"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CanvasComment } from "@/types/studio";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CommentPinProps {
  comment:  CanvasComment;
  onDelete: () => void;
  /** Current canvas zoom — used to counter-scale so pins stay a constant visual size */
  zoom:     number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
}

// ── Palette for author avatars — deterministic via name hash ──────────────────

const AVATAR_COLORS = [
  "bg-violet-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-teal-600",
  "bg-sky-600",
  "bg-indigo-600",
];

function avatarColor(name: string): string {
  const code = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function CommentPin({ comment, onDelete, zoom }: CommentPinProps) {
  const [open, setOpen] = useState(false);

  // Counter-scale the pin so it remains visually the same size at any zoom level
  const scaleStyle = { transform: `scale(${1 / zoom})`, transformOrigin: "top left" };

  return (
    // Outer wrapper — absolutely positioned in canvas coordinate space
    <div
      style={{
        position:    "absolute",
        left:        comment.x,
        top:         comment.y,
        pointerEvents: "auto",
        zIndex:       50,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Counter-scaled inner wrapper */}
      <div style={scaleStyle}>

        {/* ── Pin button ── */}
        <button
          type="button"
          aria-label={`Comment by ${comment.authorName}: ${comment.message}`}
          onClick={() => setOpen(v => !v)}
          className={`
            relative w-8 h-8 rounded-full border-2 border-white/20 shadow-[0_2px_12px_rgba(0,0,0,0.6)]
            flex items-center justify-center text-[11px] font-bold text-white select-none
            transition-transform hover:scale-110 focus:outline-none
            ${avatarColor(comment.authorName)}
          `}
        >
          {initials(comment.authorName)}
          {/* Tail */}
          <span
            aria-hidden
            className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 border-r-2 border-b-2 border-white/20 ${avatarColor(comment.authorName)}`}
          />
        </button>

        {/* ── Expanded card ── */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="card"
              initial={{ opacity: 0, y: -6, scale: 0.94 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: -6, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="absolute top-10 left-0 w-56 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.7)] overflow-hidden z-60"
            >
              {/* Author row */}
              <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
                <div className={`w-7 h-7 rounded-full ${avatarColor(comment.authorName)} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                  {initials(comment.authorName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-zinc-200 truncate">{comment.authorName}</p>
                  <p className="text-[9px] text-zinc-600">{formatTime(comment.createdAt)}</p>
                </div>
                {/* Close */}
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="w-5 h-5 flex items-center justify-center rounded-full text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors shrink-0"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Message */}
              <div className="px-3 pb-2.5">
                <p className="text-[12px] text-zinc-300 leading-relaxed">{comment.message}</p>
              </div>

              {/* Actions */}
              <div className="border-t border-zinc-800 px-3 py-2 flex justify-end">
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-400 transition-colors font-medium"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                  Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
