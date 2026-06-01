"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tool = "select" | "hand" | "comment";

interface StudioControlsProps {
  zoom?:          number;
  onZoomChange?:  (zoom: number) => void;
  activeTool?:    Tool;
  onToolChange?:  (tool: Tool) => void;
  theme?:         "dark" | "light";
  onThemeToggle?: () => void;
}

const MIN_ZOOM = 25;
const MAX_ZOOM = 200;
const ZOOM_STEP = 10;
const ZOOM_PRESETS = [50, 75, 100, 125, 150, 200] as const;

// ── Plugin data ───────────────────────────────────────────────────────────────

const PLUGINS = [
  {
    id: "browse-all",
    label: "Browse All",
    active: true,
    icon: (
      <div className="w-[22px] h-[22px] rounded-[6px] bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-sm flex-shrink-0">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <circle cx="3"   cy="3"   r="1.4" fill="white" opacity="0.95" />
          <circle cx="8"   cy="3"   r="1.4" fill="white" opacity="0.95" />
          <circle cx="3"   cy="8"   r="1.4" fill="white" opacity="0.95" />
          <circle cx="8"   cy="8"   r="1.4" fill="white" opacity="0.95" />
        </svg>
      </div>
    ),
  },
  {
    id: "workshop",
    label: "Workshop",
    active: false,
    icon: (
      <div className="w-[22px] h-[22px] rounded-[6px] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm flex-shrink-0">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M5.5 1L6.9 4.2L10.5 4.9L7.8 7.5L8.5 11L5.5 9.4L2.5 11L3.2 7.5L0.5 4.9L4.1 4.2L5.5 1Z" fill="white" opacity="0.95" />
        </svg>
      </div>
    ),
  },
  {
    id: "google-sheets",
    label: "Google Sheets",
    active: false,
    icon: (
      <div className="w-[22px] h-[22px] rounded-[6px] bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-sm flex-shrink-0">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <rect x="1"   y="1"   width="9"   height="9"   rx="1.2" fill="white" opacity="0.18" />
          <line x1="1"  y1="4.2" x2="10"  y2="4.2" stroke="white" strokeWidth="0.9" />
          <line x1="1"  y1="7"   x2="10"  y2="7"   stroke="white" strokeWidth="0.9" />
          <line x1="4.2" y1="1" x2="4.2" y2="10"   stroke="white" strokeWidth="0.9" />
        </svg>
      </div>
    ),
  },
  {
    id: "dither",
    label: "Dither",
    active: false,
    icon: (
      <div className="w-[22px] h-[22px] rounded-[6px] bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-sm flex-shrink-0">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <circle cx="2"   cy="2"   r="1.1" fill="white" opacity="0.95" />
          <circle cx="5.5" cy="2"   r="0.7" fill="white" opacity="0.5"  />
          <circle cx="9"   cy="2"   r="1.1" fill="white" opacity="0.95" />
          <circle cx="2"   cy="5.5" r="0.7" fill="white" opacity="0.5"  />
          <circle cx="5.5" cy="5.5" r="1.1" fill="white" opacity="0.95" />
          <circle cx="9"   cy="5.5" r="0.7" fill="white" opacity="0.5"  />
          <circle cx="2"   cy="9"   r="1.1" fill="white" opacity="0.95" />
          <circle cx="5.5" cy="9"   r="0.7" fill="white" opacity="0.5"  />
          <circle cx="9"   cy="9"   r="1.1" fill="white" opacity="0.95" />
        </svg>
      </div>
    ),
  },
] as const;

const PROJECT_ITEMS = [
  { id: "create-web",       label: "Create Web Page",     shortcut: null           },
  { id: "create-component", label: "Create Component...", shortcut: "Ctrl+Alt+K"   },
  { id: "publish",          label: "Publish Website",     shortcut: "Ctrl+Shift+P" },
] as const;

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function SelectIcon({ className }: { className?: string }) {
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
      <path d="M18 11V7a2 2 0 00-4 0V4a2 2 0 00-4 0v3a2 2 0 00-4 0v8a7 7 0 0014 0v-3a2 2 0 00-2-2z" />
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
      <line x1="12" y1="1"     x2="12" y2="3"     />
      <line x1="12" y1="21"    x2="12" y2="23"    />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1"  y1="12"    x2="3"  y2="12"    />
      <line x1="21" y1="12"    x2="23" y2="12"    />
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

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" className={className}>
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

// ── Toolbar button ────────────────────────────────────────────────────────────

function ToolBtn({
  active, title, onClick, children,
}: {
  active?: boolean;
  title:   string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 ${
        active
          ? "bg-zinc-700 text-white shadow-inner ring-1 ring-zinc-600"
          : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="border-l border-zinc-800 h-5 mx-0.5 flex-shrink-0" />;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StudioControls({
  zoom          = 100,
  onZoomChange,
  activeTool    = "select",
  onToolChange,
  theme         = "dark",
  onThemeToggle,
}: StudioControlsProps) {

  const [menuOpen,     setMenuOpen]     = useState(false);
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");

  const menuRef     = useRef<HTMLDivElement>(null);
  const zoomRef     = useRef<HTMLDivElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setSearchQuery("");
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", onOutside);
      setTimeout(() => searchRef.current?.focus(), 80);
    }
    return () => document.removeEventListener("mousedown", onOutside);
  }, [menuOpen]);

  // Close zoom menu on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (zoomRef.current && !zoomRef.current.contains(e.target as Node)) {
        setZoomMenuOpen(false);
      }
    }
    if (zoomMenuOpen) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [zoomMenuOpen]);

  const adjustZoom = useCallback((delta: number) => {
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
    onZoomChange?.(next);
    console.log("[StudioControls] zoom →", next + "%");
  }, [zoom, onZoomChange]);

  const applyZoomPreset = useCallback((preset: number) => {
    onZoomChange?.(preset);
    setZoomMenuOpen(false);
    console.log("[StudioControls] zoom preset →", preset + "%");
  }, [onZoomChange]);

  const handleTool = useCallback((tool: Tool) => {
    onToolChange?.(tool);
    console.log("[StudioControls] tool →", tool);
  }, [onToolChange]);

  const handlePlugin = useCallback((id: string) => {
    console.log("[StudioControls] plugin →", id);
  }, []);

  const handleProjectAction = useCallback((id: string) => {
    console.log("[StudioControls] project action →", id);
    setMenuOpen(false);
    setSearchQuery("");
  }, []);

  const handleThemeToggle = useCallback(() => {
    onThemeToggle?.();
    console.log("[StudioControls] theme toggle →", theme === "dark" ? "light" : "dark");
  }, [onThemeToggle, theme]);

  const handleGrid = useCallback(() => {
    console.log("[StudioControls] grid/component manager toggle");
  }, []);

  const handleUpgrade = useCallback(() => {
    console.log("[StudioControls] upgrade now clicked");
  }, []);

  const filteredPlugins = PLUGINS.filter(p =>
    p.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProject = PROJECT_ITEMS.filter(p =>
    p.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isDark = theme === "dark";

  return (
    <div className="flex flex-col items-center gap-2.5 select-none">

      {/* ═══════════════════════════════════════════════════════════════════════
          TOP — Popover menu (anchored to the menu trigger button in the toolbar)
          Opens above the toolbar via AnimatePresence / framer-motion.
      ════════════════════════════════════════════════════════════════════════ */}

      <div ref={menuRef} className="relative w-full flex justify-start">

        {/* ── Popover panel ── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="studio-menu"
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1    }}
              exit={{    opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
              className="absolute bottom-[calc(100%+10px)] left-0 w-[252px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-[0_16px_56px_rgba(0,0,0,0.72)] overflow-hidden z-50"
              onClick={(e) => e.stopPropagation()}
            >

              {/* Search bar */}
              <div className="px-3 pt-3 pb-2">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search plugins or actions…"
                    className="w-full bg-zinc-800 border border-zinc-700/60 rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-zinc-200 placeholder-zinc-500 outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600/50 transition-all"
                  />
                </div>
              </div>

              {/* ── Plugins section ── */}
              {filteredPlugins.length > 0 && (
                <div className="px-1 pb-1">
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                    Plugins
                  </p>
                  {filteredPlugins.map((plugin) => (
                    <button
                      key={plugin.id}
                      type="button"
                      onClick={() => handlePlugin(plugin.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-xl transition-all group ${
                        plugin.active
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
                      }`}
                    >
                      {plugin.icon}
                      <span className="text-[13px] font-medium leading-none">{plugin.label}</span>
                      {plugin.active && (
                        <span className="ml-auto text-[10px] font-semibold text-blue-400 bg-blue-500/15 border border-blue-500/20 rounded-full px-1.5 py-0.5">
                          Active
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Divider ── */}
              {filteredPlugins.length > 0 && filteredProject.length > 0 && (
                <div className="border-t border-zinc-800 mx-3 my-1" />
              )}

              {/* ── Project section ── */}
              {filteredProject.length > 0 && (
                <div className="px-1 pb-2">
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                    Project
                  </p>
                  {filteredProject.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleProjectAction(item.id)}
                      className="w-full flex items-center justify-between px-2.5 py-[7px] rounded-xl text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200 transition-all"
                    >
                      <span className="text-[13px] font-medium">{item.label}</span>
                      {item.shortcut && (
                        <span className="text-[10px] font-mono text-zinc-600 ml-3 whitespace-nowrap">
                          {item.shortcut}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {filteredPlugins.length === 0 && filteredProject.length === 0 && (
                <p className="px-4 py-6 text-center text-[12px] text-zinc-600">
                  No results for &ldquo;{searchQuery}&rdquo;
                </p>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          BOTTOM — Floating toolbar pill
      ════════════════════════════════════════════════════════════════════════ */}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.65)] gap-0.5"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Menu trigger ── */}
        <button
          type="button"
          title="Open menu"
          aria-label="Open studio menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(v => !v)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 ${
            menuOpen
              ? "bg-zinc-700 text-white ring-1 ring-zinc-600"
              : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          }`}
        >
          <MenuIcon className="w-4 h-4" />
        </button>

        <Divider />

        {/* ── Interaction tools ── */}
        <ToolBtn active={activeTool === "select"} title="Select (V)" onClick={() => handleTool("select")}>
          <SelectIcon className="w-4 h-4" />
        </ToolBtn>

        <ToolBtn active={activeTool === "hand"} title="Pan / Hand (H)" onClick={() => handleTool("hand")}>
          <HandIcon className="w-4 h-4" />
        </ToolBtn>

        <ToolBtn active={activeTool === "comment"} title="Comment (C)" onClick={() => handleTool("comment")}>
          <CommentIcon className="w-4 h-4" />
        </ToolBtn>

        <Divider />

        {/* ── Theme toggle ── */}
        <ToolBtn title={isDark ? "Switch to light theme" : "Switch to dark theme"} onClick={handleThemeToggle}>
          {isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
        </ToolBtn>

        {/* ── Grid / component manager ── */}
        <ToolBtn title="Component manager" onClick={handleGrid}>
          <GridIcon className="w-4 h-4" />
        </ToolBtn>

        <Divider />

        {/* ── Zoom controls ── */}
        <button
          type="button"
          aria-label="Zoom out 10%"
          title="Zoom out"
          onClick={() => adjustZoom(-ZOOM_STEP)}
          disabled={zoom <= MIN_ZOOM}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-25 disabled:cursor-not-allowed transition-all text-base leading-none font-light"
        >
          −
        </button>

        {/* Zoom percentage — click to toggle preset dropdown */}
        <div ref={zoomRef} className="relative">
          <button
            type="button"
            title="Zoom presets"
            onClick={() => setZoomMenuOpen(v => !v)}
            className="flex items-center gap-0.5 h-7 px-1.5 rounded-lg text-[11px] font-mono font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all tabular-nums"
          >
            {zoom}%
            <ChevronDownIcon className={`w-3 h-3 text-zinc-600 transition-transform duration-150 ${zoomMenuOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {zoomMenuOpen && (
              <motion.div
                key="zoom-menu"
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1   }}
                exit={{    opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
                className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-28 bg-zinc-900 border border-zinc-800 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.7)] overflow-hidden z-50 py-1"
                onClick={(e) => e.stopPropagation()}
              >
                {ZOOM_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => applyZoomPreset(preset)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-[12px] font-mono transition-all ${
                      zoom === preset
                        ? "text-white bg-zinc-800"
                        : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
                    }`}
                  >
                    <span>{preset}%</span>
                    {zoom === preset && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))}
                <div className="border-t border-zinc-800 my-1" />
                <button
                  type="button"
                  onClick={() => applyZoomPreset(100)}
                  className="w-full px-3 py-1.5 text-left text-[12px] text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200 transition-all"
                >
                  Reset to 100%
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          aria-label="Zoom in 10%"
          title="Zoom in"
          onClick={() => adjustZoom(ZOOM_STEP)}
          disabled={zoom >= MAX_ZOOM}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-25 disabled:cursor-not-allowed transition-all text-base leading-none font-light"
        >
          +
        </button>

        <Divider />

        {/* ── Upgrade CTA ── */}
        <button
          type="button"
          onClick={handleUpgrade}
          className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all duration-150 whitespace-nowrap"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1L6.7 4H10L7.4 5.9L8.4 9L5.5 7.1L2.6 9L3.6 5.9L1 4H4.3L5.5 1Z"
              fill="currentColor" opacity="0.9" />
          </svg>
          Upgrade Now
        </button>

      </motion.div>
    </div>
  );
}
