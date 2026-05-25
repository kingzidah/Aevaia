import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/system-user";
import { giftsCreateSchema, firstZodError } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/gifts/create
// Body: { blocks: string; globalTheme: string }
// Returns: { id: string }
//
// Both `blocks` and `globalTheme` are JSON strings from the studio.
// They are packed together into scenesJson so the viewer can unpack symmetrically.
export async function POST(request: Request) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // ── Rate limit: 30 saves per user per minute ──────────────────────────────
  // Prevents write-flooding the database from a single authenticated session.
  const rl = await rateLimit(`gifts-create:${userId}`, {
    limit:    30,
    windowMs: 60 * 1000,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "You're saving too quickly. Please wait a moment and try again." },
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

  const parsed = giftsCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const { blocks, globalTheme } = parsed.data;

  try {
    const scenesJson = JSON.stringify({ blocks, globalTheme });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = await (prisma as any).project.create({
      data:   { userId, scenesJson },
      select: { id: true },
    }) as { id: string };

    return NextResponse.json({ id: project.id });
  } catch (err) {
    console.error("[gifts/create] DB error:", err);
    return NextResponse.json({ error: "Failed to save project" }, { status: 500 });
  }
}
