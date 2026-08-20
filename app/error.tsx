"use client";

import { useEffect } from "react";
import { marketingFontVars } from "./marketing-fonts";
import s from "./marketing.module.css";

// Shown when a page throws. Must be a client component with a reset() — that is
// the App Router contract.
//
// Deliberately does NOT print the error. A stack trace tells a visitor nothing
// and can leak internals; it goes to the console for the owner instead. What a
// visitor needs is a way to reach a human, which is why WhatsApp is here — an
// enquiry lost to a crash is a customer lost.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[aevaia] page error:", error);
  }, [error]);

  return (
    <div className={`${s.site} ${marketingFontVars}`}>
      <section className={s.section} style={{ paddingTop: 120, minHeight: "70vh" }}>
        <div className={`${s.wrap} ${s.startNarrow}`}>
          <span className={s.label}>Something broke</span>

          <h1 className={s.h1} style={{ fontSize: "clamp(32px,6vw,56px)", marginTop: 14 }}>
            That didn&apos;t work.
          </h1>

          <p className={s.body} style={{ maxWidth: 520 }}>
            Something went wrong at my end, not yours. Try again — and if it keeps
            happening, message me and I&apos;ll sort it out.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 30 }}>
            <button type="button" onClick={reset} className={s.btnViolet}>Try again</button>
            <a href="/" className={s.btnGhost}>Back to the studio</a>
            <a
              href="https://wa.me/4917675460351?text=Hi!%20I%20hit%20an%20error%20on%20aevaia.com."
              target="_blank"
              rel="noopener noreferrer"
              className={s.btnWhatsapp}
            >
              Message me
            </a>
          </div>

          {error.digest && (
            <p className={s.bodySm} style={{ marginTop: 30, color: "var(--faint-2)", fontFamily: "var(--mk-mono), monospace" }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
