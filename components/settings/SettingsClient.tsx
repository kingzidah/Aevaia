"use client";

import { useState } from "react";
import Link from "next/link";
import { UserProfile } from "@clerk/nextjs";
import ThemeToggle from "@/components/theme-toggle";
import AppHeader from "@/components/app-header";

interface Props {
  subscriptionStatus: string;
  tier:               string;
  hasStripeCustomer:  boolean;
}

const TIER_META: Record<string, { label: string; color: string; glow: string }> = {
  FREE:     { label: "Free",     color: "bg-neutral-800 text-neutral-400 border-neutral-700",    glow: "" },
  INTIMATE: { label: "Intimate", color: "bg-purple-500/10 text-purple-300 border-purple-500/30", glow: "shadow-[0_0_16px_rgba(168,85,247,0.15)]" },
  EVENT:    { label: "Event",    color: "bg-rose-500/10 text-rose-300 border-rose-500/30",        glow: "shadow-[0_0_16px_rgba(244,63,94,0.15)]"  },
};

// ── Clerk appearance config ──────────────────────────────────────────────────
// baseTheme and variables are inherited from the global <ClerkProvider> in
// ClerkThemeSync — no need to repeat them here.  This object only carries
// page-specific structural overrides: stripping Clerk's card chrome so our
// own <section> wrapper provides the shell, and blending the navbar.

const clerkAppearance = {
  elements: {
    // ── Outer chrome ────────────────────────────────────────────────────────
    // Strip Clerk's card entirely — our <section> wrapper provides the shell.
    // Tailwind strings are used here so the width constraints participate in
    // Tailwind's cascade rather than fighting specificity as inline styles.
    rootBox: "w-full",
    card: {
      background:   "transparent",
      boxShadow:    "none",
      border:       "none",
      borderRadius: "0",
      padding:      "0",
      width:        "100%",
      maxWidth:     "100%",
      gap:          "0",
    },
    // Clerk's internal scroll container — must also be unconstrained so
    // the content area can fill the card width without triggering overflow.
    scrollBox: "w-full max-w-full",

    // ── Left navigation sidebar ──────────────────────────────────────────────
    // Keep it visible so the user can switch between Profile and Security.
    // A subtle divider (matching our panel borders) separates it from content.
    navbar: {
      background:   "transparent",
      borderRight:  "1px solid rgba(255,255,255,0.06)",
      paddingTop:   "1.75rem",       // aligns with pageScrollBox top padding
      paddingRight: "0",
      gap:          "0.25rem",
    },
    navbarButton: {
      borderRadius: "0.5rem",
      color:        "#a3a3a3",
      fontSize:     "0.8125rem",
      fontWeight:   "500",
      padding:      "0.5rem 0.875rem",
    },
    // Active nav item gets the brand purple tint — identical to how active
    // items appear in the rest of the app (e.g., AppHeader nav links).
    navbarButton__active: {
      background: "rgba(168,85,247,0.12)",
      color:      "#c084fc",           // purple-400
    },
    navbarButtonIcon: {
      color: "currentColor",
    },

    // ── Main content area ────────────────────────────────────────────────────
    // p-7 (1.75rem) matches every other panel on the page exactly.
    pageScrollBox: {
      padding:       "1.75rem",
      paddingLeft:   "1.75rem",
    },

    // ── Section dividers & titles ─────────────────────────────────────────────
    profileSectionTitle: {
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      paddingBottom: "0.625rem",
      marginBottom:  "1rem",
    },
    profileSectionTitleText: {
      color:       "#ffffff",
      fontWeight:  "600",
      fontSize:    "0.8125rem",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
    },
    dividerLine: {
      background: "rgba(255,255,255,0.06)",
    },

    // ── Form inputs ────────────────────────────────────────────────────────────
    formFieldInput: {
      background:  "#0a0a0a",
      border:      "1px solid rgba(255,255,255,0.10)",
      color:       "#ffffff",
      borderRadius: "0.75rem",
    },
    formFieldInputShowPasswordButton: {
      color: "#a3a3a3",
    },
    formFieldLabel: {
      color:      "#a3a3a3",
      fontSize:   "0.75rem",
      fontWeight: "500",
    },

    // ── Buttons ────────────────────────────────────────────────────────────────
    formButtonPrimary: {
      background:   "#9333ea",   // purple-600
      borderRadius: "0.75rem",
      fontWeight:   "600",
    },
    formButtonReset: {
      color:        "#a3a3a3",
      borderRadius: "0.75rem",
    },

    // ── Avatar ─────────────────────────────────────────────────────────────────
    avatarBox: {
      borderRadius: "1rem",         // rounded-2xl
      boxShadow:    "0 0 0 2px rgba(168,85,247,0.25)",
    },

    // ── Badges (e.g. "Unverified") ─────────────────────────────────────────────
    badge: {
      background: "rgba(168,85,247,0.10)",
      border:     "1px solid rgba(168,85,247,0.25)",
      color:      "#c084fc",
    },

    // ── Header inside Clerk pages (e.g. "Update profile") ─────────────────────
    // Hide it — the section title we render outside provides the context.
    header: {
      display: "none",
    },
  },
} as const;

// ── Main component ───────────────────────────────────────────────────────────

export default function SettingsClient({ subscriptionStatus, tier, hasStripeCustomer }: Props) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalErr,     setPortalErr]     = useState("");

  const tierMeta = TIER_META[tier] ?? TIER_META.FREE;

  const handleBillingPortal = async () => {
    setPortalLoading(true);
    setPortalErr("");
    try {
      const res = await fetch("/api/settings/billing-portal", { method: "POST" });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setPortalErr(d.error ?? "Unable to open billing portal.");
        return;
      }
      const { url } = await res.json() as { url: string };
      window.location.href = url;
    } catch {
      setPortalErr("Network error — please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-neutral-950 text-zinc-900 dark:text-white">
      <AppHeader />

      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-12 space-y-8">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Account Settings</h1>
          <p className="text-sm text-zinc-500 dark:text-neutral-500 mt-1">Manage your profile, security, and billing.</p>
        </div>

        {/* ── Profile & Security ──────────────────────────────────────────────
             Clerk's UserProfile handles all identity management (display name,
             email, password, MFA, connected accounts).  We own the card shell
             so border, radius, and accent bar match the panels below exactly.
             overflow-hidden is intentionally absent: it would clip Clerk's
             internal layout which has a wider minimum than the card border. */}
        <section className="rounded-3xl border border-zinc-200 dark:border-white/8 bg-white dark:bg-neutral-900/50">
          {/* Purple gradient accent bar — identical to every other section */}
          <div className="h-0.5 w-full bg-linear-to-r from-purple-600/50 via-fuchsia-500/50 to-purple-600/50" />

          {/* Section title row rendered outside Clerk so spacing is ours to own */}
          <div className="flex items-center gap-3 px-7 pt-6 pb-0">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Profile &amp; Security</h2>
              <p className="text-xs text-zinc-500 dark:text-neutral-500 mt-0.5">Update your identity, password, and two-factor settings.</p>
            </div>
          </div>

          {/* Clerk component — transparent inside our shell */}
          <UserProfile appearance={clerkAppearance} />
        </section>

        {/* ── Appearance ─────────────────────────────────────────────────────── */}
        <section className="rounded-3xl border border-zinc-200 dark:border-white/8 bg-white dark:bg-neutral-900/50 overflow-hidden">
          <div className="h-0.5 w-full bg-linear-to-r from-indigo-600/50 via-purple-500/50 to-indigo-600/50" />
          <div className="p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-indigo-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Appearance</h2>
                  <p className="text-xs text-zinc-500 dark:text-neutral-500 mt-0.5">Choose your preferred colour scheme.</p>
                </div>
              </div>
              <ThemeToggle variant="labeled" />
            </div>
          </div>
        </section>

        {/* ── Billing ────────────────────────────────────────────────────────── */}
        <section className="rounded-3xl border border-zinc-200 dark:border-white/8 bg-white dark:bg-neutral-900/50 overflow-hidden">
          <div className="h-0.5 w-full bg-linear-to-r from-rose-600/50 via-pink-500/50 to-rose-600/50" />
          <div className="p-7 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-rose-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Billing</h2>
                <p className="text-xs text-zinc-500 dark:text-neutral-500">Your active plan and payment history.</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-neutral-950 border border-zinc-200 dark:border-white/5">
              <div>
                <p className="text-xs text-zinc-500 dark:text-neutral-500 mb-1">Current Tier</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${tierMeta.color} ${tierMeta.glow}`}>
                  {tierMeta.label}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 dark:text-neutral-500 mb-1">Subscription Status</p>
                <span className={`text-xs font-semibold ${
                  subscriptionStatus === "ACTIVE"    ? "text-green-400"
                  : subscriptionStatus === "PAST_DUE" ? "text-amber-400"
                  : "text-neutral-500"
                }`}>
                  {subscriptionStatus.replace("_", " ")}
                </span>
              </div>
            </div>

            {hasStripeCustomer ? (
              <>
                {portalErr && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-xs text-red-400">
                    {portalErr}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleBillingPortal}
                  disabled={portalLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-700
                             hover:border-neutral-600 hover:bg-neutral-800 text-neutral-300 hover:text-white
                             text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {portalLoading ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-neutral-500 border-t-white animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  )}
                  {portalLoading ? "Redirecting…" : "Manage Billing on Stripe"}
                </button>
              </>
            ) : (
              <p className="text-xs text-neutral-600 italic">
                No billing record found. Purchase a tier in the studio to unlock billing management.
              </p>
            )}
          </div>
        </section>

        {/* ── Danger Zone ────────────────────────────────────────────────────── */}
        <section className="rounded-3xl border border-red-500/15 bg-red-500/3 p-7 space-y-4">
          <h2 className="text-sm font-bold text-red-400">Danger Zone</h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            Need to close your account or have a data deletion request?{" "}
            <Link href="/contact" className="text-purple-400 hover:text-purple-300 transition-colors">
              Contact our support team
            </Link>{" "}
            and we will process it within 48 hours.
          </p>
        </section>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-4 pt-2 pb-6 text-xs text-neutral-700">
          <Link href="/privacy" className="hover:text-neutral-400 transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/terms"   className="hover:text-neutral-400 transition-colors">Terms of Service</Link>
          <span>·</span>
          <Link href="/contact" className="hover:text-neutral-400 transition-colors">Support</Link>
        </div>
      </div>
    </main>
  );
}
