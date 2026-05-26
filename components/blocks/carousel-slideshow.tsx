"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FileUploader from "@/components/studio/file-uploader";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CarouselProperties {
  images?: string[];
  text?: string;
  title?: string;
  accentColor?: string;
}

interface CarouselSlideshowProps {
  /** Direct image URLs from block.images */
  images?: string[];
  /** AI-mutable display properties — images here take precedence */
  properties?: CarouselProperties;
  /**
   * Editor-only: when provided, the empty state renders a file uploader
   * that calls this with the chosen object-URL array. Not rendered in viewer.
   */
  onImagesChange?: (urls: string[]) => void;
}

// ── Framer Motion slide variants ──────────────────────────────────────────────

const variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

const TRANSITION = { duration: 0.38, ease: [0.32, 0.72, 0, 1] as const };

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ onImagesChange }: { onImagesChange?: (urls: string[]) => void }) {
  if (onImagesChange) {
    return (
      <div className="w-full aspect-video rounded-2xl overflow-hidden">
        <FileUploader onFiles={onImagesChange} className="h-full rounded-2xl" />
      </div>
    );
  }

  // Viewer / no-callback mode: static decorative placeholder strip
  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-neutral-900 border border-white/8 flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-neutral-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3 3h18" />
        </svg>
      </div>
      <p className="text-xs text-neutral-600">No slides yet</p>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function CarouselSlideshow({ images, properties, onImagesChange }: CarouselSlideshowProps) {
  const [index,     setIndex]     = useState(0);
  const [direction, setDirection] = useState(1);

  // Resolve image list — properties override, then block.images
  const resolved = properties?.images?.filter(Boolean) ?? images?.filter(Boolean) ?? [];

  // Show the uploader / empty state when no user images have been set
  if (resolved.length === 0) {
    return (
      <div className="w-full py-1">
        <EmptyState onImagesChange={onImagesChange} />
      </div>
    );
  }

  const slides = resolved;
  const total  = slides.length;

  const go = useCallback((delta: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDirection(delta);
    setIndex(i => (i + delta + total) % total);
  }, [total]);

  const goTo = useCallback((i: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  }, [index]);

  return (
    <div className="w-full py-1">
      {/* ── Main slide frame ── */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.45)] group">

        {/* Slides */}
        <AnimatePresence custom={direction} initial={false}>
          <motion.img
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={TRANSITION}
            src={slides[index]}
            alt={`Slide ${index + 1} of ${total}`}
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover select-none"
          />
        </AnimatePresence>

        {/* Subtle vignette overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent pointer-events-none z-10" />

        {/* ── Navigation arrows — only shown on hover ── */}
        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={(e) => go(-1, e)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 bg-black/30 hover:bg-black/55 backdrop-blur-sm border border-white/15 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={(e) => go(1, e)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 bg-black/30 hover:bg-black/55 backdrop-blur-sm border border-white/15 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}

        {/* ── Dot indicators ── */}
        {total > 1 && (
          <div className="absolute bottom-3 left-0 right-0 z-20 flex items-center justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={(e) => goTo(i, e)}
                className={`rounded-full transition-all duration-300 ${
                  i === index
                    ? "w-5 h-1.5 bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                    : "w-1.5 h-1.5 bg-white/45 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}

        {/* Slide counter badge */}
        {total > 1 && (
          <div className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded-full bg-black/35 backdrop-blur-sm border border-white/10 text-[10px] font-semibold text-white/80 tabular-nums pointer-events-none">
            {index + 1} / {total}
          </div>
        )}
      </div>
    </div>
  );
}
