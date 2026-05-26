'use client';

import { useState, useEffect } from 'react';

interface CountdownBlockProps {
  targetDate: string;
}

function getTimeLeft(target: string) {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownBlock({ targetDate }: CountdownBlockProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate));

  useEffect(() => {
    setTimeLeft(getTimeLeft(targetDate));
    const id = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hrs',  value: timeLeft.hours },
    { label: 'Min',  value: timeLeft.minutes },
    { label: 'Sec',  value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-2 py-6 px-4">
      {units.map(({ label, value }, i) => (
        <div key={label} className="flex items-start gap-2">
          <div className="flex flex-col items-center gap-1.5">
            <div className="min-w-[60px] h-14 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_4px_12px_rgba(0,0,0,0.3)]">
              <span className="text-2xl font-bold tabular-nums tracking-tight text-white">
                {String(value).padStart(2, '0')}
              </span>
            </div>
            <span className="text-[9px] uppercase tracking-[0.18em] font-semibold text-white/35 select-none">
              {label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span className="text-xl font-light text-white/25 mt-3.5 select-none leading-none">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
