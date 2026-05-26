import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";

// ─── Static data ───────────────────────────────────────────────────────────

const FEATURES = [
  {
    accent: "text-purple-400",
    bg:     "bg-purple-500/8 border-purple-500/20",
    glow:   "group-hover:shadow-[0_0_40px_rgba(168,85,247,0.12)]",
    label:  "Figma-Grade Editor",
    desc:   "Drag, drop, and arrange scenes on a professional infinite canvas. Text, images, countdowns, and galleries — every block snaps into place at pixel precision.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
  },
  {
    accent: "text-rose-400",
    bg:     "bg-rose-500/8 border-rose-500/20",
    glow:   "group-hover:shadow-[0_0_40px_rgba(244,63,94,0.12)]",
    label:  "Hollywood-Level Effects",
    desc:   "WebGL particle fields, aurora shaders, floating orbs, and ember cascades — all rendering at 60 fps. Pair with ambient soundscapes for full sensory immersion.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    accent: "text-emerald-400",
    bg:     "bg-emerald-500/8 border-emerald-500/20",
    glow:   "group-hover:shadow-[0_0_40px_rgba(52,211,153,0.12)]",
    label:  "One-Click Publishing",
    desc:   "Hit publish and your gift gets a permanent shareable link in seconds. Pay once, share forever — no subscriptions, no expiry, no technical setup.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
  },
] as const;

// ─── Page ──────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-neutral-950 text-zinc-900 dark:text-white overflow-x-hidden">

      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-12 h-16
                      bg-white/90 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center
                          shadow-[0_0_14px_rgba(168,85,247,0.5)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white">HeartCraft</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle variant="icon" />
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold
                       transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_28px_rgba(168,85,247,0.5)]"
          >
            Start Creating
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center text-center min-h-screen px-6 pt-16">
        {/* Ambient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full
                          bg-purple-600/8 blur-[140px]" />
          <div className="absolute top-1/3 -left-48 w-[400px] h-[400px] rounded-full bg-rose-600/6 blur-[110px]" />
          <div className="absolute top-1/2 -right-32 w-[350px] h-[350px] rounded-full bg-indigo-600/5 blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border
                          border-white/10 text-xs text-neutral-400 font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            WebGL · Gemini AI · Stripe Payments
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            Digital Gifts That{" "}
            <span className="bg-clip-text text-transparent bg-linear-to-r from-purple-400 via-pink-400 to-rose-400">
              Actually Feel
            </span>
            <br />Special.
          </h1>

          <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Design immersive, interactive, WebGL-powered digital experiences for the people
            you care about. No coding required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/studio"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl
                         bg-purple-600 hover:bg-purple-500 text-white font-bold text-base transition-all
                         shadow-[0_0_32px_rgba(168,85,247,0.4)] hover:shadow-[0_0_48px_rgba(168,85,247,0.6)]"
            >
              Start Creating
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
              </svg>
            </Link>
            <Link
              href="/gift/demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl
                         border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white
                         font-semibold text-base transition-all"
            >
              View Demo
            </Link>
          </div>

          <p className="mt-12 text-xs text-neutral-700 tracking-wider uppercase">
            One-time payment · No subscription · Works on any device
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 md:px-12 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400 mb-3">Why HeartCraft</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
            Everything you need to craft<br className="hidden md:block" /> the perfect gift experience.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div
              key={f.label}
              className={`group flex flex-col gap-4 p-6 rounded-3xl border ${f.bg} transition-all duration-300 ${f.glow}`}
            >
              <div className={`w-12 h-12 rounded-2xl border ${f.bg} flex items-center justify-center ${f.accent}`}>
                {f.icon}
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-snug">{f.label}</h3>
              <p className="text-sm text-zinc-500 dark:text-neutral-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 md:px-12 py-16 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-400 mb-3">The Process</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Ready in three steps.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Design",       desc: "Drag, drop, and arrange scenes on your canvas. Add images, countdowns, galleries, and text blocks." },
            { step: "02", title: "Personalise",  desc: "Let the AI rewrite your copy in the perfect tone. Set ambient 3D effects and a custom soundtrack." },
            { step: "03", title: "Share Securely", desc: "Choose your tier, set your guest list, pay once, and share your permanent encrypted link." },
          ].map(s => (
            <div key={s.step} className="flex flex-col gap-3">
              <span className="text-6xl font-black text-zinc-200 dark:text-white/5 leading-none select-none">{s.step}</span>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{s.title}</h3>
              <p className="text-sm text-zinc-500 dark:text-neutral-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-6 md:px-12 py-24 max-w-4xl mx-auto">
        <div className="relative flex flex-col items-center gap-8 p-10 md:p-14 rounded-3xl
                        bg-neutral-900/60 border border-white/8
                        shadow-[0_0_80px_rgba(168,85,247,0.08)] text-center overflow-hidden">
          {/* Glow orb */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px]
                          rounded-full bg-purple-600/10 blur-[80px]" aria-hidden />

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">Simple Pricing</p>

          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Free to Design.{" "}
            <span className="bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-pink-400">
              €4.99 to Publish Live.
            </span>
          </h2>

          <p className="text-neutral-400 text-base max-w-lg leading-relaxed">
            Build your entire gift experience at no cost. When you&rsquo;re ready to share,
            one small payment unlocks your permanent link — no subscriptions, no expiry.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-500">
            {["No subscription", "Permanent shareable link", "Works on any device", "Secured by Stripe"].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500 shrink-0">
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                </svg>
                {t}
              </span>
            ))}
          </div>

          <Link
            href="/studio"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500
                       text-white font-bold text-sm transition-all
                       shadow-[0_0_28px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)]"
          >
            Start for Free →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 dark:border-white/5 px-6 md:px-12 py-10
                         flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">HeartCraft</span>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <div className="flex items-center gap-4 text-xs text-zinc-400 dark:text-neutral-600">
            <Link href="/privacy" className="hover:text-zinc-600 dark:hover:text-neutral-400 transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms"   className="hover:text-zinc-600 dark:hover:text-neutral-400 transition-colors">Terms of Service</Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-zinc-600 dark:hover:text-neutral-400 transition-colors">Support</Link>
          </div>
          <p className="text-xs text-zinc-400 dark:text-neutral-700">
            © {new Date().getFullYear()} HeartCraft · Secured by Stripe
          </p>
        </div>
      </footer>

    </main>
  );
}
