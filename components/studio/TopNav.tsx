"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Plus,
  LayoutGrid,
  Type,
  PenLine,
  Database,
} from "lucide-react";

// ── Logo dropdown items ───────────────────────────────────────────────────────

const LOGO_MENU = [
  { label: "New Project",      shortcut: "Ctrl+N" },
  { label: "Open Project...",  shortcut: "Ctrl+O" },
  null,
  { label: "Project Settings", shortcut: null     },
  { label: "Export...",        shortcut: null     },
  null,
  { label: "Help & Feedback",  shortcut: null     },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

interface TopNavProps {
  projectName?: string;
}

// ── Reusable nav toolbar button ───────────────────────────────────────────────

function NavBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick ?? (() => console.log("[TopNav]", label))}
      className={`flex items-center gap-1.5 h-8 px-2 rounded-md text-[13px] transition-colors ${
        active
          ? "bg-neutral-800 text-white"
          : "text-neutral-400 hover:bg-neutral-800/70 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function TopNav({ projectName = "Untitled Project" }: TopNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <header className="relative h-11 shrink-0 flex items-center px-2.5 border-b border-neutral-800 bg-[#111111] z-30 select-none">

      {/* ── LEFT ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5">

        {/* Logo / project dropdown */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            className={`flex items-center gap-1 h-8 px-1.5 rounded-md transition-colors ${
              menuOpen ? "bg-neutral-800" : "hover:bg-neutral-800/60"
            }`}
          >
            {/* Sparkle brand icon in white square */}
            <div className="w-[22px] h-[22px] rounded-[5px] bg-white flex items-center justify-center flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M6.5 1L7.8 4.8H11.8L8.5 7.1L9.8 11L6.5 8.7L3.2 11L4.5 7.1L1.2 4.8H5.2L6.5 1Z"
                  fill="#111111"
                />
              </svg>
            </div>
            <ChevronDown size={11} className="text-neutral-500" />
          </button>

          {/* Dropdown popover */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{    opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.13, ease: [0.32, 0.72, 0, 1] }}
                className="absolute top-[calc(100%+6px)] left-0 w-52 bg-[#1c1c1c] border border-neutral-800 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.75)] py-1 z-50"
                onClick={e => e.stopPropagation()}
              >
                {LOGO_MENU.map((item, i) =>
                  item === null ? (
                    <div key={i} className="border-t border-neutral-800 my-1" />
                  ) : (
                    <button
                      key={item.label}
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-[7px] text-[13px] text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors text-left"
                      onClick={() => {
                        console.log("[TopNav]", item.label);
                        setMenuOpen(false);
                      }}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span className="text-[11px] font-mono text-neutral-600">{item.shortcut}</span>
                      )}
                    </button>
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Insert button — filled style */}
        <button
          type="button"
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white text-[13px] font-medium transition-colors"
          onClick={() => console.log("[TopNav] Insert")}
        >
          <Plus size={13} strokeWidth={2.5} />
          Insert
        </button>

        <NavBtn icon={<LayoutGrid size={13} />} label="Layout" />
        <NavBtn icon={<Type size={13} />}       label="Text"   />
        <NavBtn icon={<PenLine size={13} />}    label="Vector" />
        <NavBtn icon={<Database size={13} />}   label="CMS"    />
      </div>

      {/* ── CENTER (absolute so it's always perfectly centred) ───────────── */}
      <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center pointer-events-none">
        <span className="text-[13px] font-semibold text-white tracking-tight">
          {projectName}
        </span>
      </div>

      {/* ── RIGHT ────────────────────────────────────────────────────────── */}
      <div className="ml-auto flex items-center gap-2">
        {/* User avatar */}
        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
          AA
        </div>

        {/* Invite */}
        <button
          type="button"
          className="h-7 px-3 rounded-md border border-neutral-700 text-[13px] text-white hover:bg-neutral-800 transition-colors whitespace-nowrap"
          onClick={() => console.log("[TopNav] Invite")}
        >
          Invite
        </button>
      </div>
    </header>
  );
}
