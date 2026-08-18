"use client";

import Image from "next/image";
import { useState } from "react";
import { marketingFontVars } from "../marketing-fonts";
import s from "../marketing.module.css";

// ── /start — the commission brief ─────────────────────────────────────────────
//
// This is the link pasted into a WhatsApp, Instagram or email conversation. The
// person opening it was not browsing; they were handed a URL by someone they
// have exchanged maybe three messages with, and their first instinct is to
// wonder whether it is a scam.
//
// Everything on the page answers that: it lives on aevaia.com rather than a
// form service, it wears the same skin as the site they were just shown, it
// states what happens next before asking for anything, it names the real work
// they can go and open, and it never asks for card details. Payment happens
// later, on its own page, after a price has actually been agreed.

const WHATSAPP_NUMBER = "4917675460351";
const CONTACT_EMAIL = "helloaevaia@gmail.com";

const OCCASIONS = [
  "Wedding",
  "Birthday",
  "Engagement",
  "Naming ceremony",
  "Anniversary",
  "A gift for someone",
  "Something else",
];

const PACKAGES = [
  "Not sure yet — advise me",
  "The Invite — €149",
  "The Full Event — €349",
  "Bespoke — from €599",
];

export default function StartPage() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    occasion: "", event_on: "", event_date: "", names_on_site: "",
    brief: "", package: "",
  });

  // Most people know their date, so the picker is the default and gives an
  // unambiguous value. The minority who genuinely do not ("sometime in spring")
  // would otherwise be forced to invent one, so they get a text box instead.
  // Only ever one of the two is submitted.
  const [dateUnknown, setDateUnknown] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [code, setCode] = useState("");

  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    code ? `Hi! My brief is in — reference ${code}. Here are my photos.` : "Hi! I'd like an Aevaia site built for my event.",
  )}`;

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }
      setCode(data.code);
      setState("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("No connection. Please check your signal and try again.");
      setState("error");
    }
  }

  return (
    <div className={`${s.site} ${marketingFontVars}`}>
      {/* Wordmark links home — a visitor who wants to check this is real should
          be one tap from the actual site, not stranded on a form. */}
      <div className={`${s.nav} ${s.navScrolled}`}>
        <div className={`${s.wrap} ${s.navInner}`}>
          <a href="/" className={`${s.wordmarkLink} ${s.lockup}`}>
            <Image src="/logo-mark.png" alt="" width={24} height={24} className={s.lockupMark} />
            AEVAIA
          </a>
          <a href="/" className={s.navLink} style={{ fontFamily: "var(--mk-mono), monospace", fontSize: 12 }}>
            ← the studio
          </a>
        </div>
      </div>

      <section className={s.section} style={{ paddingTop: 110 }}>
        <div className={`${s.wrap} ${s.startNarrow}`}>

          {state === "done" ? (
            /* ── Confirmation ─────────────────────────────────────────────── */
            <>
              <div className={s.codeCard}>
                <span className={s.label}>Your reference</span>
                <div className={`${s.codeValue} ${s.gradText}`}>{code}</div>
                <p className={s.bodySm} style={{ margin: "0 auto", maxWidth: 380 }}>
                  Keep this. It is how I find your job, and later it is how your
                  site opens.
                </p>
              </div>

              <h1 className={s.h2} style={{ marginTop: 40 }}>
                Got it, {form.name.split(" ")[0]}. Now send me your photos.
              </h1>
              <p className={s.body} style={{ marginTop: 12 }}>
                Everything else I need is written down. The one thing a form is bad
                at is pictures — so send those on WhatsApp, where you already have
                them.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
                <a href={waHref} target="_blank" rel="noopener noreferrer" className={s.btnWhatsapp}>
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
                    <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-1.7-.8-2.8-1.5-3.9-3.4-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5s-.7-1.6-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.5.8.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3z" />
                    <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
                  </svg>
                  Send photos on WhatsApp
                </a>
                <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Photos — ${code}`)}`} className={s.btnGhost}>
                  Email them instead
                </a>
              </div>

              <div className={s.flow}>
                <div className={s.flowStep}>
                  <div>
                    <div className={s.flowTitle}>I read your brief and come back with a price</div>
                    <div className={s.bodySm}>Usually the same day. Fixed, agreed before anything is built.</div>
                  </div>
                </div>
                <div className={s.flowStep}>
                  <div>
                    <div className={s.flowTitle}>I build it by hand</div>
                    <div className={s.bodySm}>Usually 7–10 days from the day you approve the scope.</div>
                  </div>
                </div>
                <div className={s.flowStep}>
                  <div>
                    <div className={s.flowTitle}>Your link opens</div>
                    <div className={s.bodySm}>
                      Share it however you like. Live for a year, then €29/year to keep it up.
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ── The brief ────────────────────────────────────────────────── */
            <>
              <span className={s.label}>Start a commission</span>
              <h1 className={s.h1} style={{ fontSize: "clamp(32px,5.5vw,52px)", marginTop: 14 }}>
                Tell me about the day.
              </h1>
              <p className={s.body} style={{ maxWidth: 540 }}>
                Three questions are required. The rest helps, but you can send it
                later — I would rather have your date than a perfect form.
              </p>

              <div className={s.trustRow}>
                <span className={s.trustItem}><span className={s.trustTick}>✓</span> No account needed</span>
                <span className={s.trustItem}><span className={s.trustTick}>✓</span> No payment on this page</span>
                <span className={s.trustItem}><span className={s.trustTick}>✓</span> aevaia.com</span>
              </div>

              <p className={s.bodySm} style={{ marginTop: 22 }}>
                Not sure who I am? Open{" "}
                <a href="https://opeyemianduriel.aevaia.com" target="_blank" rel="noopener noreferrer"
                   style={{ color: "var(--violet-light)" }}>a wedding I built</a>{" "}
                or{" "}
                <a href="https://jasmine.aevaia.com" target="_blank" rel="noopener noreferrer"
                   style={{ color: "var(--magenta-light)" }}>a birthday gift</a>. Both are live, both are real.
              </p>

              <form onSubmit={submit} style={{ marginTop: 34 }}>
                <div className={s.fieldRow}>
                  <label className={s.fieldLabel} htmlFor="f-name">Your name</label>
                  <input id="f-name" required className={s.input} value={form.name}
                         autoComplete="name" onChange={e => set("name", e.target.value)} />
                </div>

                <div className={s.fieldRow}>
                  <label className={s.fieldLabel} htmlFor="f-email">Your email</label>
                  <input id="f-email" required type="email" className={s.input} value={form.email}
                         autoComplete="email" onChange={e => set("email", e.target.value)} />
                </div>

                <div className={s.fieldRow}>
                  <label className={s.fieldLabel} htmlFor="f-phone">
                    WhatsApp number <span className={s.optional}>— optional, fastest way to reach you</span>
                  </label>
                  <input id="f-phone" type="tel" className={s.input} value={form.phone}
                         autoComplete="tel" onChange={e => set("phone", e.target.value)} />
                </div>

                <div className={s.fieldRow}>
                  <label className={s.fieldLabel} htmlFor="f-occasion">What is the occasion</label>
                  <select id="f-occasion" required className={s.select} value={form.occasion}
                          onChange={e => set("occasion", e.target.value)}>
                    <option value="" disabled>Choose one…</option>
                    {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div className={s.fieldRow}>
                  <label className={s.fieldLabel} htmlFor={dateUnknown ? "f-date-text" : "f-date"}>
                    The date
                  </label>

                  {dateUnknown ? (
                    <input
                      id="f-date-text"
                      className={s.input}
                      value={form.event_date}
                      placeholder="Sometime in spring, or the weekend of the 12th…"
                      onChange={e => set("event_date", e.target.value)}
                    />
                  ) : (
                    <input
                      id="f-date"
                      type="date"
                      className={s.input}
                      value={form.event_on}
                      // Nobody commissions a site for yesterday, and blocking it
                      // here saves a confusing back-and-forth later.
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={e => set("event_on", e.target.value)}
                    />
                  )}

                  <label className={s.checkRow}>
                    <input
                      type="checkbox"
                      className={s.check}
                      checked={dateUnknown}
                      onChange={e => {
                        setDateUnknown(e.target.checked);
                        // Clear the other field so only one ever reaches the API.
                        setForm(f => ({ ...f, event_on: "", event_date: "" }));
                      }}
                    />
                    I don&apos;t know the exact date yet
                  </label>
                </div>

                <div className={s.fieldRow}>
                  <label className={s.fieldLabel} htmlFor="f-names">
                    Names on the site <span className={s.optional}>— optional</span>
                  </label>
                  <input id="f-names" className={s.input} value={form.names_on_site}
                         placeholder="Opeyemi &amp; Uriel" onChange={e => set("names_on_site", e.target.value)} />
                </div>

                <div className={s.fieldRow}>
                  <label className={s.fieldLabel} htmlFor="f-package">
                    Which package <span className={s.optional}>— optional</span>
                  </label>
                  <select id="f-package" className={s.select} value={form.package}
                          onChange={e => set("package", e.target.value)}>
                    <option value="">Choose one…</option>
                    {PACKAGES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className={s.fieldRow}>
                  <label className={s.fieldLabel} htmlFor="f-brief">
                    What are you imagining <span className={s.optional}>— optional</span>
                  </label>
                  <textarea id="f-brief" rows={5} className={s.textarea} value={form.brief}
                            placeholder="Colours, a song that matters, how you met, anything at all."
                            onChange={e => set("brief", e.target.value)} />
                </div>

                <button type="submit" disabled={state === "sending"}
                        className={s.btnGrad} style={{ width: "100%", marginTop: 8 }}>
                  {state === "sending" ? "Sending…" : "Send my brief"}
                </button>

                {state === "error" && <p className={s.formError} style={{ marginTop: 12 }}>{error}</p>}

                <p className={s.bodySm} style={{ marginTop: 16, color: "var(--faint)" }}>
                  Your details are used only to build and deliver your site. Nothing is
                  shared. See the{" "}
                  <a href="/privacy" style={{ color: "var(--violet-light)" }}>privacy notice</a>.
                </p>
              </form>

              <div className={s.flow}>
                <div className={s.flowStep}>
                  <div>
                    <div className={s.flowTitle}>You send this brief</div>
                    <div className={s.bodySm}>You get a reference straight away. No account, no password.</div>
                  </div>
                </div>
                <div className={s.flowStep}>
                  <div>
                    <div className={s.flowTitle}>I come back with a fixed price</div>
                    <div className={s.bodySm}>Usually the same day. Nothing is built until you agree it.</div>
                  </div>
                </div>
                <div className={s.flowStep}>
                  <div>
                    <div className={s.flowTitle}>I build it, then your link opens</div>
                    <div className={s.bodySm}>Usually 7–10 days. Tight date? Ask — rush is often possible.</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <footer className={s.footer}>
        <div className={`${s.wrap} ${s.footerInner}`}>
          <a href="/" className={s.wordmarkLink} style={{ fontSize: 15 }}>AEVAIA</a>
          <div className={s.footerLinks}>
            <a href="/contact" className={s.footerLink}>Contact</a>
            <a href="/impressum" className={s.footerLink}>Impressum</a>
            <a href="/privacy" className={s.footerLink}>Privacy</a>
            <a href="/terms" className={s.footerLink}>Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
