import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { commissionSchema, firstZodError } from "@/lib/validation";
import { rateLimit, getIp } from "@/lib/rate-limit";

// POST /api/commission
//
// Turns a completed brief at /start into a commission record and mints the code
// the client will be given. Public and unauthenticated by design: the whole
// point is that nobody has to make an account, so this runs pre-auth and is
// allowlisted in proxy.ts.
//
// This code eventually gates paid content, so it is generated with the same
// discipline as the wedding tickets rather than anything sequential or
// timestamp-derived. A guessable code here would mean one client could reach
// another client's site.

// Crockford-style alphabet: no I, L, O or U. Those are the characters people
// misread when reading a code aloud over the phone or typing it off a screen.
const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LENGTH = 6;

function generateCode(): string {
  let body = "";
  // randomInt is a CSPRNG. Math.random() is predictable from prior outputs and
  // would make codes guessable in bulk.
  for (let i = 0; i < CODE_LENGTH; i++) {
    body += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return `AV-${body}`;
}

export async function POST(request: Request) {
  // ── Rate limit ──────────────────────────────────────────────────────────────
  // Lower than the wedding RSVP's 20/hour: a household might legitimately RSVP
  // several guests from one phone, but nobody commissions five sites in an hour.
  //
  // failClosed, because this is an unauthenticated public write. If Redis blips,
  // refusing a few briefs for a minute is recoverable; letting someone flood the
  // table with junk jobs — each one burning a unique code — is not.
  const ip = getIp(request);
  const rl = await rateLimit(`commission:${ip}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
    failClosed: true,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many briefs from this connection. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  // ── Parse & validate ────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = commissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const { name, email, phone, occasion, event_date, names_on_site, brief, package: pkg } =
    parsed.data;

  // ── Insert, retrying on the (vanishingly rare) code collision ───────────────
  // `code` is UNIQUE, so a duplicate surfaces as Postgres 23505. Three attempts
  // over a 32^6 space (1.07 billion) is ample.
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateCode();

    const { error } = await supabaseAdmin.from("commissions").insert([
      {
        code,
        name,
        email,
        phone: phone || null,
        occasion,
        event_date: event_date || null,
        names_on_site: names_on_site || null,
        brief: brief || null,
        package: pkg || null,
        // Money stays at zero until a price is actually agreed. The gate
        // requires amount_due > 0, so a record can never be "fully paid" by
        // virtue of nothing being owed yet.
        amount_due: 0,
        amount_paid: 0,
        status: "new",
      },
    ]);

    if (!error) {
      // Only the code goes back. The row id stays server-side — the code is the
      // client-facing handle and the only thing they ever need to quote.
      return NextResponse.json({ success: true, code }, { status: 200 });
    }

    if (error.code !== "23505") {
      console.error("[api/commission] Supabase insert error:", error);
      return NextResponse.json({ error: "Could not save your brief" }, { status: 500 });
    }
    // 23505 → collision, loop and mint another code.
  }

  console.error("[api/commission] Could not generate a unique code after 3 attempts");
  return NextResponse.json({ error: "Could not save your brief" }, { status: 500 });
}
