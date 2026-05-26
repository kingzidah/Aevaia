import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/session/credits?id=<sessionId>
// Returns the remaining aiCredits for a UsageTracking session row.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tracking = await (prisma as any).usageTracking.findUnique({
      where:  { id },
      select: { aiCredits: true },
    }) as { aiCredits: number } | null;

    return NextResponse.json({ aiCredits: tracking?.aiCredits ?? 0 });
  } catch (err) {
    console.error("[session/credits]", err);
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 });
  }
}
