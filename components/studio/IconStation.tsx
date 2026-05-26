"use client";

import React, { useState, useTransition } from "react";
import * as Icons from "lucide-react";
import { getAIIcons } from "@/app/actions/aiIcons";
import { useCredits } from "@/context/CreditContext";

// ── Dynamic icon renderer ────────────────────────────────────────────────────

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[name] ?? Icons.HelpCircle;
  return React.createElement(IconComponent, { className });
}

// ── Icon Station panel ───────────────────────────────────────────────────────

interface IconStationProps {
  onSelect: (iconName: string) => void;
}

export default function IconStation({ onSelect }: IconStationProps) {
  const [prompt,  setPrompt]  = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [error,   setError]   = useState<string | null>(null);
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

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">

      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-base leading-none select-none">✦</span>
        <p className="text-xs font-bold text-zinc-900 dark:text-white tracking-tight">AI Icon Station</p>
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
          placeholder="Describe the icon vibe…"
          disabled={isPending}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950
                     border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100
                     placeholder:text-zinc-400 dark:placeholder:text-zinc-600
                     focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30
                     disabled:opacity-50 transition-all"
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending || !prompt.trim()}
          className="shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-all
                     bg-purple-600 hover:bg-purple-500 text-white
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Thinking…
            </span>
          ) : "Generate"}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <p className="text-[11px] text-red-400 dark:text-red-500">{error}</p>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <div className="grid grid-cols-5 gap-2 pt-1">
          {results.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(name)}
              title={name}
              className="group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all
                         border border-zinc-100 dark:border-zinc-800
                         hover:border-purple-500/50 hover:bg-purple-500/5"
            >
              <DynamicIcon
                name={name}
                className="w-5 h-5 text-zinc-500 dark:text-zinc-400 group-hover:text-purple-500 transition-colors"
              />
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 group-hover:text-purple-400
                               truncate w-full text-center leading-tight transition-colors">
                {name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
