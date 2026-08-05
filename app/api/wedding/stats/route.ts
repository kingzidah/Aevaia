import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit, getIp } from "@/lib/rate-limit";

// POST /api/wedding/stats
//
// Live headcount for the scanner header: how many guests are in, out of how
// many expected. Same gate PIN as check-in — it reveals nothing beyond two
// numbers, but those numbers are still the couple's business.
//
// Counts only, no names: this is polled, and the less it carries the faster
// the gate stays.
function pinMatches(supplied: string, expected: string): boolean {
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const gatePin = process.env.WEDDING_GATE_PIN;
  if (!gatePin) {
    return NextResponse.json({ error: "Gate check-in is not configured." }, { status: 503 });
  }

  const ip = getIp(request);
  const rl = await rateLimit(`wedding-stats:${ip}`, {
    limit: 600,
    windowMs: 60 * 60 * 1000,
    failClosed: true,
  });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { pin } = (body ?? {}) as { pin?: string };
  if (typeof pin !== "string" || !pinMatches(pin, gatePin)) {
    return NextResponse.json({ error: "Wrong gate PIN" }, { status: 401 });
  }

  const [total, arrived] = await Promise.all([
    supabaseAdmin.from("wedding_guests").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("wedding_guests")
      .select("*", { count: "exact", head: true })
      .not("checked_in_at", "is", null),
  ]);

  if (total.error || arrived.error) {
    console.error("[api/wedding/stats] Supabase error:", total.error ?? arrived.error);
    return NextResponse.json({ error: "Count failed" }, { status: 500 });
  }

  return NextResponse.json(
    { expected: total.count ?? 0, arrived: arrived.count ?? 0 },
    { status: 200 },
  );
}
