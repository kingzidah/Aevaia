"use client";

import React, { useState, useTransition } from "react";
import * as Icons from "lucide-react";
import { getAIIcons } from "@/app/actions/aiIcons";
import { useCredits } from "@/context/CreditContext";
import { PANEL_ACCENTS } from "@/components/studio/AIEnginePanel";

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[name] ?? Icons.HelpCircle;
  return React.createElement(IconComponent, { className });
}

interface IconStationProps {
  onSelect: (iconName: string) => void;
}

export default function IconStation({ onSelect }: IconStationProps) {
  const [prompt,    setPrompt]    = useState("");
  const [results,   setResults]   = useState<string[]>([]);
  const [error,     setError]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { deductCredits } = useCredits();

  const a = PANEL_ACCENTS.fuchsia;

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

  return (
    <div className="space-y-3">
      {/* Prompt input row */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
          placeholder="Describe the icon vibe…"
          disabled={isPending}
          className={`flex-1 min-w-0 h-8 bg-neutral-900 border border-neutral-700/80 text-neutral-200 rounded-lg px-3 text-xs outline-none ${a.focus} placeholder:text-neutral-600 disabled:opacity-50 transition-all`}
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending || !prompt.trim()}
          className={`h-8 px-3 rounded-lg ${a.btn} text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5 ${a.shadow}`}
        >
          {isPending ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Thinking…
            </>
          ) : (
            <>✦ Generate<span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[9px] font-semibold">2 ✦</span></>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-[11px] text-red-400 leading-relaxed">{error}</p>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-neutral-800/60" />
            <p className={`text-[9px] font-bold uppercase tracking-[0.15em] ${a.divider}`}>✦ SELECT AN ICON</p>
            <div className="flex-1 h-px bg-neutral-800/60" />
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {results.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onSelect(name)}
                title={name}
                className={`group flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border border-neutral-700/80 bg-neutral-800/60 ${a.chip} transition-all`}
              >
                <DynamicIcon
                  name={name}
                  className="w-5 h-5 text-neutral-400 group-hover:text-fuchsia-400 transition-colors"
                />
                <span className="text-[8px] text-neutral-500 group-hover:text-fuchsia-400 truncate w-full text-center leading-tight transition-colors">
                  {name}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
