"use client";

import { motion } from "framer-motion";
import type { CanvasTool } from "@/types/studio";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UtilityDockProps {
  // Interaction mode
  activeTool:    CanvasTool;
  setActiveTool: (t: CanvasTool) => void;
  // Theme
  theme:         string;
  setTheme:      (t: string) => void;
  // Canvas zoom/pan
  zoom:          number;
  setZoom:       (updater: number | ((z: number) => number)) => void;
  onFitView:     () => void;
  // History
  onUndo:        () => void;
  onRedo:        () => void;
  canUndo:       boolean;
  canRedo:       boolean;
}

const THEMES_CYCLE = ["minimalist", "dark-romance", "bright-birthday"] as const;

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.00;

function clampZoom(v: number) {
  return parseFloat(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v)).toFixed(2));
}

// ── SVG icon helpers ──────────────────────────────────────────────────────────

function CursorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 3l14 9-7 1-4 6z" />
    </svg>
  );
}

function HandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 11V7a2 2 0 00-2-2 2 2 0 00-2 2V4a2 2 0 00-2-2 2 2 0 00-2 2v3a2 2 0 00-2-2 2 2 0 00-2 2v8a7 7 0 0014 0v-3a2 2 0 00-2-2z" />
    </svg>
  );
}

function CommentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1"    x2="12" y2="3"    />
      <line x1="12" y1="21"   x2="12" y2="23"   />
      <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"  />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1"  y1="12"   x2="3"  y2="12"   />
      <line x1="21" y1="12"   x2="23" y2="12"   />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function CrosshairIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6"  y1="12" x2="2"  y2="12" />
      <line x1="12" y1="6"  x2="12" y2="2"  />
      <line x1="12" y1="22" x2="12" y2="18" />
    </svg>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function UtilityDock({
  activeTool, setActiveTool,
  theme, setTheme,
  zoom, setZoom, onFitView,
  onUndo, onRedo, canUndo, canRedo,
}: UtilityDockProps) {

  const isDark = theme === "dark-romance";

  const cycleTheme = () => {
    const idx = THEMES_CYCLE.indexOf(theme as typeof THEMES_CYCLE[number]);
    setTheme(THEMES_CYCLE[(idx + 1) % THEMES_CYCLE.length]);
  };

  const zoomOut = () => setZoom((z: number) => clampZoom(z - 0.1));
  const zoomIn  = () => setZoom((z: number) => clampZoom(z + 0.1));

  const TOOLS: { id: CanvasTool; label: string; Icon: React.FC<{ className?: string }> }[] = [
    { id: "select",  label: "Select (V)",  Icon: CursorIcon  },
    { id: "pan",     label: "Pan (H)",     Icon: HandIcon    },
    { id: "comment", label: "Comment (C)", Icon: CommentIcon },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0  }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="flex items-center bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-full px-2 py-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.55)] gap-0.5"
      onClick={(e) => e.stopPropagation()}
    >

      {/* ── FAR LEFT: Undo / Redo ── */}
      <button
        type="button"
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        onClick={onUndo}
        disabled={!canUndo}
        className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
        </svg>
      </button>
      <button
        type="button"
        title="Redo (Ctrl+Y)"
        aria-label="Redo"
        onClick={onRedo}
        disabled={!canRedo}
        className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
        </svg>
      </button>

      {/* ── Divider ── */}
      <div className="border-l border-zinc-800 h-5 mx-1" />

      {/* ── LEFT: Interaction mode tools ── */}
      {TOOLS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          title={label}
          aria-label={label}
          onClick={() => setActiveTool(id)}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
            activeTool === id
              ? "bg-zinc-700 text-white shadow-inner"
              : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          }`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}

      {/* ── Divider ── */}
      <div className="border-l border-zinc-800 h-5 mx-1" />

      {/* ── MIDDLE: Theme toggle ── */}
      <button
        type="button"
        title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        aria-label="Toggle theme"
        onClick={cycleTheme}
        className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-all"
      >
        {isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
      </button>

      {/* ── Divider ── */}
      <div className="border-l border-zinc-800 h-5 mx-1" />

      {/* ── RIGHT: Canvas zoom controls ── */}

      {/* Zoom out */}
      <button
        type="button"
        aria-label="Zoom out 10%"
        onClick={zoomOut}
        disabled={zoom <= MIN_ZOOM}
        className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-base leading-none font-light select-none"
      >
        −
      </button>

      {/* Zoom percentage — click to fit view */}
      <button
        type="button"
        title="Fit to screen (reset zoom)"
        onClick={onFitView}
        className="min-w-12 h-7 px-1 rounded-full text-[11px] font-mono font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all tabular-nums"
      >
        {Math.round(zoom * 100)}%
      </button>

      {/* Zoom in */}
      <button
        type="button"
        aria-label="Zoom in 10%"
        onClick={zoomIn}
        disabled={zoom >= MAX_ZOOM}
        className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-base leading-none font-light select-none"
      >
        +
      </button>

      {/* ── Divider ── */}
      <div className="border-l border-zinc-800 h-5 mx-1" />

      {/* Recenter canvas */}
      <button
        type="button"
        aria-label="Recenter canvas"
        title="Recenter — reset zoom to 100% and center canvas"
        onClick={onFitView}
        className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-all"
      >
        <CrosshairIcon className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
