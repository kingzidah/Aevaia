import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { marketingFontVars } from "./marketing-fonts";
import s from "./marketing.module.css";
import { Analytics } from "@vercel/analytics/react";

// ── Shared chrome for /impressum, /privacy and /terms ────────────────────────
//
// These three pages had drifted onto the old zinc-and-purple brand with the old
// heart logo, so clicking "Privacy" in the footer looked like leaving the site
// for someone else's. They now wear the same design system as the home page.
//
// One shell rather than three copies, because the drift is the actual failure
// mode here: a legal page is written once and then never looked at again, and
// three hand-maintained copies of the same nav guarantee they diverge.
//
// A server component — no "use client" — so each page can export its own
// metadata for search and link previews.

/** An unresolved operator decision, deliberately visible on the page. */
export function Todo({ children }: { children: ReactNode }) {
  return (
    <span style={{ color: "var(--magenta-light)" }}>
      <strong
        style={{
          fontFamily: "var(--mk-mono), monospace",
          fontSize: 12,
          letterSpacing: ".08em",
        }}
      >
        TODO-OPERATOR
      </strong>{" "}
      — {children}
    </span>
  );
}

/** A link in body copy. Inline links are exempt from the 44px tap target. */
export function L({ href, children }: { href: string; children: ReactNode }) {
  const style = { color: "var(--violet-light)" };
  if (href.startsWith("/")) {
    return <Link href={href} style={style}>{children}</Link>;
  }
  // mailto: and off-site links stay plain anchors
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      style={style}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

export type LegalSection = { n: string; title: string; body: ReactNode };

/** Numbered sections, rendered in the same rhythm as the home page's steps. */
export function LegalSections({ sections }: { sections: LegalSection[] }) {
  return (
    <div style={{ marginTop: 40 }}>
      {sections.map(sec => (
        <div key={sec.n} className={s.step} style={{ marginBottom: 26 }}>
          <div className={`${s.stepNum} ${s.gradText}`} style={{ fontSize: 26 }}>
            {sec.n}
          </div>
          <div className={s.stepTitle}>{sec.title}</div>
          <div className={s.bodySm} style={{ maxWidth: 620 }}>
            {sec.body}
          </div>
        </div>
      ))}
    </div>
  );
}

/** A loud banner for a page that is published but not yet valid. */
export function IncompleteNotice({ children }: { children: ReactNode }) {
  return (
    <div
      className={s.panel}
      style={{
        padding: 20,
        marginTop: 28,
        borderColor: "color-mix(in srgb, var(--magenta) 40%, transparent)",
      }}
    >
      <p className={s.bodySm} style={{ margin: 0 }}>
        {children}
      </p>
    </div>
  );
}

export function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  updated?: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
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
        <div className={`${s.wrap} ${s.startNarrow}`}>
          <span className={s.label}>{eyebrow}</span>

          <h1 className={s.h1} style={{ fontSize: "clamp(32px,5.5vw,52px)", marginTop: 14 }}>
            {title}
          </h1>

          {updated && (
            <p className={s.bodySm} style={{ color: "var(--faint)", marginBottom: 8 }}>
              Last updated {updated}
            </p>
          )}

          {intro && <p className={s.body} style={{ maxWidth: 560 }}>{intro}</p>}

          {children}

          <p className={s.bodySm} style={{ marginTop: 34, color: "var(--faint)" }}>
            Questions? <L href="/contact">Get in touch</L>. Operator details are on the{" "}
            <L href="/impressum">Impressum</L>.
          </p>
        </div>
      </section>

      <footer className={s.footer}>
        <div className={`${s.wrap} ${s.footerInner}`}>
          <Link href="/" className={`${s.wordmarkLink} ${s.lockup}`} style={{ fontSize: 15 }}>
            <Image src="/logo-mark.png" alt="" width={18} height={18} className={s.lockupMarkSm} />
            AEVAIA
          </Link>
          <div className={s.footerLinks}>
            <a href="/contact" className={s.footerLink}>Contact</a>
            <a href="/impressum" className={s.footerLink}>Impressum</a>
            <a href="/privacy" className={s.footerLink}>Privacy</a>
            <a href="/terms" className={s.footerLink}>Terms</a>
          </div>
        </div>
      </footer>

      <Analytics />
    </div>
  );
}
