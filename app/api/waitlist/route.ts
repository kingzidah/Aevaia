import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { waitlistSchema, firstZodError } from "@/lib/validation";
import { rateLimit, getIp } from "@/lib/rate-limit";

// POST /api/waitlist
//
// Saves a landing-page waitlist signup. Public — visitors have no accounts.
//
// This exists because the landing page form used to call setSubmitted(true) and
// nothing else: it showed a thank-you message and discarded the address. Every
// signup before this route existed was lost.
export async function POST(request: Request) {
  const ip = getIp(request);
  const rl = await rateLimit(`waitlist:${ip}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
    // Unauthenticated public write. If the limiter cannot be consulted, do not
    // accept unmetered inserts into a table that exists to be a clean list.
    failClosed: true,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("waitlist")
    .insert([{ email: parsed.data.email }]);

  // 23505 = unique violation, i.e. this address is already on the list. That is
  // a success from the visitor's point of view — telling them "you are already
  // signed up" only invites them to wonder when, and leaks who is on the list.
  if (error && error.code !== "23505") {
    console.error("[api/waitlist] Supabase insert error:", error);
    return NextResponse.json({ error: "Could not join the waitlist" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
