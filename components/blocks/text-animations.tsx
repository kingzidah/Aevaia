"use client";

import { motion } from "framer-motion";

// ── Shiny Text ─────────────────────────────────────────────────────────────────
// Renders a sweeping highlight over any children. The shimmer strip is absolutely
// positioned with pointer-events-none so underlying inputs stay interactive.
// The `hc-shimmer` keyframe is defined in globals.css (transform: translateX).

export function ShinyText({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      {children}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.52) 50%, transparent 80%)",
          animation: "hc-shimmer 2.4s linear infinite",
        }}
      />
    </div>
  );
}

// ── Blur Words ─────────────────────────────────────────────────────────────────
// Splits `text` into individual words and reveals each via a blur-to-sharp
// Framer Motion transition. One-shot on mount — words settle into full opacity
// and then stay visible.

export function BlurWords({
  text,
  className,
  style,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <div className={className} style={style}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ filter: "blur(10px)", opacity: 0 }}
          animate={{ filter: "blur(0px)", opacity: 1 }}
          transition={{ delay: i * 0.1, duration: 0.45, ease: "easeOut" }}
          className="inline-block"
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </div>
  );
}
