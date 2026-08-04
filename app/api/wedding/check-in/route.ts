import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { weddingCheckInSchema, weddingTicketSchema, firstZodError } from "@/lib/validation";
import { rateLimit, getIp } from "@/lib/rate-limit";

// POST /api/wedding/check-in
//
// Called by the gate scanner at /wedding/scan. Bouncers do not have Clerk
// accounts, so this route is allowlisted in proxy.ts and guarded by a shared
// gate PIN (WEDDING_GATE_PIN) instead.
//
// Returns one of four outcomes, which the scanner renders as a colour:
//   ok       — valid ticket, now marked as used   (green)
//   already  — valid ticket that was ALREADY used (amber; includes when)
//   notfound — no such ticket                     (red)
//   invalid  — the QR is not one of ours          (red)

// Ticket QRs may hold the bare code or a URL ending in it. Accept both so the
// Make.com scenario can embed whichever is easier, and so a bouncer can type a
// code by hand when a phone screen is too cracked or dim to scan.
//
// Current codes win over legacy ones: the OU- pattern is tried first, so a URL
// that happens to contain six hex characters somewhere (a tracking id, a colour
// like "ffffff") cannot shadow the real ticket code sitting next to it. The
// legacy branch is anchored to the whole string for the same reason — it only
// matches a QR that contains nothing but the old six-character code.
function extractTicketCode(scanned: string): string | null {
  const direct = scanned.trim().toUpperCase();

  const current = direct.match(/OU-[0-9A-HJKMNP-TV-Z]{6,8}/);
  if (current) return current[0];

  // A bare six-character code: either typed off an SMS without the prefix, or a
  // legacy June code. Anchored to the whole string so a stray six characters
  // inside a longer URL cannot be mistaken for a ticket.
  const bare = direct.match(/^[0-9A-HJKMNP-TV-Z]{6}$/) ?? direct.match(/^[0-9A-F]{6}$/);
  return bare ? bare[0] : null;
}

// A typed code may arrive with or without the "OU-" prefix, and legacy codes
// never had one. Look for every form the same six characters could be stored
// under rather than guessing which era the guest belongs to.
function candidateCodes(code: string): string[] {
  if (code.startsWith("OU-")) return [code];
  return [`OU-${code}`, code];
}

function pinMatches(supplied: string, expected: string): boolean {
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  // Length must be compared separately — timingSafeEqual throws on a mismatch.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const gatePin = process.env.WEDDING_GATE_PIN;

  // Fail closed. Without a configured PIN this route would otherwise be an open
  // read of the entire guest list.
  if (!gatePin) {
    console.error("[api/wedding/check-in] WEDDING_GATE_PIN is not set — refusing all check-ins");
    return NextResponse.json(
      { error: "Gate check-in is not configured." },
      { status: 503 },
    );
  }

  // ── Volume limit ──────────────────────────────────────────────────────────
  // Generous: a real gate scans fast and a blocked bouncer holds up the queue.
  // This bucket is about total request volume, NOT about guarding the PIN —
  // see the separate failure bucket below, which is what actually stops
  // brute-forcing. Counting both in one bucket would mean either a limit too
  // high to stop guessing or too low to run a gate.
  //
  // failClosed: a rate limiter that evaporates when Redis blips is not a rate
  // limiter. This endpoint reads the guest list, so it must not be reachable
  // unmetered. A gate outage falls back to the printed list; an unthrottled
  // guest-list endpoint does not have a fallback.
  const ip = getIp(request);
  const rl = await rateLimit(`wedding-checkin:${ip}`, {
    limit: 600,
    windowMs: 60 * 60 * 1000,
    failClosed: true,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many scans. Please wait a moment." },
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

  const parsed = weddingCheckInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  // ── PIN, with a dedicated lockout on FAILED attempts ──────────────────────
  // Incremented only on a wrong PIN, so bouncers using the correct PIN never
  // consume any of this budget no matter how many guests they scan. That is
  // what lets it be strict: 10 wrong guesses per hour per IP makes even a
  // 4-digit PIN (10 000 combinations) take roughly 41 days to exhaust from one
  // address, versus about 17 hours under the volume limit alone.
  //
  // failClosed again — if the counter cannot be kept, guesses are not accepted.
  if (!pinMatches(parsed.data.pin, gatePin)) {
    const fails = await rateLimit(`wedding-pinfail:${ip}`, {
      limit: 10,
      windowMs: 60 * 60 * 1000,
      failClosed: true,
    });
    if (!fails.success) {
      return NextResponse.json(
        { error: "Too many incorrect PIN attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(fails.retryAfter) } },
      );
    }
    return NextResponse.json({ error: "Wrong gate PIN" }, { status: 401 });
  }

  const code = extractTicketCode(parsed.data.scanned);
  if (!code || !weddingTicketSchema.safeParse(code).success) {
    return NextResponse.json({ status: "invalid" }, { status: 200 });
  }

  // ── Look the guest up ─────────────────────────────────────────────────────
  const { data: guests, error } = await supabaseAdmin
    .from("wedding_guests")
    .select("id, name, checked_in_at, ticket_code")
    .in("ticket_code", candidateCodes(code))
    .limit(1);

  const guest = guests?.[0] ?? null;

  if (error) {
    console.error("[api/wedding/check-in] Supabase lookup error:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  if (!guest) {
    return NextResponse.json({ status: "notfound", code }, { status: 200 });
  }

  if (guest.checked_in_at) {
    return NextResponse.json(
      {
        status: "already",
        name: guest.name,
        code,
        checked_in_at: guest.checked_in_at,
      },
      { status: 200 },
    );
  }

  // ── Mark as used ──────────────────────────────────────────────────────────
  // `.is("checked_in_at", null)` makes this a conditional update, so two
  // bouncers scanning the same ticket at the same moment cannot both get a
  // green light — the second update matches no rows and is reported as
  // "already". Without it, a duplicate ticket races through both phones.
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("wedding_guests")
    .update({ checked_in_at: new Date().toISOString(), checked_in_by: "gate" })
    .eq("id", guest.id)
    .is("checked_in_at", null)
    .select("name, checked_in_at");

  if (updateError) {
    console.error("[api/wedding/check-in] Supabase update error:", updateError);
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { status: "already", name: guest.name, code },
      { status: 200 },
    );
  }

  return NextResponse.json(
    { status: "ok", name: updated[0].name, code },
    { status: 200 },
  );
}
