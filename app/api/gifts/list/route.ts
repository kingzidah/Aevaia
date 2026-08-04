import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/system-user";

// POST /api/gifts/list
// Body: { ids: string[] }
// Returns minimal status for each project ID so the dashboard can render draft cards.
//
// SECURITY: results are scoped to the authenticated owner. Project IDs are visible
// in public /p/:id gift URLs, so an unscoped lookup would let anyone probe the
// paid/tier status of any project. The `userId` filter makes a foreign id return
// nothing instead of leaking its status.
export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let ids: string[];
  try {
    const body = await request.json() as { ids?: unknown };
    if (!Array.isArray(body.ids)) {
      return NextResponse.json({ error: "ids must be an array" }, { status: 400 });
    }
    ids = (body.ids as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 50);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!ids.length) return NextResponse.json({ gifts: [] });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projects = await (prisma as any).project.findMany({
      where:   { id: { in: ids }, userId },
      select:  { id: true, isPaid: true, tier: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }) as { id: string; isPaid: boolean; tier: string; createdAt: Date }[];

    // Return as `gifts` to keep the dashboard client compatible.
    return NextResponse.json({ gifts: projects });
  } catch (err) {
    console.error("[gifts/list]", err);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}
