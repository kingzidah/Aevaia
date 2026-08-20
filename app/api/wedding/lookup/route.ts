import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit, getIp } from "@/lib/rate-limit";

// POST /api/wedding/lookup
//
// Find a guest by name at the gate, for the person who arrives with no email,
// no SMS and no screenshot. Guarded by the same gate PIN as check-in.
//
// Matching is deliberately order-independent. Nigerian names are routinely
// written in a different order than they were registered — "Adetayo
// Agbomabiwon" one day, "Agbomabiwon Adetayo" the next, with a middle name in
// either slot. Matching on position would fail on exactly the guests who are
// already flustered at the door.
//
// The rule: split both names into words and require TWO to overlap, in any
// order. Surname alone is far too loose at a family wedding where half the
// room shares it; two parts narrows it hard while surviving reordering.
// Prefixes count, so "ade agbo" finds "Adetayo Agbomabiwon" — fewer keystrokes
// with a queue building.

// How many candidates the database may hand back for ranking. Two matching
// name parts is a tight filter, so a real query returns a handful; this only
// caps the pathological case where someone types two very common prefixes.
const MAX_CANDIDATES = 200;

interface GuestRow {
  ticket_code: string;
  name: string;
  phone: string | null;
  checked_in_at: string | null;
}

function pinMatches(supplied: string, expected: string): boolean {
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Lowercase, strip accents and punctuation, split on whitespace.
// "Adétayo O'Brien-Smith" -> ["adetayo", "obriensmith"]
function tokenise(value: string): string[] {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreMatch(queryTokens: string[], nameTokens: string[]): number {
  let matched = 0;
  const used = new Set<number>();

  for (const q of queryTokens) {
    for (let i = 0; i < nameTokens.length; i++) {
      if (used.has(i)) continue;
      // Prefix match in either direction: a typed "ade" matches "adetayo", and
      // a typed full name still matches a stored short form.
      if (nameTokens[i].startsWith(q) || q.startsWith(nameTokens[i])) {
        used.add(i);
        matched++;
        break;
      }
    }
  }
  return matched;
}

export async function POST(request: Request) {
  const gatePin = process.env.WEDDING_GATE_PIN;
  if (!gatePin) {
    return NextResponse.json({ error: "Gate check-in is not configured." }, { status: 503 });
  }

  const ip = getIp(request);
  const rl = await rateLimit(`wedding-lookup:${ip}`, {
    limit: 600,
    windowMs: 60 * 60 * 1000,
    failClosed: true,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many lookups. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { q, pin } = (body ?? {}) as { q?: string; pin?: string };

  if (typeof pin !== "string" || !pinMatches(pin, gatePin)) {
    return NextResponse.json({ error: "Wrong gate PIN" }, { status: 401 });
  }

  const queryTokens = tokenise(String(q ?? "")).slice(0, 5);
  // One word is not enough to identify anyone at a wedding where most of the
  // room shares a surname — it would return a wall of names and slow the gate
  // down rather than speeding it up.
  if (queryTokens.length < 2) {
    return NextResponse.json({ results: [], need: "Type at least two names" }, { status: 200 });
  }

  // The filter runs in Postgres, not here.
  //
  // This used to select every guest with .limit(2000) and no ORDER BY, then
  // score them in JavaScript. Under 2000 guests that works. Over it, Postgres
  // returns an arbitrary subset, so a guest who IS on the list gets told they
  // are not — at the door, with a queue behind them. The stated goal is 10,000
  // guests per event, so this was a real failure waiting for a big wedding.
  //
  // wedding_guest_lookup() applies a deliberately looser version of the rule
  // below (it ignores the one-to-one token pairing), which makes its output a
  // strict superset of anything scoreMatch could rank at 2 or above. The exact
  // ranking still happens here, so matching behaviour is unchanged and the
  // subtle rules live in one language rather than two.
  const { data, error } = await supabaseAdmin.rpc("wedding_guest_lookup", {
    q_tokens: queryTokens,
    max_rows: MAX_CANDIDATES,
  });

  if (error) {
    console.error("[api/wedding/lookup] Supabase error:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  const results = ((data ?? []) as GuestRow[])
    .map((g) => ({ guest: g, score: scoreMatch(queryTokens, tokenise(g.name)) }))
    .filter((r) => r.score >= 2)
    .sort((a, b) => b.score - a.score || a.guest.name.localeCompare(b.guest.name))
    // Five is what fits on a phone screen without scrolling. More than that and
    // the bouncer is reading rather than admitting.
    .slice(0, 5)
    .map(({ guest }) => ({
      ticket_code: guest.ticket_code,
      name: guest.name,
      // Last four digits only — enough to tell two relatives apart without
      // printing a full phone number on a screen held up in a crowd.
      phone_tail: (guest.phone ?? "").replace(/\D/g, "").slice(-4),
      checked_in_at: guest.checked_in_at,
    }));

  return NextResponse.json({ results }, { status: 200 });
}
