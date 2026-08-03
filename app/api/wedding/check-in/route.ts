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
function extractTicketCode(scanned: string): string | null {
  const direct = scanned.trim().toUpperCase();
  const match = direct.match(/OU-[0-9A-HJ-NP-Z]{8}/);
  return match ? match[0] : null;
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

  // ── Rate limit ────────────────────────────────────────────────────────────
  // Generous for a real gate (a queue moves fast) but low enough that the PIN
  // cannot be brute-forced from one address.
  const ip = getIp(request);
  const rl = await rateLimit(`wedding-checkin:${ip}`, {
    limit: 600,
    windowMs: 60 * 60 * 1000,
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

  if (!pinMatches(parsed.data.pin, gatePin)) {
    return NextResponse.json({ error: "Wrong gate PIN" }, { status: 401 });
  }

  const code = extractTicketCode(parsed.data.scanned);
  if (!code || !weddingTicketSchema.safeParse(code).success) {
    return NextResponse.json({ status: "invalid" }, { status: 200 });
  }

  // ── Look the guest up ─────────────────────────────────────────────────────
  const { data: guest, error } = await supabaseAdmin
    .from("wedding_guests")
    .select("id, name, checked_in_at")
    .eq("ticket_code", code)
    .maybeSingle();

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
