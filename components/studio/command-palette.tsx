"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  onPublish?:     () => void;
  onPublishLive?: () => void;
  projectId?:     string | null;
}

interface CommandItem {
  id:         string;
  label:      string;
  shortcut?:  string;
  icon?:      React.ReactNode;
  action:     () => void;
  danger?:    boolean;
}

interface CommandSection {
  title: string;
  items: CommandItem[];
}

// ── Icon helpers ──────────────────────────────────────────────────────────────

function PlugIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
      <path d="M18.36 6.64a9 9 0 11-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function ComponentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

// ── Keyboard shortcut badge ───────────────────────────────────────────────────

function Kbd({ children }: { children: string }) {
  return (
    <span className="flex items-center gap-0.5">
      {children.split("+").map((key, i) => (
        <kbd
          key={i}
          className="inline-flex items-center px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[9px] font-mono text-zinc-500 leading-none"
        >
          {key.trim()}
        </kbd>
      ))}
    </span>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function CommandPalette({
  onPublish,
  onPublishLive,
  projectId,
}: CommandPaletteProps) {
  const [isOpen,  setIsOpen]  = useState(false);
  const [query,   setQuery]   = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Ctrl/Cmd+K toggle ────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(v => !v);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Focus input on open, reset query on close
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const close = useCallback(() => setIsOpen(false), []);

  // ── Command registry ──────────────────────────────────────────────────────
  const sections: CommandSection[] = [
    {
      title: "Plugins",
      items: [
        {
          id:     "plugins-browse",
          label:  "Browse All",
          icon:   <GridIcon />,
          action: () => { console.info("[palette] Browse plugins"); close(); },
        },
        {
          id:     "plugins-workshop",
          label:  "Workshop",
          icon:   <PlugIcon />,
          action: () => { console.info("[palette] Workshop"); close(); },
        },
        {
          id:     "plugins-sheets",
          label:  "Google Sheets RSVP Sync",
          icon:   <TableIcon />,
          action: () => { console.info("[palette] Google Sheets sync"); close(); },
        },
      ],
    },
    {
      title: "Project",
      items: [
        {
          id:     "project-webpage",
          label:  "Create Web Page",
          icon:   <GlobeIcon />,
          action: () => { console.info("[palette] Create web page"); close(); },
        },
        {
          id:       "project-component",
          label:    "Create Component…",
          shortcut: "Ctrl + Alt + K",
          icon:     <ComponentIcon />,
          action:   () => { console.info("[palette] Create component"); close(); },
        },
        {
          id:       "project-publish",
          label:    "Publish Website",
          shortcut: "Ctrl + Shift + P",
          icon:     <SendIcon />,
          action:   () => {
            close();
            if (projectId) {
              onPublishLive?.();
            } else {
              onPublish?.();
            }
          },
        },
      ],
    },
  ];

  // Filter by query
  const filtered: CommandSection[] = query.trim()
    ? sections
        .map(sec => ({
          ...sec,
          items: sec.items.filter(item =>
            item.label.toLowerCase().includes(query.toLowerCase())
          ),
        }))
        .filter(sec => sec.items.length > 0)
    : sections;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="cp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm"
            onClick={close}
          />

          {/* ── Palette card ── */}
          <motion.div
            key="cp-card"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{    opacity: 0, y: -16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="fixed top-[18%] left-1/2 -translate-x-1/2 z-[121] w-80 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-[0_16px_60px_rgba(0,0,0,0.75)] overflow-hidden">

              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
                <svg
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                  className="w-4 h-4 text-zinc-500 shrink-0"
                >
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search commands…"
                  className="flex-1 min-w-0 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
                />
                <kbd className="shrink-0 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[9px] font-mono text-zinc-600">
                  ESC
                </kbd>
              </div>

              {/* Command sections */}
              <div className="p-2 max-h-72 overflow-y-auto space-y-1">
                {filtered.length === 0 && (
                  <p className="text-center text-[11px] text-zinc-600 py-6">
                    No commands match &ldquo;{query}&rdquo;
                  </p>
                )}

                {filtered.map((section) => (
                  <div key={section.title}>
                    <p className="px-2.5 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                      {section.title}
                    </p>
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.action}
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors group"
                      >
                        <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
                          {item.icon}
                        </span>
                        <span className="flex-1 text-left text-[13px] leading-tight">{item.label}</span>
                        {item.shortcut && (
                          <Kbd>{item.shortcut}</Kbd>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-[9px] text-zinc-700 font-mono">HeartCraft Palette</span>
                <div className="flex items-center gap-1">
                  <Kbd>↑ ↓</Kbd>
                  <span className="text-[9px] text-zinc-700">navigate</span>
                  <span className="text-zinc-800 mx-1">·</span>
                  <Kbd>↵</Kbd>
                  <span className="text-[9px] text-zinc-700">select</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
