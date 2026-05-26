import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/system-user";

// ── GET /api/projects/:id ─────────────────────────────────────────────────────
// Fetches a project's scenesJson for studio hydration.
// Only the owning user may read their project.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId  = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = await (prisma as any).project.findUnique({
      where:  { id },
      select: { id: true, scenesJson: true, userId: true, title: true },
    }) as { id: string; scenesJson: string; userId: string; title: string } | null;

    if (!project)              return NextResponse.json({ error: "Not found"   }, { status: 404 });
    if (project.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json({ id: project.id, scenesJson: project.scenesJson, title: project.title });
  } catch (err) {
    console.error("[projects/GET]", err);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

// ── PATCH /api/projects/:id ───────────────────────────────────────────────────
// Auto-save endpoint — debounced calls from the studio update scenesJson silently.
// Body: { scenesJson: string }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId  = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let scenesJson: string;
  try {
    const body = await request.json() as { scenesJson?: unknown };
    if (typeof body.scenesJson !== "string") {
      return NextResponse.json({ error: "scenesJson must be a string" }, { status: 400 });
    }
    scenesJson = body.scenesJson;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // Verify ownership before writing — prevents cross-user overwrite.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma as any).project.findUnique({
      where:  { id },
      select: { userId: true },
    }) as { userId: string } | null;

    if (!existing)                  return NextResponse.json({ error: "Not found"   }, { status: 404 });
    if (existing.userId !== userId) return NextResponse.json({ error: "Forbidden"   }, { status: 403 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).project.update({
      where: { id },
      data:  { scenesJson },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[projects/PATCH]", err);
    return NextResponse.json({ error: "Auto-save failed" }, { status: 500 });
  }
}
