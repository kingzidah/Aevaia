"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface LottieProperties {
  lottieUrl?: string;
  text?: string;
  title?: string;
  accentColor?: string;
}

interface LottiePlayerProps {
  properties?: LottieProperties;
}

// ── Dynamic import — lottie-web touches the DOM so skip SSR entirely ──────────

const Lottie = dynamic(() => import("lottie-react"), { ssr: false, loading: () => null });

// ── Default preview animation ─────────────────────────────────────────────────
// A self-contained pulsing star burst. Requires no network fetch.
// Swap DEFAULT_ANIM_DATA with any valid Lottie JSON object to change the preview.
const DEFAULT_ANIM_DATA = {
  v: "5.9.6", fr: 60, ip: 0, op: 120, w: 200, h: 200,
  nm: "star-pulse", ddd: 0, assets: [],
  layers: [{
    ddd: 0, ind: 1, ty: 4, nm: "star", sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: {
        a: 1, k: [
          { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 0,   s: [0]   },
          { t: 120, s: [360] },
        ],
      },
      p: { a: 0, k: [100, 100, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: {
        a: 1, k: [
          { i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] }, o: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] }, t: 0,   s: [85,  85,  100] },
          { i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] }, o: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] }, t: 60,  s: [105, 105, 100] },
          { t: 120, s: [85, 85, 100] },
        ],
      },
    },
    shapes: [
      {
        ty: "sr", d: 1, nm: "Star",
        pt: { a: 0, k: 5 },
        p:  { a: 0, k: [0, 0] },
        r:  { a: 0, k: 10 },
        or: { a: 0, k: 48 },
        os: { a: 0, k: 20 },
        ix: 1,
      },
      {
        ty: "fl", nm: "Fill",
        c:  { a: 0, k: [0.659, 0.333, 0.969, 1] },
        o:  { a: 0, k: 90 },
        r:  1,
      },
    ],
    ip: 0, op: 120, st: 0, bm: 0,
  }],
} as const;

// ── Empty / placeholder state ──────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] backdrop-blur-xl">
      <div className="flex items-center gap-4 px-5 py-5">

        {/* Spark icon */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-[linear-gradient(135deg,rgba(168,85,247,0.22),rgba(99,102,241,0.10))] border border-purple-500/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-purple-400/90">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-full border border-purple-500/15 animate-ping" style={{ animationDuration: "2.5s" }} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-xs font-semibold text-neutral-300 truncate flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 shrink-0" /> Select to add animation
          </p>
          <p className="text-[10px] text-neutral-600 leading-relaxed">
            Paste a Lottie JSON URL in the Style panel
          </p>
          {/* Fake shimmer bars */}
          <div className="flex items-center gap-1 mt-1.5">
            {[40, 65, 50, 75, 45].map((w, i) => (
              <div
                key={i}
                className="h-1 rounded-full bg-white/8 animate-pulse"
                style={{ width: `${w}%`, animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Loading shimmer ────────────────────────────────────────────────────────────

function LoadingShimmer() {
  return (
    <div className="w-full aspect-square max-h-64 rounded-xl bg-neutral-800/60 animate-pulse flex items-center justify-center">
      <svg className="animate-spin w-6 h-6 text-purple-500/40" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function LottiePlayer({ properties }: LottiePlayerProps) {
  const userUrl = properties?.lottieUrl?.trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [animData, setAnimData] = useState<Record<string, any> | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [errored,  setErrored]  = useState(false);

  useEffect(() => {
    if (!userUrl) {
      // No user URL — reset to idle so empty state renders
      setAnimData(null);
      setLoading(false);
      setErrored(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErrored(false);

    fetch(userUrl)
      .then(r => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: Record<string, any>) => {
        if (!cancelled) { setAnimData(data); setLoading(false); }
      })
      .catch(() => {
        if (!cancelled) { setErrored(true); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [userUrl]);

  // ── No URL set → show default animation at full opacity so block feels alive ─
  if (!userUrl) {
    return (
      <div className="w-full py-1 flex flex-col items-center gap-2">
        <div className="w-full max-h-64 flex items-center justify-center">
          <Lottie
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            animationData={DEFAULT_ANIM_DATA as any}
            loop
            autoplay
            style={{ width: "100%", maxHeight: "256px" }}
          />
        </div>
        <p className="text-[10px] text-neutral-500 text-center">Paste a Lottie URL in the Style panel to customise</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full py-1">
        <LoadingShimmer />
      </div>
    );
  }

  if (errored || !animData) {
    return (
      <div className="w-full py-1">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="w-full py-1 flex justify-center">
      <div className="w-full max-h-72 flex items-center justify-center">
        <Lottie
          animationData={animData}
          loop
          autoplay
          style={{ width: "100%", maxHeight: "288px" }}
        />
      </div>
    </div>
  );
}
