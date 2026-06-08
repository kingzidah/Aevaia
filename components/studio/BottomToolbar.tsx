"use client";

import { useState } from "react";
import {
  MousePointer2,
  Hand,
  MessageSquare,
  Sun,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  { Icon: MousePointer2, label: "Select",    id: "select"  },
  { Icon: Hand,          label: "Pan",       id: "pan"     },
  { Icon: MessageSquare, label: "Comment",   id: "comment" },
  { Icon: Sun,           label: "Preview",   id: "preview" },
  { Icon: LayoutGrid,    label: "Grid",      id: "grid"    },
] as const;

type ToolId = typeof TOOLS[number]["id"];

// ── Main export ───────────────────────────────────────────────────────────────

export default function BottomToolbar() {
  const [activeTool, setActiveTool] = useState<ToolId>("select");
  const [zoom,       setZoom]       = useState(100);

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center h-10 px-1.5 gap-0.5
                 rounded-full bg-[#111111] border border-neutral-800 shadow-xl select-none"
    >
      {/* ── Tool icons ─────────────────────────────────────────────────── */}
      {TOOLS.map(({ Icon, label, id }) => {
        const isActive = activeTool === id;
        return (
          <button
            key={id}
            type="button"
            title={label}
            onClick={() => setActiveTool(id)}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              isActive
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div className="w-px h-5 bg-neutral-800 mx-1 shrink-0" />

      {/* ── Zoom dropdown ──────────────────────────────────────────────── */}
      <button
        type="button"
        title="Zoom level"
        onClick={() => setZoom(z => (z === 100 ? 50 : z === 50 ? 200 : 100))}
        className="flex items-center gap-1 h-8 px-2.5 rounded-full text-[12px] font-medium
                   text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition-colors"
      >
        {zoom}%
        <ChevronDown size={11} className="text-neutral-500" />
      </button>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div className="w-px h-5 bg-neutral-800 mx-1 shrink-0" />

      {/* ── Upgrade Now ────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => console.log("[BottomToolbar] Upgrade")}
        className="flex items-center h-8 px-3.5 rounded-full text-[12px] font-semibold
                   bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 hover:text-blue-300
                   transition-colors whitespace-nowrap"
      >
        Upgrade Now
      </button>
    </div>
  );
}
