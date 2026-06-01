import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aevaia — Back Very Soon",
  description: "We're upgrading Aevaia with powerful new AI media engines. Back very soon.",
  robots: "noindex, nofollow",
};

// ── Engine cards ──────────────────────────────────────────────────────────────

const ENGINES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
    label: "Audio AI",
    detail: "MusicGen · Bark TTS",
    color: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="m10 9 5 3-5 3V9z" />
        <path d="M7 2h10" />
      </svg>
    ),
    label: "Video AI",
    detail: "Minimax · Video-01",
    color: "text-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
      </svg>
    ),
    label: "Vector AI",
    detail: "Claude · SVG Engine",
    color: "text-purple-400",
    border: "border-purple-500/20",
    bg: "bg-purple-500/5",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    label: "Image AI",
    detail: "Replicate · SDXL",
    color: "text-rose-400",
    border: "border-rose-500/20",
    bg: "bg-rose-500/5",
  },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MaintenancePage() {
  return (
    <>
      <style>{`
        @keyframes ae-orb {
          0%, 100% { opacity: .35; transform: scale(1); }
          50%       { opacity: .6;  transform: scale(1.06); }
        }
        @keyframes ae-orb-alt {
          0%, 100% { opacity: .2;  transform: scale(1); }
          50%       { opacity: .45; transform: scale(1.08); }
        }
        @keyframes ae-ring {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ae-ring-rev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes ae-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ae-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: .15; }
        }
        .ae-orb-a  { animation: ae-orb     7s  ease-in-out infinite; }
        .ae-orb-b  { animation: ae-orb-alt 9s  ease-in-out infinite; }
        .ae-orb-c  { animation: ae-orb     11s ease-in-out infinite reverse; }
        .ae-ring-a { animation: ae-ring     14s linear     infinite; }
        .ae-ring-b { animation: ae-ring-rev 20s linear     infinite; }
        .ae-u1 { animation: ae-up .7s ease-out .05s both; }
        .ae-u2 { animation: ae-up .7s ease-out .18s both; }
        .ae-u3 { animation: ae-up .7s ease-out .30s both; }
        .ae-u4 { animation: ae-up .7s ease-out .44s both; }
        .ae-u5 { animation: ae-up .7s ease-out .58s both; }
        .ae-d1 { animation: ae-blink 1.5s ease-in-out 0.0s infinite; }
        .ae-d2 { animation: ae-blink 1.5s ease-in-out 0.3s infinite; }
        .ae-d3 { animation: ae-blink 1.5s ease-in-out 0.6s infinite; }
      `}</style>

      <div className="relative min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center overflow-hidden px-5">

        {/* ── Ambient orbs ── */}
        <div className="ae-orb-a pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-purple-700/20 blur-[100px]" />
        <div className="ae-orb-b pointer-events-none absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full bg-violet-600/15 blur-[90px]" />
        <div className="ae-orb-c pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-purple-900/10 blur-[120px]" />

        {/* ── Dot grid ── */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* ── Main content ── */}
        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-lg">

          {/* Spinner icon cluster */}
          <div className="ae-u1 relative flex items-center justify-center w-24 h-24 mb-9">
            {/* Outer ring */}
            <div
              className="ae-ring-a absolute inset-0 rounded-full"
              style={{ border: "1px solid rgba(168,85,247,.25)", borderTopColor: "rgba(168,85,247,.8)" }}
            />
            {/* Middle ring */}
            <div
              className="ae-ring-b absolute inset-3 rounded-full"
              style={{ border: "1px solid rgba(139,92,246,.15)", borderBottomColor: "rgba(139,92,246,.5)" }}
            />
            {/* Icon container */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-purple-800 flex items-center justify-center shadow-xl shadow-purple-900/60 ring-1 ring-white/10">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L13.8 8.8L21 10.5L13.8 12.2L12 19L10.2 12.2L3 10.5L10.2 8.8L12 2Z" fill="white" opacity=".95" />
                <path d="M19 15L19.9 17.6L22.5 18.5L19.9 19.4L19 22L18.1 19.4L15.5 18.5L18.1 17.6L19 15Z" fill="white" opacity=".55" />
                <path d="M5 2L5.6 4L7.5 4.5L5.6 5L5 7L4.4 5L2.5 4.5L4.4 4L5 2Z" fill="white" opacity=".45" />
              </svg>
            </div>
          </div>

          {/* Status badge */}
          <div className="ae-u1 mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/25 bg-purple-500/10 backdrop-blur-sm">
            <span className="ae-d1 inline-block w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span className="text-[11px] font-semibold text-purple-300 tracking-widest uppercase">
              System Upgrade · In Progress
            </span>
          </div>

          {/* Headline */}
          <h1 className="ae-u2 text-[2.6rem] sm:text-5xl font-semibold tracking-tight leading-[1.12] mb-5">
            Upgrading Our{" "}
            <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-purple-400 bg-clip-text text-transparent">
              AI Engines
            </span>
          </h1>

          {/* Description */}
          <p className="ae-u3 text-neutral-400 text-base sm:text-lg leading-relaxed mb-10 max-w-md">
            We&apos;re wiring Aevaia with next-generation media generation — real-time audio,
            cinematic video, vector illustration, and voice synthesis. Back very soon, better than ever.
          </p>

          {/* Engine grid */}
          <div className="ae-u4 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-11">
            {ENGINES.map((e) => (
              <div
                key={e.label}
                className={`rounded-xl border ${e.border} ${e.bg} px-3 py-4 flex flex-col items-center gap-2 backdrop-blur-sm`}
              >
                <span className={e.color}>{e.icon}</span>
                <span className="text-[12px] font-semibold text-white/90">{e.label}</span>
                <span className="text-[9.5px] text-neutral-500 font-mono leading-tight text-center">{e.detail}</span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="ae-u4 w-full max-w-xs mb-5">
            <div className="h-px w-full bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-violet-500 rounded-full"
                style={{ width: "72%", boxShadow: "0 0 12px rgba(168,85,247,.6)" }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-neutral-600 font-mono">Integration</span>
              <span className="text-[10px] text-purple-500 font-mono">72%</span>
            </div>
          </div>

          {/* Pulsing status */}
          <div className="ae-u5 flex items-center gap-2 text-sm text-neutral-500">
            <span>Back very soon</span>
            <span className="ae-d1 inline-block w-1 h-1 rounded-full bg-neutral-600" />
            <span className="ae-d2 inline-block w-1 h-1 rounded-full bg-neutral-600" />
            <span className="ae-d3 inline-block w-1 h-1 rounded-full bg-neutral-600" />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="ae-u5 absolute bottom-7 left-0 right-0 flex justify-center">
          <p className="text-[11px] text-neutral-700 tracking-wide">
            © {new Date().getFullYear()} Aevaia · All rights reserved
          </p>
        </div>

      </div>
    </>
  );
}
