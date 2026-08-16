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

// ── Owner notification ────────────────────────────────────────────────────────
//
// A brief in a database nobody is watching is a lost job. This is the push half;
// /admin/briefs is the pull half.
//
// Every failure path here is swallowed. The row is already committed by the time
// this runs, so an email problem must never surface to the client as an error —
// they would simply submit the brief a second time.
type OwnerNotice = {
  code: string;
  name: string;
  email: string;
  phone?: string;
  occasion: string;
  dateLabel: string;
  names_on_site?: string;
  brief?: string;
  pkg?: string;
};

async function notifyOwner(n: OwnerNotice): Promise<void> {
  const to = process.env.OWNER_EMAIL ?? "helloaevaia@gmail.com";

  if (!process.env.RESEND_API_KEY) {
    console.error("[api/commission] RESEND_API_KEY not set — no notification sent for", n.code);
    return;
  }

  const row = (label: string, value?: string) =>
    value?.trim()
      ? `<tr><td style="padding:6px 16px 6px 0;color:#8a809c;font:500 12px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.08em;vertical-align:top;white-space:nowrap">${label}</td>` +
        `<td style="padding:6px 0;color:#f3eefb;font:400 15px system-ui,sans-serif">${escapeHtml(value)}</td></tr>`
      : "";

  const html = `
<div style="background:#0d0a12;padding:28px;font-family:system-ui,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#161120;border-radius:16px;padding:28px">
    <p style="margin:0 0 4px;color:#8a809c;font:500 12px ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase">New commission</p>
    <p style="margin:0 0 22px;color:#c79bff;font:500 30px ui-monospace,monospace;letter-spacing:.08em">${escapeHtml(n.code)}</p>
    <table style="border-collapse:collapse;width:100%">
      ${row("Name", n.name)}
      ${row("Email", n.email)}
      ${row("WhatsApp", n.phone)}
      ${row("Occasion", n.occasion)}
      ${row("Date", n.dateLabel)}
      ${row("Names", n.names_on_site)}
      ${row("Package", n.pkg)}
    </table>
    ${
      n.brief?.trim()
        ? `<p style="margin:22px 0 6px;color:#8a809c;font:500 12px ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase">Brief</p>
           <p style="margin:0;color:#d8cfe6;font:400 15px/1.6 system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(n.brief)}</p>`
        : ""
    }
    <p style="margin:26px 0 0;color:#6f6580;font:400 13px system-ui,sans-serif">
      Reply to this email to reach them directly. Photos come separately on WhatsApp.
    </p>
  </div>
</div>`;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "Aevaia <hello@aevaia.com>",
      to,
      // replyTo means hitting reply in the inbox goes straight to the client
      // rather than back to the sending address.
      replyTo: n.email,
      subject: `New commission ${n.code} — ${n.occasion}, ${n.dateLabel}`,
      html,
    });
    if (error) console.error("[api/commission] Resend error for", n.code, error);
  } catch (err) {
    console.error("[api/commission] notification threw for", n.code, err);
  }
}

// The brief is free text from a stranger and lands in an HTML email, so it is
// escaped rather than interpolated raw.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

  const { name, email, phone, occasion, event_on, event_date, names_on_site, brief, package: pkg } =
    parsed.data;

  // How the date reads in the notification and the admin list. A real date is
  // written out in full — "Saturday, 12 October 2026" — because that is the
  // form nobody can misread.
  const dateLabel = event_on
    ? new Date(`${event_on}T00:00:00Z`).toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
      })
    : (event_date || "Not known yet");

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
        // Exactly one of these is ever set — see commissionSchema.
        event_on: event_on || null,
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
      // Tell the owner. Awaited rather than fired and forgotten, because a
      // serverless function can be frozen the moment it returns and a dangling
      // promise would be killed mid-flight — silently losing the only
      // notification that a paying job arrived.
      //
      // It must never fail the request: the brief is already saved, and a
      // client seeing an error after a successful save would submit again.
      await notifyOwner({ code, name, email, phone, occasion, dateLabel, names_on_site, brief, pkg });

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
