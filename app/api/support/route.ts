import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supportSchema, firstZodError } from "@/lib/validation";
import { rateLimit, getIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // ── Rate limit: 3 support tickets per IP per hour ─────────────────────────
  // Prevents inbox spam without blocking legitimate users from filing follow-up
  // tickets within a single session.
  const rl = await rateLimit(`support:${getIp(request)}`, {
    limit:    3,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "You've sent too many support messages. Please wait an hour before trying again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  // ── Parse & validate with Zod ─────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = supportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const { email, message } = parsed.data;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).supportTicket.create({
      data: { email, message },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[support]", err);
    return NextResponse.json({ error: "Failed to submit support ticket" }, { status: 500 });
  }
}
