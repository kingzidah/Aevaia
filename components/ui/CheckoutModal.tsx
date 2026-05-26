"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail } from "lucide-react";
import type { Tier } from "@/components/studio/TierModal";

interface CheckoutModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  giftId:     string;
  tier:       Tier;
  guestNames?: string[];
}

const TIER_DISPLAY: Record<Tier, {
  price:    string;
  currency: string;
  label:    string;
  features: string[];
}> = {
  INTIMATE: {
    price:    "€15",
    currency: "EUR · one-time",
    label:    "Intimate Package",
    features: [
      "Up to 5 unique device logins",
      "Name-based entry gate",
      "Permanent shareable link",
    ],
  },
  EVENT: {
    price:    "€49",
    currency: "EUR · one-time",
    label:    "Event Package",
    features: [
      "Full guest-list access control",
      "Each guest logs in once per device",
      "Permanent shareable link",
    ],
  },
};

export default function CheckoutModal({ isOpen, onClose, giftId, tier, guestNames = [] }: CheckoutModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState("");

  const display = TIER_DISPLAY[tier];

  const handleCheckout = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ giftId, tier, guestNames }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const { url } = await res.json() as { url?: string };
      if (!url) throw new Error("No checkout URL returned");
      window.location.href = url;
    } catch {
      setError("Unable to start checkout. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="checkout-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-100 bg-black/75 backdrop-blur-sm"
          />

          <motion.div
            key="checkout-card"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="fixed inset-0 z-101 flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="w-full max-w-sm bg-neutral-950 border border-white/8 rounded-3xl shadow-[0_0_80px_rgba(168,85,247,0.15)] pointer-events-auto overflow-hidden">
              <div className="h-1 w-full bg-linear-to-r from-purple-600 via-pink-500 to-purple-600" />

              <div className="p-8">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_24px_rgba(168,85,247,0.2)]">
                    <Mail className="w-8 h-8 text-purple-400" aria-label="gift" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white text-center mb-1 tracking-tight">
                  Unlock your HeartCraft
                </h2>
                <p className="text-xs text-neutral-500 text-center mb-6">{display.label}</p>

                <div className="flex justify-center mb-6">
                  <div className="flex items-end gap-1 px-5 py-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                    <span className="text-4xl font-black text-white tracking-tight">{display.price}</span>
                    <span className="text-xs text-neutral-500 mb-1.5 ml-2">{display.currency}</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-7">
                  {display.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-xs text-neutral-400">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-purple-400 shrink-0 mt-0.5">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {error && (
                  <p className="text-xs text-red-400 text-center mb-4 px-2 py-2 rounded-xl bg-red-500/8 border border-red-500/20">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className={`w-full py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-3 ${
                    isLoading
                      ? "bg-purple-700/60 text-white/70 cursor-wait"
                      : "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_28px_rgba(168,85,247,0.35)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)]"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Redirecting to Stripe…
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                      Pay with Stripe
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                      </svg>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full mt-3 py-2.5 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
                >
                  Maybe later
                </button>
                <p className="text-center text-[10px] text-neutral-700 mt-4">Secured by Stripe · 256-bit SSL</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
