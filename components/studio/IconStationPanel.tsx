"use client";

import React, { useState, useTransition } from "react";
import * as Icons from "lucide-react";
import { getAIIcons } from "@/app/actions/aiIcons";
import { useCredits } from "@/context/CreditContext";
import { PANEL_ACCENTS, PanelDivider } from "@/components/studio/AIEnginePanel";

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[name] ?? Icons.HelpCircle;
  return React.createElement(IconComponent, { className });
}

interface IconStationPanelProps {
  onSelect: (iconName: string) => void;
}

const THEME_PILLS = ['Love & Romance', 'Celebration', 'Nature', 'Tech & Modern'];
const THEME_CHIPS = ['Nature', 'Celebration', 'Tech', 'Music', 'Travel', 'Wellness'];
const STYLE_CHIPS = ['Outline', 'Filled', 'Minimal', 'Bold', 'Delicate', 'Playful'];

const QUICK_THEMES = [
  'Heart and flowers for a romantic anniversary',
  'Stars and confetti for a birthday celebration',
  'Mountains and sun for an outdoor adventure',
  'Music notes and headphones for a concert event',
];

const a = PANEL_ACCENTS.fuchsia;

export default function IconStationPanel({ onSelect }: IconStationPanelProps) {
  const [prompt,    setPrompt]    = useState("");
  const [results,   setResults]   = useState<string[]>([]);
  const [error,     setError]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { deductCredits } = useCredits();

  function handleGenerate() {
    if (!prompt.trim()) return;
    setError(null);
    deductCredits(2);
    startTransition(async () => {
      try {
        const icons = await getAIIcons(prompt);
        setResults(icons);
      } catch {
        setError("Could not generate icons. Try a different description.");
        setResults([]);
      }
    });
  }

  function appendToPrompt(text: string) {
    setPrompt(p => p ? `${p}, ${text}` : text);
  }

  return (
    <div className="space-y-4">

      {/* Row 3: Local instruction textarea */}
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
        placeholder="Describe the icon set — mood, theme, occasion, style…"
        rows={3}
        disabled={isPending}
        className={`w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-xl px-3.5 py-2.5 text-xs resize-none focus:outline-none ${a.focus} transition-all placeholder:text-neutral-600 disabled:opacity-50`}
      />

      {/* Row 4: Primary generate button (hoisted) */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending || !prompt.trim()}
        className={`w-full py-2.5 rounded-xl ${a.btn} disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center justify-center gap-2 ${a.shadow}`}
      >
        {isPending ? (
          <>
            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
            Generating icons…
          </>
        ) : (
          <>
            ✦ Generate Icons
            <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold inline-flex items-center gap-0.5">
              2 <span className="opacity-70">✦</span>
            </span>
          </>
        )}
      </button>

      {/* Error message */}
      {error && (
        <p className="text-[11px] text-red-400 leading-relaxed">{error}</p>
      )}

      {/* Row 5: Inline suggestion badge pills */}
      <div className="flex flex-wrap gap-1.5">
        {THEME_PILLS.map(label => (
          <button
            key={label}
            type="button"
            disabled={isPending}
            onClick={() => appendToPrompt(`${label.toLowerCase()} icons`)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${a.pill}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Row 5b: THEME chip grid */}
      <div className="space-y-2">
        <PanelDivider label="THEME" accent="fuchsia" />
        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
          {THEME_CHIPS.map(s => (
            <button key={s} type="button" disabled={isPending}
              onClick={() => appendToPrompt(`${s.toLowerCase()} theme`)}
              className={`py-1.5 rounded-lg bg-neutral-800/80 ${a.chip} border border-neutral-700/80 transition-all font-medium text-neutral-400 disabled:opacity-40`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Row 5c: STYLE chip grid */}
      <div className="space-y-2">
        <PanelDivider label="STYLE" accent="fuchsia" />
        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
          {STYLE_CHIPS.map(s => (
            <button key={s} type="button" disabled={isPending}
              onClick={() => appendToPrompt(`${s.toLowerCase()} style`)}
              className={`py-1.5 rounded-lg bg-neutral-800/80 ${a.chip} border border-neutral-700/80 transition-all font-medium text-neutral-400 disabled:opacity-40`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Row 6: Results grid OR quick theme list */}
      {results.length > 0 ? (
        <div className="space-y-2">
          <PanelDivider label="SELECT AN ICON" accent="fuchsia" />
          <div className="grid grid-cols-5 gap-1.5">
            {results.map(name => (
              <button
                key={name}
                type="button"
                onClick={() => onSelect(name)}
                title={name}
                className={`group flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border border-neutral-700/80 bg-neutral-800/60 ${a.chip} transition-all`}
              >
                <DynamicIcon name={name} className="w-5 h-5 text-neutral-400 group-hover:text-fuchsia-400 transition-colors" />
                <span className="text-[8px] text-neutral-500 group-hover:text-fuchsia-400 truncate w-full text-center leading-tight transition-colors">
                  {name}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Quick Icon Sets</p>
          {QUICK_THEMES.map(label => (
            <button
              key={label}
              type="button"
              onClick={() => setPrompt(label)}
              className={`group w-full text-left px-3 py-2 rounded-lg border border-neutral-800 text-[11px] text-neutral-400 ${a.quickHover} transition-all`}
            >
              <span className="mr-1.5 text-neutral-600 group-hover:text-neutral-400 transition-colors">→</span>
              {label}
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
