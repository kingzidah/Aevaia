import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { studioDisabledResponse } from "@/lib/studio-gate";

// GET /api/user/credits
// Returns the authenticated user's Aevaia AI generation credit balance.
// The User row is created lazily on first image generation via generateCanvasImage,
// so users who have never generated an image will get the default of 1 000.
export async function GET() {
  // Studio is not launched. These routes spend real money or move money and
  // were reachable without authentication — see lib/studio-gate.ts.
  const disabled = studioDisabledResponse();
  if (disabled) return disabled;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (prisma as any).user.findUnique({
      where:  { clerkId: userId },
      select: { credits: true },
    }) as { credits: number } | null;

    // If no User row exists yet, return the schema default so the UI
    // shows a sensible value rather than zero.
    return NextResponse.json({ credits: user?.credits ?? 1000 });
  } catch (err) {
    console.error("[user/credits]", err);
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 });
  }
}
