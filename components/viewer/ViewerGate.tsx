"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GiftViewer from "@/components/gift/GiftViewer";
import type { GiftPayload } from "@/components/gift/GiftViewer";

interface ViewerGateProps {
  payload:   GiftPayload;
  tier:      string;
  guestList: string[];
}

function setViewerCookie(id: string) {
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  document.cookie = `hc_view_${id}=1; path=/p/${id}; max-age=${maxAge}; samesite=lax`;
}

export default function ViewerGate({ payload, tier, guestList }: ViewerGateProps) {
  const [authorized, setAuthorized] = useState(false);
  const [name,       setName]       = useState("");
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);

  if (authorized) return <GiftViewer payload={payload} />;

  const isEvent    = tier === "EVENT";
  const needsName  = isEvent && guestList.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (needsName && !trimmed) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/gift/check-in", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ giftId: payload.id, guestName: trimmed }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Access denied. Please try again.");
        setLoading(false);
        return;
      }

      setViewerCookie(payload.id);
      setAuthorized(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/6 blur-[140px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-rose-600/4 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* Top gradient line */}
        <div className="h-px w-full bg-linear-to-r from-transparent via-purple-500/60 to-transparent mb-8" />

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-7">

          {/* Shield icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1,   opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-20 h-20 rounded-3xl bg-purple-500/8 border border-purple-500/20
                       flex items-center justify-center shadow-[0_0_48px_rgba(168,85,247,0.12)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.3} stroke="currentColor" className="w-9 h-9 text-purple-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
            className="text-center space-y-2"
          >
            <h1 className="text-white text-2xl font-bold tracking-tight">Welcome.</h1>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-[22rem]">
              {needsName
                ? "Please type your full name exactly as it appears on your invitation to open this experience."
                : "Please enter your name to open this custom digital experience."}
            </p>
          </motion.div>

          {/* Name input */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.4 }}
            className="w-full"
          >
            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={e => { setName(e.target.value); setError(""); }}
              autoFocus
              autoComplete="name"
              className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-purple-500/60
                         focus:ring-1 focus:ring-purple-500/30 rounded-2xl px-5 py-4 text-white
                         text-sm placeholder:text-neutral-600 outline-none transition-all text-center
                         tracking-wide shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            />
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0,  height: "auto" }}
                exit={{    opacity: 0, y: -4, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-red-400 text-xs text-center leading-relaxed -mt-3"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.4 }}
            type="submit"
            disabled={loading || (needsName && !name.trim())}
            className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40
                       disabled:cursor-not-allowed text-white text-sm font-bold tracking-wide
                       transition-all shadow-[0_0_28px_rgba(168,85,247,0.3)]
                       hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            )}
            {loading ? "Verifying…" : "Enter Experience"}
          </motion.button>

          <p className="text-neutral-700 text-[10px] tracking-wider uppercase mt-2">
            Secured by Aevaia
          </p>
        </form>

        <div className="h-px w-full bg-linear-to-r from-transparent via-purple-500/30 to-transparent mt-8" />
      </motion.div>
    </div>
  );
}
