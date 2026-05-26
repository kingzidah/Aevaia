"use client";

import { useState, useEffect } from "react";

interface BlockProperties {
  text?: string;
  title?: string;
  accentColor?: string;
  buttonLabel?: string;
}

interface Props {
  targetDate: string;
  title?: string;
  properties?: BlockProperties;
}

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function calcTimeLeft(target: string): TimeLeft {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  };
}

const UNITS = ["Days", "Hours", "Mins", "Secs"] as const;

export default function LiveCountdown({ targetDate, title = "Counting Down", properties }: Props) {
  // properties overrides take precedence over direct props
  const displayTitle = properties?.title ?? title;
  const [time, setTime] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setTime(calcTimeLeft(targetDate));
    const id = setInterval(() => setTime(calcTimeLeft(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const values = [time.days, time.hours, time.minutes, time.seconds];

  return (
    <div
      className="w-full px-5 pt-6 pb-8 flex flex-col items-center gap-5 select-none"
      style={{ fontFamily: "'Cinzel', 'Trajan Pro', Times, serif" }}
    >
      {/* Eyebrow label */}
      <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-neutral-500">
        {displayTitle}
      </p>

      {/* Digit grid */}
      <div className="flex items-end gap-2.5">
        {UNITS.map((unit, i) => (
          <div key={unit} className="flex items-end gap-2.5">
            <div className="flex flex-col items-center gap-2">
              {/* Glass digit card */}
              <div
                className="relative w-[62px] h-[68px] rounded-2xl flex items-center justify-center overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {/* Subtle mid-line crease */}
                <div className="absolute inset-x-0 top-1/2 h-px bg-black/20" />
                <span
                  className="relative z-10 text-[2.1rem] font-bold tabular-nums leading-none text-white"
                  style={{ textShadow: "0 2px 12px rgba(168,85,247,0.25)" }}
                >
                  {pad(values[i])}
                </span>
              </div>
              <span className="text-[8px] uppercase tracking-[0.22em] text-neutral-600 font-medium">
                {unit}
              </span>
            </div>
            {/* Separator colon */}
            {i < UNITS.length - 1 && (
              <span
                className="text-xl font-light text-neutral-700 mb-6 leading-none select-none"
                aria-hidden
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Progress ticks */}
      <div className="flex gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`h-0.5 w-4 rounded-full transition-all duration-1000 ${
              i < Math.floor((time.seconds / 60) * 12)
                ? "bg-purple-500/60"
                : "bg-neutral-800"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
