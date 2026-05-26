// ── HeartCraft Starter Pack Blueprints ────────────────────────────────────────
// Each template ships a fully-valid scenesJson that mirrors the studio reducer
// state format: { blocks: JSON.string, globalTheme: JSON.string }.

interface SceneBlock {
  id:      string;
  type:    "image" | "headline" | "paragraph";
  content: string;
}

interface Scene {
  id:     string;
  name:   string;
  blocks: SceneBlock[];
}

interface GlobalTheme {
  theme:             string;
  bgMusicUrl:        string;
  bgMusicVolume:     number;
  bgMusicSpeed:      number;
  ambientEffect:     string;
  imageUrl:          string;
  imageBorderRadius: number;
  imageShadow:       string;
  headlineHtml:      string;
  paragraphHtml:     string;
  webglSpeed:        number;
  webglDensity:      number;
  webglColor:        string;
}

function buildScenesJson(scenes: Scene[], globalTheme: GlobalTheme): string {
  return JSON.stringify({
    blocks:      JSON.stringify(scenes),
    globalTheme: JSON.stringify(globalTheme),
  });
}

export interface ProjectTemplate {
  id:          string;
  title:       string;
  tagline:     string;
  description: string;
  features:    string[];
  accent:      string; // Tailwind text colour
  bg:          string; // Tailwind bg + border
  glow:        string; // Tailwind box-shadow
  ring:        string; // Tailwind ring colour (selected state)
  scenesJson:  string;
}

// ── Template 1: Luxury Anniversary Canvas ────────────────────────────────────

const ANNIVERSARY_SCENES: Scene[] = [
  {
    id:   "scene-1",
    name: "Our Story",
    blocks: [
      { id: "block-1", type: "image",     content: "" },
      { id: "block-2", type: "headline",  content: "A Love That Endures" },
      {
        id: "block-3", type: "paragraph",
        content: "Every moment with you is a page in the most beautiful story I have ever known. Years may pass, but the way you make me feel is timeless and eternal.",
      },
    ],
  },
  {
    id:   "scene-2",
    name: "Forever Yours",
    blocks: [
      { id: "block-4", type: "headline",  content: "Here's to Every Tomorrow" },
      {
        id: "block-5", type: "paragraph",
        content: "Thank you for choosing me, again and again. For the laughter, the quiet mornings, the adventures still ahead — I am endlessly and completely grateful.",
      },
    ],
  },
];

const ANNIVERSARY_THEME: GlobalTheme = {
  theme:             "minimalist",
  bgMusicUrl:        "",
  bgMusicVolume:     80,
  bgMusicSpeed:      1,
  ambientEffect:     "waves",
  imageUrl:          "",
  imageBorderRadius: 16,
  imageShadow:       "glow",
  headlineHtml:      "A Love That Endures",
  paragraphHtml:     "Every moment with you is a page in the most beautiful story I have ever known. Years may pass, but the way you make me feel is timeless and eternal.",
  webglSpeed:        0.6,
  webglDensity:      0.4,
  webglColor:        "#f59e0b",
};

// ── Template 2: Grand Wedding Gallery ────────────────────────────────────────

const WEDDING_SCENES: Scene[] = [
  {
    id:   "scene-1",
    name: "Welcome",
    blocks: [
      { id: "block-1", type: "image",     content: "" },
      { id: "block-2", type: "headline",  content: "Together, At Last" },
      {
        id: "block-3", type: "paragraph",
        content: "Today is the beginning of the greatest adventure of our lives. We are so glad you are here to share it with us.",
      },
    ],
  },
  {
    id:   "scene-2",
    name: "Our Vows",
    blocks: [
      { id: "block-4", type: "headline",  content: "With All My Heart" },
      {
        id: "block-5", type: "paragraph",
        content: "I promise to love you fiercely, to stand by you in every season, and to build a life that makes our younger selves proud. Now and always.",
      },
    ],
  },
  {
    id:   "scene-3",
    name: "Celebrate With Us",
    blocks: [
      { id: "block-6", type: "headline",  content: "To Our Guests" },
      {
        id: "block-7", type: "paragraph",
        content: "Thank you for being here — in person or in spirit. Your love and presence made this day feel like the most magical moment of our lives.",
      },
    ],
  },
];

const WEDDING_THEME: GlobalTheme = {
  theme:             "luxury",
  bgMusicUrl:        "",
  bgMusicVolume:     75,
  bgMusicSpeed:      0.9,
  ambientEffect:     "starfield",
  imageUrl:          "",
  imageBorderRadius: 20,
  imageShadow:       "glow",
  headlineHtml:      "Together, At Last",
  paragraphHtml:     "Today is the beginning of the greatest adventure of our lives. We are so glad you are here to share it with us.",
  webglSpeed:        0.5,
  webglDensity:      0.6,
  webglColor:        "#f43f5e",
};

// ── Template 3: Milestone Birthday Lounge ────────────────────────────────────

const BIRTHDAY_SCENES: Scene[] = [
  {
    id:   "scene-1",
    name: "The Main Stage",
    blocks: [
      { id: "block-1", type: "image",     content: "" },
      { id: "block-2", type: "headline",  content: "You Made It" },
      {
        id: "block-3", type: "paragraph",
        content: "Another year of doing the most, defying expectations, and showing up exactly as yourself. That deserves to be celebrated properly.",
      },
    ],
  },
  {
    id:   "scene-2",
    name: "Real Talk",
    blocks: [
      { id: "block-4", type: "headline",  content: "For Real Though" },
      {
        id: "block-5", type: "paragraph",
        content: "You are genuinely one of the best people I know. This year, like every year, you proved it again. Happy birthday — go be legendary.",
      },
    ],
  },
];

const BIRTHDAY_THEME: GlobalTheme = {
  theme:             "dark",
  bgMusicUrl:        "",
  bgMusicVolume:     85,
  bgMusicSpeed:      1.2,
  ambientEffect:     "starfield",
  imageUrl:          "",
  imageBorderRadius: 12,
  imageShadow:       "glow",
  headlineHtml:      "You Made It",
  paragraphHtml:     "Another year of doing the most, defying expectations, and showing up exactly as yourself.",
  webglSpeed:        1.0,
  webglDensity:      0.7,
  webglColor:        "#a855f7",
};

// ── Exported array ────────────────────────────────────────────────────────────

export const TEMPLATES: ProjectTemplate[] = [
  {
    id:          "anniversary",
    title:       "Luxury Anniversary Canvas",
    tagline:     "For the love of your life",
    description: "A minimalist two-scene layout bathed in warm amber light, pre-loaded with intimate poetry copy and a flowing waves ambient effect.",
    features:    ["2 pre-built scenes", "Warm amber WebGL waves", "Minimalist theme", "Romantic copy pre-loaded"],
    accent:      "text-amber-300",
    bg:          "bg-amber-500/8 border-amber-500/20",
    glow:        "shadow-[0_0_32px_rgba(245,158,11,0.15)]",
    ring:        "ring-amber-400",
    scenesJson:  buildScenesJson(ANNIVERSARY_SCENES, ANNIVERSARY_THEME),
  },
  {
    id:          "wedding",
    title:       "Grand Wedding Gallery",
    tagline:     "For the celebration of a lifetime",
    description: "An elegant three-scene event gallery with a starfield ambient backdrop, rose-gold tones, and space for your full guest list.",
    features:    ["3 ceremony scenes", "Rose-gold starfield effect", "Luxury theme", "Event-ready guest list"],
    accent:      "text-rose-300",
    bg:          "bg-rose-500/8 border-rose-500/20",
    glow:        "shadow-[0_0_32px_rgba(244,63,94,0.15)]",
    ring:        "ring-rose-400",
    scenesJson:  buildScenesJson(WEDDING_SCENES, WEDDING_THEME),
  },
  {
    id:          "birthday",
    title:       "Milestone Birthday Lounge",
    tagline:     "For the friend who deserves everything",
    description: "A high-energy dark-themed two-scene lounge with deep-purple neon starfield and bold, unapologetic copy for milestone moments.",
    features:    ["2 celebration scenes", "Neon purple starfield", "Dark energy theme", "Bold milestone copy"],
    accent:      "text-purple-300",
    bg:          "bg-purple-500/8 border-purple-500/20",
    glow:        "shadow-[0_0_32px_rgba(168,85,247,0.15)]",
    ring:        "ring-purple-400",
    scenesJson:  buildScenesJson(BIRTHDAY_SCENES, BIRTHDAY_THEME),
  },
];
