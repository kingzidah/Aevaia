import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/system-user";
import { projectSaveSchema, firstZodError } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/project/save
// Body: { projectId: string, canvasState: string }
// Validates ownership then writes canvasState → project.scenesJson.
export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // ── Rate limit: 60 auto-saves per user per minute ─────────────────────────
  // The studio debounces at 2 s, so 60/min is generous for normal use but
  // still blocks programmatic write-flooding.
  const rl = await rateLimit(`project-save:${userId}`, {
    limit:    60,
    windowMs: 60 * 1000,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Saving too frequently. Please slow down." },
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

  const parsed = projectSaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const { projectId, canvasState } = parsed.data;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma as any).project.findUnique({
      where:  { id: projectId },
      select: { userId: true },
    }) as { userId: string } | null;

    if (!existing)                  return NextResponse.json({ error: "Not found"   }, { status: 404 });
    if (existing.userId !== userId) return NextResponse.json({ error: "Forbidden"   }, { status: 403 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).project.update({
      where: { id: projectId },
      data:  { scenesJson: canvasState },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[project/save]", err);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
