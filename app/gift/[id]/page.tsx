import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase-admin";
import GiftViewer from "@/components/gift/GiftViewer";
import GiftGate   from "@/components/gift/GiftGate";
import type { GiftPayload } from "@/components/gift/GiftViewer";
import type { GlobalState }  from "@/types/studio";

// ── Demo preview payload ──────────────────────────────────────────────────────
// Visiting /gift/demo shows a fully-populated showcase with no DB call needed.

const DEMO_PAYLOAD: GiftPayload = {
  id: "demo",
  global: {
    theme:             "dark-romance",
    bgMusicUrl:        "",
    bgMusicVolume:     80,
    bgMusicSpeed:      1,
    ambientEffect:     "floating-orbs",
    imageUrl:          "",
    imageBorderRadius: 16,
    imageShadow:       "soft",
    headlineHtml:      "",
    paragraphHtml:     "",
    environment: {
      theme:        "dark",
      particles:    "NONE",
      ambientAudio: "NONE",
    },
  } satisfies GlobalState,
  scenes: [
    {
      id:   "demo-scene-1",
      name: "Invitation",
      blocks: [
        {
          id:      "demo-h1",
          type:    "headline",
          content: "An Evening to Remember ✦",
          properties: { fontSize: 38, color: "#fda4af" },
        },
        {
          id:      "demo-p1",
          type:    "paragraph",
          content: "You have been personally invited to join us for a magical night of celebration, gratitude, and connection. This is an experience crafted just for you.",
          properties: { fontSize: 15, color: "#fecdd3" },
        },
        {
          id:      "demo-icon-sparkles",
          type:    "icon",
          content: "Sparkles",
          properties: { iconSize: 64, iconColor: "#e879f9", iconStrokeWidth: 1.5 },
        },
        {
          id:         "demo-countdown",
          type:       "countdown",
          content:    "Until the Celebration",
          targetDate: "2026-12-31T20:00:00",
        },
        {
          id:      "demo-p2",
          type:    "paragraph",
          content: "<strong>Saturday, 31 December 2026 · 8 PM</strong><br/>The Grand Ballroom, Heartcraft House",
          properties: { fontSize: 14, color: "#fda4af" },
        },
        {
          id:      "demo-btn",
          type:    "button",
          content: "Reserve Your Spot →",
          properties: { accentColor: "#be185d", blockBorderRadius: 999 },
        },
        {
          id:      "demo-footer",
          type:    "paragraph",
          content: "Built with <strong>Aevaia</strong> — magic design experiences.",
          properties: { fontSize: 11, color: "#4b5563" },
        },
      ],
    },
  ],
};

// ── Shared error screens ──────────────────────────────────────────────────────

function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-neutral-600" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
      <p className="text-neutral-400 text-sm max-w-xs">
        This gift could not be found. The link may have expired or the ID is incorrect.
      </p>
    </div>
  );
}

function PendingPayment() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-yellow-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h2 className="text-white font-semibold text-lg">Gift Not Unlocked</h2>
      <p className="text-neutral-400 text-sm max-w-xs leading-relaxed">
        This gift is pending payment or has not been unlocked yet.
      </p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function GiftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ── Demo shortcut — no DB required ───────────────────────────────────────
  if (id === "demo") return <GiftViewer payload={DEMO_PAYLOAD} />;

  // ── Path 1: Prisma-backed gift (existing paid system) ──────────────────────
  let project: {
    id:         string;
    scenesJson: string;
    isPaid:     boolean;
    tier:       string;
  } | null = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    project = await (prisma as any).project.findUnique({
      where:  { id },
      select: { id: true, scenesJson: true, isPaid: true, tier: true },
    });
  } catch (err) {
    console.error("[gift/page] Prisma error:", err);
  }

  if (project) {
    if (!project.isPaid) return <PendingPayment />;

    // scenesJson stores { blocks, globalTheme } as JSON-encoded strings.
    let payload: GiftPayload;
    try {
      const { blocks, globalTheme } = JSON.parse(project.scenesJson) as {
        blocks:      string;
        globalTheme: string;
      };
      payload = {
        id:     project.id,
        global: JSON.parse(globalTheme),
        scenes: JSON.parse(blocks),
      };
    } catch {
      return <NotFound />;
    }

    const cookieStore  = await cookies();
    const isAuthorized = cookieStore.has(`hc_gift_${id}`);
    if (isAuthorized) return <GiftViewer payload={payload} />;
    return <GiftGate payload={payload} tier={project.tier} />;
  }

  // ── Path 2: Supabase-backed design (new /api/publish system) ───────────────
  // `environment` holds the merged canvasSettings + environment snapshot saved
  // by /api/publish. `blocks` is the Scene[] array.
  const { data: design, error: supabaseError } = await supabaseAdmin
    .from("designs")
    .select("id, blocks, environment, is_published")
    .eq("id", id)
    .single();

  if (supabaseError || !design || !design.is_published) return <NotFound />;

  const env = (design.environment ?? {}) as Record<string, unknown>;

  const global: GlobalState = {
    theme:             (env.theme         as string) ?? "minimalist",
    bgMusicUrl:        (env.bgMusicUrl    as string) ?? "",
    bgMusicVolume:     (env.bgMusicVolume as number) ?? 80,
    bgMusicSpeed:      (env.bgMusicSpeed  as number) ?? 1,
    ambientEffect: ((env.ambientEffect as string) || "none") as GlobalState["ambientEffect"],
    imageUrl:          "",
    imageBorderRadius: 12,
    imageShadow:       "none",
    headlineHtml:      "",
    paragraphHtml:     "",
    selectedFont:      env.selectedFont      as string  | undefined,
    layerOpacity:      env.layerOpacity      as number  | undefined,
    layerScale:        env.layerScale        as number  | undefined,
    layerRotation:     env.layerRotation     as number  | undefined,
    canvasBackground:  env.canvasBackground  as string  | undefined,
    webglColor:        env.webglColor        as string  | undefined,
    webglSpeed:        env.webglSpeed        as number  | undefined,
    webglDensity:      env.webglDensity      as number  | undefined,
    particleDensity:   env.particleDensity   as number  | undefined,
    particleSpeed:     env.particleSpeed     as number  | undefined,
    bloomIntensity:    env.bloomIntensity    as number  | undefined,
    vignetteIntensity: env.vignetteIntensity as number  | undefined,
    audioVolume:       env.audioVolume       as number  | undefined,
    audioFadeIn:       env.audioFadeIn       as boolean | undefined,
    // ambientAudio (soundscape key) is stored under env.ambientAudio
    activeSoundscape:  env.ambientAudio      as string  | undefined,
    environment: {
      theme:        (env.theme        as string) ?? "dark",
      particles:    (env.particles    as string) ?? "NONE",
      ambientAudio: (env.ambientAudio as string) ?? "NONE",
    },
  };

  const payload: GiftPayload = {
    id:     design.id,
    global,
    scenes: Array.isArray(design.blocks) ? design.blocks : [],
  };

  // Supabase designs are published directly — no payment gate required.
  return <GiftViewer payload={payload} />;
}
