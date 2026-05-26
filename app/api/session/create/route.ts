import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserId } from "@/lib/system-user";

// POST /api/session/create
// Creates a UsageTracking row for the current user (or system user as fallback).
// The client stores the returned `id` in localStorage as `hc_session_id`
// and sends it with every AI request to track remaining credits.
export async function POST() {
  // Allow fallback to system user so unauthenticated studio previews still
  // get 10 free credits. Authenticated users get their own tracking row.
  const userId = await resolveUserId(true);
  if (!userId) {
    return NextResponse.json({ error: "Failed to resolve user" }, { status: 500 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tracking = await (prisma as any).usageTracking.create({
      data:   { userId },
      select: { id: true, aiCredits: true },
    }) as { id: string; aiCredits: number };

    return NextResponse.json({ id: tracking.id, aiCredits: tracking.aiCredits });
  } catch (err) {
    console.error("[session/create]", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
