import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/system-user";

// POST /api/projects/:id/publish
// Flips isPublished to "PUBLISHED" for the authenticated owner.
// Returns { ok: true, id, url } where url is the canonical /p/:id viewer address.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId  = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma as any).project.findUnique({
      where:  { id },
      select: { userId: true, isPublished: true },
    }) as { userId: string; isPublished: string } | null;

    if (!existing)                  return NextResponse.json({ error: "Not found"   }, { status: 404 });
    if (existing.userId !== userId) return NextResponse.json({ error: "Forbidden"   }, { status: 403 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).project.update({
      where: { id },
      data:  { isPublished: "PUBLISHED" },
    });

    const origin = request.headers.get("origin") ?? "http://localhost:3000";
    return NextResponse.json({ ok: true, id, url: `${origin}/p/${id}` });
  } catch (err) {
    console.error("[projects/publish]", err);
    return NextResponse.json({ error: "Failed to publish" }, { status: 500 });
  }
}
