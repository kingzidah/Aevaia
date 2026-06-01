"use client";

import { useCallback } from "react";
import StudioControls from "@/components/studio/StudioControls";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tool = "select" | "hand" | "comment";

interface CanvasAreaProps {
  zoom:          number;
  onZoomChange:  (zoom: number) => void;
  activeTool:    Tool;
  onToolChange:  (tool: Tool) => void;
  theme?:        "dark" | "light";
  onThemeToggle?: () => void;
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function CanvasArea({
  zoom,
  onZoomChange,
  activeTool,
  onToolChange,
  theme = "dark",
  onThemeToggle,
}: CanvasAreaProps) {

  const handleThemeToggle = useCallback(() => {
    onThemeToggle?.();
    console.log("[CanvasArea] theme toggle");
  }, [onThemeToggle]);

  return (
    <div className="flex-1 relative overflow-hidden bg-[#161616]">

      {/* ── Dot grid background ─────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* ── Subtle vignette ─────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 60%, rgba(0,0,0,0.3) 100%)",
        }}
      />

      {/* ── Canvas frame placeholder ─────────────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative bg-[#0e0e0e] rounded-sm border border-neutral-800/60 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_60px_rgba(0,0,0,0.6)]"
          style={{
            width: `${Math.min(720, 720 * (zoom / 100))}px`,
            height: `${Math.min(480, 480 * (zoom / 100))}px`,
          }}
        >
          {/* Blue selection handles */}
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-12 h-[2px] bg-blue-500 rounded-full" />
          <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-12 h-[2px] bg-blue-500 rounded-full" />
          <div className="absolute top-1/2 -translate-y-1/2 -left-px w-[2px] h-12 bg-blue-500 rounded-full" />
          <div className="absolute top-1/2 -translate-y-1/2 -right-px w-[2px] h-12 bg-blue-500 rounded-full" />

          {/* Corner handles */}
          {[["top-0 left-0 -translate-x-1/2 -translate-y-1/2"],["top-0 right-0 translate-x-1/2 -translate-y-1/2"],["bottom-0 left-0 -translate-x-1/2 translate-y-1/2"],["bottom-0 right-0 translate-x-1/2 translate-y-1/2"]].map(([pos], i) => (
            <div key={i} className={`absolute ${pos} w-2 h-2 bg-white border-2 border-blue-500 rounded-sm`} />
          ))}

          {/* Empty canvas message */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-neutral-700">
              <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
              <path d="M16 11v10M11 16h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-[12px] text-neutral-600 font-medium">Drop components here</p>
            <p className="text-[11px] text-neutral-700">Press <kbd className="bg-neutral-800 text-neutral-500 px-1 py-0.5 rounded text-[10px] font-mono">I</kbd> to open Insert</p>
          </div>
        </div>
      </div>

      {/* ── Bottom toolbar (StudioControls) ─────────────────────────────── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <StudioControls
          zoom={zoom}
          onZoomChange={onZoomChange}
          activeTool={activeTool}
          onToolChange={onToolChange}
          theme={theme}
          onThemeToggle={handleThemeToggle}
        />
      </div>
    </div>
  );
}
