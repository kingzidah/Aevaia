"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GiftViewer from "@/components/gift/GiftViewer";
import type { GiftPayload } from "@/components/gift/GiftViewer";

interface BouncerGateProps {
  payload: GiftPayload;
}

export default function BouncerGate({ payload }: BouncerGateProps) {
  const [cleared, setCleared] = useState(false);
  const [name,    setName]    = useState("");

  const canSubmit = name.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setCleared(true);
  }

  return (
    <div className="relative w-screen min-h-screen bg-neutral-950 overflow-hidden">

      {/* Canvas — rendered beneath the gate so the fade-in feels instant */}
      <div className={`transition-opacity duration-700 ${cleared ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <GiftViewer payload={payload} />
      </div>

      {/* Bouncer overlay */}
      <AnimatePresence>
        {!cleared && (
          <motion.div
            key="bouncer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6 overflow-hidden"
          >
            {/* Deep background */}
            <div className="absolute inset-0 bg-neutral-950" />

            {/* Ambient glows */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-purple-700/8 blur-[160px]" />
              <div className="absolute top-1/4 right-1/3 w-[350px] h-[350px] rounded-full bg-rose-600/5 blur-[120px]" />
              <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-indigo-600/6 blur-[100px]" />
            </div>

            {/* Glass card */}
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: 24,  scale: 0.97 }}
              transition={{ delay: 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-sm z-10"
            >
              {/* Top gradient rule */}
              <div className="h-px w-full bg-linear-to-r from-transparent via-purple-500/70 to-transparent mb-10" />

              <form onSubmit={handleSubmit} className="flex flex-col items-center gap-8">

                {/* Seal icon */}
                <motion.div
                  initial={{ scale: 0.75, opacity: 0 }}
                  animate={{ scale: 1,    opacity: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 20 }}
                  className="relative"
                >
                  <div className="w-20 h-20 rounded-3xl bg-purple-500/8 border border-purple-500/20 flex items-center justify-center shadow-[0_0_56px_rgba(168,85,247,0.15)]">
                    {/* Wax-seal heart */}
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9 text-purple-400/90">
                      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                  </div>
                  {/* Pulse rings */}
                  <div className="absolute inset-0 rounded-3xl border border-purple-500/10 scale-110 animate-ping" style={{ animationDuration: "2.8s" }} />
                </motion.div>

                {/* Heading */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0  }}
                  transition={{ delay: 0.22, duration: 0.45 }}
                  className="text-center space-y-3 px-2"
                >
                  <h1
                    className="text-white text-2xl font-bold tracking-tight"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    Welcome.
                  </h1>
                  <p className="text-neutral-400 text-sm leading-relaxed max-w-[22rem]">
                    Please enter your name to unlock this private milestone experience.
                  </p>
                </motion.div>

                {/* Name input */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0  }}
                  transition={{ delay: 0.30, duration: 0.4 }}
                  className="w-full"
                >
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                    autoComplete="name"
                    className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 rounded-2xl px-5 py-4 text-white text-sm placeholder:text-neutral-600 outline-none transition-all text-center tracking-wide shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  />
                </motion.div>

                {/* Submit */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0  }}
                  transition={{ delay: 0.38, duration: 0.4 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-35 disabled:cursor-not-allowed text-white text-sm font-bold tracking-wide transition-all shadow-[0_0_32px_rgba(168,85,247,0.3)] hover:shadow-[0_0_48px_rgba(168,85,247,0.5)] flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                  Enter Experience
                </motion.button>

                <p className="text-neutral-700 text-[10px] tracking-widest uppercase">
                  Secured by HeartCraft
                </p>
              </form>

              {/* Bottom gradient rule */}
              <div className="h-px w-full bg-linear-to-r from-transparent via-purple-500/30 to-transparent mt-10" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
