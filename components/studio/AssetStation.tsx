"use client";

import React from "react";
import * as LucideIcons from "lucide-react";
import IconStation from "@/components/studio/IconStation";

// ── Dynamic icon renderer ────────────────────────────────────────────────────

function DynamicIcon({
  name, size, strokeWidth, color,
}: {
  name: string; size?: number; strokeWidth?: number; color?: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name] ?? LucideIcons.HelpCircle;
  return React.createElement(Icon, { size, strokeWidth, color });
}

// ── Slider ───────────────────────────────────────────────────────────────────

function Slider({
  label, value, min, max, step, display, onChange,
}: {
  label: string; value: number; min: number; max: number;
  step: number; display?: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{display ?? value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer
                   bg-zinc-200 dark:bg-zinc-700
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                   [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500
                   [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(168,85,247,0.5)]
                   [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  );
}

// ── Aevaia AI Property Panel ──────────────────────────────────────────────────
// Right-panel property inspector + AI icon prompter.
// All slider/color values are controlled from parent (Studio context).

interface AssetStationProps {
  size:           number;
  setSize:        (v: number) => void;
  strokeWidth:    number;
  setStrokeWidth: (v: number) => void;
  iconColor:      string;
  setIconColor:   (v: string) => void;
  onSelectAIIcon: (name: string) => void;
}

export default function AssetStation({
  size, setSize, strokeWidth, setStrokeWidth,
  iconColor, setIconColor, onSelectAIIcon,
}: AssetStationProps) {
  return (
    <div className="flex flex-col gap-0 overflow-y-auto h-full">

      {/* ── Property customizer ── */}
      <div className="shrink-0 px-4 pt-4 pb-4 space-y-3 border-b border-zinc-200 dark:border-zinc-800">

        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          Icon Properties
        </p>

        <Slider label="Size"   value={size}        min={16} max={128} step={1}   display={`${size}px`}          onChange={setSize} />
        <Slider label="Stroke" value={strokeWidth}  min={0.5} max={4}  step={0.1} display={strokeWidth.toFixed(1)} onChange={setStrokeWidth} />

        {/* Color */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Color</span>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{iconColor}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="relative w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 cursor-pointer shrink-0 shadow-sm">
              <input type="color" value={iconColor} onChange={(e) => setIconColor(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <span className="absolute inset-0 rounded-lg" style={{ backgroundColor: iconColor }} />
            </label>
            <input
              type="text" value={iconColor} maxLength={7}
              onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setIconColor(v); }}
              className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-mono
                         bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700
                         text-zinc-900 dark:text-zinc-100 focus:outline-none
                         focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all"
            />
          </div>
        </div>

        {/* Live preview */}
        <div className="flex items-center justify-center py-4 rounded-xl
                        bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <DynamicIcon name="Heart" size={Math.min(size, 56)} strokeWidth={strokeWidth} color={iconColor} />
        </div>

        <p className="text-[9px] text-zinc-400 dark:text-zinc-600 text-center leading-relaxed">
          These settings apply when you click an icon from the left panel library.
        </p>
      </div>

      {/* ── AI Icon Prompter ── */}
      <div className="shrink-0 px-4 pt-4 pb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">
          AI Icon Suggestions
        </p>
        <IconStation onSelect={onSelectAIIcon} />
      </div>

    </div>
  );
}
