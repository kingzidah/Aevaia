import { prisma } from "@/lib/prisma";
import BouncerGate from "@/components/viewer/BouncerGate";
import type { GiftPayload } from "@/components/gift/GiftViewer";
import type { Metadata } from "next";

// ─── Fallback screens ─────────────────────────────────────────────────────────

function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-neutral-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0 0 12.016 15a4.486 4.486 0 0 0-3.198 1.318M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
        </svg>
      </div>
      <div>
        <h2 className="text-white font-semibold text-lg mb-1">Experience not found</h2>
        <p className="text-neutral-500 text-sm max-w-xs leading-relaxed">
          This link may be invalid or the experience has been removed.
        </p>
      </div>
    </div>
  );
}

function DraftScreen() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_24px_rgba(245,158,11,0.1)]">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-amber-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </div>
      <div>
        <h2 className="text-white font-semibold text-lg mb-1">Coming soon</h2>
        <p className="text-neutral-500 text-sm max-w-xs leading-relaxed">
          This experience hasn&apos;t been published yet. Check back later.
        </p>
      </div>
    </div>
  );
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>;
}): Promise<Metadata> {
  const { projectId } = await params;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = await (prisma as any).project.findUnique({
      where:  { id: projectId },
      select: { title: true },
    }) as { title: string } | null;
    return { title: p ? `${p.title} — Aevaia` : "Aevaia Experience" };
  } catch {
    return { title: "Aevaia Experience" };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicViewerPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  let project: {
    id:          string;
    title:       string;
    scenesJson:  string;
    isPublished: string;
    isPaid:      boolean;
    tier:        string;
    guestList:   string[];
    deviceCap:   number;
    deviceCount: number;
  } | null = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    project = await (prisma as any).project.findUnique({
      where:  { id: projectId },
      select: {
        id:          true,
        title:       true,
        scenesJson:  true,
        isPublished: true,
        isPaid:      true,
        tier:        true,
        guestList:   true,
        deviceCap:   true,
        deviceCount: true,
      },
    });
  } catch (err) {
    console.error("[p/page] DB error:", err);
  }

  if (!project)                               return <NotFound />;
  if (project.isPublished !== "PUBLISHED")    return <DraftScreen />;

  // Parse stored JSON
  let payload: GiftPayload;
  try {
    const { blocks, globalTheme } = JSON.parse(project.scenesJson) as {
      blocks: string; globalTheme: string;
    };
    payload = {
      id:     project.id,
      global: JSON.parse(globalTheme),
      scenes: JSON.parse(blocks),
    };
  } catch {
    return <NotFound />;
  }

  // All published projects show the BouncerGate — a client-side name-entry
  // overlay that fades away and reveals the canvas. No API call needed; the
  // gate is purely presentational (any text is accepted).
  return <BouncerGate payload={payload} />;
}
