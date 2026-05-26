"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type Tier = "INTIMATE" | "EVENT";

interface TierModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  giftId:     string;
  onProceed:  (tier: Tier, guestNames: string[]) => void;
}

const TIERS: {
  id:       Tier;
  price:    string;
  viewers:  string;
  tagline:  string;
  features: string[];
  color:    string;
  glow:     string;
  ring:     string;
}[] = [
  {
    id:      "INTIMATE",
    price:   "€15",
    viewers: "Up to 5 viewers",
    tagline: "Perfect for personal gifts",
    features: [
      "Up to 5 unique device logins",
      "Name-based entry gate",
      "Permanent shareable link",
    ],
    color: "bg-purple-500/10 border-purple-500/30",
    glow:  "shadow-[0_0_24px_rgba(168,85,247,0.2)]",
    ring:  "ring-purple-500",
  },
  {
    id:      "EVENT",
    price:   "€49",
    viewers: "Entire guest list",
    tagline: "Weddings, birthdays, celebrations",
    features: [
      "Unlimited names on guest list",
      "20% safety buffer built in",
      "Each guest logs in once",
    ],
    color: "bg-rose-500/10 border-rose-500/30",
    glow:  "shadow-[0_0_24px_rgba(244,63,94,0.2)]",
    ring:  "ring-rose-500",
  },
];

export default function TierModal({ isOpen, onClose, giftId, onProceed }: TierModalProps) {
  const [selectedTier,    setSelectedTier]    = useState<Tier>("INTIMATE");
  const [guestListText,   setGuestListText]   = useState("");
  const [isSavingList,    setIsSavingList]    = useState(false);
  const [listSaved,       setListSaved]       = useState(false);
  const [listError,       setListError]       = useState("");
  const [isProceedLoading, setIsProceedLoading] = useState(false);

  const parsedNames = guestListText
    .split("\n")
    .map(n => n.trim())
    .filter(Boolean);

  const handleSaveGuestList = async () => {
    if (!parsedNames.length) return;
    setIsSavingList(true);
    setListError("");
    setListSaved(false);
    try {
      const res = await fetch("/api/gift/update-settings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ giftId, guestList: parsedNames }),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      setListSaved(true);
    } catch {
      setListError("Failed to save guest list. Please try again.");
    } finally {
      setIsSavingList(false);
    }
  };

  const handleProceed = async () => {
    // For EVENT, require the guest list to be saved first.
    if (selectedTier === "EVENT" && !listSaved) {
      setListError("Please save your guest list before proceeding.");
      return;
    }
    setIsProceedLoading(true);
    // Pass the parsed names so the checkout route can embed them in Stripe metadata
    // without a separate DB round-trip. For INTIMATE, the array will be empty.
    onProceed(selectedTier, selectedTier === "EVENT" ? parsedNames : []);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="tier-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            key="tier-card"
            initial={{ opacity: 0, y: 48, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{    opacity: 0, y: 48, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-101 flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="w-full max-w-md bg-neutral-950 border border-white/8 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.8)] pointer-events-auto overflow-hidden">
              <div className="h-1 w-full bg-linear-to-r from-purple-600 via-rose-500 to-purple-600" />

              <div className="p-7 overflow-y-auto max-h-[90vh]">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Choose Your Package</h2>
                    <p className="text-xs text-neutral-500 mt-1">Select a tier to unlock and share your gift.</p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="w-8 h-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center transition-colors shrink-0 ml-4"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-neutral-500">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>

                {/* Tier cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {TIERS.map(tier => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => { setSelectedTier(tier.id); setListSaved(false); setListError(""); }}
                      className={`relative flex flex-col p-4 rounded-2xl border text-left transition-all ${tier.color} ${selectedTier === tier.id ? `ring-2 ${tier.ring} ${tier.glow}` : "hover:border-white/20"}`}
                    >
                      {selectedTier === tier.id && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5 text-neutral-950">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <span className="text-2xl font-black text-white mb-1">{tier.price}</span>
                      <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider mb-2">{tier.id}</span>
                      <span className="text-xs text-neutral-400 leading-relaxed">{tier.tagline}</span>
                      <div className="mt-3 pt-3 border-t border-white/6 space-y-1.5">
                        {tier.features.map(f => (
                          <div key={f} className="flex items-start gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-neutral-500 shrink-0 mt-0.5">
                              <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                            </svg>
                            <span className="text-[10px] text-neutral-500 leading-tight">{f}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>

                {/* ── Host Dashboard — EVENT guest list ──────────────────────── */}
                <AnimatePresence>
                  {selectedTier === "EVENT" && (
                    <motion.div
                      key="guest-list"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{    opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="mb-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">Guest List Setup</span>
                        </div>
                        <label className="block text-xs text-neutral-400 leading-relaxed">
                          Paste your guest names — one per line. Guests must type their name exactly to enter.
                        </label>
                        <textarea
                          value={guestListText}
                          onChange={e => { setGuestListText(e.target.value); setListSaved(false); }}
                          rows={6}
                          placeholder={"John Doe\nAunt Sarah\nMaria Garcia\nBest Friend Alex"}
                          className="w-full bg-neutral-950 border border-neutral-800 focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/30 rounded-xl px-3 py-2.5 text-xs text-neutral-300 placeholder:text-neutral-700 resize-none outline-none transition-all font-mono"
                        />
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] text-neutral-600">
                            {parsedNames.length > 0
                              ? `${parsedNames.length} name${parsedNames.length !== 1 ? "s" : ""} · cap will be ${Math.max(5, Math.ceil(parsedNames.length * 1.2))}`
                              : "No names entered yet"}
                          </span>
                          <button
                            type="button"
                            onClick={handleSaveGuestList}
                            disabled={isSavingList || !parsedNames.length}
                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                          >
                            {isSavingList
                              ? <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                              : null}
                            {listSaved ? "✓ Saved" : "Save Guest List"}
                          </button>
                        </div>
                        {listError && (
                          <p className="text-xs text-red-400">{listError}</p>
                        )}
                        {listSaved && (
                          <p className="text-xs text-green-400">Guest list saved — {parsedNames.length} names ready.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Proceed button */}
                <button
                  type="button"
                  onClick={handleProceed}
                  disabled={isProceedLoading}
                  className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_28px_rgba(168,85,247,0.3)]"
                >
                  {isProceedLoading
                    ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    : null}
                  Proceed to Payment →
                </button>
                <p className="text-center text-[10px] text-neutral-700 mt-3">Secured by Stripe · 256-bit SSL</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
