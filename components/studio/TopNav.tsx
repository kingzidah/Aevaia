"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Plus,
  LayoutGrid,
  Type,
  PenTool,
  Database,
} from "lucide-react";
import InsertMenu  from "@/components/studio/InsertMenu";
import ProjectMenu from "@/components/studio/ProjectMenu";

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
  icon:     React.ReactNode;
  label:    string;
  active?:  boolean;
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
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [insertOpen, setInsertOpen] = useState(false);
  const menuRef   = useRef<HTMLDivElement>(null);
  const insertRef = useRef<HTMLDivElement>(null);

  // Close logo menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Close insert menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (insertRef.current && !insertRef.current.contains(e.target as Node))
        setInsertOpen(false);
    }
    if (insertOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [insertOpen]);

  return (
    <header className="relative h-11 shrink-0 flex items-center px-2.5 border-b border-neutral-800 bg-[#111111] z-30 select-none">

      {/* ── LEFT ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1">

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
            <div className="w-5.5 h-5.5 rounded-[5px] bg-white flex items-center justify-center shrink-0">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M6.5 1L7.8 4.8H11.8L8.5 7.1L9.8 11L6.5 8.7L3.2 11L4.5 7.1L1.2 4.8H5.2L6.5 1Z"
                  fill="#111111"
                />
              </svg>
            </div>
            <ChevronDown size={11} className="text-neutral-500" />
          </button>

          {/* Project dropdown */}
          <AnimatePresence>
            {menuOpen && (
              <ProjectMenu onClose={() => setMenuOpen(false)} />
            )}
          </AnimatePresence>
        </div>

        {/* Insert button + floating menu — relative anchor */}
        <div ref={insertRef} className="relative">
          <button
            type="button"
            className={`flex items-center gap-1.5 h-8 px-3 rounded-md text-white text-[13px] font-semibold transition-colors ${
              insertOpen
                ? "bg-neutral-600"
                : "bg-neutral-700 hover:bg-neutral-600"
            }`}
            onClick={() => setInsertOpen(v => !v)}
          >
            <Plus size={14} strokeWidth={2.5} />
            Insert
          </button>
          <AnimatePresence>
            {insertOpen && (
              <InsertMenu onClose={() => setInsertOpen(false)} />
            )}
          </AnimatePresence>
        </div>

        {/* Thin divider separating creation tools */}
        <div className="w-px h-4.5 bg-neutral-800 mx-0.5 shrink-0" />

        <NavBtn icon={<LayoutGrid size={13} />} label="Layout" />
        <NavBtn icon={<Type size={13} />}       label="Text"   />
        <NavBtn icon={<PenTool size={13} />}    label="Vector" />
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
        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
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
