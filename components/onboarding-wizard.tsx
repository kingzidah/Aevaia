"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TEMPLATES } from "@/lib/templates";
import type { ProjectTemplate } from "@/lib/templates";

interface OnboardingWizardProps {
  onSelect:      (templateId: string) => Promise<void>;
  onCreateBlank: () => Promise<void>;
  selecting:     string | null; // templateId currently being provisioned
  creatingBlank: boolean;
}

function TemplateCard({
  template,
  onSelect,
  isSelecting,
  anySelecting,
}: {
  template:    ProjectTemplate;
  onSelect:    () => void;
  isSelecting: boolean;
  anySelecting: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex flex-col p-6 rounded-3xl border transition-all duration-300 ${template.bg}
                  ${isSelecting ? `ring-2 ${template.ring} ${template.glow}` : "hover:border-white/20"}`}
    >
      {/* Accent dot */}
      <div className={`w-2 h-2 rounded-full mb-4 ${template.accent.replace("text-", "bg-")} opacity-80`} />

      <h3 className={`text-base font-black tracking-tight mb-1 ${template.accent}`}>{template.title}</h3>
      <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest mb-3">{template.tagline}</p>
      <p className="text-xs text-neutral-400 leading-relaxed mb-5">{template.description}</p>

      {/* Feature list */}
      <ul className="space-y-1.5 mb-6">
        {template.features.map(f => (
          <li key={f} className="flex items-center gap-2 text-[11px] text-neutral-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                 className={`w-3 h-3 shrink-0 ${template.accent}`}>
              <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onSelect}
        disabled={anySelecting}
        className={`mt-auto w-full py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2
                    ${isSelecting
                      ? "bg-white/10 text-white/70 cursor-wait"
                      : `border ${template.bg} ${template.accent} hover:brightness-125 disabled:opacity-40`
                    }`}
      >
        {isSelecting ? (
          <>
            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            Launching…
          </>
        ) : (
          "Launch This Blueprint →"
        )}
      </button>
    </motion.div>
  );
}

export default function OnboardingWizard({
  onSelect,
  onCreateBlank,
  selecting,
  creatingBlank,
}: OnboardingWizardProps) {
  const anyBusy = selecting !== null || creatingBlank;

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md"
      />

      <motion.div
        key="onboarding-panel"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="min-h-full flex items-start justify-center px-4 pt-10 pb-16">
          <div className="w-full max-w-4xl">

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="text-center mb-10">
              {/* Logo */}
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center
                                shadow-[0_0_20px_rgba(168,85,247,0.6)]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                </div>
                <span className="text-white font-bold text-lg tracking-tight">HeartCraft</span>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
              >
                {/* Welcome badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border
                                border-white/10 text-xs text-neutral-400 font-medium mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Your Creative Lounge is ready
                </div>

                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3">
                  Your First Masterpiece{" "}
                  <span className="bg-clip-text text-transparent bg-linear-to-r from-purple-400 via-pink-400 to-rose-400">
                    Awaits.
                  </span>
                </h1>
                <p className="text-neutral-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                  Select a beautifully pre-sculpted canvas blueprint below to bypass the blank
                  screen and launch your 3D experience instantly.
                </p>
              </motion.div>
            </div>

            {/* ── Template cards ────────────────────────────────────────── */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {TEMPLATES.map((template, i) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <TemplateCard
                    template={template}
                    onSelect={() => onSelect(template.id)}
                    isSelecting={selecting === template.id}
                    anySelecting={anyBusy}
                  />
                </motion.div>
              ))}
            </div>

            {/* ── Divider ───────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="flex items-center gap-4 mb-6"
            >
              <div className="flex-1 border-t border-white/5" />
              <span className="text-[10px] text-neutral-700 uppercase tracking-widest font-mono">or</span>
              <div className="flex-1 border-t border-white/5" />
            </motion.div>

            {/* ── Blank canvas CTA ──────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <button
                type="button"
                onClick={onCreateBlank}
                disabled={anyBusy}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/8
                           hover:border-white/20 hover:bg-white/3 text-neutral-400 hover:text-white
                           text-sm font-medium transition-all disabled:opacity-40"
              >
                {creatingBlank ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-neutral-500 border-t-white animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2}
                       stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                )}
                {creatingBlank ? "Creating…" : "Start with a blank canvas instead"}
              </button>
              <p className="text-[10px] text-neutral-700 mt-3">
                You can always apply AI copy, effects, and scenes inside the studio.
              </p>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
