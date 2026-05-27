"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// ── Accent token map ──────────────────────────────────────────────────────────
// All class strings are static so Tailwind v4 can scan and include them.

export type PanelAccent =
  | 'purple' | 'violet' | 'blue' | 'emerald' | 'fuchsia'
  | 'cyan'   | 'red'    | 'orange' | 'amber'  | 'pink'
  | 'teal'   | 'slate';

export interface AccentTokens {
  iconBg:     string;   // icon container background
  iconBorder: string;   // icon container border
  iconText:   string;   // icon element text-color class
  divider:    string;   // section-divider label text color
  chip:       string;   // chip/preset button hover classes
  focus:      string;   // textarea/input focus border + ring
  btn:        string;   // primary action button bg + hover-bg
  shadow:     string;   // primary action button glow shadow
  wave:       string;   // CSS gradient value for the bottom wave strip
  pill:       string;   // inline suggestion pill bg + border + text + hover
  toneActive: string;   // active-state for toggle-grid buttons (e.g. Emotional Tone)
  quickHover: string;   // quick-list item hover border + bg
}

export const PANEL_ACCENTS: Record<PanelAccent, AccentTokens> = {
  purple: {
    iconBg:     'bg-purple-500/15',
    iconBorder: 'border-purple-500/30',
    iconText:   'text-purple-400',
    divider:    'text-purple-500/70',
    chip:       'hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/30',
    focus:      'focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40',
    btn:        'bg-purple-600 hover:bg-purple-500',
    shadow:     'shadow-[0_0_16px_rgba(168,85,247,0.25)]',
    wave:       'linear-gradient(90deg,transparent 0%,rgba(168,85,247,0.55) 50%,transparent 100%)',
    pill:       'bg-purple-500/10 border-purple-500/20 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400/40',
    toneActive: 'border-purple-500 bg-purple-500/15 text-purple-200',
    quickHover: 'hover:border-purple-500/40 hover:text-neutral-200 hover:bg-purple-500/5',
  },
  violet: {
    iconBg:     'bg-violet-500/15',
    iconBorder: 'border-violet-500/30',
    iconText:   'text-violet-400',
    divider:    'text-violet-500/70',
    chip:       'hover:bg-violet-500/10 hover:text-violet-300 hover:border-violet-500/30',
    focus:      'focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40',
    btn:        'bg-violet-600 hover:bg-violet-500',
    shadow:     'shadow-[0_0_16px_rgba(139,92,246,0.25)]',
    wave:       'linear-gradient(90deg,transparent 0%,rgba(139,92,246,0.55) 50%,transparent 100%)',
    pill:       'bg-violet-500/10 border-violet-500/20 text-violet-300 hover:bg-violet-500/20 hover:border-violet-400/40',
    toneActive: 'border-violet-500 bg-violet-500/15 text-violet-200',
    quickHover: 'hover:border-violet-500/40 hover:text-neutral-200 hover:bg-violet-500/5',
  },
  blue: {
    iconBg:     'bg-blue-500/15',
    iconBorder: 'border-blue-500/30',
    iconText:   'text-blue-400',
    divider:    'text-blue-500/70',
    chip:       'hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-500/30',
    focus:      'focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40',
    btn:        'bg-blue-600 hover:bg-blue-500',
    shadow:     'shadow-[0_0_16px_rgba(59,130,246,0.25)]',
    wave:       'linear-gradient(90deg,transparent 0%,rgba(59,130,246,0.55) 50%,transparent 100%)',
    pill:       'bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400/40',
    toneActive: 'border-blue-500 bg-blue-500/15 text-blue-200',
    quickHover: 'hover:border-blue-500/40 hover:text-neutral-200 hover:bg-blue-500/5',
  },
  emerald: {
    iconBg:     'bg-emerald-500/15',
    iconBorder: 'border-emerald-500/30',
    iconText:   'text-emerald-400',
    divider:    'text-emerald-500/70',
    chip:       'hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30',
    focus:      'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40',
    btn:        'bg-emerald-600 hover:bg-emerald-500',
    shadow:     'shadow-[0_0_16px_rgba(16,185,129,0.25)]',
    wave:       'linear-gradient(90deg,transparent 0%,rgba(16,185,129,0.55) 50%,transparent 100%)',
    pill:       'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400/40',
    toneActive: 'border-emerald-500 bg-emerald-500/15 text-emerald-200',
    quickHover: 'hover:border-emerald-500/40 hover:text-neutral-200 hover:bg-emerald-500/5',
  },
  fuchsia: {
    iconBg:     'bg-fuchsia-500/15',
    iconBorder: 'border-fuchsia-500/30',
    iconText:   'text-fuchsia-400',
    divider:    'text-fuchsia-500/70',
    chip:       'hover:bg-fuchsia-500/10 hover:text-fuchsia-300 hover:border-fuchsia-500/30',
    focus:      'focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500/40',
    btn:        'bg-fuchsia-600 hover:bg-fuchsia-500',
    shadow:     'shadow-[0_0_16px_rgba(192,38,211,0.25)]',
    wave:       'linear-gradient(90deg,transparent 0%,rgba(192,38,211,0.55) 50%,transparent 100%)',
    pill:       'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/20 hover:border-fuchsia-400/40',
    toneActive: 'border-fuchsia-500 bg-fuchsia-500/15 text-fuchsia-200',
    quickHover: 'hover:border-fuchsia-500/40 hover:text-neutral-200 hover:bg-fuchsia-500/5',
  },
  cyan: {
    iconBg:     'bg-cyan-500/15',
    iconBorder: 'border-cyan-500/30',
    iconText:   'text-cyan-400',
    divider:    'text-cyan-500/70',
    chip:       'hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/30',
    focus:      'focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40',
    btn:        'bg-cyan-600 hover:bg-cyan-500',
    shadow:     'shadow-[0_0_16px_rgba(6,182,212,0.25)]',
    wave:       'linear-gradient(90deg,transparent 0%,rgba(6,182,212,0.55) 50%,transparent 100%)',
    pill:       'bg-cyan-500/10 border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400/40',
    toneActive: 'border-cyan-500 bg-cyan-500/15 text-cyan-200',
    quickHover: 'hover:border-cyan-500/40 hover:text-neutral-200 hover:bg-cyan-500/5',
  },
  red: {
    iconBg:     'bg-red-500/15',
    iconBorder: 'border-red-500/30',
    iconText:   'text-red-400',
    divider:    'text-red-500/70',
    chip:       'hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30',
    focus:      'focus:border-red-500 focus:ring-1 focus:ring-red-500/40',
    btn:        'bg-red-600 hover:bg-red-500',
    shadow:     'shadow-[0_0_16px_rgba(239,68,68,0.25)]',
    wave:       'linear-gradient(90deg,transparent 0%,rgba(239,68,68,0.55) 50%,transparent 100%)',
    pill:       'bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/20 hover:border-red-400/40',
    toneActive: 'border-red-500 bg-red-500/15 text-red-200',
    quickHover: 'hover:border-red-500/40 hover:text-neutral-200 hover:bg-red-500/5',
  },
  orange: {
    iconBg:     'bg-orange-500/15',
    iconBorder: 'border-orange-500/30',
    iconText:   'text-orange-400',
    divider:    'text-orange-500/70',
    chip:       'hover:bg-orange-500/10 hover:text-orange-300 hover:border-orange-500/30',
    focus:      'focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40',
    btn:        'bg-orange-600 hover:bg-orange-500',
    shadow:     'shadow-[0_0_16px_rgba(234,88,12,0.25)]',
    wave:       'linear-gradient(90deg,transparent 0%,rgba(234,88,12,0.55) 50%,transparent 100%)',
    pill:       'bg-orange-500/10 border-orange-500/20 text-orange-300 hover:bg-orange-500/20 hover:border-orange-400/40',
    toneActive: 'border-orange-500 bg-orange-500/15 text-orange-200',
    quickHover: 'hover:border-orange-500/40 hover:text-neutral-200 hover:bg-orange-500/5',
  },
  amber: {
    iconBg:     'bg-amber-500/15',
    iconBorder: 'border-amber-500/30',
    iconText:   'text-amber-400',
    divider:    'text-amber-500/70',
    chip:       'hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/30',
    focus:      'focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40',
    btn:        'bg-amber-600 hover:bg-amber-500',
    shadow:     'shadow-[0_0_16px_rgba(217,119,6,0.3)]',
    wave:       'linear-gradient(90deg,transparent 0%,rgba(217,119,6,0.55) 50%,transparent 100%)',
    pill:       'bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400/40',
    toneActive: 'border-amber-500 bg-amber-500/15 text-amber-200',
    quickHover: 'hover:border-amber-500/40 hover:text-neutral-200 hover:bg-amber-500/5',
  },
  pink: {
    iconBg:     'bg-pink-500/15',
    iconBorder: 'border-pink-500/30',
    iconText:   'text-pink-400',
    divider:    'text-pink-500/70',
    chip:       'hover:bg-pink-500/10 hover:text-pink-300 hover:border-pink-500/30',
    focus:      'focus:border-pink-500 focus:ring-1 focus:ring-pink-500/40',
    btn:        'bg-pink-600 hover:bg-pink-500',
    shadow:     'shadow-[0_0_16px_rgba(236,72,153,0.25)]',
    wave:       'linear-gradient(90deg,transparent 0%,rgba(236,72,153,0.55) 50%,transparent 100%)',
    pill:       'bg-pink-500/10 border-pink-500/20 text-pink-300 hover:bg-pink-500/20 hover:border-pink-400/40',
    toneActive: 'border-pink-500 bg-pink-500/15 text-pink-200',
    quickHover: 'hover:border-pink-500/40 hover:text-neutral-200 hover:bg-pink-500/5',
  },
  teal: {
    iconBg:     'bg-teal-500/15',
    iconBorder: 'border-teal-500/30',
    iconText:   'text-teal-400',
    divider:    'text-teal-500/70',
    chip:       'hover:bg-teal-500/10 hover:text-teal-300 hover:border-teal-500/30',
    focus:      'focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40',
    btn:        'bg-teal-600 hover:bg-teal-500',
    shadow:     'shadow-[0_0_16px_rgba(20,184,166,0.25)]',
    wave:       'linear-gradient(90deg,transparent 0%,rgba(20,184,166,0.55) 50%,transparent 100%)',
    pill:       'bg-teal-500/10 border-teal-500/20 text-teal-300 hover:bg-teal-500/20 hover:border-teal-400/40',
    toneActive: 'border-teal-500 bg-teal-500/15 text-teal-200',
    quickHover: 'hover:border-teal-500/40 hover:text-neutral-200 hover:bg-teal-500/5',
  },
  slate: {
    iconBg:     'bg-slate-500/15',
    iconBorder: 'border-slate-500/30',
    iconText:   'text-slate-400',
    divider:    'text-slate-500/80',
    chip:       'hover:bg-slate-500/10 hover:text-slate-300 hover:border-slate-500/30',
    focus:      'focus:border-slate-400 focus:ring-1 focus:ring-slate-400/30',
    btn:        'bg-slate-600 hover:bg-slate-500',
    shadow:     'shadow-[0_0_14px_rgba(100,116,139,0.3)]',
    wave:       'linear-gradient(90deg,transparent 0%,rgba(100,116,139,0.55) 50%,transparent 100%)',
    pill:       'bg-slate-500/10 border-slate-500/20 text-slate-300 hover:bg-slate-500/20 hover:border-slate-400/40',
    toneActive: 'border-slate-400 bg-slate-500/15 text-slate-200',
    quickHover: 'hover:border-slate-500/40 hover:text-neutral-200 hover:bg-slate-500/5',
  },
};

// ── Shared sub-components ─────────────────────────────────────────────────────

/** Horizontal divider with centred label — Row 5 section title. */
export function PanelDivider({ label, accent }: { label: string; accent: PanelAccent }) {
  const a = PANEL_ACCENTS[accent];
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-px bg-neutral-800/60" />
      <p className={`text-[9px] font-bold uppercase tracking-[0.15em] ${a.divider}`}>✦ {label}</p>
      <div className="flex-1 h-px bg-neutral-800/60" />
    </div>
  );
}

/** Inline suggestion pill badge — Row 4. */
export function PanelPill({
  label, accent, onClick, disabled,
}: {
  label: string; accent: PanelAccent; onClick: () => void; disabled?: boolean;
}) {
  const a = PANEL_ACCENTS[accent];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${a.pill}`}
    >
      {label}
    </button>
  );
}

/** Full-width primary action button — Row 6. */
export function PanelActionBtn({
  children, accent, onClick, disabled, credits,
}: {
  children: ReactNode; accent: PanelAccent; onClick: () => void;
  disabled?: boolean; credits?: number;
}) {
  const a = PANEL_ACCENTS[accent];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-2.5 rounded-xl ${a.btn} disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center justify-center gap-2 ${a.shadow}`}
    >
      {children}
      {credits != null && (
        <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold inline-flex items-center gap-0.5">
          {credits} <span className="opacity-70">✦</span>
        </span>
      )}
    </button>
  );
}

/** Single quick-access list row — Row 7. */
export function PanelQuickRow({
  label, accent, onClick, disabled,
}: {
  label: string; accent: PanelAccent; onClick: () => void; disabled?: boolean;
}) {
  const a = PANEL_ACCENTS[accent];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group w-full text-left px-3 py-2 rounded-lg border border-neutral-800 text-[11px] text-neutral-400 ${a.quickHover} transition-all disabled:opacity-40`}
    >
      <span className="mr-1.5 text-neutral-600 group-hover:text-neutral-400 transition-colors">→</span>
      {label}
    </button>
  );
}

// ── Main wrapper component ────────────────────────────────────────────────────

interface AIEnginePanelProps {
  accent:        PanelAccent;
  iconEl:        ReactNode;
  title:         string;
  subtitle:      string;
  compactBadge?: ReactNode;
  children:      ReactNode | ((tokens: AccentTokens) => ReactNode);
}

export default function AIEnginePanel({
  accent, iconEl, title, subtitle, compactBadge, children,
}: AIEnginePanelProps) {
  const a = PANEL_ACCENTS[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.15 }}
      className="p-4 space-y-4"
    >
      {compactBadge}

      {/* Row 2 — Agent identity header */}
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-xl ${a.iconBg} border ${a.iconBorder} flex items-center justify-center shrink-0`}>
          {iconEl}
        </div>
        <div>
          <p className="text-xs font-bold text-white">{title}</p>
          <p className="text-[10px] text-neutral-500">{subtitle}</p>
        </div>
      </div>

      {/* Rows 3–7 — Dynamic body via render prop or static children */}
      {typeof children === 'function' ? children(a) : children}

      {/* Accent wave strip at panel foot */}
      <div className="h-px relative overflow-hidden -mx-4 mt-1">
        <div className="absolute inset-0 opacity-40" style={{ background: a.wave }} />
      </div>
    </motion.div>
  );
}
