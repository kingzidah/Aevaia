"use client";

import DOMPurify from "isomorphic-dompurify";
import { PenTool } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface VectorProperties {
  svgCode?:    string;
  vectorType?: string;
  text?: string;
  title?: string;
  accentColor?: string;
}

interface VectorArtProps {
  properties?: VectorProperties;
}

// ── Built-in vector presets ───────────────────────────────────────────────────
// Keyed by vectorType; each value is a complete inline SVG string.

const PRESETS: Record<string, string> = {
  heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90" fill="none">
    <path d="M50 82 C50 82 8 55 8 28 C8 15 18 6 30 6 C38 6 45 11 50 17 C55 11 62 6 70 6 C82 6 92 15 92 28 C92 55 50 82 50 82Z" fill="rgba(168,85,247,0.7)" stroke="rgba(168,85,247,0.9)" stroke-width="2"/>
  </svg>`,

  underline: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 40" fill="none">
    <path d="M10,28 C50,8 100,36 150,20 C200,4 250,32 290,18" stroke="rgba(168,85,247,0.8)" stroke-width="3" stroke-linecap="round"/>
    <path d="M20,34 C60,26 110,38 160,30 C210,22 260,36 285,28" stroke="rgba(236,72,153,0.4)" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
    <polygon points="50,8 61,36 92,36 68,56 77,84 50,66 23,84 32,56 8,36 39,36" fill="rgba(168,85,247,0.65)" stroke="rgba(168,85,247,0.9)" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`,

  infinity: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" fill="none">
    <path d="M100,40 C100,40 80,12 55,12 C30,12 12,26 12,40 C12,54 30,68 55,68 C80,68 100,40 100,40 C100,40 120,12 145,12 C170,12 188,26 188,40 C188,54 170,68 145,68 C120,68 100,40 100,40 Z" stroke="rgba(168,85,247,0.85)" stroke-width="4" stroke-linecap="round"/>
  </svg>`,
};

// Default shown when nothing is configured — a decorative dual-wave underline
const DEFAULT_SVG = PRESETS.underline;

// ── Renderer: sanitises + renders SVG code or a preset ───────────────────────

function SvgRenderer({ svgCode }: { svgCode: string }) {
  return (
    <div
      className="w-full flex items-center justify-center"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(svgCode, {
        USE_PROFILES: { svg: true, svgFilters: true },
        FORBID_TAGS: ["script", "foreignObject"],
      }) }}
    />
  );
}

// ── Empty / placeholder state ──────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] backdrop-blur-xl">
      <div className="flex items-center gap-4 px-5 py-5">

        {/* Pen-nib icon */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-[linear-gradient(135deg,rgba(139,92,246,0.22),rgba(99,102,241,0.10))] border border-violet-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5 text-violet-400/90">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-xs font-semibold text-neutral-300 truncate flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 shrink-0" /> Select to add custom vector art
          </p>
          <p className="text-[10px] text-neutral-600 leading-relaxed">
            Paste SVG code or choose a preset in the Style panel
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function VectorArt({ properties }: VectorArtProps) {
  const svgCode    = properties?.svgCode?.trim();
  const vectorType = properties?.vectorType?.trim();

  // Priority: explicit SVG code > named preset > default preview
  const resolved =
    svgCode                     ? svgCode :
    vectorType && PRESETS[vectorType] ? PRESETS[vectorType] :
    null;

  if (!resolved) {
    return (
      <div className="w-full py-1 space-y-3">
        <EmptyState />
        {/* Default preview so the block isn't visually empty in the editor */}
        <div className="w-full px-4 opacity-50">
          <SvgRenderer svgCode={DEFAULT_SVG} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-3 px-4">
      <SvgRenderer svgCode={resolved} />
    </div>
  );
}

// Export presets so the style panel can list them
export { PRESETS as VECTOR_PRESETS };
