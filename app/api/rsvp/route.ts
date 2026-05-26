import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rsvpSubmitSchema, firstZodError } from "@/lib/validation";
import { rateLimit, getIp } from "@/lib/rate-limit";

// POST /api/rsvp
// Public endpoint — no authentication required (gift guests don't have accounts).
// Inserts one row into the `rsvps` table in Supabase.
// Rate-limited to 10 submissions per IP per hour to prevent spam.
//
// Required Supabase table (run once in the Supabase SQL editor):
//   CREATE TABLE rsvps (
//     id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//     gift_id    text NOT NULL,
//     guest_name text NOT NULL,
//     attending  boolean NOT NULL,
//     message    text,
//     created_at timestamptz DEFAULT now()
//   );
export async function POST(request: Request) {
  // ── Rate limit ────────────────────────────────────────────────────────────
  const ip = getIp(request);
  const rl = await rateLimit(`rsvp:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  // ── Parse & validate ──────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = rsvpSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const { gift_id, guest_name, attending, message } = parsed.data;

  // ── Insert into Supabase ──────────────────────────────────────────────────
  const { error } = await supabaseAdmin
    .from("rsvps")
    .insert([{ gift_id, guest_name, attending, message: message ?? null }]);

  if (error) {
    console.error("[api/rsvp] Supabase insert error:", error);
    return NextResponse.json({ error: "Failed to save RSVP" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
