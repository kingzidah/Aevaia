"use client";

import { useState } from "react";
import GiftViewer from "./GiftViewer";
import type { GiftPayload } from "./GiftViewer";

interface GiftGateProps {
  payload: GiftPayload;
  tier: string;
}

// Cookie name scoped per gift so multiple gifts never collide.
function cookieName(giftId: string) {
  return `hc_gift_${giftId}`;
}

function setAuthCookie(giftId: string) {
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  document.cookie = `${cookieName(giftId)}=1; path=/gift/${giftId}; max-age=${maxAge}; samesite=lax`;
}

export default function GiftGate({ payload, tier }: GiftGateProps) {
  const [authorized, setAuthorized] = useState(false);
  const [name,       setName]       = useState("");
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);

  if (authorized) return <GiftViewer payload={payload} />;

  const isEvent = tier === "EVENT";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

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
        setError(data.error ?? "Entry denied. Please try again.");
        return;
      }

      setAuthCookie(payload.id);
      setAuthorized(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs flex flex-col items-center gap-6"
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_32px_rgba(168,85,247,0.15)]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-purple-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h2 className="text-white text-xl font-semibold mb-1">
            You have a gift waiting
          </h2>
          <p className="text-neutral-500 text-sm leading-relaxed">
            {isEvent
              ? "Enter your name exactly as it appears on the invitation."
              : "Enter your name to open your gift."}
          </p>
        </div>

        {/* Input */}
        <div className="w-full">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            autoComplete="given-name"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3.5 text-white text-sm placeholder:text-neutral-600 outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-xs text-center leading-relaxed -mt-2">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-[0_0_20px_rgba(168,85,247,0.25)] flex items-center justify-center gap-2"
        >
          {loading
            ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            : null}
          {loading ? "Checking…" : "Open Gift"}
        </button>
      </form>
    </div>
  );
}
