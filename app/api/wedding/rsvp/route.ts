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

// Posts the guest to the couple's Make.com scenario, which writes their
// spreadsheet. Never throws: by the time this runs the guest is already saved
// in Postgres, and a spreadsheet hiccup must not turn a successful RSVP into an
// error the guest sees and retries.
//
// The URL lives in WEDDING_SPREADSHEET_WEBHOOK_URL. If it is unset the call is
// skipped and logged loudly — the RSVP still succeeds, because losing the row
// from the sheet is recoverable and losing the guest is not.
type SpreadsheetRow = {
  name: string;
  phone: string;
  email: string;
  group: string;
  timestamp: string;
  inviteLink: string;
  ticketCode: string;
};

// Resolves the webhook URL from the environment first, then from app_config in
// Supabase.
//
// The database fallback exists so this works without a deployment environment
// variable. Committing the URL to a file is not an option — the repository is
// public, so that is no better than the browser JavaScript it came out of. The
// row sits behind RLS with no policies, reachable only by the service role,
// whose credentials are already present in production.
// Hosts this route is permitted to POST guest data to.
//
// Moving the URL into the database turned a compile-time constant into runtime
// data, and this function feeds it straight to fetch(). That is a trust
// boundary: anything able to change that row could redirect guest names, phone
// numbers and email addresses to a server of its choosing, or aim the request
// at an internal address the server can reach but the internet cannot.
//
// Writing to app_config already requires the service role, so an attacker would
// need credentials that own the database anyway. The allowlist is defence in
// depth — it means a bad value in that row fails closed instead of exfiltrating
// a guest list. Add a host here deliberately, never by pattern.
const WEBHOOK_ALLOWED_HOSTS = new Set(["hook.eu1.make.com", "hook.us1.make.com"]);

function isPermittedWebhook(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  // https only: this carries personal data, and http would send it in the clear.
  if (url.protocol !== "https:") return false;
  // Exact host match. A suffix check like endsWith(".make.com") would accept
  // "hook.eu1.make.com.attacker.example".
  return WEBHOOK_ALLOWED_HOSTS.has(url.hostname);
}

async function resolveWebhookUrl(): Promise<string | null> {
  const fromEnv = process.env.WEDDING_SPREADSHEET_WEBHOOK_URL;
  const candidate = fromEnv ?? (await readWebhookFromConfig());
  if (!candidate) return null;

  // Validated regardless of source. An environment variable is not inherently
  // more trustworthy than a database row, and a typo there would be just as
  // capable of posting a guest list somewhere unintended.
  if (!isPermittedWebhook(candidate)) {
    console.error(
      "[api/wedding/rsvp] configured webhook host is not allowlisted — refusing to send guest data. Host:",
      (() => { try { return new URL(candidate).hostname; } catch { return "unparseable"; } })(),
    );
    return null;
  }
  return candidate;
}

async function readWebhookFromConfig(): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("app_config")
    .select("value")
    .eq("key", "wedding_spreadsheet_webhook_url")
    .maybeSingle();

  if (error) {
    console.error("[api/wedding/rsvp] could not read webhook url from app_config:", error);
    return null;
  }
  return data?.value ?? null;
}

async function forwardToSpreadsheet(row: SpreadsheetRow): Promise<void> {
  const url = await resolveWebhookUrl();
  if (!url) {
    console.error(
      "[api/wedding/rsvp] no spreadsheet webhook configured — guest saved to Postgres but NOT forwarded:",
      row.ticketCode,
    );
    return;
  }

  try {
    // Bounded: a hanging webhook must not hold the guest on a spinner at the
    // moment they are trying to RSVP.
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("[api/wedding/rsvp] spreadsheet webhook returned", res.status, "for", row.ticketCode);
    }
  } catch (err) {
    console.error("[api/wedding/rsvp] spreadsheet webhook failed for", row.ticketCode, err);
  }
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
      // Forward to the couple's spreadsheet from HERE, not from the browser.
      //
      // This call used to live in public/wedding-demo/app.js with the webhook
      // URL hardcoded beside it, which put the address of their spreadsheet in
      // a file anyone could read from view-source. Anybody who copied it could
      // post arbitrary guests into their sheet indefinitely, without ever
      // visiting the invite. Server-side, the URL is never sent to a browser.
      //
      // Awaited, not fire-and-forget: a serverless function can be frozen the
      // moment it returns, and a dangling promise would be killed mid-flight,
      // losing the row from the couple's sheet.
      await forwardToSpreadsheet({
        name,
        phone,
        email: email || "",
        // Shape below is byte-compatible with what the browser used to send.
        // The Make scenario maps fields into columns BY NAME, so dropping a key
        // or renaming one silently shifts their spreadsheet.
        group: "",
        timestamp: new Date().toISOString(),
        inviteLink: "https://opeyemianduriel.aevaia.com",
        ticketCode,
      });

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
