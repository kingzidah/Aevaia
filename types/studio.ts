// ─────────────────────────────────────────────────────────────────────────────
// HeartCraft Studio — Centralized Type Definitions
//
// Single source of truth for all shared types across studio, viewer, and API
// layers. Import from here; never duplicate these shapes locally.
// ─────────────────────────────────────────────────────────────────────────────

// ── Block type registry ───────────────────────────────────────────────────────
// Const object so values are string literals (enables `block.type === BlockType.HEADLINE`)
// while the type alias remains the plain union (no `.HEADLINE` required in JSX).

export const BlockType = {
  IMAGE:         "image",
  HEADLINE:      "headline",
  PARAGRAPH:     "paragraph",
  BUTTON:        "button",
  VIDEO:         "video",
  COUNTDOWN:     "countdown",
  GALLERY_STACK: "gallery-stack",
  AUDIO:         "audio",
  RSVP_FORM:     "rsvp-form",
  MAP:           "map",
  LOTTIE:        "lottie",
  VECTOR:        "vector",
  CAROUSEL:      "carousel",
  ICON:          "icon",
  SCRIBBLE:      "scribble",
  ARC_TEXT:      "arc-text",
} as const;

export type BlockType = (typeof BlockType)[keyof typeof BlockType];

// ── Image filter adjustments ──────────────────────────────────────────────────

export interface ImageFilters {
  brightness: number; // 0–200 (%)
  contrast:   number; // 0–200 (%)
  saturate:   number; // 0–200 (%)
  blur:       number; // 0–20  (px)
  grayscale:  number; // 0–100 (%)
}

export const DEFAULT_IMAGE_FILTERS: ImageFilters = {
  brightness: 100,
  contrast:   100,
  saturate:   100,
  blur:       0,
  grayscale:  0,
};

export function buildFilterString(f: ImageFilters): string {
  return `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) blur(${f.blur}px) grayscale(${f.grayscale}%)`;
}

// ── Block properties (AI-mutable display layer) ───────────────────────────────

export interface BlockProperties {
  text?:        string;  // overrides content for placed blocks
  title?:       string;  // countdown heading, rsvp event name
  accentColor?: string;  // visual accent override
  color?:       string;  // alias for accentColor used in some contexts
  buttonLabel?: string;  // rsvp submit button label
  spotifyUrl?:  string;  // Spotify track/album/playlist URL
  address?:     string;  // venue address for map blocks
  embedUrl?:    string;  // explicit Google Maps embed URL (overrides address)
  lottieUrl?:   string;  // public URL to a Lottie JSON animation file
  svgCode?:     string;  // raw SVG markup for vector art blocks
  vectorType?:  string;  // named preset: heart | underline | star | infinity
  images?:      string[]; // image URL array for carousel/gallery blocks
  // ── Advanced typography (px, %, align) ───────────────────────────────────
  letterSpacing?: number;              // pixels, -5 to 20
  lineHeight?:    number;              // percentage, 80–200
  textAlign?:     'left' | 'center' | 'right';
  // ── Appearance (glassmorphism / per-block visuals) ────────────────────────
  blockOpacity?:      number;          // 0–100 (%)
  blockBorderRadius?: number;          // px, 0–50
  backdropBlur?:      number;          // px, 0–20
  // ── Effects ──────────────────────────────────────────────────────────────
  dropShadow?: 'none' | 'neon-glow' | 'drop-shadow';
  // ── Blending & Border ────────────────────────────────────────────────────
  blendMode?:   string;                              // CSS mix-blend-mode
  borderWidth?: number;                              // px, 0–20
  borderColor?: string;                              // hex
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  // ── Text animations ──────────────────────────────────────────────────────
  animationType?: 'none' | 'shiny' | 'blur-words';
  // ── Scribble (freehand) block ─────────────────────────────────────────────
  scribblePaths?: string[];   // serialised SVG path `d` strings
  scribbleColor?: string;     // hex
  scribbleWidth?: number;     // 1–20 px
  // ── Arc text block ────────────────────────────────────────────────────────
  arcText?:       string;     // the text to render
  arcRadius?:     number;     // 80–200 px
  arcColor?:      string;     // hex
  arcFontSize?:   number;     // 12–48 px
  arcStartAngle?: number;     // 0–360°
  // Allow arbitrary AI-injected properties without losing type safety on known keys
  [key: string]: unknown;
}

// ── Core block shape ──────────────────────────────────────────────────────────

export interface Block {
  id:       string;
  type:     BlockType;
  content?: string;
  targetDate?: string;
  images?:     string[];
  filters?:    ImageFilters;
  audioUrl?:    string;
  audioVolume?: number;   // 0–100
  audioSpeed?:  number;   // 0.5 | 1 | 1.5 | 2
  // Free-placement coordinates — undefined for flow (sorted) blocks
  x?: number;
  y?: number;
  // AI-mutable display properties — patched by the AI sidebar
  properties?: BlockProperties;
}

// Alias used in new code; identical to Block
export type CanvasBlock = Block;

// ── Scene ─────────────────────────────────────────────────────────────────────

export interface Scene {
  id:     string;
  name:   string;
  blocks: Block[];
}

// ── Atmosphere / environment ──────────────────────────────────────────────────

export interface Environment {
  theme:        string;
  particles:    string;  // 'NONE' | 'SNOW' | 'EMBERS' | 'BLOSSOMS'
  ambientAudio: string;  // 'NONE' | soundscape key
}

// ── Global presentation state (attached to a published gift) ──────────────────

export interface GlobalState {
  theme:             string;
  bgMusicUrl:        string;
  bgMusicVolume:     number;
  bgMusicSpeed:      number;
  ambientEffect:     "none" | "fireflies" | "floating-orbs" | "particles" | "ember" | "starfield" | "waves";
  imageUrl:          string;
  imageBorderRadius: number;
  imageShadow:       string;
  headlineHtml:      string;
  paragraphHtml:     string;
  webglSpeed?:       number;
  webglDensity?:     number;
  webglColor?:       string;
  selectedFont?:     string;
  layerOpacity?:     number;
  layerScale?:       number;
  layerRotation?:    number;
  activeSoundscape?:  string;
  environment?:       Environment;
  // Key into EffectsRegistry — the interactive background chosen in the studio.
  canvasBackground?:  string;
  // ── World / post-processing ───────────────────────────────────────────────
  particleDensity?:   number;   // 10–200
  particleSpeed?:     number;   // 1–30 (display as 0.1–3.0×)
  vignetteIntensity?: number;   // 0–100 (%)
  bloomIntensity?:    number;   // 0–100 (%)
  audioVolume?:       number;   // 0–100 (%)
  audioFadeIn?:       boolean;
}

// ── Top-level gift payload (DB-persisted, viewer-consumed) ────────────────────

export interface GiftPayload {
  id:     string;
  global: GlobalState;
  scenes: Scene[];
}

// ── Canvas tool modes ─────────────────────────────────────────────────────────

export type CanvasTool = "select" | "pan" | "comment";

// ── Spatial canvas comments ───────────────────────────────────────────────────

export interface CanvasComment {
  id:          string;
  projectId:   string;
  x:           number;
  y:           number;
  authorName:  string;
  message:     string;
  createdAt:   string;
}
