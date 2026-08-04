import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { weddingRsvpSchema, firstZodError } from "@/lib/validation";
import { rateLimit, getIp } from "@/lib/rate-limit";

// POST /api/wedding/rsvp
//
// Public endpoint for the standalone wedding invite served on
// opeyemianduriel.aevaia.com. Guests have no accounts, so this runs pre-auth
// (allowlisted in proxy.ts).
//
// Distinct from /api/rsvp, which is scoped to a published gift Project and
// cannot represent a static invite.
//
// Stores the guest and returns a ticket code. The invite then forwards that
// code to the Make.com scenario, which embeds it in the QR on the emailed
// entry ticket — so the code a bouncer scans at the gate resolves to this row.

// Crockford-style alphabet: no I, L, O, or U. Those are the characters people
// misread when a QR will not scan and the code has to be typed in by hand at
// the gate, which is exactly when you cannot afford ambiguity.
const TICKET_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

// Six characters, not eight. A QR does not care how long the code is, but an
// SMS cannot carry a QR at all — the guest reads the code aloud or types it,
// and every extra character is another chance to get it wrong with a queue
// waiting. 32^6 is still 1.07 billion combinations, and the check-in route
// allows only 600 attempts per hour per IP, so guessing one is not a route in.
const TICKET_LENGTH = 6;

function generateTicketCode(): string {
  let body = "";
  // randomInt (CSPRNG), not Math.random: a guessable code is a free entry.
  for (let i = 0; i < TICKET_LENGTH; i++) {
    body += TICKET_ALPHABET[randomInt(TICKET_ALPHABET.length)];
  }
  return `OU-${body}`;
}

export async function POST(request: Request) {
  // ── Rate limit ────────────────────────────────────────────────────────────
  // Higher than /api/rsvp's 10/hour: a household may legitimately RSVP several
  // guests from one phone on the same network, and a blocked real guest is
  // worse here than a few junk rows.
  //
  // failClosed: this is an UNAUTHENTICATED public write, and the table it
  // writes to is the one bouncers rely on at the gate. Failing open would mean
  // that during a Redis outage anyone could flood the guest list with junk
  // rows — and a poisoned guest list on the day is far harder to recover from
  // than a guest retrying an RSVP a minute later.
  const ip = getIp(request);
  const rl = await rateLimit(`wedding-rsvp:${ip}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
    failClosed: true,
  });
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

  const parsed = weddingRsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const { name, phone, email } = parsed.data;

  // ── Insert, retrying on the (vanishingly rare) code collision ─────────────
  // ticket_code is UNIQUE, so a duplicate surfaces as Postgres error 23505.
  // Three attempts over a 32^8 space is ample.
  for (let attempt = 0; attempt < 3; attempt++) {
    const ticketCode = generateTicketCode();

    const { error } = await supabaseAdmin.from("wedding_guests").insert([
      {
        ticket_code: ticketCode,
        name,
        phone,
        email: email || null,
        attending: true,
      },
    ]);

    if (!error) {
      return NextResponse.json({ success: true, ticket_code: ticketCode }, { status: 200 });
    }

    if (error.code !== "23505") {
      console.error("[api/wedding/rsvp] Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to save RSVP" }, { status: 500 });
    }
    // 23505 → collision, loop and mint another code.
  }

  console.error("[api/wedding/rsvp] Could not generate a unique ticket code after 3 attempts");
  return NextResponse.json({ error: "Failed to save RSVP" }, { status: 500 });
}
