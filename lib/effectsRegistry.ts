// ── Interactive Effects Registry ──────────────────────────────────────────────
// All components are dynamically imported with { ssr: false } because they use
// canvas / requestAnimationFrame / ResizeObserver — browser-only APIs.
//
// Taxonomy mirrors ReactBits.dev:
//   Backgrounds   — full-canvas visual atmospheres (behind all blocks)
//   TextAnimations — decorative animated text/light overlays
//   Components     — interactive canvas decorations driven by cursor input
//
// To add a new effect: create the component, add an entry here and in
// EFFECT_META below.  The UI in LeftSidebar will pick it up automatically.

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { Waves, Sparkles, Grip, Droplet, Magnet } from "lucide-react";

const loading = () => null;

export const EffectsRegistry = {
  Backgrounds: {
    Aurora:       dynamic(() => import("@/components/canvas/effects/Aurora"),                      { ssr: false, loading }),
    DotField:     dynamic(() => import("@/components/canvas/effects/DotField"),                    { ssr: false, loading }),
    LineWaves:    dynamic(() => import("@/components/canvas/effects/LineWaves"),                   { ssr: false, loading }),
    Grid:         dynamic(() => import("@/components/canvas/effects/Grid"),                        { ssr: false, loading }),
    MagicRings:   dynamic(() => import("@/components/canvas/effects/MagicRings"),                  { ssr: false, loading }),
    SplashCursor: dynamic(() => import("@/components/canvas/effects/backgrounds/SplashCursor"),    { ssr: false, loading }),
  },
  TextAnimations: {
    ShinyText:    dynamic(() => import("@/components/canvas/effects/text/ShinyText"),              { ssr: false, loading }),
    BlurText:     dynamic(() => import("@/components/canvas/effects/text/BlurText"),               { ssr: false, loading }),
  },
  Components: {
    MagnetLines:  dynamic(() => import("@/components/canvas/effects/components/MagnetLines"),      { ssr: false, loading }),
  },
} as const;

// ── Type helpers ──────────────────────────────────────────────────────────────

export type EffectCategory = keyof typeof EffectsRegistry;
export type EffectKey = {
  [C in EffectCategory]: keyof typeof EffectsRegistry[C]
}[EffectCategory];

// ── Flat lookup ───────────────────────────────────────────────────────────────
// Searches every category so callers can use a bare key string ("Aurora",
// "ShinyText") without knowing which category it lives in.

export function getEffectComponent(key: string): ComponentType | null {
  for (const category of Object.values(EffectsRegistry)) {
    if (key in category) {
      return category[key as keyof typeof category] as React.ComponentType;
    }
  }
  return null;
}

// ── Category metadata (for the Left Panel UI) ─────────────────────────────────

export const CATEGORY_META: Record<EffectCategory, { label: string; icon: string | ComponentType<{ className?: string }> }> = {
  Backgrounds:    { label: "Backgrounds",      icon: Waves    },
  TextAnimations: { label: "Text Animations",  icon: Sparkles },
  Components:     { label: "Components",        icon: Grip     },
};

// ── Per-effect metadata ───────────────────────────────────────────────────────

export const EFFECT_META: Record<string, { label: string; icon: string | ComponentType<{ className?: string }>; desc: string }> = {
  // Backgrounds
  Aurora:       { label: "Aurora",        icon: Waves,   desc: "Northern-lights colour wash"    },
  DotField:     { label: "Dot Field",     icon: "✦",     desc: "Pulsing gradient dot grid"      },
  LineWaves:    { label: "Line Waves",    icon: "〜",    desc: "Flowing sine-wave ribbons"       },
  Grid:         { label: "Grid",          icon: "⊞",     desc: "Retro perspective floor grid"    },
  MagicRings:   { label: "Magic Rings",   icon: "◎",     desc: "Concentric ripple rings"         },
  SplashCursor: { label: "Splash Cursor", icon: Droplet,  desc: "Ink-splash cursor trail"         },
  // Text Animations
  ShinyText:    { label: "Shiny",         icon: "✸",     desc: "Premium foil-sheen sweep"        },
  BlurText:     { label: "Blur Words",    icon: "☁",     desc: "Romantic words blur in & out"    },
  // Components
  MagnetLines:  { label: "Magnet Lines",  icon: Magnet,   desc: "Compass needles follow cursor"   },
};
