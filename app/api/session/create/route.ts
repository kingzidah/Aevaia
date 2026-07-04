import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserId } from "@/lib/system-user";

// POST /api/session/create
// Creates a UsageTracking row for the current user (or system user as fallback).
// The client stores the returned `id` in localStorage as `hc_session_id`
// and sends it with every AI request to track remaining credits.
export async function POST() {
  // Clerk-authenticated users get their own tracking row. Unauthenticated
  // callers are rejected — the system-user fallback was removed with Clerk,
  // so this is an auth failure (401), not a server error.
  const userId = await resolveUserId(true);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
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
