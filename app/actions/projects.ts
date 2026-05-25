"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { idSchema, canvasStateSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

const DEFAULT_SCENES_JSON = JSON.stringify({
  blocks: JSON.stringify([
    {
      id:     "scene-1",
      name:   "Landing",
      blocks: [
        { id: "block-1", type: "image",     content: "" },
        { id: "block-2", type: "headline",  content: "Happy Anniversary!" },
        { id: "block-3", type: "paragraph", content: "Thank you for the best year of my life. I love you more than words can say." },
      ],
    },
  ]),
  globalTheme: JSON.stringify({
    theme:             "minimalist",
    bgMusicUrl:        "",
    bgMusicVolume:     80,
    bgMusicSpeed:      1,
    ambientEffect:     "none",
    imageUrl:          "",
    imageBorderRadius: 8,
    imageShadow:       "none",
    headlineHtml:      "Happy Anniversary!",
    paragraphHtml:     "Thank you for the best year of my life. I love you more than words can say.",
    webglSpeed:        1,
    webglDensity:      0.5,
    webglColor:        "#c4b5fd",
  }),
});

// Returns the newly created project ID.
// Throws "Unauthorized" if no active Clerk session is found.
export async function createProject(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // ── Rate limit: 10 project creations per user per hour ───────────────────
  // Prevents mass project creation that would bloat the database.
  const rl = await rateLimit(`create-project:${userId}`, {
    limit:    10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.success) throw new Error("Too many projects created. Please wait before creating another.");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const project = await (prisma as any).project.create({
    data:   { userId, title: "Untitled HeartCraft", scenesJson: DEFAULT_SCENES_JSON },
    select: { id: true },
  }) as { id: string };

  return project.id;
}

// Debounced auto-save target — validates ownership then writes canvas state.
// Calls revalidatePath so the dashboard reflects the latest title/state.
export async function updateProjectData(projectId: string, canvasData: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // ── Zod: validate both inputs before touching the DB ─────────────────────
  const idResult = idSchema.safeParse(projectId);
  if (!idResult.success) throw new Error("Invalid project ID");

  const dataResult = canvasStateSchema.safeParse(canvasData);
  if (!dataResult.success) throw new Error(dataResult.error.issues[0]?.message ?? "Invalid canvas data");

  // ── Rate limit: 120 saves per user per minute ────────────────────────────
  // Studio auto-saves every 2 s; 120/min = 2/s headroom with some burst.
  const rl = await rateLimit(`update-project:${userId}`, {
    limit:    120,
    windowMs: 60 * 1000,
  });
  if (!rl.success) throw new Error("Saving too frequently. Please slow down.");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = await (prisma as any).project.findUnique({
    where:  { id: idResult.data },
    select: { userId: true },
  }) as { userId: string } | null;

  if (!existing)                  throw new Error("Not found");
  if (existing.userId !== userId) throw new Error("Forbidden");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).project.update({
    where: { id: idResult.data },
    data:  { scenesJson: dataResult.data },
  });

  revalidatePath("/dashboard");
}
