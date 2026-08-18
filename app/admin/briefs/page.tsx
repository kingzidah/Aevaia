"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { marketingFontVars } from "../../marketing-fonts";
import s from "../../marketing.module.css";

// ── /admin/briefs — the owner's inbox ─────────────────────────────────────────
//
// The pull half of notifications. Email tells you a job arrived; this is where
// you read it, price it and track it — and it keeps working on the day an email
// silently fails to deliver, which is the day it matters.
//
// Built for a phone, because that is where it will actually be opened: one card
// per brief, everything visible without tapping through, and the two things you
// do most often (set a price, move a status) reachable in one tap.
//
// Not in proxy.ts's public allowlist, so authentication is enforced there. The
// API additionally checks the Clerk user id matches the owner — see the route.

type Brief = {
  code: string;
  name: string;
  email: string;
  phone: string | null;
  occasion: string | null;
  event_on: string | null;
  event_date: string | null;
  names_on_site: string | null;
  brief: string | null;
  package: string | null;
  currency: string;
  amount_due: number;
  amount_paid: number;
  status: string;
  created_at: string;
  quoted_at: string | null;
};

const STATUSES = ["new", "quoted", "building", "delivered", "cancelled"] as const;

/** Full weekday-and-month so a date can never be misread. */
function formatDate(b: Brief): string {
  if (b.event_on) {
    return new Date(`${b.event_on}T00:00:00Z`).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
    });
  }
  return b.event_date?.trim() || "Not known yet";
}

/** Days until the event — the thing that decides what you work on next. */
function daysAway(b: Brief): number | null {
  if (!b.event_on) return null;
  const then = new Date(`${b.event_on}T00:00:00Z`).getTime();
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((then - today) / 86400000);
}

function money(minor: number, currency: string): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency, minimumFractionDigits: 0 })
    .format(minor / 100);
}

export default function AdminBriefsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/briefs");
      if (res.status === 404) { setError("This account is not the owner account."); setLoading(false); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.error ?? "Could not load briefs."); setLoading(false); return; }
      setBriefs(data.briefs ?? []);
    } catch {
      setError("No connection.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function patch(code: string, body: Record<string, unknown>) {
    setBusy(code);
    try {
      const res = await fetch("/api/admin/briefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, ...body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.error ?? "Update failed."); setBusy(""); return; }
      setBriefs(list => list.map(b => (b.code === code ? data.brief : b)));
    } catch {
      setError("No connection.");
    }
    setBusy("");
  }

  function setPrice(b: Brief) {
    const current = b.amount_due ? String(b.amount_due / 100) : "";
    const input = window.prompt(`Price for ${b.code} in ${b.currency} (numbers only)`, current);
    if (input === null) return;
    const value = Number(input.replace(/[^\d.]/g, ""));
    if (!Number.isFinite(value) || value < 0) { setError("That price did not look right."); return; }
    // Rounded to whole cents — a float here becomes a rounding bug in the gate.
    void patch(b.code, { amount_due: Math.round(value * 100) });
  }

  const outstanding = (b: Brief) => b.amount_due - b.amount_paid;

  return (
    <div className={`${s.site} ${marketingFontVars}`}>
      <div className={`${s.nav} ${s.navScrolled}`}>
        <div className={`${s.wrap} ${s.navInner}`}>
          <a href="/" className={`${s.wordmarkLink} ${s.lockup}`}>
            <Image src="/logo-mark.png" alt="" width={24} height={24} className={s.lockupMark} />
            AEVAIA
          </a>
          <button type="button" onClick={() => void load()} className={s.navLink}
                  style={{ background: "none", border: "none", cursor: "pointer",
                           fontFamily: "var(--mk-mono), monospace", fontSize: 12, color: "var(--muted)" }}>
            refresh
          </button>
        </div>
      </div>

      <section className={s.section} style={{ paddingTop: 100 }}>
        <div className={s.wrap}>
          <span className={s.label}>Commissions</span>
          <h1 className={s.h2} style={{ marginTop: 10, marginBottom: 6 }}>
            {loading ? "Loading…" : `${briefs.length} ${briefs.length === 1 ? "brief" : "briefs"}`}
          </h1>
          <p className={s.bodySm} style={{ marginBottom: 26 }}>
            Newest first. Tap a price to set it — that also marks the job quoted.
          </p>

          {error && <p className={s.formError} style={{ marginBottom: 20 }}>{error}</p>}

          {!loading && briefs.length === 0 && !error && (
            <div className={s.featCard} style={{ padding: 24 }}>
              <p className={s.bodySm} style={{ margin: 0 }}>
                Nothing yet. Briefs appear here the moment someone completes{" "}
                <a href="/start" style={{ color: "var(--violet-light)" }}>/start</a>.
              </p>
            </div>
          )}

          <div style={{ display: "grid", gap: 14 }}>
            {briefs.map(b => {
              const away = daysAway(b);
              const owed = outstanding(b);
              return (
                <div key={b.code} className={s.doorCard} style={{ padding: 20 }}>

                  {/* Header: code, status, and how close the date is */}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontFamily: "var(--mk-mono), monospace", fontSize: 15,
                                   letterSpacing: ".06em", color: "var(--violet-lighter)" }}>
                      {b.code}
                    </span>
                    <span className={s.chipViolet}>{b.status}</span>
                    {away !== null && (
                      <span className={away <= 21 ? s.chipMagenta : s.chipViolet}>
                        {away < 0 ? "date passed" : away === 0 ? "today" : `${away} days away`}
                      </span>
                    )}
                    <span style={{ marginLeft: "auto", fontFamily: "var(--mk-mono), monospace",
                                   fontSize: 12, color: "var(--faint-2)" }}>
                      {new Date(b.created_at).toLocaleDateString("en-GB",
                        { day: "numeric", month: "short" })}
                    </span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 2 }}>{b.name}</div>
                  <div className={s.bodySm} style={{ marginBottom: 14 }}>
                    {b.occasion ?? "—"} · {formatDate(b)}
                  </div>

                  {/* Contact — tappable, because the next action is always to reply */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                    <a href={`mailto:${b.email}?subject=${encodeURIComponent(`Your Aevaia commission ${b.code}`)}`}
                       className={s.btnGhost} style={{ fontSize: 13, padding: "10px 16px" }}>
                      Email
                    </a>
                    {b.phone && (
                      <a href={`https://wa.me/${b.phone.replace(/\D/g, "")}`}
                         target="_blank" rel="noopener noreferrer"
                         className={s.btnWhatsapp} style={{ fontSize: 13, padding: "10px 16px" }}>
                        WhatsApp
                      </a>
                    )}
                  </div>

                  <div className={s.bodySm} style={{ marginBottom: 4 }}>
                    <strong style={{ color: "var(--text)" }}>{b.email}</strong>
                    {b.phone ? ` · ${b.phone}` : ""}
                  </div>
                  {b.names_on_site && (
                    <div className={s.bodySm}>Names on site: {b.names_on_site}</div>
                  )}
                  {b.package && <div className={s.bodySm}>Wants: {b.package}</div>}

                  {b.brief && (
                    <p className={s.bodySm} style={{ whiteSpace: "pre-wrap", marginTop: 12,
                                                     paddingTop: 12, borderTop: "1px solid var(--rule)" }}>
                      {b.brief}
                    </p>
                  )}

                  {/* Money + status */}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10,
                                marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--rule)" }}>
                    <button type="button" onClick={() => setPrice(b)} disabled={busy === b.code}
                            className={s.btnGhost} style={{ fontSize: 13, padding: "10px 16px" }}>
                      {b.amount_due ? `${money(b.amount_due, b.currency)} — change` : "Set price"}
                    </button>

                    {b.amount_due > 0 && (
                      <span className={owed <= 0 ? s.chipViolet : s.chipMagenta}
                            style={{ fontVariantNumeric: "tabular-nums" }}>
                        {owed <= 0
                          ? "paid in full"
                          : `${money(b.amount_paid, b.currency)} of ${money(b.amount_due, b.currency)}`}
                      </span>
                    )}

                    <select value={b.status} disabled={busy === b.code}
                            onChange={e => void patch(b.code, { status: e.target.value })}
                            className={s.select}
                            style={{ width: "auto", minWidth: 140, marginLeft: "auto",
                                     fontSize: 13, padding: "10px 40px 10px 14px",
                                     backgroundPosition: "calc(100% - 18px) 18px, calc(100% - 13px) 18px" }}>
                      {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
