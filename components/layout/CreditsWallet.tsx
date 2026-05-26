"use client";

import { useEffect, useState, useCallback } from "react";

export default function CreditsWallet() {
  const [credits,    setCredits]    = useState<number | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    fetch("/api/user/credits")
      .then(r => r.json())
      .then((d: { credits?: number }) => setCredits(d.credits ?? 1000))
      .catch(() => setCredits(1000));
  }, []);

  const handleBuyCredits = useCallback(async () => {
    if (redirecting) return;
    setRedirecting(true);
    try {
      const res  = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json() as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setRedirecting(false);
      }
    } catch {
      setRedirecting(false);
    }
  }, [redirecting]);

  return (
    <button
      type="button"
      onClick={handleBuyCredits}
      disabled={redirecting}
      className="flex items-center gap-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400
                 border border-purple-500/20 hover:border-purple-500/40 px-3 py-1.5 rounded-full
                 text-xs font-semibold shadow-[0_0_12px_rgba(168,85,247,0.15)]
                 hover:shadow-[0_0_18px_rgba(168,85,247,0.3)] transition-all
                 disabled:opacity-60 disabled:cursor-wait"
      title="Buy more credits"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0" aria-hidden="true">
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
        <path d="M20 3v4m2-2h-4M4 17v2m1-1H3" />
      </svg>
      {redirecting ? (
        <span className="w-4 h-2 rounded-full bg-purple-500/30 animate-pulse" />
      ) : credits === null ? (
        <span className="w-8 h-2 rounded-full bg-purple-500/20 animate-pulse" />
      ) : (
        <>{credits.toLocaleString()} Credits</>
      )}
    </button>
  );
}
