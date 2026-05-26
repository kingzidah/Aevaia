"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import type { AppTheme } from "@/components/theme-provider";

// Sun icon
function SunIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  );
}

// Monitor icon
function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" />
    </svg>
  );
}

// Moon icon
function MoonIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  );
}

const OPTIONS: { value: AppTheme; icon: typeof SunIcon; label: string }[] = [
  { value: "light",  icon: SunIcon,     label: "Light"  },
  { value: "system", icon: MonitorIcon, label: "System" },
  { value: "dark",   icon: MoonIcon,    label: "Dark"   },
];

interface ThemeToggleProps {
  /** "icon" = compact 3-icon pill for navbars; "labeled" = pill + text for settings rows */
  variant?: "icon" | "labeled";
}

export default function ThemeToggle({ variant = "icon" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    // Render a same-size placeholder to avoid layout shift.
    // aria-checked is not evaluated here, so no hydration mismatch.
    return variant === "labeled"
      ? <div className="h-10 w-50 rounded-2xl bg-zinc-100 dark:bg-neutral-900" />
      : <div className="h-8 w-24.5 rounded-xl bg-zinc-100 dark:bg-neutral-900" />;
  }

  if (variant === "labeled") {
    return (
      <div
        role="radiogroup"
        aria-label="App theme"
        className="inline-flex items-center gap-0.5 p-1 rounded-2xl
                   bg-zinc-100 dark:bg-neutral-900 border border-zinc-200 dark:border-white/8"
      >
        {OPTIONS.map(opt => {
          const active = theme === opt.value;
          const Icon   = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(opt.value)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold
                          transition-all duration-200 ${
                active
                  ? "bg-white dark:bg-neutral-800 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-400 dark:text-neutral-500 hover:text-zinc-700 dark:hover:text-neutral-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  // "icon" variant — compact, for navbars
  return (
    <div
      role="radiogroup"
      aria-label="App theme"
      className="inline-flex items-center gap-0.5 p-0.5 rounded-xl
                 bg-zinc-100 dark:bg-neutral-900 border border-zinc-200 dark:border-white/8"
    >
      {OPTIONS.map(opt => {
        const active = theme === opt.value;
        const Icon   = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.label}
            onClick={() => setTheme(opt.value)}
            className={`flex items-center justify-center w-7 h-7 rounded-[10px] transition-all duration-200 ${
              active
                ? "bg-white dark:bg-neutral-800 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-400 dark:text-neutral-500 hover:text-zinc-600 dark:hover:text-neutral-300"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
}
