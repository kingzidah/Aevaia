"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ImageIcon, Plus } from "lucide-react";
import FileUploader from "@/components/studio/file-uploader";

// ── Types ──────────────────────────────────────────────────────────────────────

interface GalleryProperties {
  images?: string[];
  text?: string;
  title?: string;
  accentColor?: string;
}

interface MasonryGalleryProps {
  /** Direct image URLs from block.images */
  images?: string[];
  /** AI-mutable display properties — take precedence over images */
  properties?: GalleryProperties;
  /**
   * Editor-only: when provided, the empty state renders a file uploader
   * that calls this with the chosen object-URL array. Not rendered in viewer.
   */
  onImagesChange?: (urls: string[]) => void;
}

// ── Placeholder images ─────────────────────────────────────────────────────────
// Varying heights make the masonry layout immediately visible in the editor.
const PLACEHOLDER_IMAGES = [
  { url: "https://picsum.photos/seed/heartcraft-a/400/560", alt: "Memory 1" },
  { url: "https://picsum.photos/seed/heartcraft-b/400/310", alt: "Memory 2" },
  { url: "https://picsum.photos/seed/heartcraft-c/400/490", alt: "Memory 3" },
  { url: "https://picsum.photos/seed/heartcraft-d/400/340", alt: "Memory 4" },
  { url: "https://picsum.photos/seed/heartcraft-e/400/520", alt: "Memory 5" },
];

// ── Empty state — shown when no real images are available ─────────────────────

const SPARKLE_POSITIONS = ["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"] as const;

function EmptyState({ onImagesChange }: { onImagesChange?: (urls: string[]) => void }) {
  if (onImagesChange) {
    // Editor mode: show a functional file uploader
    return (
      <div className="relative w-full min-h-65 flex flex-col items-center justify-center rounded-2xl overflow-hidden">
        <FileUploader onFiles={onImagesChange} className="min-h-65" />
        {SPARKLE_POSITIONS.map((pos) => (
          <div key={pos} className={`absolute ${pos} w-1 h-1 rounded-full bg-purple-500/30 pointer-events-none`} />
        ))}
      </div>
    );
  }

  // Viewer / no-callback mode: static decorative placeholder
  // Three fanned cards — transforms encoded as Tailwind arbitrary values
  // so no inline styles are required.
  const CARD_BASE = "absolute top-1/2 left-1/2 rounded-xl overflow-hidden border border-purple-500/25 backdrop-blur-sm bg-[linear-gradient(135deg,rgba(168,85,247,0.2),rgba(99,102,241,0.2))]";
  const CARD_ICON = (
    <div className="w-full h-full flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-400/70">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3 3h18" />
      </svg>
    </div>
  );

  return (
    <div className="relative w-full min-h-65 flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-purple-500/35 bg-[radial-gradient(ellipse_at_50%_0%,rgba(168,85,247,0.06)_0%,transparent_70%)]">
      <div className="relative w-16 h-16">
        {/* Left back card */}
        <div className={`${CARD_BASE} w-10 h-10 z-0 opacity-40 transform-[translate(-50%,-50%)_translateX(-14px)_translateY(4px)_rotate(-8deg)]`}>{CARD_ICON}</div>
        {/* Right back card */}
        <div className={`${CARD_BASE} w-10 h-10 z-0 opacity-40 transform-[translate(-50%,-50%)_translateX(14px)_translateY(4px)_rotate(6deg)]`}>{CARD_ICON}</div>
        {/* Front card */}
        <div className={`${CARD_BASE} w-12 h-12 z-1 opacity-100 transform-[translate(-50%,-50%)]`}>{CARD_ICON}</div>
      </div>
      <div className="text-center space-y-1.5 px-6">
        <p className="text-sm font-semibold text-neutral-300">No images yet</p>
        <p className="text-[11px] text-neutral-600 leading-relaxed">Add image URLs in the Style panel</p>
      </div>
      {SPARKLE_POSITIONS.map((pos) => (
        <div key={pos} className={`absolute ${pos} w-1 h-1 rounded-full bg-purple-500/30`} />
      ))}
    </div>
  );
}

// ── Individual photo tile ──────────────────────────────────────────────────────

function PhotoTile({ src, alt, index }: { src: string; alt: string; index: number }) {
  const [loaded, setLoaded]   = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <motion.div
      className="relative mb-3 break-inside-avoid rounded-xl overflow-hidden cursor-pointer group shadow-[0_2px_12px_rgba(0,0,0,0.35),0_1px_3px_rgba(0,0,0,0.25)]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
    >
      {!loaded && !errored && (
        <div className="w-full min-h-30 bg-neutral-800 animate-pulse" />
      )}
      {errored && (
        <div className="w-full min-h-30 flex items-center justify-center bg-neutral-800/80">
          <ImageIcon className="w-6 h-6 opacity-20 text-neutral-400" />
        </div>
      )}
      {!errored && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`w-full block object-cover origin-center transition-all duration-500 group-hover:scale-[1.03] group-hover:brightness-110 ${loaded ? "opacity-100" : "opacity-0 absolute inset-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-8 bg-linear-to-b from-white/6 to-transparent pointer-events-none" />
    </motion.div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function MasonryGallery({ images, properties, onImagesChange }: MasonryGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI-mutated properties.images take precedence over block.images
  const resolved = properties?.images ?? images ?? [];
  const srcs     = resolved.filter(Boolean);

  const handleAddFiles = (urls: string[]) => {
    onImagesChange?.([...srcs, ...urls]);
  };

  if (srcs.length === 0) {
    return (
      <div className="w-full p-4">
        <EmptyState onImagesChange={onImagesChange} />
      </div>
    );
  }

  // Backfill with placeholders when fewer than 2 real images are provided
  // so the masonry layout is always visible in the editor.
  const tiles =
    srcs.length < 2
      ? [
          ...srcs.map((url, i) => ({ url, alt: `Memory ${i + 1}` })),
          ...PLACEHOLDER_IMAGES.slice(srcs.length, 5),
        ]
      : srcs.map((url, i) => ({ url, alt: `Memory ${i + 1}` }));

  const colClass = tiles.length <= 2 ? "columns-2" : "columns-3";

  return (
    <div className="w-full p-4 space-y-3">
      <div className={`${colClass} gap-3`}>
        {tiles.map((tile, i) => (
          <PhotoTile key={`${tile.url}-${i}`} src={tile.url} alt={tile.alt} index={i} />
        ))}
      </div>

      {/* Add Photo button — editor only */}
      {onImagesChange && srcs.length < 9 && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            aria-label="Add photos to gallery"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const files = e.target.files;
              if (!files?.length) return;
              const urls = Array.from(files)
                .filter(f => f.type.startsWith("image/"))
                .map(f => URL.createObjectURL(f));
              if (urls.length) handleAddFiles(urls);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-neutral-700 bg-neutral-900/40 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-neutral-500 hover:text-emerald-400 text-xs font-medium transition-all duration-200"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Photo
          </button>
        </>
      )}
    </div>
  );
}
