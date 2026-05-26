"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CanvasControlPillProps {
  zoom:         number;
  setZoom:      (updater: number | ((z: number) => number)) => void;
  resetView:    () => void;
  fitToScreen:  () => void;
}

// Zoom is clamped to [0.25, 2.0] for the pill controls (±10% per click).
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.00;

function clamp(v: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v));
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function CanvasControlPill({
  zoom,
  setZoom,
  resetView,
  fitToScreen,
}: CanvasControlPillProps) {
  const [collapsed, setCollapsed] = useState(false);

  const zoomOut = useCallback(() => {
    setZoom((z: number) => parseFloat(clamp(z - 0.1).toFixed(2)));
  }, [setZoom]);

  const zoomIn = useCallback(() => {
    setZoom((z: number) => parseFloat(clamp(z + 0.1).toFixed(2)));
  }, [setZoom]);

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">

      {/* ── Main pill ── */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="pill"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="flex items-center gap-0 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-full px-1.5 py-1 shadow-[0_2px_16px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Zoom out */}
            <button
              type="button"
              aria-label="Zoom out (10%)"
              onClick={zoomOut}
              disabled={zoom <= MIN_ZOOM}
              className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-base leading-none font-light"
            >
              −
            </button>

            {/* Zoom percentage — click to reset to 100% */}
            <button
              type="button"
              title="Reset to 100%"
              onClick={resetView}
              className="min-w-[3rem] h-7 px-1.5 rounded-full text-[11px] font-mono font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all tracking-wide"
            >
              {Math.round(zoom * 100)}%
            </button>

            {/* Zoom in */}
            <button
              type="button"
              aria-label="Zoom in (10%)"
              onClick={zoomIn}
              disabled={zoom >= MAX_ZOOM}
              className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-base leading-none font-light"
            >
              +
            </button>

            {/* Divider */}
            <div className="border-l border-zinc-700 h-4 mx-1" />

            {/* Fit to screen */}
            <button
              type="button"
              aria-label="Fit to screen"
              title="Fit to screen"
              onClick={fitToScreen}
              className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                <path strokeLinecap="round" d="M2 5V2h3M11 2h3v3M14 11v3h-3M5 14H2v-3" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Collapse toggle handle ── */}
      <button
        type="button"
        aria-label={collapsed ? "Expand zoom controls" : "Collapse zoom controls"}
        onClick={(e) => { e.stopPropagation(); setCollapsed(v => !v); }}
        className="w-6 h-6 rounded-full bg-zinc-900/80 border border-zinc-800 backdrop-blur-md flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all shadow-md"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className={`w-3 h-3 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}
