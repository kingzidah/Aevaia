import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/session/credits?id=<sessionId>
// Returns the remaining aiCredits for a UsageTracking session row.
// Ownership-scoped: a caller may only read a row whose userId matches their
// own Clerk session. Previously any id could be read by any caller (IDOR).
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tracking = await (prisma as any).usageTracking.findUnique({
      where:  { id },
      select: { aiCredits: true, userId: true },
    }) as { aiCredits: number; userId: string } | null;

    // Collapse "not found" and "not yours" into one 404 so the endpoint can't
    // be used to enumerate which session ids exist.
    if (!tracking || tracking.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ aiCredits: tracking.aiCredits });
  } catch (err) {
    console.error("[session/credits]", err);
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 });
  }
}
