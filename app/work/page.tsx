import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/react";
import { marketingFontVars } from "../marketing-fonts";
import { WORK } from "../work-data";
import { TESTIMONIALS } from "../testimonials";
import s from "../marketing.module.css";

// ── /work ────────────────────────────────────────────────────────────────────
//
// The portfolio, in full. The home page shows three cards in a grid because it
// has a job to do in one screen; this page has room for the part that actually
// sells the work — what the problem was and what got built for it.
//
// It also gives the gallery somewhere to grow. Three pieces fit on a home page.
// Ten do not, and the fix should not be "make the home page longer".
//
// A server component: nothing here is interactive, so it ships no JavaScript
// beyond the analytics beacon.

export const metadata: Metadata = {
  title: "Work — Aevaia",
  description:
    "Invitations, gifts and event pages built to order. Open them — they are live.",
};

export default function WorkPage() {
  return (
    <div className={`${s.site} ${marketingFontVars}`}>
      <div className={`${s.nav} ${s.navScrolled}`}>
        <div className={`${s.wrap} ${s.navInner}`}>
          <Link href="/" className={`${s.wordmarkLink} ${s.lockup}`}>
            <Image src="/logo-mark.png" alt="" width={24} height={24} className={s.lockupMark} />
            AEVAIA
          </Link>
          <Link
            href="/"
            className={s.navLink}
            style={{ fontFamily: "var(--mk-mono), monospace", fontSize: 12 }}
          >
            ← the studio
          </Link>
        </div>
      </div>

      <section className={s.section} style={{ paddingTop: 110 }}>
        <div className={s.wrap}>
          <span className={s.label}>Selected work</span>
          <h1 className={s.h1} style={{ fontSize: "clamp(32px,5.5vw,54px)", marginTop: 14 }}>
            Every one of these was built for<br />
            <span className={s.gradText}>a real person, by hand.</span>
          </h1>
          <p className={s.body} style={{ maxWidth: 540 }}>
            No templates and no page builder. Open them — most are live right now.
          </p>

          {/* One piece per row rather than a grid, so each gets the space to be
              read rather than skimmed. */}
          <div style={{ marginTop: 54 }}>
            {WORK.map((piece, i) => {
              const accent =
                piece.accent === "violet" ? "var(--violet-light)" : "var(--magenta-light)";
              return (
                <article
                  key={piece.slug}
                  id={piece.slug}
                  className={s.panel}
                  style={{ overflow: "hidden", marginBottom: 26, padding: 0 }}
                >
                  <div className={s.workPhoto} style={{ minHeight: 240 }}>
                    <Image
                      src={piece.image}
                      alt={`${piece.title} — ${piece.kind}`}
                      fill
                      sizes="(max-width: 880px) 100vw, 720px"
                      priority={i === 0}
                    />
                    <span className={s.workPill} style={{ color: accent }}>
                      {piece.kind}
                    </span>
                  </div>

                  <div style={{ padding: "24px 22px 26px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                      <h2 className={s.workTitle} style={{ fontSize: 24 }}>{piece.title}</h2>
                      <span
                        style={{
                          fontFamily: "var(--mk-mono), monospace",
                          fontSize: 12,
                          color: "var(--faint)",
                        }}
                      >
                        Delivered {piece.delivered}
                      </span>
                    </div>

                    <p className={s.body} style={{ margin: "10px 0 0", maxWidth: 620 }}>
                      {piece.blurb}
                    </p>

                    {piece.story && (
                      <p
                        className={s.bodySm}
                        style={{ margin: "12px 0 0", maxWidth: 620, color: "var(--muted)" }}
                      >
                        {piece.story}
                      </p>
                    )}

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "18px 0" }}>
                      {piece.tags.map(tag => (
                        <span
                          key={tag}
                          className={piece.accent === "violet" ? s.chipViolet : s.chipMagenta}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {piece.href ? (
                      <a
                        href={piece.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={s.btnGhost}
                      >
                        {piece.demo ? "Open the demo" : "Open the live site"} →
                      </a>
                    ) : (
                      <span className={s.bodySm} style={{ color: "var(--faint)" }}>
                        Private — built for one person
                      </span>
                    )}

                    {/* Said plainly rather than buried. A visitor who clicks
                        "demo" and only later finds out it was a replica has been
                        misled; one who is told up front has been respected. */}
                    {piece.demo && (
                      <p
                        className={s.bodySm}
                        style={{ marginTop: 12, color: "var(--faint)", fontSize: 13 }}
                      >
                        This opens an exact copy rather than the couple&apos;s own
                        invitation — their guest list is live and being built right
                        now, so it is not somewhere strangers should be able to write.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Renders only once real quotes exist. See app/testimonials.ts. */}
          {TESTIMONIALS.length > 0 && (
            <div style={{ marginTop: 56 }}>
              <span className={s.label}>In their words</span>
              <div style={{ marginTop: 20 }}>
                {TESTIMONIALS.map(t => (
                  <figure
                    key={t.attribution}
                    className={s.panel}
                    style={{ padding: 24, marginBottom: 16 }}
                  >
                    <blockquote className={s.body} style={{ margin: 0, maxWidth: 620 }}>
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <figcaption className={s.bodySm} style={{ marginTop: 12, color: "var(--faint)" }}>
                      {t.attribution} — {t.context}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}

          <div className={s.panel} style={{ padding: 26, marginTop: 46 }}>
            <h2 className={s.h2} style={{ fontSize: 24, marginTop: 0 }}>Yours could be next.</h2>
            <p className={s.body} style={{ maxWidth: 480 }}>
              Tell me about the day and I will tell you what it costs. No account,
              no card details.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
              <Link href="/start" className={s.btnViolet}>Start a commission</Link>
              <Link href="/#pricing" className={s.btnGhost}>See pricing</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className={s.footer}>
        <div className={`${s.wrap} ${s.footerInner}`}>
          <Link href="/" className={`${s.wordmarkLink} ${s.lockup}`} style={{ fontSize: 15 }}>
            <Image src="/logo-mark.png" alt="" width={18} height={18} className={s.lockupMarkSm} />
            AEVAIA
          </Link>
          <div className={s.footerLinks}>
            <Link href="/work" className={s.footerLink}>Work</Link>
            <Link href="/contact" className={s.footerLink}>Contact</Link>
            <Link href="/impressum" className={s.footerLink}>Impressum</Link>
            <Link href="/privacy" className={s.footerLink}>Privacy</Link>
            <Link href="/terms" className={s.footerLink}>Terms</Link>
          </div>
        </div>
      </footer>

      <Analytics />
    </div>
  );
}
