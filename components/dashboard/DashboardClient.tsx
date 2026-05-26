"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OnboardingWizard from "@/components/onboarding-wizard";
import AppHeader from "@/components/app-header";
import CreditsWallet from "@/components/layout/CreditsWallet";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ProjectRecord {
  id:        string;
  title:     string;
  isPaid:    boolean;
  tier:      string;
  createdAt: string;
}

export interface DesignRecord {
  id:          string;
  title:       string;
  createdAt:   string;
  isPublished: boolean;
}

// ─── Gift card ───────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: ProjectRecord }) {
  const date    = new Date(project.createdAt);
  const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const shortId = project.id.slice(-8).toUpperCase();

  return (
    <div className="group flex flex-col gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-900/60 border border-zinc-200 dark:border-neutral-800
                    hover:border-zinc-300 dark:hover:border-neutral-700 transition-all hover:shadow-[0_0_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_0_24px_rgba(0,0,0,0.4)]">
      {/* Thumbnail placeholder */}
      <div className="w-full h-28 rounded-xl bg-zinc-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-linear-to-br from-purple-900/30 via-transparent to-rose-900/20" />
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-neutral-700">
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
            {project.title !== "Untitled Masterpiece" ? project.title : `···${shortId}`}
          </p>
          <p className="text-xs text-zinc-400 dark:text-neutral-600 mt-0.5">{dateStr} · {timeStr}</p>
        </div>
        <div className="shrink-0">
          {project.isPaid ? (
            <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20
                             text-green-400 text-[10px] font-bold uppercase tracking-wider">Published</span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700
                             text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Draft</span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {project.isPaid && (
          <a
            href={`/gift/${project.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 rounded-xl border border-neutral-800 hover:border-neutral-600
                       text-neutral-400 hover:text-white text-xs font-medium text-center transition-all"
          >
            View Live
          </a>
        )}
        <Link
          href={`/studio/${project.id}`}
          className="flex-1 py-2 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border
                     border-purple-500/20 hover:border-purple-500/40 text-purple-300 hover:text-purple-200
                     text-xs font-bold transition-all text-center"
        >
          Open in Studio
        </Link>
      </div>
    </div>
  );
}

// ─── Design card (Supabase /api/publish designs) ─────────────────────────────

function DesignCard({ design }: { design: DesignRecord }) {
  const [copied, setCopied] = useState(false);

  const date    = new Date(design.createdAt);
  const dateStr = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const shortId = design.id.slice(-8).toUpperCase();

  const handleCopy = useCallback(() => {
    const url = `${window.location.origin}/gift/${design.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [design.id]);

  return (
    <div className="group flex flex-col gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-900/60 border border-zinc-200 dark:border-neutral-800
                    hover:border-zinc-300 dark:hover:border-neutral-700 transition-all hover:shadow-[0_0_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_0_24px_rgba(0,0,0,0.4)]">
      {/* Thumbnail placeholder */}
      <div className="w-full h-28 rounded-xl bg-zinc-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-linear-to-br from-purple-900/30 via-transparent to-pink-900/20" />
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
             stroke="currentColor" className="w-8 h-8 text-neutral-600 relative">
          <path strokeLinecap="round" strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
            {design.title !== "Untitled Gift" ? design.title : `···${shortId}`}
          </p>
          <p className="text-xs text-zinc-400 dark:text-neutral-600 mt-0.5">{dateStr} · {timeStr}</p>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
          design.isPublished
            ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
            : "bg-neutral-800 border-neutral-700 text-neutral-500"
        }`}>
          {design.isPublished ? "Live" : "Draft"}
        </span>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/studio?design=${design.id}`}
          className="flex-1 py-2 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border
                     border-purple-500/20 hover:border-purple-500/40 text-purple-300 hover:text-purple-200
                     text-xs font-bold text-center transition-all"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={handleCopy}
          className={`flex-1 py-2 rounded-xl border text-xs font-medium text-center transition-all ${
            copied
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "border-neutral-800 hover:border-neutral-600 text-neutral-400 hover:text-white"
          }`}
        >
          {copied ? "Copied!" : "Copy Live Link"}
        </button>
      </div>
    </div>
  );
}

// ─── Main client component ──────────────────────────────────────────────────

interface DashboardClientProps {
  userName:        string | null;
  userEmail:       string;
  initialProjects: ProjectRecord[];
  initialDesigns?: DesignRecord[];
}

export default function DashboardClient({ userName, userEmail, initialProjects, initialDesigns = [] }: DashboardClientProps) {
  const router = useRouter();

  const [creating,      setCreating]      = useState(false);
  const [selectingTmpl, setSelectingTmpl] = useState<string | null>(null);

  const handleCreateNew = useCallback(async () => {
    setCreating(true);
    try {
      const res  = await fetch("/api/projects/create", { method: "POST" });
      const data = await res.json() as { id?: string; error?: string };
      if (res.ok && data.id) {
        router.push(`/studio/${data.id}`);
      } else {
        console.error("[dashboard] Project creation failed:", data.error);
        router.push("/dashboard");
      }
    } catch {
      router.push("/studio");
    }
  }, [router]);

  const handleSelectTemplate = useCallback(async (templateId: string) => {
    setSelectingTmpl(templateId);
    try {
      const res  = await fetch("/api/projects/from-template", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ templateId }),
      });
      const data = await res.json() as { id?: string; error?: string };
      if (res.ok && data.id) {
        router.push(`/studio/${data.id}`);
      } else {
        console.error("[onboarding] Template project creation failed:", data.error);
        setSelectingTmpl(null);
      }
    } catch {
      setSelectingTmpl(null);
    }
  }, [router]);

  const headerActions = useMemo(() => <CreditsWallet />, []);
  const greeting      = userName ? `Welcome back, ${userName.split(" ")[0]}.` : "Your Creative Lounge";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-neutral-950 text-zinc-900 dark:text-white">

      {/* Onboarding wizard — shown only on first login (zero projects) */}
      {initialProjects.length === 0 && (
        <OnboardingWizard
          onSelect={handleSelectTemplate}
          onCreateBlank={handleCreateNew}
          selecting={selectingTmpl}
          creatingBlank={creating}
        />
      )}

      {/* Nav — CreditsWallet mirrors the Studio's credits pill exactly */}
      <AppHeader
        userName={userName}
        userEmail={userEmail}
        actions={headerActions}
      />

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12">

        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1 text-zinc-900 dark:text-white">{greeting}</h1>
            <p className="text-zinc-500 dark:text-neutral-500 text-sm">Design, manage, and share your gift experiences.</p>
          </div>
          <button
            type="button"
            onClick={handleCreateNew}
            disabled={creating}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500
                       disabled:opacity-60 text-white font-bold text-sm transition-all
                       shadow-[0_0_24px_rgba(168,85,247,0.35)] hover:shadow-[0_0_36px_rgba(168,85,247,0.5)]
                       whitespace-nowrap"
          >
            {creating ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}
                   stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
            Create Fresh Canvas Blueprint
          </button>
        </div>

        {/* Projects grid */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-sm font-bold text-zinc-500 dark:text-neutral-300 uppercase tracking-wider">Your Gifts</h2>
            <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-500 text-[10px] font-bold">
              {initialProjects.length}
            </span>
          </div>

          {initialProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
              <div className="w-20 h-20 rounded-3xl bg-purple-500/8 border border-purple-500/15
                              flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                     stroke="currentColor" className="w-9 h-9 text-purple-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </div>
              <div>
                <p className="text-zinc-900 dark:text-white font-semibold mb-1">No gifts yet</p>
                <p className="text-zinc-400 dark:text-neutral-600 text-sm max-w-xs leading-relaxed">
                  Hit &ldquo;Create Fresh Canvas Blueprint&rdquo; to start designing your first gift experience.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreateNew}
                className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white
                           font-bold text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              >
                Start Designing →
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {initialProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* ── Supabase designs grid ─────────────────────────────────────── */}
        {initialDesigns.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-sm font-bold text-zinc-500 dark:text-neutral-300 uppercase tracking-wider">Published Designs</h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold">
                {initialDesigns.length}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {initialDesigns.map(design => (
                <DesignCard key={design.id} design={design} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
