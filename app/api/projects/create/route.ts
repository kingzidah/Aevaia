import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/system-user";

// ── Default canvas state ──────────────────────────────────────────────────────
// Mirrors DEFAULT_SCENES and initial state values from app/studio/page.tsx.
const DEFAULT_BLOCKS = JSON.stringify([
  {
    id:     "scene-1",
    name:   "Landing",
    blocks: [
      { id: "block-1", type: "image",     content: ""                                                                            },
      { id: "block-2", type: "headline",  content: "Happy Anniversary!"                                                          },
      { id: "block-3", type: "paragraph", content: "Thank you for the best year of my life. I love you more than words can say." },
    ],
  },
]);

const DEFAULT_GLOBAL_THEME = JSON.stringify({
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
});

// POST /api/projects/create
// Creates a new Project row linked to the authenticated user with the
// studio default canvas state. Returns { id } for the /studio?id= redirect.
export async function POST() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const scenesJson = JSON.stringify({
    blocks:      DEFAULT_BLOCKS,
    globalTheme: DEFAULT_GLOBAL_THEME,
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = await (prisma as any).project.create({
      data:   { userId, scenesJson, title: "Untitled Masterpiece" },
      select: { id: true },
    }) as { id: string };

    return NextResponse.json({ id: project.id });
  } catch (err) {
    console.error("[projects/create]", err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
