import Link from "next/link";
import { marketingFontVars } from "./marketing-fonts";
import s from "./marketing.module.css";

// Shown for any unmatched URL. Previously this was Next's unbranded default,
// which reads as a broken site rather than a mistyped address — bad on a page
// people reach from links pasted into WhatsApp, where typos are common.
//
// Wears the marketing skin so it clearly belongs to Aevaia, and always offers a
// way onward rather than leaving someone at a dead end.
export default function NotFound() {
  return (
    <div className={`${s.site} ${marketingFontVars}`}>
      <section className={s.section} style={{ paddingTop: 120, minHeight: "70vh" }}>
        <div className={`${s.wrap} ${s.startNarrow}`}>
          <span className={s.label}>404</span>

          <h1 className={s.h1} style={{ fontSize: "clamp(32px,6vw,56px)", marginTop: 14 }}>
            That page doesn&apos;t exist.
          </h1>

          <p className={s.body} style={{ maxWidth: 520 }}>
            The link may be mistyped, or the page may have moved. Nothing is broken
            on your end.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 30 }}>
            <Link href="/" className={s.btnViolet}>Back to the studio</Link>
            <Link href="/start" className={s.btnGhost}>Start a commission</Link>
          </div>

          <p className={s.bodySm} style={{ marginTop: 34, color: "var(--faint)" }}>
            Looking for a site someone sent you? Those live on their own address —
            check the link they gave you rather than this one.
          </p>
        </div>
      </section>
    </div>
  );
}
