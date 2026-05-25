import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema, firstZodError } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Rate limit: 10 profile updates per user per minute ───────────────────
  const rl = await rateLimit(`profile:${userId}`, {
    limit:    10,
    windowMs: 60 * 1000,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many update attempts. Please wait a moment." },
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

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const { name, email } = parsed.data;

  if (name === undefined && !email) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // ── Email uniqueness check ────────────────────────────────────────────────
  if (email) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = await (prisma as any).user.findUnique({
      where:  { id: userId },
      select: { email: true },
    }) as { email: string } | null;

    if (current?.email !== email) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = await (prisma as any).user.findUnique({ where: { email } });
      if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name: name?.trim() || null }),
      ...(email && { email }),
    },
  });

  return NextResponse.json({ ok: true });
}
