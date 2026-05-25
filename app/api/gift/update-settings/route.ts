import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/system-user";
import { updateSettingsSchema, firstZodError } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/gift/update-settings
// Body: { giftId: string; guestList: string[] }
// Saves the parsed guest-list array into the Project record.
// Requires authentication and verified project ownership.
export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // ── Rate limit: 20 settings updates per user per minute ──────────────────
  const rl = await rateLimit(`gift-settings:${userId}`, {
    limit:    20,
    windowMs: 60 * 1000,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many updates. Please wait a moment and try again." },
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

  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const { giftId: projectId, guestList } = parsed.data;

  // Strip empty strings that slipped through client-side trimming.
  const cleanList = guestList.filter((n) => n.length > 0);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma as any).project.findUnique({
      where:  { id: projectId },
      select: { userId: true },
    }) as { userId: string } | null;

    if (!existing)                  return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).project.update({
      where: { id: projectId },
      data:  { guestList: cleanList },
    });
    return NextResponse.json({ ok: true, count: cleanList.length });
  } catch (err) {
    console.error("[gift/update-settings]", err);
    return NextResponse.json({ error: "Failed to update project settings" }, { status: 500 });
  }
}
