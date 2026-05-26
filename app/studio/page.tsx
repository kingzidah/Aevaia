"use client";

import React, { useState, useEffect, useCallback, useReducer, useRef, useMemo, createContext, useContext } from "react";
import type { Editor } from "@tiptap/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTiptapEditor } from "@/hooks/useTiptapEditor";
import TextEditorPanel from "@/components/text-editor/TextEditorPanel";
import AmbientEffects from "@/components/canvas/AmbientEffects";
import AtmosphereRenderer from "@/components/studio/atmosphere-renderer";
import IconStation from "@/components/studio/IconStation";
import { useCredits } from "@/context/CreditContext";
import * as LucideIcons from "lucide-react";
import { ICON_LIBRARY } from "@/utils/icon-library";
import { useAutoSave } from "@/hooks/use-auto-save";
import type { SaveStatus } from "@/hooks/use-auto-save";
import { generateCanvasImage } from "@/app/actions/generateImage";
import dynamic from "next/dynamic";

import {
  EffectsRegistry, EFFECT_META, CATEGORY_META, getEffectComponent,
  type EffectCategory,
} from "@/lib/effectsRegistry";
import { getContrastColor } from "@/lib/utils";
import { uploadImage } from "@/lib/storage";

// html2canvas must be loaded in the browser only — it accesses window/document.
// The dynamic import also keeps it out of the initial JS bundle.
let html2canvasPromise: Promise<typeof import("html2canvas").default> | null = null;
function loadHtml2Canvas() {
  if (!html2canvasPromise) {
    html2canvasPromise = import("html2canvas").then(m => m.default);
  }
  return html2canvasPromise;
}

// WebGL canvas — dynamically imported so it never runs on the server
const WebGLBackground = dynamic(
  () => import("@/components/ui/WebGLBackground"),
  { ssr: false, loading: () => null }
);
import CountdownBlock from "@/components/canvas/CountdownBlock";
import GalleryStackBlock from "@/components/canvas/GalleryStackBlock";
import AudioBlockPanel from "@/components/canvas/AudioBlockPanel";
import TiptapEditor from "@/components/text-editor/TiptapEditor";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableBlock } from "@/components/canvas/SortableBlock";
import SceneNavigator from "@/components/canvas/SceneNavigator";
import LiveCountdown from "@/components/blocks/live-countdown";
import RsvpForm from "@/components/blocks/rsvp-form";
import { BlurWords } from "@/components/blocks/text-animations";
import MasonryGallery from "@/components/blocks/masonry-gallery";
import AudioBlock from "@/components/blocks/audio-block";
import GoogleMap from "@/components/blocks/google-map";
import LottiePlayer from "@/components/blocks/lottie-player";
import VectorArt, { VECTOR_PRESETS } from "@/components/blocks/vector-art";
import CarouselSlideshow from "@/components/blocks/carousel-slideshow";
import ScribbleBlock from "@/components/blocks/scribble-block";
import ArcTextBlock from "@/components/blocks/arc-text-block";
import VideoBlock from "@/components/blocks/video-block";
import CheckoutModal from "@/components/ui/CheckoutModal";
import TierModal from "@/components/studio/TierModal";
import CommandPalette from "@/components/studio/command-palette";
import UtilityDock    from "@/components/studio/utility-dock";
import CommentPin     from "@/components/studio/comment-pin";
import type { Tier } from "@/components/studio/TierModal";
import { triggerHaptic, HapticPatterns } from "@/lib/haptics";
import { toast, Toaster } from "sonner";
import { useAuth } from "@clerk/nextjs";
import {
  type TemplateConfig,
  WEDDING_SUITE_TEMPLATE,
  ANNIVERSARY_VAULT_TEMPLATE,
} from "@/utils/studio-templates";

// Types are centralised in types/studio.ts — import directly from there.
import type {
  ImageFilters,
  BlockProperties,
  Block,
  Scene,
  CanvasComment,
  CanvasTool,
} from "@/types/studio";
import {
  DEFAULT_IMAGE_FILTERS as DEFAULT_FILTERS,
  buildFilterString,
} from "@/types/studio";

// Reusable slider used by the Icons customizer in the left sidebar.
function Slider({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number;
  step: number; display?: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">{label}</span>
        <span className="text-[10px] font-mono text-neutral-600">{display ?? value}</span>
      </div>
      <input type="range" aria-label={label} min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer bg-neutral-700
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                   [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer" />
    </div>
  );
}

// Renders a Lucide icon by string name; falls back to HelpCircle for unknown names.
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name] ?? LucideIcons.HelpCircle;
  return React.createElement(Icon, { className });
}

// Stable fallback used when a countdown block has no targetDate yet
const COUNTDOWN_FALLBACK = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

const VOICE_MODELS = [
  { value: 'rachel', label: 'Rachel — Calm, Warm'      },
  { value: 'Antoni', label: 'Antoni — Deep, Resonant'  },
  { value: 'bella',  label: 'Bella — Soft, Feminine'   },
  { value: 'josh',   label: 'Josh — Young, Energetic'  },
  { value: 'domi',   label: 'Domi — Strong, Bold'      },
];

const DEFAULT_SCENES: Scene[] = [
  {
    id: 'scene-1',
    name: 'Landing',
    blocks: [
      { id: 'block-1', type: 'image',     content: '' },
      { id: 'block-2', type: 'headline',  content: 'Happy Anniversary!' },
      { id: 'block-3', type: 'paragraph', content: 'Thank you for the best year of my life. I love you more than words can say.' },
    ],
  },
];

function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ── History types + reducer (module-level per React Compiler) ─────────────
interface HistoryState {
  past:    Scene[][];
  present: Scene[];
  future:  Scene[][];
}

type HistoryAction =
  | { type: 'SET_FN'; update: (prev: Scene[]) => Scene[] }
  | { type: 'UNDO' }
  | { type: 'REDO' };

function scenesReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'SET_FN': {
      const next = action.update(state.present);
      if (next === state.present) return state;
      return {
        past:    [...state.past.slice(-49), state.present],
        present: next,
        future:  [],
      };
    }
    case 'UNDO': {
      if (state.past.length === 0) return state;
      return {
        past:    state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future:  [state.present, ...state.future.slice(0, 49)],
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      return {
        past:    [...state.past.slice(-49), state.present],
        present: state.future[0],
        future:  state.future.slice(1),
      };
    }
  }
}

// ── Typography ────────────────────────────────────────────────────────────────

type CanvasFont = 'inter' | 'playfair' | 'cinzel';

const FONTS: { id: CanvasFont; label: string; sub: string; css: string }[] = [
  { id: 'inter',    label: 'Inter',            sub: 'Clean · Modern',      css: "var(--font-inter), system-ui, sans-serif"       },
  { id: 'playfair', label: 'Playfair Display', sub: 'Elegant · Editorial', css: "var(--font-playfair), Georgia, serif"           },
  { id: 'cinzel',   label: 'Cinzel',           sub: 'Luxury · Roman Caps', css: "var(--font-cinzel), 'Trajan Pro', Times, serif"  },
];

// ── Atmosphere particle presets ───────────────────────────────────────────────

type ParticlePreset = 'falling-blossoms' | 'glowing-embers' | 'falling-snow';

const PARTICLE_PRESETS: {
  id:      ParticlePreset;
  label:   string;
  Icon:    React.ComponentType<{ className?: string }>;
  desc:    string;
  effect:  'particles' | 'ember' | 'starfield';
  color:   string;
  density: number;
  speed:   number;
}[] = [
  { id: 'falling-blossoms', label: 'Falling Blossoms', Icon: LucideIcons.Flower2,   desc: 'Soft petals drifting down',    effect: 'particles', color: '#fda4af', density: 0.6, speed: 0.4 },
  { id: 'glowing-embers',   label: 'Glowing Embers',   Icon: LucideIcons.Flame,     desc: 'Warm fire embers rising',      effect: 'ember',     color: '#f97316', density: 0.5, speed: 0.8 },
  { id: 'falling-snow',     label: 'Falling Snow',     Icon: LucideIcons.Snowflake, desc: 'Gentle snowflakes drifting',   effect: 'starfield', color: '#bae6fd', density: 0.7, speed: 0.3 },
];

// ── Soundscapes ───────────────────────────────────────────────────────────────

type Soundscape = 'cinematic-strings' | 'acoustic-nostalgia' | 'lo-fi-solitude';

const SOUNDSCAPES: { id: Soundscape; label: string; desc: string; Icon: React.ComponentType<{ className?: string }>; url: string }[] = [
  { id: 'cinematic-strings',  label: 'Cinematic Strings',  desc: 'Sweeping orchestral warmth',   Icon: LucideIcons.Music,      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'acoustic-nostalgia', label: 'Acoustic Nostalgia', desc: 'Warm fingerpicked guitar',      Icon: LucideIcons.Guitar,     url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'lo-fi-solitude',     label: 'Lo-Fi Solitude',     desc: 'Mellow beats, late-night calm', Icon: LucideIcons.Headphones, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
];

// ─── Studio Context ──────────────────────────────────────────────────────────
// All studio state flows through this context to the three panel components.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StudioCtx = createContext<Record<string, any> | null>(null);
const useS = () => {
  const ctx = useContext(StudioCtx);
  if (!ctx) throw new Error("useS must be inside Studio");
  return ctx as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
};

// ─── Insert-tab component library (accordion data) ───────────────────────────

type InsertItem = {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  blockType?: Block['type'];
  feature?: string;
  // Special actions that don't map to a block type or named feature.
  action?: 'upload-photo';
  // Applies an animationType to the currently selected text block.
  animType?: string;
};

type InsertCategory = {
  id: string;
  title: string;
  dotCls: string;
  items: InsertItem[];
};

const INSERT_CATEGORIES: InsertCategory[] = [
  {
    id: 'basics',
    title: 'Basics',
    dotCls: 'bg-neutral-400',
    items: [
      { Icon: LucideIcons.Type,             label: 'Headline',  desc: 'Bold title or heading text',       blockType: 'headline'  },
      { Icon: LucideIcons.AlignLeft,        label: 'Paragraph', desc: 'Body copy and rich text',           blockType: 'paragraph' },
      { Icon: LucideIcons.MousePointerClick,label: 'Button',    desc: 'Clickable call-to-action element', blockType: 'button' as const, feature: 'button' },
    ],
  },
  {
    id: 'media',
    title: 'Media & Galleries',
    dotCls: 'bg-blue-400',
    items: [
      { Icon: LucideIcons.ImageIcon,        label: 'Image',           desc: 'Single photo or AI artwork',    blockType: 'image'             },
      { Icon: LucideIcons.Upload,           label: 'Upload Photo',    desc: 'Add a photo from your device',  action:  'upload-photo'        },
      { Icon: LucideIcons.Video,            label: 'Video',           desc: 'Embed a video clip',           blockType: 'video' as const, feature: 'video' },
      { Icon: LucideIcons.LayoutGrid,       label: 'Masonry Gallery', desc: 'Pinterest-style photo mosaic',  blockType: 'gallery-stack'     },
      { Icon: LucideIcons.GalleryHorizontal,label: 'Slideshow',       desc: 'Auto-scrolling carousel',       blockType: 'carousel' as const },
    ],
  },
  {
    id: 'atmosphere',
    title: 'Atmosphere',
    dotCls: 'bg-purple-400',
    items: [
      { Icon: LucideIcons.Music,  label: 'Ambient Audio',    desc: 'Background soundscape block',  blockType: 'audio'                        },
      { Icon: LucideIcons.Wind,   label: 'Lottie Animation', desc: 'Vector motion graphics',       blockType: 'lottie' as const, feature: 'lottie' },
    ],
  },
  {
    id: 'event',
    title: 'Event Utilities',
    dotCls: 'bg-amber-400',
    items: [
      { Icon: LucideIcons.Timer,        label: 'Live Countdown',   desc: 'Real-time event ticker',        blockType: 'countdown'          },
      { Icon: LucideIcons.ClipboardList,label: 'RSVP Form',        desc: 'Guest registration form',        blockType: 'rsvp-form' as const },
      { Icon: LucideIcons.MapPin,       label: 'Google Map Venue', desc: 'Embedded venue location map',   blockType: 'map' as const       },
    ],
  },
  {
    id: 'art',
    title: 'Art & Vectors',
    dotCls: 'bg-violet-400',
    items: [
      { Icon: LucideIcons.Shapes,    label: 'Custom SVG', desc: 'Import your own vector art',  blockType: 'vector'   as const, feature: 'svg'      },
      { Icon: LucideIcons.Pencil,    label: 'Scribbles',  desc: 'Hand-drawn freeform layers',  blockType: 'scribble' as const, feature: 'scribbles' },
      { Icon: LucideIcons.RefreshCw, label: 'Arc Text',   desc: 'Text along a curved path',    blockType: 'arc-text' as const, feature: 'arctext'   },
    ],
  },
  {
    id: 'text-animations',
    title: 'Text Animations',
    dotCls: 'bg-pink-400',
    items: [
      { Icon: LucideIcons.Sparkles, label: 'Shiny',        desc: 'Sweeping metallic shimmer',  animType: 'shiny'      },
      { Icon: LucideIcons.Eye,      label: 'Blur Words',   desc: 'Word-by-word blur reveal',   animType: 'blur-words' },
      { Icon: LucideIcons.Minus,    label: 'No Animation', desc: 'Remove text animation',      animType: 'none'       },
    ],
  },
  {
    id: 'icons',
    title: 'Icons',
    dotCls: 'bg-fuchsia-400',
    items: [],
  },
  {
    // Items intentionally empty — the sidebar renders custom nested UI for this category.
    id: 'webgl-effects',
    title: 'WebGL & Effects',
    dotCls: 'bg-cyan-400',
    items: [],
  },
];

// ─── Shared micro-components ─────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Left Sidebar ─────────────────────────────────────────────────────────────

function LeftSidebar() {
  const {
    leftPanelTab, setLeftPanelTab,
    selectedFont, setSelectedFont,
    selectedItem, setSelectedItem, activeBlockId, setActiveBlockId,
    activeBlock, activeFilters, setFilter, resetFilters,
    headlineEditor, paragraphEditor, activeEditor,
    isTextSelected, isImageSelected, isCountdownSelected, isGallerySelected, isAudioSelected, isMapSelected, isIconSelected, isLottieSelected, isVectorSelected, isScribbleSelected, isArcTextSelected, isNoneSelected,
    imageBorderRadius, setImageBorderRadius, imageShadow, setImageShadow,
    activeSoundscape, soundscapePlaying, toggleSoundscape,
    particleDensity, setParticleDensity, particleSpeed, setParticleSpeed,
    vignetteIntensity, setVignetteIntensity, bloomIntensity, setBloomIntensity,
    audioVolume, setAudioVolume, audioFadeIn, setAudioFadeIn,
    addBlock, updateBlock, patchBlockProperties,
    setScenes, activeSceneId,
    iconSize, setIconSize, iconStrokeWidth, setIconStrokeWidth, iconColor, setIconColor,
    activeFeature, setActiveFeature,
    theme, setTheme,
    ambientEffect, setAmbientEffect,
    webglSpeed, setWebglSpeed, webglDensity, setWebglDensity, webglColor, setWebglColor,
    webglActive, particlePreset, applyParticlePreset,
    hapticsEnabled, setHapticsEnabled,
    layerOpacity, setLayerOpacity, layerScale, setLayerScale, layerRotation, setLayerRotation,
    bringForward, sendBackward, bringToFront, sendToBack,
    activeScene,
    canvasBackground, setCanvasBackground,
  } = useS();

  // ── Local photo upload ──────────────────────────────────────────────────────
  const uploadRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // ── Insert click feedback ───────────────────────────────────────────────────
  const [flashItem, setFlashItem] = useState<string | null>(null);
  const flashInsert = (key: string) => {
    setFlashItem(key);
    setTimeout(() => setFlashItem(null), 350);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsUploadingPhoto(true);
    try {
      const publicUrl = await uploadImage(file);
      const newBlock: Block = {
        id:      `block-${Date.now()}`,
        type:    'image',
        content: publicUrl,
        filters: { ...DEFAULT_FILTERS },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setScenes((prev: any[]) => prev.map((scene: any) =>
        scene.id === activeSceneId
          ? { ...scene, blocks: [...scene.blocks, newBlock] }
          : scene
      ));
      setLeftPanelTab('style');
    } catch {
      // Surface error without crashing — console only; no toast system here.
      console.error('[upload] Failed to upload image to Supabase storage.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Insert-tab local state
  const [insertSearch,     setInsertSearch]     = useState('');
  const [openCategories,   setOpenCategories]   = useState<string[]>(['basics', 'event']);
  // Which React Bits sub-categories are expanded inside "WebGL & Effects"
  const [openRbCats, setOpenRbCats] = useState<string[]>(['Backgrounds']);
  const toggleRbCat = (cat: string) =>
    setOpenRbCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  const toggleCategory = (id: string) =>
    setOpenCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );

  // Auto-expand the accordion matching the active right-panel feature
  useEffect(() => {
    const featureToCategoryId: Record<string, string> = {
      text:      'basics',
      button:    'basics',
      media:     'media',
      video:     'media',
      audio:     'atmosphere',
      webgl:     'atmosphere',
      lottie:    'atmosphere',
      icons:     'icons',
      svg:       'art',
      scribbles: 'art',
      arctext:   'art',
    };
    const catId = featureToCategoryId[activeFeature];
    if (catId) {
      setOpenCategories(prev => prev.includes(catId) ? prev : [...prev, catId]);
    }
  }, [activeFeature]);

  return (
    <div className="flex flex-col min-h-full p-4">

      {/* Back to Dashboard */}
      <a href="/dashboard" className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-300 text-xs font-medium transition-colors mb-5 w-fit group">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Dashboard
      </a>

      {/* Tab row */}
      <div className="flex gap-1.5 mb-5 shrink-0">
        {([
          { id: 'insert', label: 'Insert' },
          { id: 'style',  label: 'Style'  },
          { id: 'world',  label: 'World'  },
        ] as { id: string; label: string }[]).map(tab => (
          <button key={tab.id} type="button"
            onClick={() => { setLeftPanelTab(tab.id); if (tab.id !== 'style') { setSelectedItem('none'); setActiveBlockId(null); } }}
            className={`flex-1 py-2 rounded-lg text-[11px] font-semibold tracking-wide transition-all ${
              leftPanelTab === tab.id
                ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── INSERT TAB ──────────────────────────────────────────────── */}
      {leftPanelTab === 'insert' && (
        <div className="flex flex-col gap-0.5">

          {/* ── Sticky search ── */}
          <div className="relative mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={insertSearch}
              onChange={e => setInsertSearch(e.target.value)}
              placeholder="Search components…"
              className="w-full bg-neutral-800/60 border border-neutral-700/60 rounded-xl pl-9 pr-8 py-2.5 text-xs text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/60 focus:bg-neutral-800/80 transition-all"
            />
            {insertSearch && (
              <button type="button" onClick={() => setInsertSearch('')} aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-2.5 h-2.5 text-neutral-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* ── Accordion categories ── */}
          {INSERT_CATEGORIES.map(cat => {
            const q = insertSearch.trim().toLowerCase();
            const visibleItems = q
              ? cat.items.filter(it => it.label.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q))
              : cat.items;
            if (q && visibleItems.length === 0) return null;
            const isOpen = q ? true : openCategories.includes(cat.id);

            return (
              <div key={cat.id} className="overflow-hidden rounded-lg">

                {/* Category header */}
                <button
                  type="button"
                  onClick={() => {
                    toggleCategory(cat.id);
                    const featureMap: Record<string, 'general' | 'text' | 'media' | 'audio' | 'icons'> = {
                      basics: 'text', media: 'media', atmosphere: 'audio', icons: 'icons',
                    };
                    const feature = featureMap[cat.id];
                    if (feature) setActiveFeature(feature);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50 transition-colors rounded-md"
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cat.dotCls}`} />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 flex-1 text-left">{cat.title}</p>
                  <svg
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    strokeWidth={2.5} stroke="currentColor"
                    className={`w-3 h-3 text-neutral-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Items */}
                {isOpen && (
                  <div className="mt-0.5 pl-4">
                    {/* ── Icons customizer (only for Icons category) ── */}
                    {cat.id === 'icons' && (
                      <div className="px-3 pt-3 pb-3 space-y-3">
                        {/* Sliders */}
                        <Slider label="Size"   value={iconSize}        min={16}  max={128} step={1}   display={`${iconSize}px`}          onChange={setIconSize} />
                        <Slider label="Stroke" value={iconStrokeWidth} min={0.5} max={4}   step={0.1} display={iconStrokeWidth.toFixed(1)} onChange={setIconStrokeWidth} />

                        {/* Color picker */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Color</span>
                            <span className="text-[10px] font-mono text-neutral-600">{iconColor}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="relative w-7 h-7 rounded-lg overflow-hidden border border-neutral-700 cursor-pointer shrink-0">
                              <input type="color" value={iconColor} aria-label="Icon color"
                                onChange={(e) => setIconColor(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                              {/* eslint-disable-next-line react/forbid-dom-props */}
                              <span className="absolute inset-0 rounded-lg" style={{ backgroundColor: iconColor }} />
                            </label>
                            <input type="text" value={iconColor} maxLength={7} aria-label="Icon color hex"
                              onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setIconColor(v); }}
                              className="flex-1 px-2 py-1 rounded-lg text-[11px] font-mono bg-neutral-900 border border-neutral-700
                                         text-neutral-200 focus:outline-none focus:border-purple-500 transition-all" />
                          </div>
                        </div>

                        {/* Live preview */}
                        <div className="flex items-center justify-center py-3 rounded-xl bg-neutral-900 border border-neutral-800">
                          {React.createElement(
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (LucideIcons as any)['Heart'] ?? LucideIcons.HelpCircle,
                            { size: Math.min(iconSize, 48), strokeWidth: iconStrokeWidth, color: iconColor }
                          )}
                        </div>

                        {/* Icon library grid — all categories stacked */}
                        {(Object.keys(ICON_LIBRARY) as (keyof typeof ICON_LIBRARY)[]).map(catKey => (
                          <div key={catKey}>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 mb-1.5">
                              {ICON_LIBRARY[catKey].label}
                            </p>
                            <div className="grid grid-cols-5 gap-1">
                              {ICON_LIBRARY[catKey].icons.map(iconName => (
                                <button key={iconName} type="button" title={iconName}
                                  onClick={() => {
                                    addBlock('icon');
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    setScenes((prev: any[]) => prev.map((scene: any) =>
                                      scene.id === activeSceneId
                                        ? {
                                            ...scene,
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            blocks: scene.blocks.map((b: any, i: number) =>
                                              i === scene.blocks.length - 1
                                                ? { ...b, content: iconName, properties: { ...b.properties, iconSize, iconStrokeWidth, iconColor } }
                                                : b
                                            ),
                                          }
                                        : scene
                                    ));
                                  }}
                                  className="group flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all
                                             border border-transparent hover:border-purple-500/40 hover:bg-purple-500/5 active:scale-95"
                                >
                                  <DynamicIcon name={iconName} className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                                  <span className="text-[7.5px] text-neutral-600 group-hover:text-purple-400 truncate w-full text-center transition-colors">
                                    {iconName}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* ── WebGL & Effects library ── */}
                    {cat.id === 'webgl-effects' && (
                      <div className="px-3 py-3 space-y-2">
                        {/* Clear current effect */}
                        <button type="button" onClick={() => setCanvasBackground('none')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left text-xs transition-all
                            ${canvasBackground === 'none'
                              ? 'border-neutral-600 bg-neutral-800 text-neutral-200'
                              : 'border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'}`}>
                          <div className="flex items-center gap-2">
                            <span className="select-none">✕</span>
                            <span className="font-semibold">No Effect</span>
                          </div>
                          {canvasBackground === 'none' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                          )}
                        </button>

                        {/* React Bits Library — nested sub-accordions per category */}
                        <div className="rounded-lg border border-neutral-800 overflow-hidden">
                          <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-neutral-600 bg-neutral-900/80">
                            React Bits Library
                          </p>
                          {(Object.entries(EffectsRegistry) as [EffectCategory, Record<string, unknown>][]).map(([category, effects]) => {
                            const catMeta  = CATEGORY_META[category];
                            const isOpen   = openRbCats.includes(category);
                            const effectKeys = Object.keys(effects);
                            return (
                              <div key={category} className="border-t border-neutral-800/60 first:border-t-0">
                                {/* Sub-category header */}
                                <button type="button" onClick={() => toggleRbCat(category)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-neutral-800/40 transition-colors">
                                  <span className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
                                    {typeof catMeta.icon === 'string' ? <span className="select-none">{catMeta.icon}</span> : <catMeta.icon className="w-3.5 h-3.5 text-zinc-400" />}
                                    {catMeta.label}
                                    <span className="text-[9px] font-normal text-neutral-600">({effectKeys.length})</span>
                                  </span>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                                    className={`w-3 h-3 text-neutral-600 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                  </svg>
                                </button>

                                {/* Effect button grid */}
                                {isOpen && (
                                  <div className="grid grid-cols-2 gap-1.5 px-3 pb-3">
                                    {effectKeys.map(key => {
                                      const meta     = EFFECT_META[key];
                                      const isActive = canvasBackground === key;
                                      return (
                                        <button key={key} type="button" onClick={() => { setCanvasBackground(key); setLeftPanelTab('style'); }}
                                          className={`flex flex-col items-start gap-0.5 px-2.5 py-2 rounded-xl border text-left transition-all
                                            ${isActive
                                              ? 'border-cyan-500/60 bg-cyan-500/10 text-white shadow-[0_0_8px_rgba(34,211,238,0.2)]'
                                              : 'border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200 hover:bg-neutral-800/40'}`}>
                                          {meta?.icon && typeof meta.icon !== 'string' ? <meta.icon className="w-4 h-4 text-zinc-400" /> : <span className="text-base leading-none select-none">{(meta?.icon as string | undefined) ?? '✦'}</span>}
                                          <span className="text-[10px] font-semibold leading-tight mt-1">{meta?.label ?? key}</span>
                                          <span className="text-[9px] text-neutral-600 leading-tight">{meta?.desc ?? ''}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── Standard block items (hidden for icon/webgl-effects categories) ── */}
                    {cat.id !== 'webgl-effects' && visibleItems.map(item => {
                      const isUploading = item.action === 'upload-photo' && isUploadingPhoto;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          disabled={isUploading}
                          draggable={!!item.blockType}
                          onDragStart={item.blockType ? (e) => {
                            e.dataTransfer.setData('blockType', item.blockType!);
                            e.dataTransfer.effectAllowed = 'copy';
                          } : undefined}
                          onClick={() => {
                            if (item.blockType)                  { addBlock(item.blockType); setLeftPanelTab('style'); flashInsert(item.label); }
                            if (item.feature)                    { setActiveFeature(item.feature as any); }
                            if (item.action === 'upload-photo')  { uploadRef.current?.click(); }
                            if (item.animType !== undefined) {
                              if (activeBlockId && (selectedItem === 'headline' || selectedItem === 'paragraph')) {
                                patchBlockProperties(activeBlockId, { animationType: item.animType as 'none' | 'shiny' | 'blur-words' });
                              }
                              flashInsert(item.label);
                            }
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all group rounded-md hover:bg-zinc-800/60 ${item.blockType ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${isUploading ? 'opacity-60 pointer-events-none' : ''} ${flashItem === item.label ? 'bg-purple-500/20 scale-[0.97]' : ''}`}
                        >
                          {isUploading ? (
                            <svg className="w-4 h-4 shrink-0 text-purple-400 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                          ) : (
                            <item.Icon className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-purple-400 transition-colors" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-zinc-400 group-hover:text-white transition-colors">
                              {isUploading ? 'Uploading…' : item.label}
                            </p>
                            <p className="text-[10px] text-zinc-600 mt-0.5 leading-snug">{item.desc}</p>
                          </div>
                          {item.blockType ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                              className="w-3 h-3 text-neutral-700 shrink-0 opacity-0 group-hover:opacity-100 group-hover:text-purple-400 transition-all">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                              className="w-3 h-3 text-neutral-700 shrink-0 opacity-0 group-hover:opacity-100 group-hover:text-purple-400 transition-all">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

              </div>
            );
          })}

          <p className="text-[10px] text-neutral-700 text-center pt-1 leading-relaxed">Click to add  ·  drag onto canvas to place</p>

          {/* Hidden file input — triggered programmatically by the Upload Photo item */}
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            aria-label="Upload photo from device"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      )}

      {/* ── STYLE TAB ───────────────────────────────────────────────── */}
      {leftPanelTab === 'style' && (
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-800/80">
              <div className="w-1.5 h-3.5 rounded-full bg-violet-500" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Typeface</p>
            </div>
            {FONTS.map((font: typeof FONTS[0]) => (
              <button key={font.id} type="button" onClick={() => setSelectedFont(font.id)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${selectedFont === font.id ? 'border-purple-500 bg-purple-500/10' : 'border-neutral-800 hover:border-neutral-600'}`}>
                <div>
                  <p className={`text-sm font-semibold ${selectedFont === font.id ? 'text-white' : 'text-neutral-300'}`} style={{ fontFamily: font.css }}>{font.label}</p>
                  <p className="text-[10px] text-neutral-600 mt-0.5">{font.sub}</p>
                </div>
                {selectedFont === font.id && <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7] shrink-0" />}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={(activeBlock as Block | null)?.type ?? 'none'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">

              {isNoneSelected && (
                <div className="flex flex-col items-center justify-center text-center py-10 gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-800/60 border border-neutral-700 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-neutral-600"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" /></svg>
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed max-w-[180px]">Select a block on the canvas to see its style options.</p>
                </div>
              )}

              {isAudioSelected && activeBlock && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-neutral-800/80"><div className="w-1.5 h-3.5 rounded-full bg-purple-500 shadow-[0_0_6px_#a855f7]" /><p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Audio Block</p></div>
                  <AudioBlockPanel audioUrl={(activeBlock as Block).audioUrl ?? ''} audioVolume={(activeBlock as Block).audioVolume ?? 80} audioSpeed={(activeBlock as Block).audioSpeed ?? 1}
                    onAudioUrlChange={(url: string) => updateBlock((activeBlock as Block).id, { audioUrl: url })}
                    onVolumeChange={(vol: number) => updateBlock((activeBlock as Block).id, { audioVolume: vol })}
                    onSpeedChange={(speed: number) => updateBlock((activeBlock as Block).id, { audioSpeed: speed })} />
                </div>
              )}

              {isLottieSelected && activeBlock && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-neutral-800/80">
                    <div className="w-1.5 h-3.5 rounded-full bg-purple-500 shadow-[0_0_6px_#a855f7]" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Lottie Animation</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Animation URL</p>
                    <input
                      type="text"
                      defaultValue={(activeBlock as Block).properties?.lottieUrl as string ?? ''}
                      onBlur={(e) => patchBlockProperties((activeBlock as Block).id, { lottieUrl: e.target.value.trim() })}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); patchBlockProperties((activeBlock as Block).id, { lottieUrl: (e.target as HTMLInputElement).value.trim() }); } }}
                      placeholder="https://assets.lottiefiles.com/..."
                      className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all placeholder:text-neutral-600"
                    />
                    <p className="text-[10px] text-neutral-600">Paste any public Lottie JSON URL</p>
                  </div>
                </div>
              )}

              {isTextSelected && activeBlock && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-neutral-800/80">
                    <div className="w-1.5 h-3.5 rounded-full bg-purple-500 shadow-[0_0_6px_#a855f7]" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">{selectedItem === 'headline' ? 'Headline' : 'Paragraph'}</p>
                  </div>

                  {/* Per-block font family */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Typeface</p>
                    <div className="space-y-1.5">
                      {FONTS.map(font => {
                        const active = ((activeBlock as Block).properties?.fontFamily as string | undefined)?.includes(font.id === 'inter' ? '--font-inter' : font.id === 'playfair' ? '--font-playfair' : '--font-cinzel');
                        return (
                          <button key={font.id} type="button"
                            onClick={() => patchBlockProperties((activeBlock as Block).id, { fontFamily: font.css })}
                            className={`w-full px-3 py-2 rounded-lg border text-left transition-all flex items-center justify-between ${active ? 'border-purple-500 bg-purple-500/10' : 'border-neutral-800 hover:border-neutral-700'}`}>
                            <div>
                              <p className={`text-xs font-semibold ${active ? 'text-white' : 'text-neutral-300'}`} style={{ fontFamily: font.css }}>{font.label}</p>
                              <p className="text-[10px] text-neutral-600">{font.sub}</p>
                            </div>
                            {active && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Per-block font size */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Size</p>
                      <span className="text-[10px] font-mono text-neutral-400">{((activeBlock as Block).properties?.fontSize as number | undefined) ?? (selectedItem === 'headline' ? 48 : 16)}px</span>
                    </div>
                    <input type="range" aria-label="Font size"
                      min={selectedItem === 'headline' ? 20 : 12} max={selectedItem === 'headline' ? 96 : 36} step={1}
                      value={((activeBlock as Block).properties?.fontSize as number | undefined) ?? (selectedItem === 'headline' ? 48 : 16)}
                      onChange={e => patchBlockProperties((activeBlock as Block).id, { fontSize: Number(e.target.value) })}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer bg-neutral-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer" />
                  </div>

                  {/* Per-block text color */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Color</p>
                      <span className="text-[10px] font-mono text-neutral-600">{((activeBlock as Block).properties?.color as string) || '#ffffff'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="relative w-7 h-7 rounded-lg overflow-hidden border border-neutral-700 cursor-pointer shrink-0">
                        <input type="color" aria-label="Text color"
                          value={((activeBlock as Block).properties?.color as string) || '#ffffff'}
                          onChange={e => patchBlockProperties((activeBlock as Block).id, { color: e.target.value })}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        {/* eslint-disable-next-line react/forbid-dom-props */}
                        <span className="absolute inset-0 rounded-lg" style={{ backgroundColor: ((activeBlock as Block).properties?.color as string) || '#ffffff' }} />
                      </label>
                      <input type="text" maxLength={7} aria-label="Text color hex"
                        value={((activeBlock as Block).properties?.color as string) || '#ffffff'}
                        onChange={e => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) patchBlockProperties((activeBlock as Block).id, { color: v }); }}
                        className="flex-1 px-2 py-1 rounded-lg text-[11px] font-mono bg-neutral-900 border border-neutral-700 text-neutral-200 focus:outline-none focus:border-purple-500 transition-all" />
                    </div>
                  </div>

                  <TextEditorPanel editor={activeEditor as Editor | null} />

                  {/* ── Typography ── */}
                  <div className="space-y-3 border-t border-neutral-800/60 pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Typography</p>

                    {/* Text Align */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Align</label>
                      <div className="flex gap-1.5">
                        {(['left', 'center', 'right'] as const).map(align => (
                          <button key={align} type="button"
                            onClick={() => patchBlockProperties((activeBlock as Block).id, { textAlign: align })}
                            className={`flex-1 h-7 rounded-lg border flex items-center justify-center transition-all ${((activeBlock as Block).properties?.textAlign ?? 'center') === align ? 'border-purple-500 bg-purple-500/15 text-purple-300' : 'border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'}`}
                            aria-label={`Align ${align}`}
                          >
                            {align === 'left' && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-3.5 h-3.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
                            )}
                            {align === 'center' && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-3.5 h-3.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
                            )}
                            {align === 'right' && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-3.5 h-3.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Letter Spacing */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Letter Spacing</label>
                        <span className="text-[10px] font-mono text-zinc-400">{(activeBlock as Block).properties?.letterSpacing ?? 0}px</span>
                      </div>
                      <input type="range" min={-5} max={20} step={1}
                        value={(activeBlock as Block).properties?.letterSpacing ?? 0}
                        onChange={e => patchBlockProperties((activeBlock as Block).id, { letterSpacing: Number(e.target.value) })}
                        aria-label="Letter spacing"
                        className="w-full accent-purple-500 h-1.5 rounded-full" />
                    </div>

                    {/* Line Height */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Line Height</label>
                        <span className="text-[10px] font-mono text-zinc-400">{(activeBlock as Block).properties?.lineHeight ?? (selectedItem === 'headline' ? 120 : 160)}%</span>
                      </div>
                      <input type="range" min={80} max={200} step={5}
                        value={(activeBlock as Block).properties?.lineHeight ?? (selectedItem === 'headline' ? 120 : 160)}
                        onChange={e => patchBlockProperties((activeBlock as Block).id, { lineHeight: Number(e.target.value) })}
                        aria-label="Line height"
                        className="w-full accent-purple-500 h-1.5 rounded-full" />
                    </div>
                  </div>
                </div>
              )}

              {isImageSelected && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-neutral-800/80"><div className="w-1.5 h-3.5 rounded-full bg-blue-500" /><p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Image</p></div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Adjustments</span>
                      <button type="button" onClick={resetFilters} className="text-[10px] text-neutral-600 hover:text-neutral-300 transition-colors">Reset</button>
                    </div>
                    {([
                      { key: 'brightness' as const, label: 'Brightness', min: 0,  max: 200, unit: '%'  },
                      { key: 'contrast'   as const, label: 'Contrast',   min: 0,  max: 200, unit: '%'  },
                      { key: 'saturate'   as const, label: 'Saturation', min: 0,  max: 200, unit: '%'  },
                      { key: 'blur'       as const, label: 'Blur',       min: 0,  max: 20,  unit: 'px' },
                      { key: 'grayscale'  as const, label: 'Grayscale',  min: 0,  max: 100, unit: '%'  },
                    ]).map(({ key, label, min, max, unit }) => (
                      <div key={key}>
                        <div className="flex justify-between mb-1.5"><label className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</label><span className="text-[10px] text-neutral-400 tabular-nums">{(activeFilters as ImageFilters)[key]}{unit}</span></div>
                        <input type="range" min={min} max={max} value={(activeFilters as ImageFilters)[key]} onChange={e => setFilter(key, Number(e.target.value))} aria-label={label} className="w-full accent-purple-500" />
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-neutral-800/60 pt-4 space-y-4">
                    <div><div className="flex justify-between mb-1.5"><label className="text-[10px] text-neutral-500 uppercase tracking-wider">Corner Radius</label><span className="text-[10px] text-neutral-400 tabular-nums">{imageBorderRadius}px</span></div><input type="range" min="0" max="32" value={imageBorderRadius} onChange={e => setImageBorderRadius(Number(e.target.value))} aria-label="Image corner radius" className="w-full accent-purple-500" /></div>
                    <div><label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2 block">Shadow</label><div className="grid grid-cols-2 gap-2">{(['none','soft','strong','glow'] as const).map(s => (<button key={s} type="button" onClick={() => setImageShadow(s)} className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${imageShadow === s ? 'border-purple-500 bg-purple-500/15 text-purple-200' : 'border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'}`}>{s}</button>))}</div></div>
                  </div>
                </div>
              )}

              {isGallerySelected && activeBlock && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-neutral-800/80"><div className="w-1.5 h-3.5 rounded-full bg-emerald-500" /><p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Gallery Stack</p></div>
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2 block">Images ({((activeBlock as Block).images ?? []).length}/5)</label>
                    <div className="space-y-2">
                      {((activeBlock as Block).images ?? []).map((url: string, i: number) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input type="text" value={url} aria-label={`Image ${i + 1} URL`} placeholder={`Image ${i + 1} URL`}
                            onChange={e => { const next = [...((activeBlock as Block).images ?? [])]; next[i] = e.target.value; updateBlock((activeBlock as Block).id, { images: next }); }}
                            className="flex-1 min-w-0 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-all placeholder:text-neutral-600" />
                          {((activeBlock as Block).images ?? []).length > 1 && (
                            <button type="button" aria-label="Remove image" onClick={() => updateBlock((activeBlock as Block).id, { images: ((activeBlock as Block).images ?? []).filter((_: string, idx: number) => idx !== i) })}
                              className="w-7 h-7 shrink-0 rounded-lg bg-neutral-800 hover:bg-red-500/20 border border-neutral-700 flex items-center justify-center transition-all">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-neutral-500"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          )}
                        </div>
                      ))}
                      {((activeBlock as Block).images ?? []).length < 5 && (
                        <button type="button" onClick={() => updateBlock((activeBlock as Block).id, { images: [...((activeBlock as Block).images ?? []), ''] })} className="w-full py-2 border border-dashed border-neutral-700 rounded-lg text-xs text-neutral-500 hover:border-emerald-500/50 hover:text-emerald-400 transition-all">+ Add Image</button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {isCountdownSelected && activeBlock && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-neutral-800/80"><div className="w-1.5 h-3.5 rounded-full bg-amber-500" /><p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Countdown</p></div>
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2 block">Target Date &amp; Time</label>
                    <input type="datetime-local" aria-label="Countdown target date and time" title="Target date and time" value={(activeBlock as Block).targetDate?.slice(0, 16) ?? ''} onChange={e => updateBlock((activeBlock as Block).id, { targetDate: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all" />
                  </div>
                </div>
              )}

              {isMapSelected && activeBlock && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-neutral-800/80">
                    <div className="w-1.5 h-3.5 rounded-full bg-emerald-500" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Map Venue</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-neutral-500 uppercase tracking-wider block">Venue Address</label>
                    <input
                      type="text"
                      value={(activeBlock as Block).properties?.address ?? ''}
                      onChange={e => patchBlockProperties((activeBlock as Block).id, { address: e.target.value })}
                      placeholder="e.g. The Ritz, 15 W 51st St, New York"
                      aria-label="Venue address"
                      className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-neutral-600"
                    />
                    <p className="text-[9px] text-neutral-700 leading-relaxed">
                      Accepts any address · Updates the map in real time
                    </p>
                  </div>
                </div>
              )}

              {isIconSelected && activeBlock && (() => {
                const blk        = activeBlock as Block;
                const iconName   = blk.content || 'Heart';
                const iconSzVal  = (blk.properties?.iconSize        as number) || 64;
                const iconSwVal  = (blk.properties?.iconStrokeWidth as number) || 2;
                const iconClrVal = (blk.properties?.iconColor       as string)  || '#ec4899';
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const PreviewIcon = (LucideIcons as any)[iconName] ?? LucideIcons.HelpCircle;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-neutral-800/80">
                      <div className="w-1.5 h-3.5 rounded-full bg-fuchsia-500 shadow-[0_0_6px_#d946ef]" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-400">Icon</p>
                    </div>

                    {/* Live preview */}
                    <div className="flex items-center justify-center py-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                      {React.createElement(PreviewIcon, { size: Math.min(iconSzVal, 56), strokeWidth: iconSwVal, color: iconClrVal })}
                    </div>

                    {/* Size */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Size</p>
                        <span className="text-[10px] font-mono text-neutral-400">{iconSzVal}px</span>
                      </div>
                      <input type="range" aria-label="Icon size" min={16} max={128} step={1} value={iconSzVal}
                        onChange={e => patchBlockProperties(blk.id, { iconSize: Number(e.target.value) })}
                        className="w-full h-1 rounded-full appearance-none cursor-pointer bg-neutral-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-fuchsia-500 [&::-webkit-slider-thumb]:cursor-pointer" />
                    </div>

                    {/* Stroke width */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Stroke</p>
                        <span className="text-[10px] font-mono text-neutral-400">{iconSwVal.toFixed(1)}</span>
                      </div>
                      <input type="range" aria-label="Icon stroke width" min={0.5} max={4} step={0.1} value={iconSwVal}
                        onChange={e => patchBlockProperties(blk.id, { iconStrokeWidth: Number(e.target.value) })}
                        className="w-full h-1 rounded-full appearance-none cursor-pointer bg-neutral-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-fuchsia-500 [&::-webkit-slider-thumb]:cursor-pointer" />
                    </div>

                    {/* Color */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Color</p>
                        <span className="text-[10px] font-mono text-neutral-600">{iconClrVal}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="relative w-7 h-7 rounded-lg overflow-hidden border border-neutral-700 cursor-pointer shrink-0">
                          <input type="color" aria-label="Icon color" value={iconClrVal}
                            onChange={e => patchBlockProperties(blk.id, { iconColor: e.target.value })}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          {/* eslint-disable-next-line react/forbid-dom-props */}
                          <span className="absolute inset-0 rounded-lg" style={{ backgroundColor: iconClrVal }} />
                        </label>
                        <input type="text" maxLength={7} aria-label="Icon color hex" value={iconClrVal}
                          onChange={e => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) patchBlockProperties(blk.id, { iconColor: v }); }}
                          className="flex-1 px-2 py-1 rounded-lg text-[11px] font-mono bg-neutral-900 border border-neutral-700 text-neutral-200 focus:outline-none focus:border-fuchsia-500 transition-all" />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Vector (Custom SVG) Style Panel ── */}
              {isVectorSelected && activeBlock && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-neutral-800/80">
                    <div className="w-1.5 h-3.5 rounded-full bg-violet-500 shadow-[0_0_6px_#7c3aed]" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Custom SVG</p>
                  </div>

                  {/* Preset picker */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Presets</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.keys(VECTOR_PRESETS) as (keyof typeof VECTOR_PRESETS)[]).map(key => {
                        const active = (activeBlock as Block).properties?.vectorType === key && !(activeBlock as Block).properties?.svgCode;
                        return (
                          <button key={key} type="button"
                            onClick={() => patchBlockProperties((activeBlock as Block).id, { vectorType: key, svgCode: '' })}
                            className={`py-1.5 px-3 rounded-lg border text-[10px] font-semibold capitalize transition-all ${active ? 'border-violet-500 bg-violet-500/15 text-violet-200' : 'border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'}`}>
                            {key}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Raw SVG paste */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Paste SVG Code</p>
                    <textarea
                      rows={5}
                      defaultValue={(activeBlock as Block).properties?.svgCode as string ?? ''}
                      placeholder={'<svg xmlns="http://www.w3.org/2000/svg" ...>…</svg>'}
                      onBlur={(e) => patchBlockProperties((activeBlock as Block).id, { svgCode: e.target.value.trim(), vectorType: '' })}
                      className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg px-3 py-2 text-[10px] font-mono focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all placeholder:text-neutral-600 resize-none"
                    />
                    <p className="text-[10px] text-neutral-600">Paste any valid SVG · DOMPurify sanitised</p>
                  </div>
                </div>
              )}

              {/* ── Scribble Style Panel ── */}
              {isScribbleSelected && activeBlock && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-neutral-800/80">
                    <div className="w-1.5 h-3.5 rounded-full bg-pink-500 shadow-[0_0_6px_#ec4899]" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-pink-400">Scribble</p>
                  </div>

                  {/* Stroke color */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Stroke Color</p>
                      <span className="text-[10px] font-mono text-neutral-600">{(activeBlock as Block).properties?.scribbleColor as string || '#a855f7'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="relative w-7 h-7 rounded-lg overflow-hidden border border-neutral-700 cursor-pointer shrink-0">
                        <input type="color" aria-label="Scribble stroke color"
                          value={(activeBlock as Block).properties?.scribbleColor as string || '#a855f7'}
                          onChange={e => patchBlockProperties((activeBlock as Block).id, { scribbleColor: e.target.value })}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        {/* eslint-disable-next-line react/forbid-dom-props */}
                        <span className="absolute inset-0 rounded-lg" style={{ backgroundColor: (activeBlock as Block).properties?.scribbleColor as string || '#a855f7' }} />
                      </label>
                      <input type="text" maxLength={7} aria-label="Scribble color hex"
                        value={(activeBlock as Block).properties?.scribbleColor as string || '#a855f7'}
                        onChange={e => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) patchBlockProperties((activeBlock as Block).id, { scribbleColor: v }); }}
                        className="flex-1 px-2 py-1 rounded-lg text-[11px] font-mono bg-neutral-900 border border-neutral-700 text-neutral-200 focus:outline-none focus:border-pink-500 transition-all" />
                    </div>
                  </div>

                  {/* Stroke width */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Stroke Width</p>
                      <span className="text-[10px] font-mono text-neutral-400">{(activeBlock as Block).properties?.scribbleWidth as number || 3}px</span>
                    </div>
                    <input type="range" aria-label="Scribble stroke width" min={1} max={20} step={1}
                      value={(activeBlock as Block).properties?.scribbleWidth as number || 3}
                      onChange={e => patchBlockProperties((activeBlock as Block).id, { scribbleWidth: Number(e.target.value) })}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer bg-neutral-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pink-500 [&::-webkit-slider-thumb]:cursor-pointer" />
                  </div>

                  {/* Clear all */}
                  <button type="button"
                    onClick={() => patchBlockProperties((activeBlock as Block).id, { scribblePaths: [] })}
                    className="w-full py-1.5 rounded-lg border border-neutral-800 text-[10px] font-semibold text-neutral-500 hover:border-red-500/50 hover:text-red-400 transition-all">
                    Clear All Strokes
                  </button>
                </div>
              )}

              {/* ── Arc Text Style Panel ── */}
              {isArcTextSelected && activeBlock && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-neutral-800/80">
                    <div className="w-1.5 h-3.5 rounded-full bg-teal-500 shadow-[0_0_6px_#14b8a6]" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-teal-400">Arc Text</p>
                  </div>

                  {/* Text content */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Text</p>
                    <input
                      type="text"
                      defaultValue={(activeBlock as Block).properties?.arcText as string ?? 'Forever & Always'}
                      onBlur={(e) => patchBlockProperties((activeBlock as Block).id, { arcText: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); patchBlockProperties((activeBlock as Block).id, { arcText: (e.target as HTMLInputElement).value }); } }}
                      placeholder="Forever & Always"
                      className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 transition-all placeholder:text-neutral-600"
                    />
                  </div>

                  {/* Radius */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Curvature</p>
                      <span className="text-[10px] font-mono text-neutral-400">{(activeBlock as Block).properties?.arcRadius as number ?? 120}px</span>
                    </div>
                    <input type="range" aria-label="Arc radius" min={80} max={200} step={5}
                      value={(activeBlock as Block).properties?.arcRadius as number ?? 120}
                      onChange={e => patchBlockProperties((activeBlock as Block).id, { arcRadius: Number(e.target.value) })}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer bg-neutral-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:cursor-pointer" />
                  </div>

                  {/* Font size */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Font Size</p>
                      <span className="text-[10px] font-mono text-neutral-400">{(activeBlock as Block).properties?.arcFontSize as number ?? 22}px</span>
                    </div>
                    <input type="range" aria-label="Arc font size" min={12} max={48} step={1}
                      value={(activeBlock as Block).properties?.arcFontSize as number ?? 22}
                      onChange={e => patchBlockProperties((activeBlock as Block).id, { arcFontSize: Number(e.target.value) })}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer bg-neutral-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:cursor-pointer" />
                  </div>

                  {/* Start angle */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Rotation</p>
                      <span className="text-[10px] font-mono text-neutral-400">{(activeBlock as Block).properties?.arcStartAngle as number ?? 0}°</span>
                    </div>
                    <input type="range" aria-label="Arc start angle" min={0} max={360} step={5}
                      value={(activeBlock as Block).properties?.arcStartAngle as number ?? 0}
                      onChange={e => patchBlockProperties((activeBlock as Block).id, { arcStartAngle: Number(e.target.value) })}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer bg-neutral-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:cursor-pointer" />
                  </div>

                  {/* Color */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Color</p>
                      <span className="text-[10px] font-mono text-neutral-600">{(activeBlock as Block).properties?.arcColor as string || '#ffffff'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="relative w-7 h-7 rounded-lg overflow-hidden border border-neutral-700 cursor-pointer shrink-0">
                        <input type="color" aria-label="Arc text color"
                          value={(activeBlock as Block).properties?.arcColor as string || '#ffffff'}
                          onChange={e => patchBlockProperties((activeBlock as Block).id, { arcColor: e.target.value })}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        {/* eslint-disable-next-line react/forbid-dom-props */}
                        <span className="absolute inset-0 rounded-lg" style={{ backgroundColor: (activeBlock as Block).properties?.arcColor as string || '#ffffff' }} />
                      </label>
                      <input type="text" maxLength={7} aria-label="Arc color hex"
                        value={(activeBlock as Block).properties?.arcColor as string || '#ffffff'}
                        onChange={e => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) patchBlockProperties((activeBlock as Block).id, { arcColor: v }); }}
                        className="flex-1 px-2 py-1 rounded-lg text-[11px] font-mono bg-neutral-900 border border-neutral-700 text-neutral-200 focus:outline-none focus:border-teal-500 transition-all" />
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* ── Inspector (Transform / Opacity) ── */}
          {!!activeBlock && (
          <div className="border-t border-zinc-200 dark:border-neutral-800 pt-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 rounded-full bg-zinc-500" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Inspector</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Transform</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between"><label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Scale</label><span className="text-[10px] font-mono text-zinc-400">{layerScale}%</span></div>
                <input type="range" min="50" max="150" step="1" value={layerScale} onChange={e => setLayerScale(Number(e.target.value))} aria-label="Canvas scale" className="w-full accent-purple-500 h-1.5 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between"><label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Rotation</label><span className="text-[10px] font-mono text-zinc-400">{layerRotation}°</span></div>
                <input type="range" min="-30" max="30" step="1" value={layerRotation} onChange={e => setLayerRotation(Number(e.target.value))} aria-label="Canvas rotation" className="w-full accent-purple-500 h-1.5 rounded-full" />
              </div>
              {(layerScale !== 100 || layerRotation !== 0) && (
                <button type="button" onClick={() => { setLayerScale(100); setLayerRotation(0); }} className="text-[9px] text-neutral-600 hover:text-neutral-400 transition-colors font-medium">Reset transform</button>
              )}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Opacity</p><span className="text-[10px] font-mono text-zinc-400">{layerOpacity}%</span></div>
              <input type="range" min="0" max="100" step="1" value={layerOpacity} onChange={e => setLayerOpacity(Number(e.target.value))} aria-label="Canvas opacity" className="w-full accent-purple-500 h-1.5 rounded-full" />
            </div>

            {/* ── Layering ── */}
            {(() => {
              // Derive the selected block's position within the active scene so we
              // can disable the "already at limit" buttons accurately.
              const blockCount = activeScene?.blocks?.length ?? 0;
              const blockIdx   = activeBlockId
                ? (activeScene?.blocks?.findIndex((b: Block) => b.id === activeBlockId) ?? -1)
                : -1;
              const hasBlock    = blockIdx >= 0;
              const atFront     = hasBlock && blockIdx === blockCount - 1;
              const atBack      = hasBlock && blockIdx === 0;
              const btnBase     = "flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all text-[9px] font-bold uppercase tracking-widest";
              const btnActive   = "border-neutral-700 bg-neutral-800/80 text-neutral-300 hover:border-purple-500/60 hover:text-purple-300 hover:bg-purple-500/10";
              const btnDisabled = "border-neutral-800 bg-transparent text-neutral-700 cursor-not-allowed";
              return (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Layering</p>
                    {hasBlock && (
                      <span className="text-[9px] font-mono text-neutral-600">
                        {blockIdx + 1} / {blockCount}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {/* Send to Back */}
                    <button type="button" aria-label="Send to back" title="Send to Back"
                      disabled={!hasBlock || atBack}
                      onClick={() => activeBlockId && sendToBack(activeBlockId)}
                      className={`${btnBase} ${!hasBlock || atBack ? btnDisabled : btnActive}`}>
                      <LucideIcons.ChevronsDown className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    {/* Send Backward */}
                    <button type="button" aria-label="Send backward" title="Send Backward"
                      disabled={!hasBlock || atBack}
                      onClick={() => activeBlockId && sendBackward(activeBlockId)}
                      className={`${btnBase} ${!hasBlock || atBack ? btnDisabled : btnActive}`}>
                      <LucideIcons.ArrowDown className="w-3.5 h-3.5" />
                      <span>Down</span>
                    </button>
                    {/* Bring Forward */}
                    <button type="button" aria-label="Bring forward" title="Bring Forward"
                      disabled={!hasBlock || atFront}
                      onClick={() => activeBlockId && bringForward(activeBlockId)}
                      className={`${btnBase} ${!hasBlock || atFront ? btnDisabled : btnActive}`}>
                      <LucideIcons.ArrowUp className="w-3.5 h-3.5" />
                      <span>Up</span>
                    </button>
                    {/* Bring to Front */}
                    <button type="button" aria-label="Bring to front" title="Bring to Front"
                      disabled={!hasBlock || atFront}
                      onClick={() => activeBlockId && bringToFront(activeBlockId)}
                      className={`${btnBase} ${!hasBlock || atFront ? btnDisabled : btnActive}`}>
                      <LucideIcons.ChevronsUp className="w-3.5 h-3.5" />
                      <span>Front</span>
                    </button>
                  </div>
                  {!hasBlock && (
                    <p className="text-[9px] text-neutral-700 text-center">Select a block to adjust its layer</p>
                  )}
                </div>
              );
            })()}

            {/* ── Appearance ── */}
            {activeBlock && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Appearance</p>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Opacity</label>
                    <span className="text-[10px] font-mono text-zinc-400">{(activeBlock as Block).properties?.blockOpacity ?? 100}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={1}
                    value={(activeBlock as Block).properties?.blockOpacity ?? 100}
                    onChange={e => patchBlockProperties((activeBlock as Block).id, { blockOpacity: Number(e.target.value) })}
                    aria-label="Block opacity"
                    className="w-full accent-purple-500 h-1.5 rounded-full" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Corner Radius</label>
                    <span className="text-[10px] font-mono text-zinc-400">{(activeBlock as Block).properties?.blockBorderRadius ?? 0}px</span>
                  </div>
                  <input type="range" min={0} max={50} step={1}
                    value={(activeBlock as Block).properties?.blockBorderRadius ?? 0}
                    onChange={e => patchBlockProperties((activeBlock as Block).id, { blockBorderRadius: Number(e.target.value) })}
                    aria-label="Corner radius"
                    className="w-full accent-purple-500 h-1.5 rounded-full" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Backdrop Blur</label>
                    <span className="text-[10px] font-mono text-zinc-400">{(activeBlock as Block).properties?.backdropBlur ?? 0}px</span>
                  </div>
                  <input type="range" min={0} max={20} step={1}
                    value={(activeBlock as Block).properties?.backdropBlur ?? 0}
                    onChange={e => patchBlockProperties((activeBlock as Block).id, { backdropBlur: Number(e.target.value) })}
                    aria-label="Backdrop blur"
                    className="w-full accent-purple-500 h-1.5 rounded-full" />
                </div>
              </div>
            )}

            {/* ── Effects ── */}
            {activeBlock && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Effects</p>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Shadow / Glow</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      { id: 'none',         label: 'None'   },
                      { id: 'neon-glow',    label: 'Glow'   },
                      { id: 'drop-shadow',  label: 'Shadow' },
                    ] as { id: 'none' | 'neon-glow' | 'drop-shadow'; label: string }[]).map(fx => (
                      <button key={fx.id} type="button"
                        onClick={() => patchBlockProperties((activeBlock as Block).id, { dropShadow: fx.id })}
                        className={`py-2 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all ${((activeBlock as Block).properties?.dropShadow ?? 'none') === fx.id ? 'border-purple-500 bg-purple-500/15 text-purple-300' : 'border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400'}`}>
                        {fx.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Blending ── */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Blending</p>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">Mix Blend Mode</label>
                <div className="relative">
                  <select
                    value={(activeBlock as Block).properties?.blendMode ?? 'normal'}
                    onChange={e => patchBlockProperties((activeBlock as Block).id, { blendMode: e.target.value })}
                    aria-label="Blend mode"
                    className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500 transition-all appearance-none cursor-pointer"
                  >
                    {(['normal','multiply','screen','overlay','color-dodge','color-burn','hard-light','soft-light','difference','exclusion'] as const).map(m => (
                      <option key={m} value={m} className="bg-zinc-900 text-zinc-300">{m.charAt(0).toUpperCase() + m.slice(1).replace(/-/g, ' ')}</option>
                    ))}
                  </select>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* ── Border ── */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Border</p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Width</label>
                  <span className="text-[10px] font-mono text-zinc-400">{(activeBlock as Block).properties?.borderWidth ?? 0}px</span>
                </div>
                <input type="range" min={0} max={20} step={1}
                  value={(activeBlock as Block).properties?.borderWidth ?? 0}
                  onChange={e => patchBlockProperties((activeBlock as Block).id, { borderWidth: Number(e.target.value) })}
                  aria-label="Border width"
                  className="w-full accent-purple-500 h-1.5 rounded-full" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Color</label>
                  <span className="text-[10px] font-mono text-zinc-600">{((activeBlock as Block).properties?.borderColor as string) ?? '#ffffff'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative w-7 h-7 rounded-lg overflow-hidden border border-neutral-700 cursor-pointer shrink-0">
                    <input type="color"
                      value={((activeBlock as Block).properties?.borderColor as string) ?? '#ffffff'}
                      onChange={e => patchBlockProperties((activeBlock as Block).id, { borderColor: e.target.value })}
                      aria-label="Border color"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    {/* eslint-disable-next-line react/forbid-dom-props */}
                    <span className="absolute inset-0 rounded-lg" style={{ backgroundColor: ((activeBlock as Block).properties?.borderColor as string) ?? '#ffffff' }} />
                  </label>
                  <input type="text" maxLength={7}
                    value={((activeBlock as Block).properties?.borderColor as string) ?? '#ffffff'}
                    onChange={e => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) patchBlockProperties((activeBlock as Block).id, { borderColor: v }); }}
                    aria-label="Border color hex"
                    className="flex-1 px-2 py-1 rounded-lg text-[11px] font-mono bg-neutral-900 border border-neutral-700 text-neutral-200 focus:outline-none focus:border-purple-500 transition-all" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Style</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['solid', 'dashed', 'dotted'] as const).map(s => (
                    <button key={s} type="button"
                      onClick={() => patchBlockProperties((activeBlock as Block).id, { borderStyle: s })}
                      className={`py-2 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all capitalize ${((activeBlock as Block).properties?.borderStyle ?? 'solid') === s ? 'border-purple-500 bg-purple-500/15 text-purple-300' : 'border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
          )}

        </div>
      )}

      {/* ── WORLD TAB ───────────────────────────────────────────────── */}
      {leftPanelTab === 'world' && (
        <div className="space-y-4">

          <div className="flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-pink-500" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">Atmosphere</p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">Particle Presets</p>
            <button type="button" onClick={() => applyParticlePreset(null)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${particlePreset === null ? 'border-neutral-600 bg-neutral-800 text-neutral-200' : 'border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}>
              <div className="flex items-center gap-2"><span className="text-sm select-none">✕</span><span className="text-xs font-semibold">No Particles</span></div>
              {particlePreset === null && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_6px_#a855f7] shrink-0" />}
            </button>
            {PARTICLE_PRESETS.map((preset: typeof PARTICLE_PRESETS[0]) => (
              <button key={preset.id} type="button" onClick={() => applyParticlePreset(preset.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all ${particlePreset === preset.id ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}>
                <div className="flex items-center gap-2"><preset.Icon className="w-4 h-4 text-zinc-400" /><span className="text-xs font-semibold">{preset.label}</span></div>
                <div className={`relative w-8 h-4 rounded-full transition-all shrink-0 ${particlePreset === preset.id ? 'bg-purple-500' : 'bg-neutral-700'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${particlePreset === preset.id ? 'left-4' : 'left-0.5'}`} />
                </div>
              </button>
            ))}
          </div>

          {/* ── Particle Physics — only visible when a preset is active ── */}
          {particlePreset !== null && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Particle Physics</p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Density</label>
                  <span className="text-[10px] font-mono text-zinc-400">{particleDensity}</span>
                </div>
                <input type="range" min={10} max={200} step={5}
                  value={particleDensity}
                  onChange={e => {
                    const v = Number(e.target.value);
                    setParticleDensity(v);
                    setWebglDensity(v / 200);
                  }}
                  aria-label="Particle density"
                  className="w-full accent-purple-500 h-1.5 rounded-full" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Speed</label>
                  <span className="text-[10px] font-mono text-zinc-400">{(particleSpeed / 10).toFixed(1)}×</span>
                </div>
                <input type="range" min={1} max={30} step={1}
                  value={particleSpeed}
                  onChange={e => {
                    const v = Number(e.target.value);
                    setParticleSpeed(v);
                    setWebglSpeed(v / 10);
                  }}
                  aria-label="Particle speed"
                  className="w-full accent-purple-500 h-1.5 rounded-full" />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">Canvas Theme</p>
            {([
              { key: 'minimalist',      label: 'Minimalist',      cls: 'font-medium' },
              { key: 'dark-romance',    label: 'Dark Romance',    cls: 'font-serif tracking-wide' },
              { key: 'bright-birthday', label: 'Bright Birthday', cls: 'font-bold text-yellow-500' },
            ] as { key: string; label: string; cls: string }[]).map(t => (
              <button key={t.key} type="button" onClick={() => setTheme(t.key)}
                className={`w-full px-3 py-2 rounded-lg border text-left transition-all flex items-center justify-between ${theme === t.key ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}>
                <span className={`text-xs ${t.cls}`}>{t.label}</span>
                {theme === t.key && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_6px_#a855f7]" />}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">Ambient Background</p>
            {([
              { value: 'none',          label: 'None',             desc: 'Clean canvas'           },
              { value: 'fireflies',     label: 'Fireflies',     desc: 'Glowing floating dots'  },
              { value: 'floating-orbs', label: 'Floating Orbs', desc: 'Apple Music blur'       },
              { value: 'particles',     label: '✦ Particles',   desc: '3D drifting particles'  },
              { value: 'ember',         label: 'Ember',          desc: '3D rising fire embers'  },
            ] as { value: typeof ambientEffect; label: string; desc: string }[]).map(({ value, label, desc }) => (
              <button key={value} type="button" onClick={() => setAmbientEffect(value)}
                className={`w-full px-3 py-2 rounded-lg border text-left transition-all flex items-center justify-between ${ambientEffect === value ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}>
                <div><span className="text-xs font-medium block">{label}</span><span className="text-[10px] text-neutral-600">{desc}</span></div>
                {ambientEffect === value && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">3D Engine</p>
              <div className="flex gap-1">
                {([{ v: 'none', l: 'Off' }, { v: 'starfield', l: '✦' }, { v: 'waves', l: '〜' }] as { v: typeof ambientEffect; l: string }[]).map(({ v, l }) => (
                  <button key={v} type="button" onClick={() => setAmbientEffect(v)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${(v === 'none' ? !webglActive : ambientEffect === v) ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-neutral-600 hover:text-neutral-400 border border-neutral-800'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {webglActive && (
              <div className="space-y-2.5 pt-1">
                <div><div className="flex justify-between mb-1"><label className="text-[10px] text-neutral-500 uppercase tracking-wider">Speed</label><span className="text-[10px] text-neutral-400 tabular-nums">{webglSpeed.toFixed(1)}×</span></div><input type="range" min="1" max="30" value={Math.round(webglSpeed * 10)} onChange={e => setWebglSpeed(Number(e.target.value) / 10)} aria-label="Animation speed" className="w-full accent-purple-500" /></div>
                <div><div className="flex justify-between mb-1"><label className="text-[10px] text-neutral-500 uppercase tracking-wider">Density</label><span className="text-[10px] text-neutral-400 tabular-nums">{Math.round(webglDensity * 100)}%</span></div><input type="range" min="0" max="100" value={Math.round(webglDensity * 100)} onChange={e => setWebglDensity(Number(e.target.value) / 100)} aria-label="Particle density" className="w-full accent-purple-500" /></div>
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">Color</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(['#c4b5fd','#fda4af','#6ee7b7','#93c5fd','#fde047','#f97316'] as const).map(c => (
                      <button key={c} type="button" onClick={() => setWebglColor(c)} aria-label={`Color ${c}`}
                        className={`w-5 h-5 rounded-full shrink-0 transition-transform ${webglColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-neutral-900 scale-110' : 'hover:scale-105'}`}
                        style={{ background: c }} />
                    ))}
                    <input type="color" value={webglColor} onChange={e => setWebglColor(e.target.value)} title="Custom color" aria-label="Custom WebGL color" className="w-5 h-5 rounded-full cursor-pointer border-0 p-0 bg-transparent" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Post-Processing ── */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 space-y-3">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1.5 h-3.5 rounded-full bg-violet-500" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Post-Processing</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Vignette</label>
                <span className="text-[10px] font-mono text-zinc-400">{vignetteIntensity}%</span>
              </div>
              <input type="range" min={0} max={100} step={1}
                value={vignetteIntensity}
                onChange={e => setVignetteIntensity(Number(e.target.value))}
                aria-label="Vignette intensity"
                className="w-full accent-purple-500 h-1.5 rounded-full" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Bloom</label>
                <span className="text-[10px] font-mono text-zinc-400">{bloomIntensity}%</span>
              </div>
              <input type="range" min={0} max={100} step={1}
                value={bloomIntensity}
                onChange={e => setBloomIntensity(Number(e.target.value))}
                aria-label="Bloom intensity"
                className="w-full accent-purple-500 h-1.5 rounded-full" />
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="text-xs text-neutral-400">Haptic Feedback</label>
            <button type="button" onClick={() => setHapticsEnabled(!hapticsEnabled)} aria-label={hapticsEnabled ? 'Disable haptic feedback' : 'Enable haptic feedback'}
              className={`relative w-11 h-6 rounded-full transition-all ${hapticsEnabled ? 'bg-purple-600' : 'bg-neutral-700'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${hapticsEnabled ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          {/* ── Cinematic Soundscapes ── */}
          <div className="border-t border-zinc-200 dark:border-neutral-800 pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-3.5 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Cinematic Soundscapes</p>
            </div>
            {SOUNDSCAPES.map((track: typeof SOUNDSCAPES[0]) => {
              const isActive = activeSoundscape === track.id;
              return (
                <button key={track.id} type="button" onClick={() => toggleSoundscape(track.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all ${isActive ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.2)]' : 'border-neutral-800 hover:border-neutral-600'}`}>
                  <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-emerald-500/20' : 'bg-neutral-800'}`}>
                    <track.Icon className="w-4 h-4 text-neutral-400" />
                    {isActive && soundscapePlaying && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-neutral-300'}`}>{track.label}</p>
                    <p className="text-[10px] text-neutral-600 mt-0.5">{track.desc}</p>
                  </div>
                  <div className={`relative w-9 h-5 rounded-full transition-all shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-neutral-700'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isActive ? 'left-4' : 'left-0.5'}`} />
                  </div>
                </button>
              );
            })}
            {activeSoundscape && (
              <div className="mt-2 space-y-3 pt-2 border-t border-neutral-800/60">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Volume</label>
                    <span className="text-[10px] font-mono text-zinc-400">{audioVolume}%</span>
                  </div>
                  <input type="range" min={0} max={100} step={1}
                    value={audioVolume}
                    onChange={e => setAudioVolume(Number(e.target.value))}
                    aria-label="Soundscape volume"
                    className="w-full accent-purple-500 h-1.5 rounded-full" />
                </div>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Fade In on Load</span>
                  <input type="checkbox" checked={audioFadeIn} onChange={e => setAudioFadeIn(e.target.checked)}
                    aria-label="Fade in on load"
                    className="w-3.5 h-3.5 accent-purple-500 cursor-pointer rounded" />
                </label>
                <p className="text-[10px] text-emerald-400/60 text-center">{soundscapePlaying ? '♪ Now playing' : 'Click track to play'}</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

// ─── Free-placed block shared metadata ───────────────────────────────────────

const PLACED_BLOCK_META: Record<string, { Icon: React.ComponentType<{ className?: string }>; label: string; accentCls: string }> = {
  headline:        { Icon: LucideIcons.Type,              label: 'Headline',   accentCls: 'border-purple-500/60  bg-purple-500/10'  },
  paragraph:       { Icon: LucideIcons.AlignLeft,         label: 'Paragraph',  accentCls: 'border-purple-500/60  bg-purple-500/10'  },
  button:          { Icon: LucideIcons.MousePointerClick, label: 'Button',     accentCls: 'border-emerald-500/60 bg-emerald-500/10' },
  video:           { Icon: LucideIcons.Video,             label: 'Video',      accentCls: 'border-red-500/60     bg-red-500/10'     },
  image:           { Icon: LucideIcons.ImageIcon,         label: 'Image',      accentCls: 'border-blue-500/60    bg-blue-500/10'    },
  countdown:       { Icon: LucideIcons.Timer,             label: 'Countdown',  accentCls: 'border-amber-500/60   bg-amber-500/10'   },
  'gallery-stack': { Icon: LucideIcons.LayoutGrid,        label: 'Gallery',    accentCls: 'border-emerald-500/60 bg-emerald-500/10' },
  audio:           { Icon: LucideIcons.Music,             label: 'Audio',      accentCls: 'border-green-500/60   bg-green-500/10'   },
  'rsvp-form':     { Icon: LucideIcons.ClipboardList,     label: 'RSVP Form',  accentCls: 'border-pink-500/60    bg-pink-500/10'    },
  lottie:          { Icon: LucideIcons.Wind,              label: 'Lottie',     accentCls: 'border-purple-500/60  bg-purple-500/10'  },
  vector:          { Icon: LucideIcons.Shapes,            label: 'Vector',     accentCls: 'border-violet-500/60  bg-violet-500/10'  },
  carousel:        { Icon: LucideIcons.GalleryHorizontal, label: 'Carousel',   accentCls: 'border-sky-500/60     bg-sky-500/10'     },
  scribble:        { Icon: LucideIcons.Pencil,            label: 'Scribble',   accentCls: 'border-pink-500/60    bg-pink-500/10'    },
  'arc-text':      { Icon: LucideIcons.RefreshCw,         label: 'Arc Text',   accentCls: 'border-teal-500/60    bg-teal-500/10'    },
};

const FIDELITY_TYPES = new Set(['countdown', 'rsvp-form', 'headline', 'paragraph', 'button', 'video', 'gallery-stack', 'audio', 'map', 'lottie', 'vector', 'carousel', 'scribble', 'arc-text']);

// ─── FreePlacedBlock — self-contained draggable block ────────────────────────

function FreePlacedBlock({ block }: { block: Block }) {
  const {
    activeBlockId, setActiveBlockId, setSelectedItem, setLeftPanelTab,
    editingBlockId, setEditingBlockId, updateBlock, setContextMenu,
    canvasZoom, selectedFont,
  } = useS();

  const isSel      = activeBlockId === block.id;
  const isFidelity = FIDELITY_TYPES.has(block.type);
  const meta       = PLACED_BLOCK_META[block.type] ?? { Icon: LucideIcons.Package, label: block.type, accentCls: 'border-neutral-600 bg-neutral-800' };

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [localPos, setLocalPos]     = useState({ x: block.x ?? 0, y: block.y ?? 0 });
  const dragStartRef    = useRef<{ mouseX: number; mouseY: number; blockX: number; blockY: number } | null>(null);
  const canvasZoomRef   = useRef(canvasZoom);
  const updateBlockRef  = useRef(updateBlock);
  const hasMovedRef     = useRef(false);

  useEffect(() => { canvasZoomRef.current  = canvasZoom;    }, [canvasZoom]);
  useEffect(() => { updateBlockRef.current = updateBlock;   }, [updateBlock]);

  // Sync localPos from external position changes (undo/redo) while not mid-drag
  useEffect(() => {
    if (!isDragging) setLocalPos({ x: block.x ?? 0, y: block.y ?? 0 });
  }, [block.x, block.y, isDragging]);

  // Window-level drag listeners — attached only while a drag is active
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = (e.clientX - dragStartRef.current.mouseX) / canvasZoomRef.current;
      const dy = (e.clientY - dragStartRef.current.mouseY) / canvasZoomRef.current;
      hasMovedRef.current = Math.hypot(dx, dy) > 4;
      setLocalPos({ x: dragStartRef.current.blockX + dx, y: dragStartRef.current.blockY + dy });
    };
    const onUp = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = (e.clientX - dragStartRef.current.mouseX) / canvasZoomRef.current;
      const dy = (e.clientY - dragStartRef.current.mouseY) / canvasZoomRef.current;
      const newX = dragStartRef.current.blockX + dx;
      const newY = dragStartRef.current.blockY + dy;
      setLocalPos({ x: newX, y: newY });
      updateBlockRef.current(block.id, { x: newX, y: newY });
      setIsDragging(false);
      dragStartRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, [isDragging, block.id]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (editingBlockId === block.id) return;
    e.stopPropagation();
    e.preventDefault();
    hasMovedRef.current  = false;
    dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, blockX: localPos.x, blockY: localPos.y };
    setIsDragging(true);
    setActiveBlockId(block.id);
    setSelectedItem(block.type);
    setLeftPanelTab('style');
  };

  // Inner node
  const displayText = block.properties?.text ?? block.content ?? '';
  let innerNode: React.ReactNode;

  if (block.type === 'countdown') {
    innerNode = <LiveCountdown targetDate={block.targetDate ?? COUNTDOWN_FALLBACK} properties={block.properties} />;
  } else if (block.type === 'rsvp-form') {
    innerNode = <RsvpForm properties={block.properties} />;
  } else if (block.type === 'headline') {
    const hFont    = (block.properties?.fontFamily as string) || FONTS.find(f => f.id === selectedFont)?.css;
    const hSize    = (block.properties?.fontSize as number)   || 36;
    const hEditing = editingBlockId === block.id;
    const hAnimType = block.properties?.animationType as string | undefined;
    const hTextStyle: React.CSSProperties = { fontFamily: hFont, fontSize: `${hSize}px`, lineHeight: 1.2 };
    innerNode = (
      <div className="relative w-full px-5 pt-5 pb-6 text-center overflow-hidden" style={hTextStyle}>
        {hEditing ? (
          <textarea
            autoFocus
            defaultValue={displayText}
            rows={1}
            aria-label="Edit headline"
            placeholder="New Headline"
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => { updateBlock(block.id, { content: e.target.value }); setEditingBlockId(null); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); updateBlock(block.id, { content: (e.target as HTMLTextAreaElement).value }); setEditingBlockId(null); }
              if (e.key === 'Escape') setEditingBlockId(null);
            }}
            className="w-full bg-transparent border-none outline-none resize-none text-center font-bold text-white break-words placeholder:text-neutral-600"
            style={hTextStyle}
          />
        ) : hAnimType === 'blur-words' ? (
          <BlurWords text={displayText || 'New Headline'} className="font-bold text-white break-words" />
        ) : (
          <p className="font-bold text-white break-words">{displayText || 'New Headline'}</p>
        )}
        {hAnimType === 'shiny' && !hEditing && (
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.52) 50%, transparent 80%)", animation: "hc-shimmer 2.4s linear infinite" }} />
        )}
      </div>
    );
  } else if (block.type === 'paragraph') {
    const pFont    = (block.properties?.fontFamily as string) || FONTS.find(f => f.id === selectedFont)?.css;
    const pSize    = (block.properties?.fontSize as number)   || 16;
    const pEditing = editingBlockId === block.id;
    const pAnimType = block.properties?.animationType as string | undefined;
    const pTextStyle: React.CSSProperties = { fontFamily: pFont, fontSize: `${pSize}px`, lineHeight: 1.6 };
    innerNode = (
      <div className="relative w-full px-5 pt-4 pb-5 text-center overflow-hidden" style={pTextStyle}>
        {pEditing ? (
          <textarea
            autoFocus
            defaultValue={displayText}
            rows={3}
            aria-label="Edit paragraph"
            placeholder="Start writing your story..."
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => { updateBlock(block.id, { content: e.target.value }); setEditingBlockId(null); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); updateBlock(block.id, { content: (e.target as HTMLTextAreaElement).value }); setEditingBlockId(null); }
              if (e.key === 'Escape') setEditingBlockId(null);
            }}
            className="w-full bg-transparent border-none outline-none resize-none text-center text-neutral-300 break-words placeholder:text-neutral-600"
            style={pTextStyle}
          />
        ) : pAnimType === 'blur-words' ? (
          <BlurWords text={displayText || 'Start writing your story...'} className="text-neutral-300 break-words" />
        ) : (
          <p className="text-neutral-300 break-words">{displayText || 'Start writing your story...'}</p>
        )}
        {pAnimType === 'shiny' && !pEditing && (
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.52) 50%, transparent 80%)", animation: "hc-shimmer 2.4s linear infinite" }} />
        )}
      </div>
    );
  } else if (block.type === 'button') {
    const btnLabel  = block.content || 'Click Here';
    const btnColor  = (block.properties?.accentColor as string) || '#10b981';
    const btnRadius = (block.properties?.blockBorderRadius as number) ?? 12;
    innerNode = (
      <div className="flex items-center justify-center px-5 py-5">
        <button
          type="button"
          style={{ backgroundColor: btnColor, borderRadius: `${btnRadius}px` }}
          className="px-8 py-3 text-white text-sm font-bold tracking-wide pointer-events-none shadow-lg"
        >
          {btnLabel}
        </button>
      </div>
    );
  } else if (block.type === 'video') {
    innerNode = (
      <VideoBlock
        content={block.content}
        onContentChange={(url) => updateBlock(block.id, { content: url })}
      />
    );
  } else if (block.type === 'gallery-stack') {
    innerNode = <MasonryGallery images={block.images} properties={block.properties}
      onImagesChange={(urls) => updateBlock(block.id, { images: urls })} />;
  } else if (block.type === 'audio') {
    innerNode = <AudioBlock audioUrl={block.audioUrl} audioVolume={block.audioVolume ?? 80} onVolumeChange={(vol) => updateBlock(block.id, { audioVolume: vol })} />;
  } else if (block.type === 'map') {
    innerNode = <GoogleMap properties={block.properties} />;
  } else if (block.type === 'lottie') {
    innerNode = <LottiePlayer properties={block.properties} />;
  } else if (block.type === 'vector') {
    innerNode = <VectorArt properties={block.properties} />;
  } else if (block.type === 'carousel') {
    innerNode = <CarouselSlideshow images={block.images} properties={block.properties}
      onImagesChange={(urls) => updateBlock(block.id, { images: urls })} />;
  } else if (block.type === 'icon') {
    const fpIconName = block.content || 'Heart';
    const fpIconSize = (block.properties?.iconSize as number)        || 64;
    const fpIconStr  = (block.properties?.iconStrokeWidth as number) || 2;
    const fpIconCol  = (block.properties?.iconColor as string)       || '#ec4899';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const FpIconComp = (LucideIcons as any)[fpIconName] ?? LucideIcons.HelpCircle;
    innerNode = (
      <div className="flex items-center justify-center p-5">
        {React.createElement(FpIconComp, { size: fpIconSize, strokeWidth: fpIconStr, color: fpIconCol })}
      </div>
    );
  } else if (block.type === 'scribble') {
    innerNode = (
      <ScribbleBlock
        paths={(block.properties?.scribblePaths as string[]) ?? []}
        strokeColor={(block.properties?.scribbleColor as string) ?? '#a855f7'}
        strokeWidth={(block.properties?.scribbleWidth as number) ?? 3}
        onPathsChange={(paths) => updateBlock(block.id, { properties: { ...block.properties, scribblePaths: paths } })}
      />
    );
  } else if (block.type === 'arc-text') {
    innerNode = (
      <ArcTextBlock
        text={(block.properties?.arcText as string) ?? undefined}
        radius={(block.properties?.arcRadius as number) ?? undefined}
        color={(block.properties?.arcColor as string) ?? undefined}
        fontSize={(block.properties?.arcFontSize as number) ?? undefined}
        startAngle={(block.properties?.arcStartAngle as number) ?? undefined}
      />
    );
  } else {
    innerNode = (
      <>
        <meta.Icon className="w-6 h-6 text-neutral-400" />
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${isSel ? 'text-white' : 'text-neutral-400'}`}>{meta.label}</span>
      </>
    );
  }

  const cursor = editingBlockId === block.id ? 'cursor-text' : isDragging ? 'cursor-grabbing' : 'cursor-grab';

  return (
    <motion.div
      initial={{ scale: 0.75, opacity: 0 }}
      animate={{ scale: isDragging ? 1.03 : 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      style={{
        position: 'absolute',
        left: localPos.x,
        top:  localPos.y,
        transform: 'translate(-50%, -50%)',
        zIndex: isDragging ? 100 : undefined,
      }}
      className={`select-none rounded-2xl border-2 transition-colors backdrop-blur-md overflow-hidden ${cursor} ${
        isFidelity ? 'w-80' : 'w-32 flex flex-col items-center justify-center gap-1.5 py-4 px-3'
      } ${
        isSel
          ? `${meta.accentCls} ring-2 ring-purple-500 ring-offset-2 ring-offset-zinc-950 shadow-[0_0_24px_rgba(168,85,247,0.35)]`
          : 'border-neutral-700/60 bg-neutral-900/90 hover:border-purple-500/50 hover:shadow-[0_0_18px_rgba(168,85,247,0.18)]'
      } ${isDragging ? 'shadow-[0_30px_60px_rgba(0,0,0,0.7)]' : 'shadow-xl'}`}
      onMouseDown={onMouseDown}
      onClick={(e) => {
        if (hasMovedRef.current) { hasMovedRef.current = false; return; }
        e.stopPropagation();
        setSelectedItem(block.type);
        setActiveBlockId(block.id);
        setLeftPanelTab('style');
      }}
      onDoubleClick={(e) => {
        if (block.type !== 'headline' && block.type !== 'paragraph') return;
        e.stopPropagation();
        setEditingBlockId(block.id);
      }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id }); }}
    >
      {innerNode}
      {isSel && <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7] z-10" />}
    </motion.div>
  );
}

// ─── Center Canvas ────────────────────────────────────────────────────────────

function CenterCanvas() {
  const {
    canvasZoom, setCanvasZoom, canvasPanX, setCanvasPanX, canvasPanY, setCanvasPanY,
    isPanningWorkspace, setIsPanningWorkspace, panStartRef, workspaceRef,
    ambientEffect, webglActive, webglSpeed, webglDensity, webglColor,
    canvasBackground,
    vignetteIntensity, bloomIntensity,
    layerOpacity, layerScale, layerRotation,
    activeSceneId, activeScene, scenes,
    handleBackgroundClick, selectedItem, setSelectedItem, activeBlockId, setActiveBlockId, editingBlockId, setEditingBlockId,
    theme, setTheme, currentTheme, imageBorderRadius, imageShadow, imageUrl,
    selectedFont, headlineEditor, paragraphEditor,
    sensors, handleDragEnd, updateBlock, deleteBlock, addBlockAtPosition,
    contextMenu, setContextMenu,
    undo, redo, canUndo, canRedo,
    handlePublish, isSavingGift, handlePublishLive, isPublishing, projectId, saveStatus,
    setLeftPanelTab,
    sceneDrawerOpen, setSceneDrawerOpen,
    handleSceneChange, handleAddScene, handleDeleteScene, handleRenameScene, handleDuplicateScene,
    isLeftOpen, setIsLeftOpen, isRightOpen, setIsRightOpen,
    environment,
    activeTool, setActiveTool,
    comments, addComment, removeComment,
  } = useS();

  const { credits } = useCredits();

  const SHADOW_STYLES_LOCAL: Record<string, string> = {
    none:   'none',
    soft:   '0 4px 20px rgba(0,0,0,0.18)',
    strong: '0 8px 36px rgba(0,0,0,0.45)',
    glow:   '0 0 28px rgba(168,85,247,0.45)',
  };

  const [isDragOver,    setIsDragOver]    = useState(false);
  const [isExporting,   setIsExporting]   = useState(false);
  const [spacebarHeld,  setSpacebarHeld]  = useState(false);

  // ── Spacebar hold → engage pan mode ──────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      setSpacebarHeld(true);
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') { setSpacebarHeld(false); setIsPanningWorkspace(false); }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
    };
  }, []);

  // ── PNG export ────────────────────────────────────────────────────────────
  // Captures the live canvas DOM node as a high-resolution PNG and triggers a
  // browser download. useCORS is required so Replicate/AI-generated images
  // (hosted on external domains) are included in the render rather than
  // appearing as blank rectangles.
  const handleDownload = async () => {
    const element = document.getElementById('heartcraft-export-zone');
    if (!element) return;
    setIsExporting(true);
    try {
      const html2canvas = await loadHtml2Canvas();
      const capturedCanvas = await html2canvas(element, {
        useCORS:         true,   // allow cross-origin images (AI art, CDN assets)
        backgroundColor: null,   // preserve transparent / gradient backgrounds
        scale:           2,      // 2× pixel density for crisp prints
        logging:         false,
      });
      const dataUrl = capturedCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href     = dataUrl;
      link.download = 'heartcraft-gift.png';
      link.click();
    } catch (err) {
      console.error('[Aevaia] PNG export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // ── Comment mode local state ──────────────────────────────────────────────
  const [pendingComment, setPendingComment] = useState<{
    canvasX: number; canvasY: number;
    screenX: number; screenY: number;
  } | null>(null);
  const [commentMsg,    setCommentMsg]    = useState('');
  const [commentAuthor, setCommentAuthor] = useState(
    () => (typeof window !== 'undefined' ? (localStorage.getItem('hc_commenter') ?? '') : '')
  );

  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const blockType = e.dataTransfer.getData('blockType') as Block['type'];
    if (!blockType) return;
    // Get position relative to the canvas card, corrected for zoom
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvasZoom;
    const y = (e.clientY - rect.top)  / canvasZoom;
    addBlockAtPosition(blockType, Math.round(x), Math.round(y));
    // Select the new block immediately so the right sidebar morphs
    setLeftPanelTab('style');
  };


  return (
    <div className="flex-1 relative h-full flex flex-col">

      {/* ── Top action bar ── */}
      <div className="shrink-0 h-14 relative flex items-center justify-end w-full px-4 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 z-20" onClick={(e) => e.stopPropagation()}>

        {/* CENTER: publish actions — absolutely centered in the bar */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3">
          <motion.button onClick={handlePublish} disabled={isSavingGift}
            animate={isSavingGift ? { boxShadow: ['0 0 0px rgba(34,197,94,0)', '0 0 20px rgba(34,197,94,0.4)', '0 0 0px rgba(34,197,94,0)'] } : { boxShadow: '0 0 0px rgba(0,0,0,0)' }}
            transition={isSavingGift ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } : { duration: 0.3 }}
            className={`px-6 py-2 text-sm font-bold rounded-full flex items-center gap-2 transition-colors select-none ${isSavingGift ? 'bg-green-500/80 text-white cursor-wait' : 'bg-green-500 hover:bg-green-600 text-white shadow-lg'}`}>
            {isSavingGift ? <><svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Saving…</> : <><LucideIcons.Rocket className="w-3.5 h-3.5 shrink-0" />Publish Design</>}
          </motion.button>
          {projectId && (
            <motion.button type="button" onClick={handlePublishLive} disabled={isPublishing} whileTap={{ scale: 0.97 }}
              className={`px-4 py-2 text-sm font-bold rounded-full flex items-center gap-1.5 transition-all border ${isPublishing ? 'bg-transparent border-purple-500/30 text-purple-400/60 cursor-wait' : 'bg-purple-600/10 border-purple-500/40 text-purple-300 hover:bg-purple-600/20 hover:text-white'}`}>
              {isPublishing ? <span className="w-3 h-3 rounded-full border-2 border-purple-400/30 border-t-purple-400 animate-spin" /> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>}
              {isPublishing ? 'Publishing…' : 'Publish Live'}
            </motion.button>
          )}
          <button type="button" onClick={handleDownload} disabled={isExporting} title="Download canvas as PNG" aria-label="Download PNG"
            className={`px-3.5 py-2 text-sm font-bold rounded-full flex items-center gap-1.5 border transition-all select-none ${isExporting ? 'bg-transparent border-zinc-700 text-zinc-600 cursor-wait' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white hover:border-zinc-600'}`}>
            {isExporting
              ? <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
              : React.createElement((LucideIcons as any)['Download'] ?? LucideIcons.HelpCircle, { size: 14, strokeWidth: 2 })
            }
            {isExporting ? 'Exporting…' : 'PNG'}
          </button>
        </div>

        {/* RIGHT: credits badge — sits at the far right via justify-end */}
        <div className="flex items-center gap-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-full text-xs font-semibold select-none shadow-[0_0_12px_rgba(168,85,247,0.15)] transition-all">
          {React.createElement((LucideIcons as any)['Sparkles'] ?? LucideIcons.HelpCircle, { size: 12, strokeWidth: 2 })}
          {credits.toLocaleString()} Credits
        </div>
      </div>

      {/* ── Infinite workspace ── */}
      <div ref={workspaceRef}
        className={`flex-1 relative overflow-hidden ${
          isPanningWorkspace
            ? 'cursor-grabbing'
            : spacebarHeld
            ? 'cursor-grab'
            : activeTool === 'comment'
            ? 'cursor-crosshair'
            : 'cursor-default'
        }`}
        style={{ backgroundImage: 'radial-gradient(circle, rgba(113,113,122,0.22) 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }}
        onMouseDown={(e) => {
          if (e.button === 1) {
            // Middle mouse button → pan from anywhere on the canvas
            e.preventDefault();
            setIsPanningWorkspace(true);
            panStartRef.current = { x: e.clientX, y: e.clientY, px: canvasPanX, py: canvasPanY };
            return;
          }
          if (e.target !== e.currentTarget) return;
          if (activeTool === 'comment') return; // comment clicks handled by onClick
          handleBackgroundClick();
          setIsPanningWorkspace(true);
          panStartRef.current = { x: e.clientX, y: e.clientY, px: canvasPanX, py: canvasPanY };
        }}
        onClick={(e) => {
          if (activeTool !== 'comment') return;
          if (e.target !== e.currentTarget) return;
          const rect = workspaceRef.current!.getBoundingClientRect();
          setPendingComment({
            canvasX: Math.round((e.clientX - rect.left) / canvasZoom),
            canvasY: Math.round((e.clientY - rect.top)  / canvasZoom),
            screenX: e.clientX,
            screenY: e.clientY,
          });
          setCommentMsg('');
        }}>

        {/* ── Spacebar-pan capture layer — sits above blocks, intercepts pointer ── */}
        {spacebarHeld && (
          <div
            className={`absolute inset-0 z-50 ${isPanningWorkspace ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              e.preventDefault();
              setIsPanningWorkspace(true);
              panStartRef.current = { x: e.clientX, y: e.clientY, px: canvasPanX, py: canvasPanY };
            }}
          />
        )}

        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(calc(-50% + ${canvasPanX}px), calc(-50% + ${canvasPanY}px)) scale(${canvasZoom})`, transformOrigin: 'center center' }}>
          <div
            onClick={(e) => { if (e.target === e.currentTarget) { setSelectedItem('none'); setActiveBlockId(null); } e.stopPropagation(); }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleCanvasDrop}
            id="heartcraft-export-zone"
            className={`w-[720px] min-h-[560px] rounded-2xl shadow-2xl shadow-black/50 border-2 overflow-y-auto transition-colors duration-500 ${(currentTheme as Record<string,string>).canvasBg} ${isDragOver ? 'ring-2 ring-purple-500/50 ring-offset-2 ring-offset-transparent' : 'ring-1 ring-white/10'}`}
            style={{ opacity: layerOpacity / 100, transform: `scale(${layerScale / 100}) rotate(${layerRotation}deg)`, transformOrigin: 'top center' }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeSceneId} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.35, ease: "easeInOut" }} className="relative">
                {/* ── BackgroundRenderer — absolute lowest z-index layer ── */}
                {canvasBackground !== 'none' && (() => {
                  const Effect = getEffectComponent(canvasBackground);
                  return Effect ? (
                    <div
                      className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
                      aria-hidden="true"
                    >
                      <Effect />
                    </div>
                  ) : null;
                })()}
                <AtmosphereRenderer particles={(environment as { particles: string }).particles} />
                <AmbientEffects effect={ambientEffect} />
                {/* ── Bloom overlay (screen blend, boosts WebGL glow) ── */}
                {(bloomIntensity as number) > 0 && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 40%, rgba(168,85,247,${(bloomIntensity as number) / 200}) 0%, transparent 68%)`, mixBlendMode: 'screen', zIndex: 15 }} />
                )}
                {/* ── Vignette overlay (darkens edges for cinematic focus) ── */}
                {(vignetteIntensity as number) > 0 && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,${((vignetteIntensity as number) / 100) * 0.88}) 100%)`, zIndex: 20 }} />
                )}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext
                    items={(activeScene as Scene).blocks.filter((b: Block) => b.x === undefined).map((b: Block) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="p-8 flex flex-col gap-6" onClick={(e) => { if (e.target === e.currentTarget) { setSelectedItem('none'); setActiveBlockId(null); } }}>
                      {(activeScene as Scene).blocks.filter((b: Block) => b.x === undefined).map((block: Block) => {
                        if (block.type === 'image') {
                          return (
                            <SortableBlock key={block.id} id={block.id} isSelected={activeBlockId === block.id} onClick={() => { setSelectedItem('image'); setActiveBlockId(block.id); setLeftPanelTab('style'); }}>
                              <div className={`h-64 relative cursor-pointer transition-all duration-300 ${activeBlockId === block.id ? 'ring-2 ring-purple-500/60' : 'hover:opacity-90'}`}
                                style={{ borderRadius: `${imageBorderRadius}px`, boxShadow: SHADOW_STYLES_LOCAL[imageShadow] }}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id }); }}>
                                <div className={`w-full h-full overflow-hidden flex items-center justify-center ${(currentTheme as Record<string,string>).imageArea}`} style={{ borderRadius: `${imageBorderRadius}px` }}>
                                  {(block.content || imageUrl) ? (
                                    <img src={block.content || imageUrl} alt="Generated art" className="w-full h-full object-cover"
                                      style={{ filter: block.filters ? buildFilterString(block.filters) : undefined }} />
                                  ) : (
                                    <LucideIcons.Camera className="w-12 h-12 text-neutral-600 drop-shadow-xl" />
                                  )}
                                </div>
                              </div>
                            </SortableBlock>
                          );
                        }
                        if (block.type === 'headline') {
                          const hFont = (block.properties?.fontFamily as string) || FONTS.find((f: typeof FONTS[0]) => f.id === selectedFont)?.css;
                          const hSize = (block.properties?.fontSize as number) || 48;
                          const hIsSelected = activeBlockId === block.id;
                          const hAnimType = block.properties?.animationType as string | undefined;
                          return (
                            <SortableBlock key={block.id} id={block.id} isSelected={hIsSelected} onClick={() => { setSelectedItem('headline'); setActiveBlockId(block.id); setLeftPanelTab('style'); }}>
                              <div
                                className={`relative rounded-xl transition-all overflow-hidden ${hIsSelected ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent shadow-[0_0_20px_rgba(168,85,247,0.2)]' : ''}`}
                                style={{
                                  opacity: ((block.properties?.blockOpacity as number) ?? 100) / 100,
                                  backdropFilter: (block.properties?.backdropBlur as number) ? `blur(${block.properties?.backdropBlur}px)` : undefined,
                                  borderRadius: (block.properties?.blockBorderRadius as number) ? `${block.properties?.blockBorderRadius}px` : undefined,
                                  mixBlendMode: block.properties?.blendMode ? (block.properties.blendMode as React.CSSProperties['mixBlendMode']) : undefined,
                                  border: (block.properties?.borderWidth as number) ? `${block.properties?.borderWidth}px ${(block.properties?.borderStyle as string) || 'solid'} ${(block.properties?.borderColor as string) || '#ffffff'}` : undefined,
                                }}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id }); }}>
                                <textarea
                                  value={block.content || ''}
                                  onChange={(e) => {
                                    updateBlock(block.id, { content: e.target.value });
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                  }}
                                  onFocus={() => { setSelectedItem('headline'); setActiveBlockId(block.id); setLeftPanelTab('style'); }}
                                  placeholder="Happy Anniversary!"
                                  rows={1}
                                  style={{
                                    fontFamily: hFont,
                                    fontSize: `${hSize}px`,
                                    lineHeight: ((block.properties?.lineHeight as number) || 120) / 100,
                                    letterSpacing: `${(block.properties?.letterSpacing as number) || 0}px`,
                                    textAlign: ((block.properties?.textAlign as 'left' | 'center' | 'right') || 'center'),
                                    color: (block.properties?.color as string) || undefined,
                                    textShadow: block.properties?.dropShadow === 'neon-glow'
                                      ? '0 0 14px rgba(168,85,247,0.9), 0 0 32px rgba(168,85,247,0.4)'
                                      : block.properties?.dropShadow === 'drop-shadow'
                                      ? '0 2px 16px rgba(0,0,0,0.95), 0 4px 32px rgba(0,0,0,0.6)'
                                      : undefined,
                                  }}
                                  className="w-full bg-transparent border-none outline-none resize-none cursor-text px-4 py-3 placeholder:text-neutral-600 overflow-hidden"
                                />
                                {hAnimType === 'shiny' && (
                                  <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
                                    <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.52) 50%, transparent 80%)", animation: "hc-shimmer 2.4s linear infinite" }} />
                                  </div>
                                )}
                                {hAnimType === 'blur-words' && (
                                  <div aria-hidden="true" className="absolute top-2 right-2 pointer-events-none flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25">
                                    <LucideIcons.Eye className="w-2.5 h-2.5 text-blue-400" />
                                    <span className="text-[8px] font-bold text-blue-400 uppercase tracking-wide">Blur</span>
                                  </div>
                                )}
                              </div>
                            </SortableBlock>
                          );
                        }
                        if (block.type === 'paragraph') {
                          const pFont = (block.properties?.fontFamily as string) || FONTS.find((f: typeof FONTS[0]) => f.id === selectedFont)?.css;
                          const pSize = (block.properties?.fontSize as number) || 16;
                          const pIsSelected = activeBlockId === block.id;
                          const pAnimType = block.properties?.animationType as string | undefined;
                          return (
                            <SortableBlock key={block.id} id={block.id} isSelected={pIsSelected} onClick={() => { setSelectedItem('paragraph'); setActiveBlockId(block.id); setLeftPanelTab('style'); }}>
                              <div
                                className={`relative rounded-xl transition-all overflow-hidden ${pIsSelected ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent shadow-[0_0_20px_rgba(168,85,247,0.2)]' : ''}`}
                                style={{
                                  opacity: ((block.properties?.blockOpacity as number) ?? 100) / 100,
                                  backdropFilter: (block.properties?.backdropBlur as number) ? `blur(${block.properties?.backdropBlur}px)` : undefined,
                                  borderRadius: (block.properties?.blockBorderRadius as number) ? `${block.properties?.blockBorderRadius}px` : undefined,
                                  mixBlendMode: block.properties?.blendMode ? (block.properties.blendMode as React.CSSProperties['mixBlendMode']) : undefined,
                                  border: (block.properties?.borderWidth as number) ? `${block.properties?.borderWidth}px ${(block.properties?.borderStyle as string) || 'solid'} ${(block.properties?.borderColor as string) || '#ffffff'}` : undefined,
                                }}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id }); }}>
                                <textarea
                                  value={block.content || ''}
                                  onChange={(e) => {
                                    updateBlock(block.id, { content: e.target.value });
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                  }}
                                  onFocus={() => { setSelectedItem('paragraph'); setActiveBlockId(block.id); setLeftPanelTab('style'); }}
                                  placeholder="Type your message here"
                                  rows={3}
                                  style={{
                                    fontFamily: pFont,
                                    fontSize: `${pSize}px`,
                                    lineHeight: ((block.properties?.lineHeight as number) || 160) / 100,
                                    letterSpacing: `${(block.properties?.letterSpacing as number) || 0}px`,
                                    textAlign: ((block.properties?.textAlign as 'left' | 'center' | 'right') || 'center'),
                                    color: (block.properties?.color as string) || undefined,
                                    textShadow: block.properties?.dropShadow === 'neon-glow'
                                      ? '0 0 14px rgba(168,85,247,0.9), 0 0 32px rgba(168,85,247,0.4)'
                                      : block.properties?.dropShadow === 'drop-shadow'
                                      ? '0 2px 16px rgba(0,0,0,0.95), 0 4px 32px rgba(0,0,0,0.6)'
                                      : undefined,
                                  }}
                                  className="w-full bg-transparent border-none outline-none resize-none cursor-text px-4 py-3 placeholder:text-neutral-600 overflow-hidden"
                                />
                                {pAnimType === 'shiny' && (
                                  <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
                                    <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.52) 50%, transparent 80%)", animation: "hc-shimmer 2.4s linear infinite" }} />
                                  </div>
                                )}
                                {pAnimType === 'blur-words' && (
                                  <div aria-hidden="true" className="absolute top-2 right-2 pointer-events-none flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25">
                                    <LucideIcons.Eye className="w-2.5 h-2.5 text-blue-400" />
                                    <span className="text-[8px] font-bold text-blue-400 uppercase tracking-wide">Blur</span>
                                  </div>
                                )}
                              </div>
                            </SortableBlock>
                          );
                        }
                        if (block.type === 'icon') {
                          const isSel    = activeBlockId === block.id;
                          const iconName = block.content || 'Heart';
                          const iconSize = (block.properties?.iconSize as number)        || 64;
                          const iconStr  = (block.properties?.iconStrokeWidth as number) || 2;
                          const iconCol  = (block.properties?.iconColor as string)       || '#ec4899';
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const IconComp = (LucideIcons as any)[iconName] ?? LucideIcons.HelpCircle;
                          return (
                            <SortableBlock key={block.id} id={block.id} isSelected={isSel}
                              onClick={() => { setSelectedItem('icon'); setActiveBlockId(block.id); setLeftPanelTab('style'); }}>
                              <div
                                className={`flex items-center justify-center p-5 rounded-xl transition-all cursor-pointer ${isSel ? 'ring-2 ring-fuchsia-500/70 bg-fuchsia-500/5 shadow-[0_0_20px_rgba(217,70,239,0.15)]' : 'hover:bg-white/5'}`}
                                style={{
                                  opacity: ((block.properties?.blockOpacity as number) ?? 100) / 100,
                                  backdropFilter: (block.properties?.backdropBlur as number) ? `blur(${block.properties?.backdropBlur}px)` : undefined,
                                  borderRadius: (block.properties?.blockBorderRadius as number) ? `${block.properties?.blockBorderRadius}px` : undefined,
                                  filter: block.properties?.dropShadow === 'neon-glow'
                                    ? 'drop-shadow(0 0 10px rgba(168,85,247,0.9)) drop-shadow(0 0 24px rgba(168,85,247,0.5))'
                                    : block.properties?.dropShadow === 'drop-shadow'
                                    ? 'drop-shadow(0 4px 16px rgba(0,0,0,0.9))'
                                    : undefined,
                                  mixBlendMode: block.properties?.blendMode ? (block.properties.blendMode as React.CSSProperties['mixBlendMode']) : undefined,
                                  border: (block.properties?.borderWidth as number) ? `${block.properties?.borderWidth}px ${(block.properties?.borderStyle as string) || 'solid'} ${(block.properties?.borderColor as string) || '#ffffff'}` : undefined,
                                }}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id }); }}>
                                {React.createElement(IconComp, { size: iconSize, strokeWidth: iconStr, color: iconCol })}
                              </div>
                            </SortableBlock>
                          );
                        }
                        if (block.type === 'countdown') {
                          const isSel = activeBlockId === block.id;
                          return (
                            <SortableBlock key={block.id} id={block.id} isSelected={isSel} onClick={() => { setSelectedItem('countdown'); setActiveBlockId(block.id); setLeftPanelTab('style'); }}>
                              <div className={`cursor-pointer rounded-xl transition-all ${isSel ? 'ring-2 ring-amber-500/60 bg-amber-500/5 scale-[1.02]' : 'hover:bg-white/5'}`}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id }); }}>
                                <CountdownBlock targetDate={block.targetDate || COUNTDOWN_FALLBACK} />
                              </div>
                            </SortableBlock>
                          );
                        }
                        if (block.type === 'gallery-stack') {
                          const isSel = activeBlockId === block.id;
                          return (
                            <SortableBlock key={block.id} id={block.id} isSelected={isSel} onClick={() => { setSelectedItem('gallery-stack'); setActiveBlockId(block.id); setLeftPanelTab('style'); }}>
                              <div
                                className={`cursor-pointer rounded-xl transition-all ${isSel ? 'ring-2 ring-emerald-500/60 bg-emerald-500/5 scale-[1.01]' : 'hover:bg-white/5'}`}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id }); }}>
                                <MasonryGallery images={block.images} properties={block.properties}
                                  onImagesChange={(urls) => updateBlock(block.id, { images: urls })} />
                              </div>
                            </SortableBlock>
                          );
                        }
                        if (block.type === 'rsvp-form') {
                          const isSel = activeBlockId === block.id;
                          return (
                            <SortableBlock key={block.id} id={block.id} isSelected={isSel} onClick={() => { setSelectedItem('rsvp-form'); setActiveBlockId(block.id); setLeftPanelTab('style'); }}>
                              <div
                                className={`cursor-pointer rounded-xl transition-all ${isSel ? 'ring-2 ring-pink-500/50 scale-[1.01]' : 'hover:bg-white/5'}`}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id }); }}>
                                <RsvpForm properties={block.properties} />
                              </div>
                            </SortableBlock>
                          );
                        }
                        if (block.type === 'audio') {
                          const isSel = activeBlockId === block.id;
                          return (
                            <SortableBlock key={block.id} id={block.id} isSelected={isSel} onClick={() => { setSelectedItem('audio'); setActiveBlockId(block.id); setLeftPanelTab('style'); }}>
                              <div
                                className={`cursor-pointer rounded-xl transition-all ${isSel ? 'ring-2 ring-purple-500/50 scale-[1.01]' : ''}`}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id }); }}>
                                <AudioBlock audioUrl={block.audioUrl} audioVolume={block.audioVolume ?? 80} onVolumeChange={(vol) => updateBlock(block.id, { audioVolume: vol })} />
                              </div>
                            </SortableBlock>
                          );
                        }
                        if (block.type === 'map') {
                          const isSel = activeBlockId === block.id;
                          return (
                            <SortableBlock key={block.id} id={block.id} isSelected={isSel} onClick={() => { setSelectedItem('map'); setActiveBlockId(block.id); setLeftPanelTab('style'); }}>
                              <div
                                className={`cursor-pointer rounded-xl transition-all ${isSel ? 'ring-2 ring-teal-500/50 scale-[1.01]' : 'hover:bg-white/5'}`}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id }); }}>
                                <GoogleMap properties={block.properties} />
                              </div>
                            </SortableBlock>
                          );
                        }
                        if (block.type === 'lottie') {
                          const isSel = activeBlockId === block.id;
                          return (
                            <SortableBlock key={block.id} id={block.id} isSelected={isSel} onClick={() => { setSelectedItem('lottie'); setActiveBlockId(block.id); setLeftPanelTab('style'); }}>
                              <div
                                className={`cursor-pointer rounded-xl transition-all ${isSel ? 'ring-2 ring-purple-500/50 scale-[1.01]' : 'hover:bg-white/5'}`}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id }); }}>
                                <LottiePlayer properties={block.properties} />
                              </div>
                            </SortableBlock>
                          );
                        }
                        if (block.type === 'vector') {
                          const isSel = activeBlockId === block.id;
                          return (
                            <SortableBlock key={block.id} id={block.id} isSelected={isSel} onClick={() => { setSelectedItem('vector'); setActiveBlockId(block.id); setLeftPanelTab('style'); }}>
                              <div
                                className={`cursor-pointer rounded-xl transition-all ${isSel ? 'ring-2 ring-violet-500/50 scale-[1.01]' : 'hover:bg-white/5'}`}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id }); }}>
                                <VectorArt properties={block.properties} />
                              </div>
                            </SortableBlock>
                          );
                        }
                        if (block.type === 'carousel') {
                          const isSel = activeBlockId === block.id;
                          return (
                            <SortableBlock key={block.id} id={block.id} isSelected={isSel} onClick={() => { setSelectedItem('carousel'); setActiveBlockId(block.id); setLeftPanelTab('style'); }}>
                              <div
                                className={`cursor-pointer rounded-xl transition-all ${isSel ? 'ring-2 ring-sky-500/50 scale-[1.01]' : 'hover:bg-white/5'}`}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id }); }}>
                                <CarouselSlideshow images={block.images} properties={block.properties}
                                  onImagesChange={(urls) => updateBlock(block.id, { images: urls })} />
                              </div>
                            </SortableBlock>
                          );
                        }
                        if (block.type === 'button') {
                          const isSel    = activeBlockId === block.id;
                          const btnLabel  = block.content || 'Click Here';
                          const btnColor  = (block.properties?.accentColor as string) || '#10b981';
                          const btnRadius = (block.properties?.blockBorderRadius as number) ?? 12;
                          return (
                            <SortableBlock key={block.id} id={block.id} isSelected={isSel} onClick={() => { setSelectedItem('button'); setActiveBlockId(block.id); setLeftPanelTab('style'); }}>
                              <div
                                className={`flex items-center justify-center px-5 py-5 rounded-xl transition-all cursor-pointer ${isSel ? 'ring-2 ring-emerald-500/60 bg-emerald-500/5 scale-[1.01]' : 'hover:bg-white/5'}`}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id }); }}>
                                <button
                                  type="button"
                                  style={{ backgroundColor: btnColor, borderRadius: `${btnRadius}px` }}
                                  className="px-8 py-3 text-white text-sm font-bold tracking-wide pointer-events-none shadow-lg"
                                >
                                  {btnLabel}
                                </button>
                              </div>
                            </SortableBlock>
                          );
                        }
                        if (block.type === 'video') {
                          const isSel = activeBlockId === block.id;
                          return (
                            <SortableBlock key={block.id} id={block.id} isSelected={isSel} onClick={() => { setSelectedItem('video'); setActiveBlockId(block.id); setLeftPanelTab('style'); }}>
                              <div
                                className={`cursor-pointer rounded-xl transition-all ${isSel ? 'ring-2 ring-red-500/50 scale-[1.01]' : 'hover:bg-white/5'}`}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id }); }}>
                                <VideoBlock
                                  content={block.content}
                                  onContentChange={(url) => updateBlock(block.id, { content: url })}
                                />
                              </div>
                            </SortableBlock>
                          );
                        }
                        if (block.type === 'scribble') {
                          const isSel = activeBlockId === block.id;
                          return (
                            <SortableBlock key={block.id} id={block.id} isSelected={isSel} onClick={() => { setSelectedItem('scribble'); setActiveBlockId(block.id); setLeftPanelTab('style'); }}>
                              <div
                                className={`cursor-pointer rounded-xl transition-all ${isSel ? 'ring-2 ring-pink-500/50 scale-[1.01]' : 'hover:bg-white/5'}`}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id }); }}>
                                <ScribbleBlock
                                  paths={(block.properties?.scribblePaths as string[]) ?? []}
                                  strokeColor={(block.properties?.scribbleColor as string) ?? '#a855f7'}
                                  strokeWidth={(block.properties?.scribbleWidth as number) ?? 3}
                                  onPathsChange={(paths) => updateBlock(block.id, { properties: { ...block.properties, scribblePaths: paths } })}
                                />
                              </div>
                            </SortableBlock>
                          );
                        }
                        if (block.type === 'arc-text') {
                          const isSel = activeBlockId === block.id;
                          return (
                            <SortableBlock key={block.id} id={block.id} isSelected={isSel} onClick={() => { setSelectedItem('arc-text'); setActiveBlockId(block.id); setLeftPanelTab('style'); }}>
                              <div
                                className={`cursor-pointer rounded-xl transition-all ${isSel ? 'ring-2 ring-teal-500/50 scale-[1.01]' : 'hover:bg-white/5'}`}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, blockId: block.id }); }}>
                                <ArcTextBlock
                                  text={(block.properties?.arcText as string) ?? undefined}
                                  radius={(block.properties?.arcRadius as number) ?? undefined}
                                  color={(block.properties?.arcColor as string) ?? undefined}
                                  fontSize={(block.properties?.arcFontSize as number) ?? undefined}
                                  startAngle={(block.properties?.arcStartAngle as number) ?? undefined}
                                />
                              </div>
                            </SortableBlock>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* ── Free-placed blocks (dragged from sidebar) ── */}
                {(activeScene as Scene).blocks.filter((b: Block) => b.x !== undefined).map((block: Block) => (
                  <FreePlacedBlock key={block.id} block={block} />
                ))}

              {/* ── Spatial comment pins ── */}
              {(comments as CanvasComment[]).map((comment) => (
                <CommentPin
                  key={comment.id}
                  comment={comment}
                  onDelete={() => (removeComment as (id: string) => void)(comment.id)}
                  zoom={canvasZoom}
                />
              ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Comment input popup — fixed overlay at click position ── */}
      <AnimatePresence>
        {pendingComment && (
          <motion.div
            key="comment-input"
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.92, y: -6  }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed z-[120] w-64 pointer-events-auto"
            style={{ left: Math.min(pendingComment.screenX, window.innerWidth - 272), top: Math.min(pendingComment.screenY + 12, window.innerHeight - 180) }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-zinc-900/98 backdrop-blur-md border border-zinc-700/80 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.7)] overflow-hidden">
              <div className="h-px w-full bg-linear-to-r from-transparent via-violet-500/50 to-transparent" />
              <div className="p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-violet-400 shrink-0">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400/80">New Comment</p>
                </div>
                <input
                  type="text"
                  autoFocus
                  placeholder="Your name"
                  value={commentAuthor}
                  onChange={e => setCommentAuthor(e.target.value)}
                  className="w-full h-7 bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-2.5 text-[11px] outline-none focus:border-violet-500/70 placeholder:text-zinc-600 transition-all"
                />
                <textarea
                  placeholder="Leave a comment…"
                  value={commentMsg}
                  onChange={e => setCommentMsg(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!commentMsg.trim()) return;
                      if (typeof window !== 'undefined') localStorage.setItem('hc_commenter', commentAuthor);
                      (addComment as (d: Omit<CanvasComment, 'id'|'createdAt'>) => void)({
                        x: pendingComment.canvasX, y: pendingComment.canvasY,
                        message: commentMsg.trim(),
                        authorName: commentAuthor.trim() || 'Guest',
                        projectId: (projectId as string | null) ?? 'local',
                      });
                      setPendingComment(null);
                    }
                    if (e.key === 'Escape') setPendingComment(null);
                  }}
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-2.5 py-2 text-[11px] resize-none outline-none focus:border-violet-500/70 placeholder:text-zinc-600 transition-all"
                />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!commentMsg.trim()) return;
                      if (typeof window !== 'undefined') localStorage.setItem('hc_commenter', commentAuthor);
                      (addComment as (d: Omit<CanvasComment, 'id'|'createdAt'>) => void)({
                        x: pendingComment.canvasX, y: pendingComment.canvasY,
                        message: commentMsg.trim(),
                        authorName: commentAuthor.trim() || 'Guest',
                        projectId: (projectId as string | null) ?? 'local',
                      });
                      setPendingComment(null);
                    }}
                    disabled={!commentMsg.trim()}
                    className="flex-1 h-7 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-[11px] font-semibold transition-all"
                  >
                    Post
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingComment(null)}
                    className="h-7 px-3 rounded-lg border border-zinc-700 text-zinc-500 hover:text-zinc-300 text-[11px] transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Unified Utility Dock — bottom-center HUD ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <UtilityDock
          theme={theme as string}
          setTheme={setTheme as (t: string) => void}
          activeTool={activeTool as CanvasTool}
          setActiveTool={setActiveTool as (t: CanvasTool) => void}
          zoom={canvasZoom}
          setZoom={setCanvasZoom}
          onFitView={() => { setCanvasZoom(1); setCanvasPanX(0); setCanvasPanY(0); }}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </div>

      {/* ── Command Palette — Ctrl/Cmd+K global overlay ── */}
      <CommandPalette
        onPublish={handlePublish as () => void}
        onPublishLive={handlePublishLive as () => void}
        projectId={projectId as string | null}
      />

      {/* ── Scene Drawer — slides up from bottom of center canvas ── */}
      <motion.div
        initial={false}
        animate={{ y: sceneDrawerOpen ? 0 : 128 }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        className="absolute bottom-0 left-0 right-0 z-40 pointer-events-auto"
      >
        {/* Semi-circle toggle */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setSceneDrawerOpen((v: boolean) => !v)}
            aria-label={sceneDrawerOpen ? 'Hide scenes' : 'Show scenes'}
            className="w-16 h-8 bg-zinc-950 border border-zinc-800 border-b-0 rounded-t-full flex items-center justify-center hover:bg-zinc-900 transition-colors shadow-[0_-4px_24px_rgba(0,0,0,0.55)] backdrop-blur-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2.5} stroke="currentColor"
              className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-300 ${sceneDrawerOpen ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
        {/* Scene strip */}
        <SceneNavigator
          scenes={scenes as Scene[]}
          activeSceneId={activeSceneId}
          onSceneChange={handleSceneChange}
          onAddScene={handleAddScene}
          onDeleteScene={handleDeleteScene}
          onRenameScene={handleRenameScene}
          onDuplicateScene={handleDuplicateScene}
        />
      </motion.div>

      {/* ── Edge toggle handles (left & right) ── */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
        <button
          type="button"
          onClick={() => setIsLeftOpen((v: boolean) => !v)}
          aria-label={isLeftOpen ? 'Collapse left panel' : 'Expand left panel'}
          className="pointer-events-auto bg-zinc-900/80 backdrop-blur border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/90 p-2 rounded-r-xl transition-all shadow-lg flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 transition-transform duration-300 ${isLeftOpen ? '' : 'rotate-180'}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
        <button
          type="button"
          onClick={() => setIsRightOpen((v: boolean) => !v)}
          aria-label={isRightOpen ? 'Collapse right panel' : 'Expand right panel'}
          className="pointer-events-auto bg-zinc-900/80 backdrop-blur border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/90 p-2 rounded-l-xl transition-all shadow-lg flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 transition-transform duration-300 ${isRightOpen ? '' : 'rotate-180'}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* ── Context menu ── */}
      {contextMenu && (
        <div style={{ top: (contextMenu as {x:number;y:number;blockId:string}).y, left: (contextMenu as {x:number;y:number;blockId:string}).x }}
          className="fixed z-200 min-w-40 bg-neutral-900 border border-neutral-700/80 rounded-xl shadow-2xl overflow-hidden py-1"
          onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => deleteBlock((contextMenu as {x:number;y:number;blockId:string}).blockId)}
            className="w-full px-3.5 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Delete Block
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Right Sidebar ────────────────────────────────────────────────────────────

function RightSidebar() {
  const {
    isNoneSelected, isTextSelected, isImageSelected, isCountdownSelected, isGallerySelected, isAudioSelected, isMapSelected,
    selectedItem, selectedTone, setSelectedTone,
    handleRewriteText, handleGenerateMockImage, handleGenerateSong, handleOrchestrate,
    isRewriting, isGeneratingImage, sunoLoading, isOrchestrating,
    setImagePrompt, setSunoPrompt, setLeftPanelTab,
    sunoPrompt, sunoSuccess,
    imagePrompt,
    ttsText, setTtsText, ttsVoice, setTtsVoice, ttsLoading, ttsSuccess, handleGenerateVoice,
    activeBlockId, setActiveBlockId, updateBlock, patchBlockProperties,
    headlineEditor, paragraphEditor,
    addBlock, setScenes, activeSceneId,
    setImageUrl, setSelectedItem,
    activeFeature, setActiveFeature, activeAIPrompt, setActiveAIPrompt,
  } = useS();

  const { deductCredits } = useCredits();

  // Per-panel textarea values — pre-populated by OmniBar via activeAIPrompt
  const [textPrompt,     setTextPrompt]     = useState('');
  const [mediaPrompt,    setMediaPrompt]    = useState('');
  const [audioPrompt,    setAudioPrompt]    = useState('');
  const [webglPrompt,    setWebglPrompt]    = useState('');
  const [lottiePrompt,   setLottiePrompt]   = useState('');
  const [svgPrompt,      setSvgPrompt]      = useState('');
  const [scribblePrompt, setScribblePrompt] = useState('');

  // Image Studio generation state
  const [isGenerating,      setIsGenerating]      = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generateError,     setGenerateError]     = useState<string | null>(null);

  async function handleGenerateImage() {
    if (!mediaPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setGenerateError(null);
    setGeneratedImageUrl(null);
    try {
      const url = await generateCanvasImage(mediaPrompt);
      setGeneratedImageUrl(url);

      // ── Inject the image directly onto the canvas ──────────────────────────
      const blockId = `block-${Date.now()}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setScenes((prev: any[]) => prev.map((scene: any) =>
        scene.id === activeSceneId
          ? {
              ...scene,
              blocks: [
                ...scene.blocks,
                {
                  id:      blockId,
                  type:    'image',
                  content: url,
                  filters: { ...DEFAULT_FILTERS },
                },
              ],
            }
          : scene
      ));

      // Update global imageUrl so the auto-save / viewer still picks it up
      setImageUrl(url);
      // Select the new block and open the style panel
      setActiveBlockId(blockId);
      setSelectedItem('image');
      setLeftPanelTab('style');

      deductCredits(20);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setGenerateError(
        msg === 'INSUFFICIENT_CREDITS'
          ? "You don't have enough Aevaia Credits for this! Top up to continue creating."
          : msg || 'Something went wrong. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  }

  // Sync activeAIPrompt into the correct panel textarea whenever it changes
  useEffect(() => {
    if (!activeAIPrompt) return;
    if (activeFeature === 'text')  { setTextPrompt(activeAIPrompt);  setActiveAIPrompt(''); }
    if (activeFeature === 'media') { setMediaPrompt(activeAIPrompt); setActiveAIPrompt(''); }
    if (activeFeature === 'audio') { setAudioPrompt(activeAIPrompt); setActiveAIPrompt(''); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAIPrompt]);

  // ── Copilot chat history ──────────────────────────────────────────────────
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const COPILOT_PANEL_LABELS: Record<string, string> = {
    general: 'Orchestrator',
    text:    'Copywriter AI',
    media:   'Image Studio',
    audio:   'Audio Engineer',
    icons:   'Icon Station',
  };

  async function handleCopilotSubmit(overrideText?: string) {
    const text = (overrideText ?? chatInput).trim();
    if (!text || isSending) return;
    setIsSending(true);
    setChatHistory(prev => [...prev, { role: 'user', text }]);
    if (!overrideText) setChatInput('');

    try {
      const res = await fetch('/api/orchestrator', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userInput: text }),
      });
      if (!res.ok) throw new Error('unavailable');

      const payload = await res.json() as {
        action: string; targetPanel: string; engineeredPrompt: string | null;
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setActiveFeature(payload.targetPanel as any);
      if (payload.engineeredPrompt) setActiveAIPrompt(payload.engineeredPrompt);

      const label = COPILOT_PANEL_LABELS[payload.targetPanel] ?? payload.targetPanel;
      const reply = payload.action === 'navigate'
        ? `Opening ${label}…`
        : `Luxury prompt crafted for ${label}. Opening now ✦`;
      setChatHistory(prev => [...prev, { role: 'ai', text: reply }]);
    } catch {
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Something went wrong. Please try again.' }]);
    } finally {
      setIsSending(false);
    }
  }

  // Compact global bar state (used in specialist mode)
  const [globalBarInput, setGlobalBarInput] = useState('');
  const [globalBarSending, setGlobalBarSending] = useState(false);

  // ── Streaming AI chat state ────────────────────────────────────────────────
  // Used by the text-panel prompt box and the live image-prompt generator.
  const [chatPrompt, setChatPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // ── Per-panel AI director inputs (Image + Audio panels) ───────────────────
  const [imageAIInput, setImageAIInput] = useState('');
  const [isImageStreaming, setIsImageStreaming] = useState(false);
  const [audioAIInput, setAudioAIInput] = useState('');
  const [isAudioStreaming, setIsAudioStreaming] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const SUGGESTIONS: Array<{ label: string; Icon: React.ComponentType<{ className?: string }>; mockText?: string }> = [
    { label: 'Make it romantic',     Icon: LucideIcons.Heart,       mockText: 'Forever and Always. Join us in celebrating our love story.' },
    { label: 'Generate webGL snow',  Icon: LucideIcons.Snowflake },
    { label: 'Rewrite the headline', Icon: LucideIcons.Sparkles,    mockText: 'A Day Written in the Stars — and in Our Hearts.' },
    { label: 'Add background music', Icon: LucideIcons.Music },
    { label: 'Set a dark mood',      Icon: LucideIcons.Moon,        mockText: 'In the quiet hours before forever, we invite you to witness our vows.' },
    { label: 'Make it joyful',       Icon: LucideIcons.PartyPopper, mockText: 'We\'re getting married — and you\'re invited to the best party of our lives!' },
  ];

  const handleSend = async (suggestion: { label: string; mockText?: string }) => {
    const text = suggestion.label;
    if (!text.trim() || isSending) return;
    // Route to live streaming handler — real AI replaces mock payloads
    await handleSendLive(text);
  };

  // Instant AI injection — updates both content (flow blocks) and
  // properties.text (placed blocks) on the active block
  const handleQuickRewrite = (mockText: string) => {
    if (!activeBlockId) return;
    updateBlock(activeBlockId, { content: mockText });
    patchBlockProperties(activeBlockId, { text: mockText });
  };

  const handleGlobalBar = async () => {
    if (!globalBarInput.trim() || globalBarSending) return;
    setGlobalBarSending(true);
    try { await handleOrchestrate(globalBarInput); } catch { /* non-fatal */ }
    setGlobalBarInput('');
    setGlobalBarSending(false);
  };

  // ── Live streaming AI handler ─────────────────────────────────────────────
  // Calls /api/chat, streams tokens into the active TipTap editor in real time,
  // then persists the completed text to the global block state.
  const handleStreamChat = async (overridePrompt?: string) => {
    const prompt = (overridePrompt ?? chatPrompt).trim();
    if (!prompt || isStreaming || !activeBlockId) return;
    setIsStreaming(true);

    const isHeadline = selectedItem === 'headline';
    const editor     = isHeadline
      ? (headlineEditor as import('@tiptap/react').Editor | null)
      : (paragraphEditor as import('@tiptap/react').Editor | null);
    const currentContent = editor?.getText() ?? '';

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          activeElementType: 'TEXT',
          tone:         selectedTone,
          blockContent: currentContent,
        }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      // Stream tokens into the editor so the user sees the AI "typing"
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        // Wrap in paragraph so TipTap renders it correctly
        editor?.commands.setContent(`<p>${accumulated}</p>`);
      }

      // Task 3: persist completed result to global canvas state
      if (accumulated.trim()) {
        updateBlock(activeBlockId, { content: accumulated.trim() });
        patchBlockProperties(activeBlockId, { text: accumulated.trim() });
      }

      setChatPrompt('');
    } catch (err) {
      console.error('[RightSidebar/stream] error:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  // ── Image AI Director: streams an art-direction prompt into imagePrompt ─────
  const handleStreamImagePrompt = async (overridePrompt?: string) => {
    const prompt = (overridePrompt ?? imageAIInput).trim();
    if (!prompt || isImageStreaming) return;
    setIsImageStreaming(true);
    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, activeElementType: 'IMAGE' }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setImagePrompt(accumulated);
      }
      setImageAIInput('');
    } catch (err) {
      console.error('[image-director/stream] error:', err);
    } finally {
      setIsImageStreaming(false);
    }
  };

  // ── Audio AI Director: streams a music composition brief into sunoPrompt ───
  const handleStreamAudioPrompt = async (overridePrompt?: string) => {
    const prompt = (overridePrompt ?? audioAIInput).trim();
    if (!prompt || isAudioStreaming) return;
    setIsAudioStreaming(true);
    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, activeElementType: 'AUDIO', blockContent: sunoPrompt }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setSunoPrompt(accumulated);
      }
      setAudioAIInput('');
    } catch (err) {
      console.error('[audio-director/stream] error:', err);
    } finally {
      setIsAudioStreaming(false);
    }
  };

  // ── Global chat: replace mock pill handler with real streaming AI ─────────
  const handleSendLive = async (text: string) => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    setChatHistory(prev => [...prev, { role: 'user', text }, { role: 'ai', text: '…' }]);
    setChatInput('');

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, activeElementType: 'DEFAULT' }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setChatHistory(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: 'ai', text: reply };
          return next;
        });
      }
    } catch {
      setChatHistory(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: 'ai', text: 'Something went wrong. Please try again.' };
        return next;
      });
    } finally {
      setIsSending(false);
    }
  };

  const isWorking = isSending || isOrchestrating || isStreaming || isImageStreaming || isAudioStreaming;
  const VOICE_MODELS = [
    { value: 'rachel', label: 'Rachel — Calm, Warm'     },
    { value: 'Antoni', label: 'Antoni — Deep, Resonant' },
    { value: 'bella',  label: 'Bella — Soft, Feminine'  },
    { value: 'josh',   label: 'Josh — Young, Energetic' },
  ];

  // Derive context label for the mode pill
  const modeLabel = isTextSelected ? 'Copywriting AI'
    : isGallerySelected   ? 'Visual AI — Gallery'
    : isImageSelected     ? 'Visual AI — Image'
    : isAudioSelected     ? 'Sound AI'
    : isCountdownSelected ? 'Countdown'
    : isMapSelected       ? 'Venue Map'
    : 'Aevaia AI';

  const modeIcon = isTextSelected ? <LucideIcons.PenTool className="w-3.5 h-3.5" />
    : (isImageSelected || isGallerySelected) ? <LucideIcons.ImageIcon className="w-3.5 h-3.5" />
    : isAudioSelected     ? <LucideIcons.Music className="w-3.5 h-3.5" />
    : isCountdownSelected ? <LucideIcons.Timer className="w-3.5 h-3.5" />
    : isMapSelected       ? <LucideIcons.MapPin className="w-3.5 h-3.5" />
    : <LucideIcons.Bot className="w-3.5 h-3.5" />;

  const modePillCls = isTextSelected
    ? 'bg-purple-500/10 border-purple-500/20 text-purple-300'
    : (isImageSelected || isGallerySelected)
    ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
    : isAudioSelected
    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
    : isCountdownSelected
    ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
    : isMapSelected
    ? 'bg-teal-500/10 border-teal-500/20 text-teal-300'
    : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-400';

  return (
    <div className="flex flex-col h-full">

      {/* ══════════════════════════════════════════════════════
          STATIC HEADER — always visible, mirrors left sidebar
          header height (p-5 + title row + mb-5 + mode row)
          ══════════════════════════════════════════════════════ */}
      <div className="shrink-0 p-5 border-b border-zinc-200 dark:border-zinc-800">
        {/* Row 1: title + status */}
        <div className="flex items-center gap-2 mb-5">
          <LucideIcons.Sparkles className="w-4 h-4 text-purple-400" />
          <p className="text-xs font-bold text-zinc-900 dark:text-white tracking-tight">Aevaia AI</p>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[9px] font-medium text-green-400/70 uppercase tracking-wider">Online</span>
          </div>
        </div>
        {/* Row 2: context mode pill — always visible */}
        <div className={`flex items-center gap-2 py-2 px-3 rounded-lg border transition-colors duration-200 ${modePillCls}`}>
          {modeIcon}
          <span className="text-xs font-semibold truncate">{modeLabel}</span>
          {!isNoneSelected && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current animate-pulse opacity-70 shrink-0" />}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          COMPACT GLOBAL BAR — slides in when element selected,
          pinned directly under the static header
          ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {!isNoneSelected && (
          <motion.div key="global-bar"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="shrink-0 overflow-hidden border-b border-zinc-800/80 bg-zinc-950/50"
          >
            <div className="px-4 py-3 flex gap-1.5">
              <input
                value={globalBarInput}
                onChange={e => setGlobalBarInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleGlobalBar(); }}
                placeholder="Global instruction…"
                className="flex-1 min-w-0 h-8 bg-neutral-900 border border-neutral-700/80 text-neutral-200 rounded-lg px-2.5 text-xs outline-none focus:border-purple-500/70 placeholder:text-neutral-600 transition-all"
              />
              <button type="button" onClick={handleGlobalBar} disabled={!globalBarInput.trim() || globalBarSending}
                className="h-8 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1">
                {globalBarSending ? <Spinner /> : '✦'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          DYNAMIC CONTENT AREA — global chat OR specialist panel
          ══════════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 relative">

        <AnimatePresence mode="wait">

          {/* ── Morphing AI Panel (nothing selected on canvas) ── */}
          {isNoneSelected && (
            <motion.div key="global-chat"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 flex flex-col overflow-y-auto"
            >
              <AnimatePresence mode="wait">

                {/* ── Copywriter AI ── */}
                {activeFeature === 'text' && (
                  <motion.div key="feat-text" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                    className="p-4 space-y-4">
                    <button type="button" onClick={() => setActiveFeature('general')}
                      className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-purple-400 transition-colors mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                      Back to Aevaia AI
                    </button>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center"><LucideIcons.PenTool className="w-4 h-4 text-violet-400" /></div>
                      <div><p className="text-xs font-bold text-white">Copywriter AI</p><p className="text-[10px] text-neutral-500">Headlines, paragraphs & story arcs</p></div>
                    </div>
                    <textarea value={textPrompt} onChange={e => setTextPrompt(e.target.value)}
                      placeholder="What should this say? Describe the tone, emotion, or message…" rows={4}
                      className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-xl px-3.5 py-2.5 text-xs resize-none focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 transition-all placeholder:text-neutral-600" />
                    <button type="button" onClick={() => deductCredits(5)}
                      className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(139,92,246,0.25)]">
                      ✦ Generate Story
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold inline-flex items-center gap-0.5">5 <LucideIcons.Sparkles className="w-2.5 h-2.5" /></span>
                    </button>
                    <p className="text-[10px] text-neutral-600 text-center">Select a text block on the canvas first to apply directly.</p>
                  </motion.div>
                )}

                {/* ── Image Studio AI ── */}
                {activeFeature === 'media' && (
                  <motion.div key="feat-media" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                    className="p-4 space-y-4">
                    <button type="button" onClick={() => setActiveFeature('general')}
                      className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-purple-400 transition-colors mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                      Back to Aevaia AI
                    </button>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center"><LucideIcons.Palette className="w-4 h-4 text-blue-400" /></div>
                      <div><p className="text-xs font-bold text-white">Image Studio AI</p><p className="text-[10px] text-neutral-500">Generate cinematic visuals on demand</p></div>
                    </div>
                    <textarea
                      value={mediaPrompt}
                      onChange={e => setMediaPrompt(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleGenerateImage(); }}
                      placeholder="Describe the photo — mood, lighting, subject, style…"
                      rows={4}
                      disabled={isGenerating}
                      className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-xl px-3.5 py-2.5 text-xs resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all placeholder:text-neutral-600 disabled:opacity-50" />
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-500">
                      {['Cinematic', 'Minimalist', 'Romantic', 'Editorial'].map(style => (
                        <button key={style} type="button" disabled={isGenerating}
                          onClick={() => setMediaPrompt(p => p ? `${p}, ${style.toLowerCase()} style` : `${style.toLowerCase()} style`)}
                          className="py-1.5 rounded-lg bg-neutral-800 hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-500/30 border border-neutral-700 transition-all font-medium disabled:opacity-40">
                          {style}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateImage}
                      disabled={isGenerating || !mediaPrompt.trim()}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(59,130,246,0.25)]">
                      {isGenerating ? (
                        <>
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                          Creating Magic…
                        </>
                      ) : (
                        <>
                          ✦ Generate Image
                          <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold inline-flex items-center gap-0.5">20 <LucideIcons.Sparkles className="w-2.5 h-2.5" /></span>
                        </>
                      )}
                    </button>
                    {generateError && (
                      <p className="text-xs text-red-400 text-center leading-relaxed px-1">{generateError}</p>
                    )}
                    {generatedImageUrl && (
                      <div className="space-y-2">
                        <img
                          src={generatedImageUrl}
                          alt="AI generated"
                          className="w-full rounded-xl border border-blue-500/30 object-cover aspect-square"
                        />
                        <p className="text-[10px] text-neutral-500 text-center">Canvas drop-in coming soon ✦</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Audio Engineer AI ── */}
                {activeFeature === 'audio' && (
                  <motion.div key="feat-audio" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                    className="p-4 space-y-4">
                    <button type="button" onClick={() => setActiveFeature('general')}
                      className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-purple-400 transition-colors mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                      Back to Aevaia AI
                    </button>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center"><LucideIcons.Music className="w-4 h-4 text-emerald-400" /></div>
                      <div><p className="text-xs font-bold text-white">Audio Engineer AI</p><p className="text-[10px] text-neutral-500">Custom tracks & ambient soundscapes</p></div>
                    </div>
                    <textarea value={audioPrompt} onChange={e => setAudioPrompt(e.target.value)}
                      placeholder="Describe the vibe — genre, tempo, emotional arc, key instruments…" rows={3}
                      className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-xl px-3.5 py-2.5 text-xs resize-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all placeholder:text-neutral-600" />
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-neutral-800/60" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-500/70">✦ ATMOSPHERE</p>
                      <div className="flex-1 h-px bg-neutral-800/60" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {['Orchestral', 'Lo-Fi', 'Jazz', 'Ambient', 'Acoustic', 'Cinematic'].map(s => (
                        <button key={s} type="button"
                          onClick={() => setAudioPrompt(p => p ? `${p}, ${s.toLowerCase()} style` : `${s.toLowerCase()} track`)}
                          className="py-1.5 rounded-lg bg-neutral-800/80 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30 border border-neutral-700/80 transition-all font-medium text-neutral-400">{s}</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-neutral-800/60" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-500/70">✦ TEMPO</p>
                      <div className="flex-1 h-px bg-neutral-800/60" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {['Slow & Dreamy', 'Mid Tempo', 'Upbeat', 'Pulse', 'Floating', 'Driving'].map(s => (
                        <button key={s} type="button"
                          onClick={() => setAudioPrompt(p => p ? `${p}, ${s.toLowerCase()} tempo` : `${s.toLowerCase()} tempo`)}
                          className="py-1.5 rounded-lg bg-neutral-800/80 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30 border border-neutral-700/80 transition-all font-medium text-neutral-400">{s}</button>
                      ))}
                    </div>
                    <button type="button" onClick={() => deductCredits(50)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(16,185,129,0.25)]">
                      ✦ Generate Track
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold inline-flex items-center gap-0.5">50 <LucideIcons.Sparkles className="w-2.5 h-2.5" /></span>
                    </button>
                  </motion.div>
                )}

                {/* ── AI Icon Station ── */}
                {activeFeature === 'icons' && (
                  <motion.div key="feat-icons" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                    className="p-4 space-y-4">
                    <button type="button" onClick={() => setActiveFeature('general')}
                      className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-purple-400 transition-colors mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                      Back to Aevaia AI
                    </button>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center"><LucideIcons.Gem className="w-4 h-4 text-fuchsia-400" /></div>
                      <div><p className="text-xs font-bold text-white">AI Icon Station</p><p className="text-[10px] text-neutral-500">Prompt → 5 matching Lucide icons</p></div>
                    </div>
                    <IconStation
                      onSelect={(name) => {
                        addBlock('icon');
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        setScenes((prev: any[]) => prev.map((scene: any) =>
                          scene.id === activeSceneId
                            ? {
                                ...scene,
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                blocks: scene.blocks.map((b: any, i: number) =>
                                  i === scene.blocks.length - 1 ? { ...b, content: name } : b
                                ),
                              }
                            : scene
                        ));
                      }}
                    />
                    <p className="text-[9px] text-neutral-600 text-center inline-flex items-center justify-center gap-0.5 w-full">2 <LucideIcons.Sparkles className="w-2 h-2" /> per generation</p>
                  </motion.div>
                )}

                {/* ── Button Block AI ── */}
                {activeFeature === 'button' && (
                  <motion.div key="feat-button" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                    className="p-4 space-y-4">
                    <button type="button" onClick={() => setActiveFeature('general')}
                      className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-purple-400 transition-colors mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                      Back to Aevaia AI
                    </button>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-500/15 border border-slate-500/30 flex items-center justify-center"><LucideIcons.MousePointerClick className="w-4 h-4 text-slate-400" /></div>
                      <div><p className="text-xs font-bold text-white">Button Block AI</p><p className="text-[10px] text-neutral-500">Design your call-to-action copy & style</p></div>
                    </div>
                    <textarea value={textPrompt} onChange={e => setTextPrompt(e.target.value)}
                      placeholder="Describe your CTA — action, urgency, tone…" rows={3}
                      className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-xl px-3.5 py-2.5 text-xs resize-none focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400/30 transition-all placeholder:text-neutral-600" />
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-neutral-800/60" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500/80">✦ CTA STYLE</p>
                      <div className="flex-1 h-px bg-neutral-800/60" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {['RSVP Now', 'Book Seat', 'Learn More', 'Shop Now', 'Donate', 'Join Us'].map(s => (
                        <button key={s} type="button"
                          onClick={() => setTextPrompt(p => p ? `${p}, ${s}` : s)}
                          className="py-1.5 rounded-lg bg-neutral-800/80 hover:bg-slate-500/10 hover:text-slate-300 hover:border-slate-500/30 border border-neutral-700/80 transition-all font-medium text-neutral-400">{s}</button>
                      ))}
                    </div>
                    <button type="button" onClick={() => deductCredits(3)}
                      className="w-full py-2.5 rounded-xl bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_14px_rgba(100,116,139,0.3)]">
                      ✦ Generate Button Copy
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold inline-flex items-center gap-0.5">3 <LucideIcons.Sparkles className="w-2.5 h-2.5" /></span>
                    </button>
                  </motion.div>
                )}

                {/* ── Video Block AI ── */}
                {activeFeature === 'video' && (
                  <motion.div key="feat-video" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                    className="p-4 space-y-4">
                    <button type="button" onClick={() => setActiveFeature('general')}
                      className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-purple-400 transition-colors mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                      Back to Aevaia AI
                    </button>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center"><LucideIcons.Video className="w-4 h-4 text-red-400" /></div>
                      <div><p className="text-xs font-bold text-white">Video Block AI</p><p className="text-[10px] text-neutral-500">Script a cinematic moment for your gift</p></div>
                    </div>
                    <textarea value={mediaPrompt} onChange={e => setMediaPrompt(e.target.value)}
                      placeholder="e.g. Slow-motion walk down the aisle, golden hour backlit, soft focus…" rows={3}
                      className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-xl px-3.5 py-2.5 text-xs resize-none focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/40 transition-all placeholder:text-neutral-600" />
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-neutral-800/60" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-red-500/70">✦ MOTION PRESETS</p>
                      <div className="flex-1 h-px bg-neutral-800/60" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {['Slow Motion', 'Glitch', 'Fade In', 'Drone Shot', 'Timelapse', 'Whip Pan'].map(s => (
                        <button key={s} type="button"
                          onClick={() => setMediaPrompt(p => p ? `${p}, ${s.toLowerCase()} effect` : `${s.toLowerCase()} effect`)}
                          className="py-1.5 rounded-lg bg-neutral-800/80 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 border border-neutral-700/80 transition-all font-medium text-neutral-400">{s}</button>
                      ))}
                    </div>
                    <button type="button" onClick={() => deductCredits(25)}
                      className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(239,68,68,0.25)]">
                      ✦ Generate Video Concept
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold inline-flex items-center gap-0.5">25 <LucideIcons.Sparkles className="w-2.5 h-2.5" /></span>
                    </button>
                  </motion.div>
                )}

                {/* ── WebGL Particles AI ── */}
                {activeFeature === 'webgl' && (
                  <motion.div key="feat-webgl" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                    className="p-4 space-y-4">
                    <button type="button" onClick={() => setActiveFeature('general')}
                      className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-purple-400 transition-colors mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                      Back to Aevaia AI
                    </button>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-base select-none">✦</div>
                      <div><p className="text-xs font-bold text-white">Particle Engine AI</p><p className="text-[10px] text-neutral-500">Sculpt a living 3D particle atmosphere</p></div>
                    </div>
                    <textarea value={webglPrompt} onChange={e => setWebglPrompt(e.target.value)}
                      placeholder="e.g. Drifting gold dust rising through deep blue darkness…" rows={3}
                      className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-xl px-3.5 py-2.5 text-xs resize-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-all placeholder:text-neutral-600" />
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-neutral-800/60" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-cyan-500/70">✦ PARTICLE PHYSICS</p>
                      <div className="flex-1 h-px bg-neutral-800/60" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {['Sparkle', 'Snowfall', 'Galaxy', 'Fireflies', 'Embers', 'Starfield'].map(s => (
                        <button key={s} type="button"
                          onClick={() => setWebglPrompt(p => p ? `${p}, ${s.toLowerCase()} particles` : `${s.toLowerCase()} particles`)}
                          className="py-1.5 rounded-lg bg-neutral-800/80 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/30 border border-neutral-700/80 transition-all font-medium text-neutral-400">{s}</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-neutral-800/60" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-cyan-500/70">✦ PALETTE</p>
                      <div className="flex-1 h-px bg-neutral-800/60" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {['Gold', 'Silver', 'Rose', 'Neon Blue', 'Pastel', 'Iridescent'].map(s => (
                        <button key={s} type="button"
                          onClick={() => setWebglPrompt(p => p ? `${p}, ${s.toLowerCase()} tones` : `${s.toLowerCase()} tones`)}
                          className="py-1.5 rounded-lg bg-neutral-800/80 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/30 border border-neutral-700/80 transition-all font-medium text-neutral-400">{s}</button>
                      ))}
                    </div>
                    <button type="button" onClick={() => deductCredits(30)}
                      className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(6,182,212,0.25)]">
                      ✦ Generate Particles
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold inline-flex items-center gap-0.5">30 <LucideIcons.Sparkles className="w-2.5 h-2.5" /></span>
                    </button>
                  </motion.div>
                )}

                {/* ── Lottie Animation AI ── */}
                {activeFeature === 'lottie' && (
                  <motion.div key="feat-lottie" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                    className="p-4 space-y-4">
                    <button type="button" onClick={() => setActiveFeature('general')}
                      className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-purple-400 transition-colors mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                      Back to Aevaia AI
                    </button>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center"><LucideIcons.Wind className="w-4 h-4 text-orange-400" /></div>
                      <div><p className="text-xs font-bold text-white">Lottie Animation AI</p><p className="text-[10px] text-neutral-500">Find the perfect looping motion graphic</p></div>
                    </div>
                    <textarea value={lottiePrompt} onChange={e => setLottiePrompt(e.target.value)}
                      placeholder="e.g. Looping confetti burst in soft pastel colours, gentle and joyful…" rows={3}
                      className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-xl px-3.5 py-2.5 text-xs resize-none focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 transition-all placeholder:text-neutral-600" />
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-neutral-800/60" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-orange-500/70">✦ ANIMATION TYPE</p>
                      <div className="flex-1 h-px bg-neutral-800/60" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {['Confetti', 'Hearts', 'Stars', 'Sparkles', 'Rings', 'Ripple'].map(s => (
                        <button key={s} type="button"
                          onClick={() => setLottiePrompt(p => p ? `${p}, ${s.toLowerCase()}` : `looping ${s.toLowerCase()} animation`)}
                          className="py-1.5 rounded-lg bg-neutral-800/80 hover:bg-orange-500/10 hover:text-orange-300 hover:border-orange-500/30 border border-neutral-700/80 transition-all font-medium text-neutral-400">{s}</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-neutral-800/60" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-orange-500/70">✦ MOOD</p>
                      <div className="flex-1 h-px bg-neutral-800/60" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {['Joyful', 'Elegant', 'Playful', 'Dramatic', 'Delicate', 'Bold'].map(s => (
                        <button key={s} type="button"
                          onClick={() => setLottiePrompt(p => p ? `${p}, ${s.toLowerCase()} mood` : `${s.toLowerCase()} mood`)}
                          className="py-1.5 rounded-lg bg-neutral-800/80 hover:bg-orange-500/10 hover:text-orange-300 hover:border-orange-500/30 border border-neutral-700/80 transition-all font-medium text-neutral-400">{s}</button>
                      ))}
                    </div>
                    <button type="button" onClick={() => deductCredits(10)}
                      className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(234,88,12,0.25)]">
                      ✦ Find Animation
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold inline-flex items-center gap-0.5">10 <LucideIcons.Sparkles className="w-2.5 h-2.5" /></span>
                    </button>
                  </motion.div>
                )}

                {/* ── Custom SVG AI ── */}
                {activeFeature === 'svg' && (
                  <motion.div key="feat-svg" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                    className="p-4 space-y-4">
                    <button type="button" onClick={() => setActiveFeature('general')}
                      className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-purple-400 transition-colors mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                      Back to Aevaia AI
                    </button>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center"><LucideIcons.Shapes className="w-4 h-4 text-amber-400" /></div>
                      <div><p className="text-xs font-bold text-white">Vector Art AI</p><p className="text-[10px] text-neutral-500">Generate scalable SVG artwork for the canvas</p></div>
                    </div>
                    <textarea value={svgPrompt} onChange={e => setSvgPrompt(e.target.value)}
                      placeholder="e.g. Minimalist floral wreath, monogram initials J+M, geometric mandala…" rows={3}
                      className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-xl px-3.5 py-2.5 text-xs resize-none focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-all placeholder:text-neutral-600" />
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-neutral-800/60" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-500/70">✦ ART STYLE</p>
                      <div className="flex-1 h-px bg-neutral-800/60" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {['Minimalist', 'Hand-drawn', 'Geometric', 'Neon', 'Botanical', 'Abstract'].map(s => (
                        <button key={s} type="button"
                          onClick={() => setSvgPrompt(p => p ? `${p}, ${s.toLowerCase()} style` : `${s.toLowerCase()} style`)}
                          className="py-1.5 rounded-lg bg-neutral-800/80 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/30 border border-neutral-700/80 transition-all font-medium text-neutral-400">{s}</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-neutral-800/60" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-500/70">✦ ELEMENTS</p>
                      <div className="flex-1 h-px bg-neutral-800/60" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {['Floral', 'Monogram', 'Border', 'Mandala', 'Crest', 'Pattern'].map(s => (
                        <button key={s} type="button"
                          onClick={() => setSvgPrompt(p => p ? `${p}, ${s.toLowerCase()}` : `${s.toLowerCase()} vector`)}
                          className="py-1.5 rounded-lg bg-neutral-800/80 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/30 border border-neutral-700/80 transition-all font-medium text-neutral-400">{s}</button>
                      ))}
                    </div>
                    <button type="button" onClick={() => deductCredits(15)}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(217,119,6,0.3)]">
                      ✦ Generate SVG Art
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold inline-flex items-center gap-0.5">15 <LucideIcons.Sparkles className="w-2.5 h-2.5" /></span>
                    </button>
                  </motion.div>
                )}

                {/* ── Scribbles AI ── */}
                {activeFeature === 'scribbles' && (
                  <motion.div key="feat-scribbles" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                    className="p-4 space-y-4">
                    <button type="button" onClick={() => setActiveFeature('general')}
                      className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-purple-400 transition-colors mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                      Back to Aevaia AI
                    </button>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center"><LucideIcons.Pencil className="w-4 h-4 text-pink-400" /></div>
                      <div><p className="text-xs font-bold text-white">Scribble Style AI</p><p className="text-[10px] text-neutral-500">Hand-drawn layer overlays, borders & marks</p></div>
                    </div>
                    <textarea value={scribblePrompt} onChange={e => setScribblePrompt(e.target.value)}
                      placeholder="e.g. Thin gold underline, loose ink border, soft watercolour wash…" rows={3}
                      className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-xl px-3.5 py-2.5 text-xs resize-none focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/40 transition-all placeholder:text-neutral-600" />
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-neutral-800/60" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-pink-500/70">✦ MEDIUM</p>
                      <div className="flex-1 h-px bg-neutral-800/60" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {['Ink', 'Watercolour', 'Crayon', 'Charcoal', 'Pencil', 'Marker'].map(s => (
                        <button key={s} type="button"
                          onClick={() => setScribblePrompt(p => p ? `${p}, ${s.toLowerCase()} medium` : `${s.toLowerCase()} scribble overlay`)}
                          className="py-1.5 rounded-lg bg-neutral-800/80 hover:bg-pink-500/10 hover:text-pink-300 hover:border-pink-500/30 border border-neutral-700/80 transition-all font-medium text-neutral-400">{s}</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-neutral-800/60" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-pink-500/70">✦ MARK WEIGHT</p>
                      <div className="flex-1 h-px bg-neutral-800/60" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {['Hair-thin', 'Delicate', 'Natural', 'Bold', 'Brushy', 'Expressive'].map(s => (
                        <button key={s} type="button"
                          onClick={() => setScribblePrompt(p => p ? `${p}, ${s.toLowerCase()} weight` : `${s.toLowerCase()} weight lines`)}
                          className="py-1.5 rounded-lg bg-neutral-800/80 hover:bg-pink-500/10 hover:text-pink-300 hover:border-pink-500/30 border border-neutral-700/80 transition-all font-medium text-neutral-400">{s}</button>
                      ))}
                    </div>
                    <button type="button" onClick={() => deductCredits(8)}
                      className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(236,72,153,0.25)]">
                      ✦ Generate Scribble Style
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold inline-flex items-center gap-0.5">8 <LucideIcons.Sparkles className="w-2.5 h-2.5" /></span>
                    </button>
                  </motion.div>
                )}

                {/* ── Arc Text AI ── */}
                {activeFeature === 'arctext' && (
                  <motion.div key="feat-arctext" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                    className="p-4 space-y-4">
                    <button type="button" onClick={() => setActiveFeature('general')}
                      className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-purple-400 transition-colors mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                      Back to Aevaia AI
                    </button>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center"><LucideIcons.RefreshCw className="w-4 h-4 text-teal-400" /></div>
                      <div><p className="text-xs font-bold text-white">Arc Text AI</p><p className="text-[10px] text-neutral-500">Curved typographic phrases for your gift</p></div>
                    </div>
                    <textarea value={textPrompt} onChange={e => setTextPrompt(e.target.value)}
                      placeholder="e.g. Forever & Always · Est. 2024 · Together We Rise…" rows={3}
                      className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-xl px-3.5 py-2.5 text-xs resize-none focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 transition-all placeholder:text-neutral-600" />
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-neutral-800/60" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-teal-500/70">✦ OCCASION</p>
                      <div className="flex-1 h-px bg-neutral-800/60" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {['Anniversary', 'Wedding', 'Birthday', 'Graduation', 'Milestone', 'Memorial'].map(s => (
                        <button key={s} type="button"
                          onClick={() => setTextPrompt(p => p ? `${p}, ${s.toLowerCase()} theme` : `${s.toLowerCase()} arc text phrase`)}
                          className="py-1.5 rounded-lg bg-neutral-800/80 hover:bg-teal-500/10 hover:text-teal-300 hover:border-teal-500/30 border border-neutral-700/80 transition-all font-medium text-neutral-400">{s}</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-neutral-800/60" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-teal-500/70">✦ CURVE STYLE</p>
                      <div className="flex-1 h-px bg-neutral-800/60" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      {['Full Circle', 'Top Arc', 'Banner', 'Wave', 'Rising', 'Spiral'].map(s => (
                        <button key={s} type="button"
                          onClick={() => setTextPrompt(p => p ? `${p}, ${s.toLowerCase()} curve` : `${s.toLowerCase()} curve style`)}
                          className="py-1.5 rounded-lg bg-neutral-800/80 hover:bg-teal-500/10 hover:text-teal-300 hover:border-teal-500/30 border border-neutral-700/80 transition-all font-medium text-neutral-400">{s}</button>
                      ))}
                    </div>
                    <button type="button" onClick={() => deductCredits(5)}
                      className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(20,184,166,0.25)]">
                      ✦ Generate Arc Text
                      <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold inline-flex items-center gap-0.5">5 <LucideIcons.Sparkles className="w-2.5 h-2.5" /></span>
                    </button>
                  </motion.div>
                )}

                {/* ── Aevaia AI — unified navigation + generation ── */}
                {activeFeature === 'general' && (
                  <motion.div key="feat-general" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                    className="absolute inset-0 flex flex-col">

                    {/* Header */}
                    <div className="shrink-0 px-4 pt-4 pb-3 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center"><LucideIcons.Bot className="w-4 h-4 text-purple-400" /></div>
                      <div>
                        <p className="text-xs font-bold text-white">Aevaia AI</p>
                        <p className="text-[10px] text-neutral-500">Your creative AI partner</p>
                      </div>
                    </div>

                    {/* Message history */}
                    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2.5 min-h-0">
                      {chatHistory.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-6">
                          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xl select-none">✦</div>
                          <div>
                            <p className="text-xs font-semibold text-neutral-300 mb-1">Aevaia AI</p>
                            <p className="text-[10px] text-neutral-600 leading-relaxed max-w-[160px]">
                              Ask to generate content or open any panel.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {SUGGESTIONS.map(s => (
                              <button key={s.label} type="button" onClick={() => handleCopilotSubmit(s.label)} disabled={isSending}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-800/80 border border-neutral-700/60 text-[10px] font-medium text-neutral-400 hover:border-purple-500/60 hover:text-purple-300 hover:bg-purple-500/10 transition-all disabled:opacity-40">
                                <s.Icon className="w-3 h-3 shrink-0" />{s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'ai' && (
                            <div className="w-5 h-5 rounded-full bg-purple-600/80 border border-purple-500/40 shrink-0 flex items-center justify-center mt-0.5">
                              <span className="text-[9px] text-white select-none">✦</span>
                            </div>
                          )}
                          <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-purple-600 text-white rounded-br-sm'
                              : 'bg-neutral-800/80 text-neutral-200 rounded-bl-sm border border-neutral-700/50'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div className="shrink-0 px-4 pb-4 pt-2 border-t border-zinc-800/60 space-y-2">
                      <div className="flex gap-2 items-end">
                        <textarea
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCopilotSubmit(); } }}
                          placeholder="Ask Aevaia AI…"
                          rows={2}
                          disabled={isSending}
                          className="flex-1 min-w-0 bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-xl px-3 py-2.5 text-xs resize-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-neutral-600 disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopilotSubmit()}
                          disabled={!chatInput.trim() || isSending}
                          className="shrink-0 w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                          aria-label="Send"
                        >
                          {isSending ? (
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Copywriting AI ── */}
          {isTextSelected && (
            <motion.div key="copywriting"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 overflow-y-auto p-4 space-y-5"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center"><LucideIcons.PenTool className="w-3.5 h-3.5 text-purple-400" /></div>
                <div>
                  <p className="text-xs font-bold text-white">Copywriting AI</p>
                  <p className="text-[10px] text-neutral-500">{selectedItem === 'headline' ? 'Headline' : 'Paragraph'} selected</p>
                </div>
              </div>

              {/* ── Live streaming prompt box ── */}
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-400/70">
                  ✦ Aevaia AI
                </p>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={chatPrompt}
                    onChange={e => setChatPrompt(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleStreamChat(); }}
                    placeholder={`e.g. "Make this more intimate for a 10th anniversary"`}
                    disabled={isStreaming || !activeBlockId}
                    className="flex-1 min-w-0 h-8 bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg px-2.5 text-[11px] outline-none focus:border-purple-500/70 placeholder:text-neutral-600 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => handleStreamChat()}
                    disabled={!chatPrompt.trim() || isStreaming || !activeBlockId}
                    aria-label="Generate with AI"
                    className="h-8 w-8 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all shrink-0 flex items-center justify-center"
                  >
                    {isStreaming ? <Spinner /> : <span className="text-sm select-none">✦</span>}
                  </button>
                </div>
                {isStreaming && (
                  <p className="text-[9px] text-purple-400/60 animate-pulse">Writing to canvas…</p>
                )}
              </div>

              {/* ── Context-aware suggestion pills ── */}
              <div className="flex flex-wrap gap-1.5">
                {([
                  { label: 'Make it poetic',     prompt: 'Rewrite this in a deeply poetic, lyrical style — evoke raw emotion in every line' },
                  { label: 'Make it formal',     prompt: 'Rewrite this in a formal, sophisticated tone appropriate for a luxury occasion' },
                  { label: 'Toast speech style', prompt: 'Rewrite this as an elegant toast speech — warm, celebratory, and memorable' },
                ]).map(({ label, prompt }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleStreamChat(prompt)}
                    disabled={isStreaming || !activeBlockId}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-medium text-purple-300 hover:bg-purple-500/20 hover:border-purple-400/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Emotional Tone</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {([
                    { id: 'romantic', label: 'Romantic', Icon: LucideIcons.Heart },
                    { id: 'poetic',   label: 'Poetic',   Icon: LucideIcons.Moon  },
                    { id: 'funny',    label: 'Funny',    Icon: LucideIcons.Smile  },
                    { id: 'casual',   label: 'Casual',   Icon: LucideIcons.Hand   },
                  ] as const).map(({ id, label, Icon }) => (
                    <button key={id} type="button" onClick={() => setSelectedTone(id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${selectedTone === id ? 'border-purple-500 bg-purple-500/15 text-purple-200' : 'border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'}`}>
                      <Icon className="w-3.5 h-3.5 shrink-0" />{label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleStreamChat(`Rewrite this ${selectedItem} with a ${selectedTone} tone`)}
                disabled={isRewriting || isStreaming || !activeBlockId}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.25)]"
              >
                {(isRewriting || isStreaming) ? <><Spinner />{isStreaming ? 'Writing…' : 'Rewriting…'}</> : <><LucideIcons.Sparkles className="w-3.5 h-3.5" /> Rewrite Text</>}
              </button>
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Quick Rewrites</p>
                {([
                  { label: 'Make it romantic',      text: 'Forever and Always. Join us in celebrating our love story.' },
                  { label: 'Add emotion & warmth',  text: 'With hearts full of joy, we invite you to witness our most cherished day.' },
                  { label: 'Make it formal',        text: 'We cordially request the honour of your presence at our celebration.' },
                  { label: 'Make it short',         text: 'Join us. It will be unforgettable.' },
                ]).map(({ label, text }) => (
                  <button key={label} type="button" onClick={() => handleQuickRewrite(text)} disabled={!activeBlockId}
                    className="w-full text-left px-3 py-2 rounded-lg border border-neutral-800 text-[11px] text-neutral-400 hover:border-purple-500/40 hover:text-neutral-200 hover:bg-purple-500/5 transition-all disabled:opacity-40 group">
                    <span className="text-neutral-600 group-hover:text-purple-400 mr-1.5">→</span>{label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Visual AI ── */}
          {(isImageSelected || isGallerySelected) && (
            <motion.div key="visual"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 overflow-y-auto p-4 space-y-5"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center"><LucideIcons.Palette className="w-3.5 h-3.5 text-blue-400" /></div>
                <div>
                  <p className="text-xs font-bold text-white">Visual AI</p>
                  <p className="text-[10px] text-neutral-500">{isGallerySelected ? 'Gallery Stack' : 'Image'} selected</p>
                </div>
              </div>

              {/* ── AI Art Director streaming prompt box ── */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400/70">✦ AI Art Director</p>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={imageAIInput}
                    onChange={e => setImageAIInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleStreamImagePrompt(); }}
                    placeholder={`e.g. "Luxurious midnight candlelight scene"`}
                    disabled={isImageStreaming}
                    className="flex-1 min-w-0 h-8 bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg px-2.5 text-[11px] outline-none focus:border-blue-500/70 placeholder:text-neutral-600 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => handleStreamImagePrompt()}
                    disabled={!imageAIInput.trim() || isImageStreaming}
                    aria-label="Generate image prompt"
                    className="h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-all shrink-0 flex items-center justify-center"
                  >
                    {isImageStreaming ? <Spinner /> : <span className="text-sm select-none">✦</span>}
                  </button>
                </div>
                {isImageStreaming && (
                  <p className="text-[9px] text-blue-400/60 animate-pulse">Crafting art direction…</p>
                )}
              </div>

              {/* ── Visual suggestion pills ── */}
              <div className="flex flex-wrap gap-1.5">
                {([
                  { label: 'Midnight luxury glow',  prompt: 'Generate an image prompt for a midnight luxury scene — deep navy darkness, golden glowing accents, floating candlelight, romantic editorial photography' },
                  { label: 'Pastel floral canvas',   prompt: 'Generate an image prompt for a pastel romantic floral setting — soft watercolour blooms, warm sunrise light, airy feminine luxury' },
                  { label: 'Cinematic photo style',  prompt: 'Generate an image prompt in a cinematic photorealistic style — dramatic Rembrandt lighting, shallow depth of field, 35mm film grain, editorial high fashion' },
                ]).map(({ label, prompt }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleStreamImagePrompt(prompt)}
                    disabled={isImageStreaming}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-medium text-blue-300 hover:bg-blue-500/20 hover:border-blue-400/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Image Prompt</p>
                <textarea value={imagePrompt} onChange={e => setImagePrompt(e.target.value)}
                  placeholder="Golden hour, soft bokeh, romantic couple silhouette…" rows={3}
                  className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-xl px-3 py-2.5 text-xs resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all placeholder:text-neutral-600"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Style Presets</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {([{ label: 'Photorealistic', Icon: LucideIcons.Camera }, { label: 'Illustration', Icon: LucideIcons.Paintbrush }, { label: 'Abstract', Icon: LucideIcons.Wind }, { label: 'Cinematic', Icon: LucideIcons.Film }] as { label: string; Icon: React.ComponentType<{ className?: string }> }[]).map(p => (
                    <button key={p.label} type="button"
                      onClick={() => setImagePrompt((imagePrompt ? imagePrompt + ', ' : '') + p.label.toLowerCase() + ' style')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 hover:border-blue-500/40 hover:text-neutral-200 hover:bg-blue-500/5 transition-all">
                      <p.Icon className="w-3 h-3" />{p.label}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => handleGenerateMockImage(imagePrompt)} disabled={isGeneratingImage}
                className={`w-full py-3 rounded-xl text-white text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${isGallerySelected ? 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]' : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.25)]'}`}>
                {isGeneratingImage ? <><Spinner />Generating…</> : <><LucideIcons.Sparkles className="w-3.5 h-3.5" /> Generate Asset</>}
              </button>
            </motion.div>
          )}

          {/* ── Sound AI ── */}
          {isAudioSelected && (
            <motion.div key="sound"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 overflow-y-auto p-4 space-y-5"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center"><LucideIcons.Music className="w-3.5 h-3.5 text-emerald-400" /></div>
                <div>
                  <p className="text-xs font-bold text-white">Sound AI</p>
                  <p className="text-[10px] text-neutral-500">Audio block selected</p>
                </div>
              </div>

              {/* ── AI Music Director streaming prompt box ── */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">✦ AI Music Director</p>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={audioAIInput}
                    onChange={e => setAudioAIInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleStreamAudioPrompt(); }}
                    placeholder={`e.g. "Romantic piano piece for a first dance"`}
                    disabled={isAudioStreaming}
                    className="flex-1 min-w-0 h-8 bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg px-2.5 text-[11px] outline-none focus:border-emerald-500/70 placeholder:text-neutral-600 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => handleStreamAudioPrompt()}
                    disabled={!audioAIInput.trim() || isAudioStreaming}
                    aria-label="Generate music prompt"
                    className="h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-all shrink-0 flex items-center justify-center"
                  >
                    {isAudioStreaming ? <Spinner /> : <span className="text-sm select-none">✦</span>}
                  </button>
                </div>
                {isAudioStreaming && (
                  <p className="text-[9px] text-emerald-400/60 animate-pulse">Composing music direction…</p>
                )}
              </div>

              {/* ── Audio suggestion pills ── */}
              <div className="flex flex-wrap gap-1.5">
                {([
                  { label: 'Sweet acoustic track',         prompt: 'Generate a Suno music prompt for a sweet warm acoustic guitar track — fingerpicked melody, intimate and tender, 70 BPM, romantic folk' },
                  { label: 'Cinematic orchestral strings', prompt: 'Generate a Suno music prompt for a sweeping cinematic orchestral piece — rising strings, emotional build to release, 80 BPM, film score style' },
                  { label: 'Warm voiceover preset',        prompt: 'Generate an ElevenLabs voice prompt describing a warm, intimate, slightly breathy narrator voice — feminine, close-mic, for a romantic personal gift message' },
                ]).map(({ label, prompt }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleStreamAudioPrompt(prompt)}
                    disabled={isAudioStreaming}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3.5 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5"><LucideIcons.Music2 className="w-3 h-3" /> Original Music</p>
                <textarea value={sunoPrompt} onChange={e => setSunoPrompt(e.target.value)}
                  placeholder="Soft lo-fi piano, warm and melancholic…" rows={2}
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all placeholder:text-neutral-600"
                />
                <button type="button" onClick={() => handleGenerateSong(sunoPrompt)} disabled={sunoLoading || !sunoPrompt.trim() || !activeBlockId}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${sunoSuccess ? 'bg-green-600/80 text-white' : sunoLoading ? 'bg-emerald-700/60 text-white/70 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 shadow-[0_0_14px_rgba(16,185,129,0.2)]'}`}>
                  {sunoLoading ? <><Spinner />Composing…</> : sunoSuccess ? '✓ Loaded!' : 'Compose Song'}
                </button>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3.5 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5"><LucideIcons.Mic className="w-3 h-3" /> Voice Generation</p>
                <input type="text" value={ttsText} onChange={e => setTtsText(e.target.value)} placeholder="Text to speak aloud…"
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500 transition-all placeholder:text-neutral-600"
                />
                <select value={ttsVoice} onChange={e => setTtsVoice(e.target.value)} aria-label="Voice model" title="Voice model"
                  className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500 transition-all appearance-none">
                  {VOICE_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <button type="button" onClick={handleGenerateVoice} disabled={ttsLoading || !ttsText.trim() || !activeBlockId}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${ttsSuccess ? 'bg-green-600/80 text-white' : ttsLoading ? 'bg-purple-700/60 text-white/70 cursor-wait' : 'bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 shadow-[0_0_14px_rgba(168,85,247,0.2)]'}`}>
                  {ttsLoading ? <><Spinner />Generating…</> : ttsSuccess ? '✓ Voice Loaded!' : 'Generate Voiceover'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Countdown info ── */}
          {isCountdownSelected && (
            <motion.div key="countdown"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><LucideIcons.Timer className="w-6 h-6 text-amber-400" /></div>
              <div>
                <p className="text-sm font-medium text-neutral-300 mb-1">Countdown Block</p>
                <p className="text-xs text-neutral-600 leading-relaxed">Set the target date in the Style panel.</p>
              </div>
              <button type="button" onClick={() => setLeftPanelTab('style')}
                className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium hover:bg-amber-500/20 transition-colors">
                Open Style Panel
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Studio({ id: propId = null }: { id?: string | null } = {}) {
  const { userId } = useAuth();

  // --- SCENE-BASED STATE ARCHITECTURE (with undo/redo history) ---
  const [historyState, dispatch] = useReducer(
    scenesReducer,
    null,
    (): HistoryState => ({
      past:    [],
      present: loadLocal('hc_scenes', DEFAULT_SCENES),
      future:  [],
    })
  );
  const scenes  = historyState.present;
  const canUndo = historyState.past.length > 0;
  const canRedo = historyState.future.length > 0;

  // History-aware scenes setter — drop-in replacement for the old useState setter
  const setScenes = useCallback((update: Scene[] | ((prev: Scene[]) => Scene[])) => {
    dispatch({
      type:   'SET_FN',
      update: typeof update === 'function' ? update : () => update,
    });
  }, []);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

  const [activeSceneId, setActiveSceneId] = useState<string>(() => loadLocal('hc_activeSceneId', 'scene-1'));

  // Get active scene
  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0];

  // --- APP LOGIC STATE ---
  const [selectedItem, setSelectedItem] = useState('none');
  const [activeBlockId,   setActiveBlockId]   = useState<string | null>(null);
  const [editingBlockId,  setEditingBlockId]  = useState<string | null>(null);
  const [theme, setTheme] = useState<string>(() => loadLocal('hc_theme', 'minimalist'));
  // Left panel tabs: Insert (component picker) | Style (block tools) | World (atmosphere)
  const [leftPanelTab, setLeftPanelTab] = useState<'insert' | 'style' | 'world'>('insert');
  // Image visual controls (applied to image blocks)
  const [imageBorderRadius, setImageBorderRadius] = useState(8);
  const [imageShadow, setImageShadow] = useState<'none' | 'soft' | 'strong' | 'glow'>('none');
  
  // --- SENSORY ENGINE STATE ---
  // Global ambient music (kept in publish payload for viewer backward-compat; edited via audio blocks)
  const [bgMusicUrl]    = useState('');
  const [bgMusicVolume] = useState(80);
  const [bgMusicSpeed]  = useState(1);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [ambientEffect, setAmbientEffect] = useState<'none' | 'fireflies' | 'floating-orbs' | 'particles' | 'ember' | 'starfield' | 'waves'>('none');
  // Interactive background effect from the Effects Library ('none' = no effect).
  const [canvasBackground, setCanvasBackground] = useState<string>('none');

  // ── 3D Engine controls ────────────────────────────────────────────────────
  const [webglSpeed,   setWebglSpeed]   = useState(1);     // 0.1 – 3
  const [webglDensity, setWebglDensity] = useState(0.5);   // 0 – 1
  const [webglColor,   setWebglColor]   = useState('#c4b5fd');
  
  // Editable Text State (for backward compatibility)
  const [headlineText, setHeadlineText] = useState("Happy Anniversary!");
  const [paragraphText, setParagraphText] = useState("Thank you for the best year of my life. I love you more than words can say.");
  
  // Initialize Tiptap editors
  const headlineEditor = useTiptapEditor({
    content: headlineText,
    onUpdate: (content) => setHeadlineText(content),
  });
  
  const paragraphEditor = useTiptapEditor({
    content: paragraphText,
    onUpdate: (content) => setParagraphText(content),
  });
  
  // AI & Database Loading States
  const [isRewriting, setIsRewriting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  // ── Global Orchestrator (Right Panel empty-state) ──────────────────────
  const [globalPrompt,      setGlobalPrompt]      = useState('');
  const [isOrchestrating,   setIsOrchestrating]   = useState(false);
  const [orchestrateResult, setOrchestrateResult] = useState('');
  // ── AI Audio — Suno (Right Panel) ─────────────────────────────────────
  const [sunoPrompt,  setSunoPrompt]  = useState('');
  const [sunoLoading, setSunoLoading] = useState(false);
  const [sunoSuccess, setSunoSuccess] = useState(false);
  // ── AI Audio — ElevenLabs (Right Panel) ───────────────────────────────
  const [ttsText,     setTtsText]     = useState('');
  const [ttsVoice,    setTtsVoice]    = useState('rachel');
  const [ttsLoading,  setTtsLoading]  = useState(false);
  const [ttsSuccess,  setTtsSuccess]  = useState(false);

  // ── Morphing right-panel feature mode — driven by left sidebar category clicks ─
  const [activeFeature,   setActiveFeature]   = useState<'general' | 'text' | 'media' | 'audio' | 'icons' | 'button' | 'video' | 'webgl' | 'lottie' | 'svg' | 'scribbles' | 'arctext'>('general');
  // Pre-engineered prompt injected by OmniBar → right panel textareas
  const [activeAIPrompt,  setActiveAIPrompt]  = useState('');

  // ── Icon property customizer — shared across left grid + right sliders ───────
  const [iconSize,        setIconSize]        = useState(24);
  const [iconStrokeWidth, setIconStrokeWidth] = useState(2);
  const [iconColor,       setIconColor]       = useState('#ffffff');

  // --- AI CO-PILOT STATE ---
  const [selectedTone, setSelectedTone] = useState<'poetic' | 'funny' | 'romantic' | 'casual'>('romantic');
  const [imagePrompt, setImagePrompt] = useState('');

  // Always false on first render (server + client hydration both see false → both render null → no mismatch).
  // Flipped to true in the effect below once the component has mounted on the client.
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => { setIsLoaded(true); }, []);

  // Share Modal States
  const [showShareModal, setShowShareModal] = useState(false);
  const [publishedId, setPublishedId] = useState("");
  const [copied, setCopied] = useState(false);

  // ── Publish Live modal ────────────────────────────────────────────────────────
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublishing,     setIsPublishing]     = useState(false);
  const [liveUrl,          setLiveUrl]          = useState('');
  const [liveCopied,       setLiveCopied]       = useState(false);

  // Paywall checkout modal
  const [isCheckoutOpen,  setIsCheckoutOpen]  = useState(false);
  const [showTierModal,   setShowTierModal]   = useState(false);
  const [pendingGiftId,    setPendingGiftId]    = useState('');
  const [pendingTier,      setPendingTier]      = useState<Tier>('INTIMATE');
  const [pendingGuestNames, setPendingGuestNames] = useState<string[]>([]);
  const [isSavingGift,     setIsSavingGift]     = useState(false);

  // AI Battery — session tracks remaining credits
  const [sessionId,        setSessionId]        = useState<string>(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('hc_session_id') ?? '') : ''
  );
  const [showCreditUpsell, setShowCreditUpsell] = useState(false);

  // ── Project persistence (Task A / B) ──────────────────────────────────────
  // projectId is read once from ?id= on mount; null means "fresh unsaved canvas"
  const [projectId, setProjectId] = useState<string | null>(() =>
    propId ?? (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null)
  );
  // True after the initial DB load completes; gates the auto-save hook so it
  // does not fire immediately on mount with the pre-hydration default state.
  const [hydrated, setHydrated] = useState(false);
  // Shown once when a brand-new project has no saved canvas data yet.
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  // Spatial canvas comments — persisted in scenesJson alongside blocks
  const [comments, setComments] = useState<CanvasComment[]>([]);

  // ── AI model selector (Task C) ────────────────────────────────────────────
  const [selectedModel, setSelectedModel] = useState<'google/gemini-2.5-flash' | 'openai/gpt-4o-mini'>('google/gemini-2.5-flash');

  // ── Typography ────────────────────────────────────────────────────────────────
  const [selectedFont, setSelectedFont] = useState<CanvasFont>(
    () => loadLocal('hc_font', 'inter') as CanvasFont
  );

  // ── Particle presets ──────────────────────────────────────────────────────────
  const [particlePreset, setParticlePreset] = useState<ParticlePreset | null>(null);

  // ── Global environment (atmosphere engine) ────────────────────────────────────
  const [environment, setEnvironmentState] = useState<{ theme: string; particles: string; ambientAudio: string }>(
    { theme: 'dark', particles: 'NONE', ambientAudio: 'NONE' }
  );
  const setEnvironment = useCallback((key: string, value: string) => {
    setEnvironmentState(prev => ({ ...prev, [key]: value }));
  }, []);

  // ── Soundscapes ───────────────────────────────────────────────────────────────
  const [activeSoundscape,  setActiveSoundscape]  = useState<Soundscape | null>(null);
  const [soundscapePlaying, setSoundscapePlaying] = useState(false);
  const soundscapeRef = useRef<HTMLAudioElement | null>(null);

  // ── World / post-processing controls ─────────────────────────────────────────
  const [particleDensity,   setParticleDensity]   = useState(50);    // 10–200
  const [particleSpeed,     setParticleSpeed]     = useState(10);    // 1–30 (×0.1 → 0.1–3.0)
  const [vignetteIntensity, setVignetteIntensity] = useState(0);     // 0–100 (%)
  const [bloomIntensity,    setBloomIntensity]    = useState(0);     // 0–100 (%)
  const [audioVolume,       setAudioVolume]       = useState(50);    // 0–100 (%)
  const [audioFadeIn,       setAudioFadeIn]       = useState(false);

  // ── Layer transforms (right-panel inspector) ──────────────────────────────────
  const [layerOpacity,  setLayerOpacity]  = useState(100); // 0–100
  const [layerScale,    setLayerScale]    = useState(100); // 50–150
  const [layerRotation, setLayerRotation] = useState(0);   // -30–30

  // ── Canvas workspace pan/zoom ─────────────────────────────────────────────────
  const [canvasZoom,         setCanvasZoom]         = useState(1);   // 0.15 – 4
  const [canvasPanX,         setCanvasPanX]         = useState(0);
  const [canvasPanY,         setCanvasPanY]         = useState(0);
  const [isPanningWorkspace, setIsPanningWorkspace] = useState(false);
  // Active canvas tool — drives cursor and click behaviour
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const panStartRef  = useRef<{ x: number; y: number; px: number; py: number }>({ x: 0, y: 0, px: 0, py: 0 });
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  // Both start as null so server and client render identically — no hydration mismatch.
  // URL params are read after mount in the useEffect below.
  const [stripeReturn, setStripeReturn] = useState<
    { status: 'success'; giftId: string } | { status: 'canceled' } | null
  >(null);
  const [paymentToast, setPaymentToast] = useState<'success' | 'canceled' | null>(null);

  // Sidebar collapse state (hardware-accelerated via CSS transition-all)
  const [isLeftOpen,  setIsLeftOpen]  = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);

  // Scene drawer (bottom of center canvas)
  const [sceneDrawerOpen, setSceneDrawerOpen] = useState(false);

  // Right-click context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; blockId: string } | null>(null);

  // --- DND-KIT SENSORS ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --- DRAG HANDLER (Updated for scenes) ---
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setScenes((currentScenes) => {
        return currentScenes.map((scene) => {
          if (scene.id === activeSceneId) {
            const oldIndex = scene.blocks.findIndex((item) => item.id === active.id);
            const newIndex = scene.blocks.findIndex((item) => item.id === over.id);
            return {
              ...scene,
              blocks: arrayMove(scene.blocks, oldIndex, newIndex)
            };
          }
          return scene;
        });
      });
    }
  };


  // --- SCENE MANAGEMENT FUNCTIONS ---
  const handleAddScene = () => {
    triggerHaptic(HapticPatterns.MEDIUM, hapticsEnabled);
    
    const newSceneNumber = scenes.length + 1;
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      name: `Scene ${newSceneNumber}`,
      blocks: [
        { id: `block-${Date.now()}-1`, type: 'headline', content: 'New Scene' },
        { id: `block-${Date.now()}-2`, type: 'paragraph', content: 'Start creating your story...' },
      ]
    };
    setScenes([...scenes, newScene]);
    setActiveSceneId(newScene.id);
  };

  const handleDeleteScene = (sceneId: string) => {
    if (scenes.length <= 1) return;
    
    const newScenes = scenes.filter(s => s.id !== sceneId);
    setScenes(newScenes);
    
    if (activeSceneId === sceneId) {
      setActiveSceneId(newScenes[0].id);
    }
  };

  const handleRenameScene = (sceneId: string, newName: string) => {
    setScenes(scenes.map(scene =>
      scene.id === sceneId ? { ...scene, name: newName } : scene
    ));
  };

  const handleDuplicateScene = (sceneId: string) => {
    const source = scenes.find(s => s.id === sceneId);
    if (!source) return;
    const now = Date.now();
    const copy: Scene = {
      id: `scene-${now}`,
      name: `${source.name} (Copy)`,
      blocks: source.blocks.map((b, i) => ({ ...b, id: `block-${now}-${i}` })),
    };
    const idx = scenes.findIndex(s => s.id === sceneId);
    const next = [...scenes];
    next.splice(idx + 1, 0, copy);
    setScenes(next);
    setActiveSceneId(copy.id);
    triggerHaptic(HapticPatterns.MEDIUM, hapticsEnabled);
  };

  const handleSceneChange = (sceneId: string) => {
    setActiveSceneId(sceneId);
    setSelectedItem('none');
    setActiveBlockId(null);
  };

  // --- BLOCK MUTATION HELPERS ---
  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    setScenes(prev => prev.map(scene =>
      scene.id === activeSceneId
        ? { ...scene, blocks: scene.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b) }
        : scene
    ));
  };

  // Deep-merges into a block's `properties` sub-object (used by AI sidebar)
  const patchBlockProperties = (blockId: string, patch: Partial<BlockProperties>) => {
    setScenes(prev => prev.map(scene =>
      scene.id === activeSceneId
        ? {
            ...scene,
            blocks: scene.blocks.map(b =>
              b.id === blockId
                ? { ...b, properties: { ...b.properties, ...patch } }
                : b
            ),
          }
        : scene
    ));
  };

  const addBlock = useCallback((type: Block['type']) => {
    // Theme → approximate background hex, used when no dark effect is active.
    const THEME_BG: Record<string, string> = {
      minimalist:        '#f5f5f5',
      'dark-romance':    '#020617',
      'bright-birthday': '#fefce8',
    };
    const isEffectActive = canvasBackground !== 'none' || ambientEffect !== 'none';
    const defaultTextColor = isEffectActive
      ? '#ffffff'
      : getContrastColor(THEME_BG[theme] ?? '#0a0a0a');

    setScenes(prev => {
      const now = Date.now();
      const thirtyDaysOut = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
      const newBlock: Block = {
        id: `block-${now}`,
        type,
        content: type === 'headline' ? 'Happy Anniversary!'
               : type === 'paragraph' ? 'Type your message here'
               : type === 'button' ? 'RSVP Now'
               : '',
        targetDate: type === 'countdown' ? thirtyDaysOut : undefined,
        images: type === 'gallery-stack' ? ['', '', ''] : undefined,
        filters:      (type === 'image' || type === 'gallery-stack') ? { ...DEFAULT_FILTERS } : undefined,
        audioUrl:     type === 'audio' ? '' : undefined,
        audioVolume:  type === 'audio' ? 80 : undefined,
        audioSpeed:   type === 'audio' ? 1  : undefined,
        properties:
          type === 'headline'  ? { fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 48,  color: defaultTextColor } :
          type === 'paragraph' ? { fontFamily: 'var(--font-inter), system-ui, sans-serif', fontSize: 16, color: defaultTextColor } :
          type === 'button'    ? { accentColor: '#10b981', blockBorderRadius: 12 } :
          undefined,
      };
      return prev.map(scene =>
        scene.id === activeSceneId
          ? { ...scene, blocks: [...scene.blocks, newBlock] }
          : scene
      );
    });
    triggerHaptic(HapticPatterns.LIGHT, hapticsEnabled);
  }, [activeSceneId, hapticsEnabled, canvasBackground, ambientEffect, theme]);

  const addBlockAtPosition = useCallback((type: Block['type'], x: number, y: number) => {
    const THEME_BG: Record<string, string> = {
      minimalist:        '#f5f5f5',
      'dark-romance':    '#020617',
      'bright-birthday': '#fefce8',
    };
    const isEffectActive = canvasBackground !== 'none' || ambientEffect !== 'none';
    const defaultTextColor = isEffectActive
      ? '#ffffff'
      : getContrastColor(THEME_BG[theme] ?? '#0a0a0a');

    setScenes(prev => {
      const now = Date.now();
      const thirtyDaysOut = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
      const newBlock: Block = {
        id: `block-${now}`,
        type,
        x,
        y,
        content: type === 'headline' ? 'Happy Anniversary!'
               : type === 'paragraph' ? 'Type your message here'
               : type === 'button' ? 'RSVP Now'
               : '',
        targetDate: type === 'countdown' ? thirtyDaysOut : undefined,
        images: type === 'gallery-stack' ? ['', '', ''] : undefined,
        filters: (type === 'image' || type === 'gallery-stack') ? { ...DEFAULT_FILTERS } : undefined,
        audioUrl:    type === 'audio' ? '' : undefined,
        audioVolume: type === 'audio' ? 80 : undefined,
        audioSpeed:  type === 'audio' ? 1 : undefined,
        properties:
          type === 'headline'  ? { fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 48,  color: defaultTextColor } :
          type === 'paragraph' ? { fontFamily: 'var(--font-inter), system-ui, sans-serif', fontSize: 16, color: defaultTextColor } :
          type === 'button'    ? { accentColor: '#10b981', blockBorderRadius: 12 } :
          undefined,
      };
      return prev.map(scene =>
        scene.id === activeSceneId
          ? { ...scene, blocks: [...scene.blocks, newBlock] }
          : scene
      );
    });
    triggerHaptic(HapticPatterns.LIGHT, hapticsEnabled);
  }, [activeSceneId, hapticsEnabled, canvasBackground, ambientEffect, theme]);

  // ── Spatial comment handlers ──────────────────────────────────────────────
  const addComment = useCallback((data: Omit<CanvasComment, 'id' | 'createdAt'>) => {
    const comment: CanvasComment = {
      ...data,
      id:        Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(),
    };
    setComments(prev => [...prev, comment]);
  }, []);

  const removeComment = useCallback((id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
  }, []);

  // --- AUTO-SAVE LOGIC ---

  // Serialised canvas state that drives the auto-save hook.
  // bgMusic values are effectively constant (no setters) so they need no deps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // ── Canonical payload inspector — call this anywhere to snapshot canvas state ──
  const generateCanvasPayload = useCallback(() => ({
    blocks: scenes,
    environment: {
      particles:        (environment as { particles: string }).particles,
      ambientAudio:     (environment as { ambientAudio: string }).ambientAudio,
      ambientEffect:    ambientEffect || "none",
      canvasBackground,
      webglColor,
      webglSpeed,
      webglDensity,
      particlePreset,
      particleDensity,
      particleSpeed,
      bloomIntensity,
      vignetteIntensity,
    },
    canvasSettings: {
      theme,
      selectedFont,
      layerOpacity,
      layerScale,
      layerRotation,
      audioVolume,
      audioFadeIn,
      bgMusicUrl,
      bgMusicVolume,
      bgMusicSpeed,
    },
    meta: {
      activeSceneId,
      sceneCount: scenes.length,
      generatedAt: new Date().toISOString(),
    },
  }), [
    scenes, environment, ambientEffect, canvasBackground, webglColor, webglSpeed, webglDensity,
    particlePreset, particleDensity, particleSpeed, bloomIntensity, vignetteIntensity,
    theme, selectedFont, layerOpacity, layerScale, layerRotation,
    audioVolume, audioFadeIn, bgMusicUrl, bgMusicVolume, bgMusicSpeed, activeSceneId,
  ]);

  const autoSavePayload = useMemo(() => JSON.stringify({
    blocks:      JSON.stringify(scenes),
    globalTheme: JSON.stringify({
      theme, bgMusicUrl, bgMusicVolume, bgMusicSpeed,
      ambientEffect, imageUrl, imageBorderRadius, imageShadow,
      headlineHtml:  headlineText,
      paragraphHtml: paragraphText,
      webglSpeed, webglDensity, webglColor,
      selectedFont, particlePreset, activeSoundscape,
      layerOpacity, layerScale, layerRotation,
      environment, canvasBackground,
      particleDensity, particleSpeed,
      vignetteIntensity, bloomIntensity,
      audioVolume, audioFadeIn,
    }),
    commentsJson: JSON.stringify(comments),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [scenes, theme, ambientEffect, webglSpeed, webglDensity, webglColor,
       headlineText, paragraphText, imageUrl, imageBorderRadius, imageShadow,
       selectedFont, particlePreset, activeSoundscape,
       layerOpacity, layerScale, layerRotation, environment, canvasBackground, comments,
       particleDensity, particleSpeed, vignetteIntensity, bloomIntensity, audioVolume, audioFadeIn]);

  const { saveStatus } = useAutoSave({
    projectId,
    payload: autoSavePayload,
    enabled: isLoaded && !!projectId && hydrated,
  });

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("hc_scenes", JSON.stringify(scenes));
      localStorage.setItem("hc_activeSceneId", activeSceneId);
      localStorage.setItem("hc_theme", theme);
    }
  }, [scenes, activeSceneId, theme, isLoaded]);

  // --- AI CO-PILOT HANDLERS ---

  // Fallback copy used when the API key is not configured or the request fails
  const TONE_COPY_FALLBACK: Record<string, Record<string, string>> = {
    headline: {
      poetic:    'Two Hearts, One Infinite Story',
      romantic:  'My Greatest Adventure Begins With You',
      funny:     'Officially Your Problem For Another Year',
      casual:    "So Happy You're In My Life",
    },
    paragraph: {
      poetic:    'In the quiet hours between our heartbeats, I find the verses I never knew I was writing — all of them about you.',
      romantic:  'Every sunrise feels like a promise renewed, because I wake up knowing the most extraordinary person in the world is beside me.',
      funny:     "You've endured another year of my chaos. That's basically a superpower. I owe you everything — and also maybe tacos.",
      casual:    'Hey, just wanted to say you mean a whole lot to me. Thanks for being your awesome self every single day.',
    },
  };

  const handleRewriteText = async (blockType: string, tone: string) => {
    setIsRewriting(true);

    // Lazily create a session on first AI use and persist ID in localStorage
    let sid = sessionId;
    if (!sid) {
      try {
        const r = await fetch('/api/session/create', { method: 'POST' });
        if (r.ok) {
          const d = await r.json() as { id: string };
          sid = d.id;
          setSessionId(sid);
          localStorage.setItem('hc_session_id', sid);
        }
      } catch { /* non-fatal — generation will proceed without credit tracking */ }
    }

    const currentText = blockType === 'headline' ? headlineText : paragraphText;

    let result: string;

    try {
      const res = await fetch('/api/ai/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentText, tone, blockType, sessionId: sid, model: selectedModel, projectId }),
      });

      if (res.status === 403) {
        const data = await res.json() as { error?: string };
        if (data.error === 'BATTERY_DEPLETED' || data.error === 'INSUFFICIENT_CREDITS') {
          setShowCreditUpsell(true);
          setIsRewriting(false);
          return;
        }
        throw new Error(`API 403`);
      }

      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json() as { text?: string };
      if (!data.text) throw new Error('Empty response');
      result = data.text;
    } catch {
      // Graceful fallback so the UI never breaks without an API key
      result = TONE_COPY_FALLBACK[blockType]?.[tone] ?? 'Beautiful words, beautifully rewritten.';
    }

    // Update the Tiptap editor (live canvas view)
    if (blockType === 'headline') {
      setHeadlineText(result);
      headlineEditor?.commands.setContent(result);
    } else {
      setParagraphText(result);
      paragraphEditor?.commands.setContent(result);
    }

    // Sync the result back into the scenes reducer so the canvas state is persisted
    setScenes(prev =>
      prev.map(scene => ({
        ...scene,
        blocks: scene.blocks.map(b =>
          b.type === blockType ? { ...b, content: result } : b
        ),
      }))
    );

    setIsRewriting(false);
  };

  // ── Global Orchestrator handler (atmosphere + AI UI navigation) ──────────
  const handleOrchestrate = async (promptOverride?: string) => {
    const prompt = promptOverride ?? globalPrompt;
    if (!prompt.trim() || isOrchestrating) return;
    setIsOrchestrating(true);
    setOrchestrateResult('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskType: 'generate_theme', prompt }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json() as {
        message?: string;
        ui_command?: string;
        theme?: string;
        ambientEffect?: string;
        suggestion?: string;
      };

      // Apply theme/atmosphere if the AI chose them
      if (data.theme && ['minimalist','dark-romance','bright-birthday'].includes(data.theme)) {
        setTheme(data.theme);
      }
      if (data.ambientEffect && ['none','fireflies','floating-orbs','particles','ember'].includes(data.ambientEffect)) {
        setAmbientEffect(data.ambientEffect as typeof ambientEffect);
      }

      // Execute UI navigation command
      if (data.ui_command) {
        switch (data.ui_command) {
          case 'OPEN_GLOBAL_THEME':
            setSelectedItem('none');
            setActiveBlockId(null);
            break;
          case 'OPEN_AUDIO_PANEL': {
            const audioBlock = activeScene.blocks.find(b => b.type === 'audio');
            if (audioBlock) {
              setSelectedItem('audio');
              setActiveBlockId(audioBlock.id);
              setLeftPanelTab('style');
            } else {
              setLeftPanelTab('insert');
            }
            break;
          }
          case 'OPEN_ELEMENTS_TAB':
            setLeftPanelTab('insert');
            break;
          case 'OPEN_TEXT_TOOLS': {
            const textBlock = activeScene.blocks.find(b => b.type === 'headline' || b.type === 'paragraph');
            if (textBlock) {
              setSelectedItem(textBlock.type);
              setActiveBlockId(textBlock.id);
              setLeftPanelTab('style');
            }
            break;
          }
          case 'OPEN_IMAGE_TOOLS': {
            const imgBlock = activeScene.blocks.find(b => b.type === 'image' || b.type === 'gallery-stack');
            if (imgBlock) {
              setSelectedItem(imgBlock.type);
              setActiveBlockId(imgBlock.id);
              setLeftPanelTab('style');
            }
            break;
          }
        }
      }

      setOrchestrateResult(data.message ?? data.suggestion ?? 'Atmosphere updated.');
    } catch {
      setOrchestrateResult('Unable to reach Aevaia AI. Try again.');
    } finally {
      setIsOrchestrating(false);
    }
  };

  // ── AI Audio handlers (Right Panel) ──────────────────────────────────────
  const handleGenerateSong = async (promptOverride?: string) => {
    const prompt = promptOverride ?? sunoPrompt;
    if (!prompt.trim() || sunoLoading || !activeBlockId) return;
    setSunoLoading(true);
    await new Promise<void>(r => setTimeout(r, 2000));
    // Mock result: load into the active audio block
    updateBlock(activeBlockId, { audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' });
    setSunoLoading(false);
    setSunoSuccess(true);
    setTimeout(() => setSunoSuccess(false), 3000);
  };

  const handleGenerateVoice = async () => {
    if (!ttsText.trim() || ttsLoading || !activeBlockId) return;
    setTtsLoading(true);
    await new Promise<void>(r => setTimeout(r, 2000));
    // Mock result: load into the active audio block
    updateBlock(activeBlockId, { audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' });
    setTtsLoading(false);
    setTtsSuccess(true);
    setTimeout(() => setTtsSuccess(false), 3000);
  };

  const handleGenerateMockImage = async (prompt: string) => {
    setIsGeneratingImage(true);
    await new Promise<void>(resolve => setTimeout(resolve, 2000));
    const seed = encodeURIComponent(prompt.trim() || 'romance');
    setImageUrl(`https://picsum.photos/seed/${seed}/800/600`);
    // Reset the active image block's filters so the new image is shown cleanly
    if (activeBlockId && (selectedItem === 'image' || selectedItem === 'gallery-stack')) {
      updateBlock(activeBlockId, { filters: { ...DEFAULT_FILTERS } });
    }
    setIsGeneratingImage(false);
  };

  // --- PUBLISH FLOW ---

  const handleCreateAnother = useCallback(() => {
    setShowShareModal(false);
    setPublishedId('');
    setPendingGiftId('');
    setPendingTier('INTIMATE');
    setPendingGuestNames([]);
    setShowTierModal(false);
    // Reset canvas to defaults and clear persisted state so the next
    // loadLocal call starts fresh (the auto-save effect will overwrite storage).
    localStorage.removeItem('hc_scenes');
    localStorage.removeItem('hc_activeSceneId');
    localStorage.removeItem('hc_theme');
    dispatch({ type: 'SET_FN', update: () => DEFAULT_SCENES });
    setActiveSceneId('scene-1');
    setTheme('minimalist');
    setAmbientEffect('none');
    window.history.replaceState({}, '', '/studio');
  }, []);

  // handlePublish: saves the current design to the DB, then opens the Stripe
  // paywall modal. Always creates a fresh row — never reuses a stale gift ID.
  const handlePublish = async () => {
    if (isSavingGift) return;
    console.log('[Aevaia] Canvas payload snapshot:', generateCanvasPayload());
    setPendingGiftId(''); // always start from a clean slate
    setIsSavingGift(true);

    try {
      const globalState = {
        theme, bgMusicUrl, bgMusicVolume, bgMusicSpeed,
        ambientEffect, imageUrl, imageBorderRadius, imageShadow,
        headlineHtml:  headlineEditor?.getHTML() ?? headlineText,
        paragraphHtml: paragraphEditor?.getHTML() ?? paragraphText,
        webglSpeed, webglDensity, webglColor,
      };

      const res = await fetch('/api/gifts/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks:      JSON.stringify(scenes),
          globalTheme: JSON.stringify(globalState),
        }),
      });

      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      const { id } = await res.json() as { id: string };
      setPendingGiftId(id);

      // Track in localStorage so the dashboard can show this gift in the drafts grid
      try {
        const prev: { id: string; createdAt: string }[] =
          JSON.parse(localStorage.getItem('hc_gift_history') ?? '[]');
        const updated = [{ id, createdAt: new Date().toISOString() }, ...prev].slice(0, 50);
        localStorage.setItem('hc_gift_history', JSON.stringify(updated));
      } catch { /* non-fatal */ }

      toast.success('Design saved!', { description: 'Select a plan to share your gift.' });
      setShowTierModal(true);  // tier selection before Stripe
    } catch (err) {
      console.error('[handlePublish] Failed to save gift before checkout:', err);
      // Still open modal so user can retry payment; gift save will be retried
    } finally {
      setIsSavingGift(false);
    }
  };

  // Called by TierModal once the user has chosen a tier (and saved the guest
  // list for EVENT). Closes the tier modal and opens the payment modal.
  const handleTierProceed = useCallback((tier: Tier, guestNames: string[]) => {
    setPendingTier(tier);
    setPendingGuestNames(guestNames);
    setShowTierModal(false);
    setIsCheckoutOpen(true);
  }, []);

  // ── Publish Live: flips isPublished → PUBLISHED, shows shareable /p/ URL ───
  const handlePublishLive = useCallback(async () => {
    if (!projectId || isPublishing) return;
    setIsPublishing(true);
    try {
      // Send full canvas snapshot to the inspection endpoint for server-side logging.
      fetch('/api/publish', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...generateCanvasPayload(), designId: projectId, userId: userId ?? 'anonymous' }),
      }).catch(() => {});

      const res  = await fetch(`/api/projects/${projectId}/publish`, { method: 'POST' });
      const data = await res.json() as { url?: string; error?: string };
      if (res.ok && data.url) {
        setLiveUrl(data.url);
        setShowPublishModal(true);
        // Sonner toast — quick feedback with copy action
        toast.success('Live! Your experience is public.', {
          description: data.url,
          duration: 9000,
          action: {
            label: 'Copy link',
            onClick: () => navigator.clipboard.writeText(data.url!).catch(() => {}),
          },
        });
      } else {
        console.error('[studio] Publish failed:', data.error);
        toast.error('Publish failed. Please try again.');
      }
    } catch (err) {
      console.error('[studio] Publish error:', err);
    } finally {
      setIsPublishing(false);
    }
  }, [projectId, isPublishing, generateCanvasPayload, userId]);

  // --- THEME DICTIONARY ---
  const themeStyles = {
    'minimalist': { canvasBg: 'bg-white border-neutral-300', imageArea: 'bg-neutral-200', headline: 'text-neutral-800 font-sans', paragraph: 'text-neutral-600 font-sans' },
    'dark-romance': { canvasBg: 'bg-slate-950 border-rose-900', imageArea: 'bg-slate-900', headline: 'text-rose-200 font-serif tracking-widest', paragraph: 'text-rose-400/80 font-serif italic' },
    'bright-birthday': { canvasBg: 'bg-yellow-50 border-pink-400', imageArea: 'bg-blue-200', headline: 'text-pink-600 font-black tracking-tight', paragraph: 'text-purple-600 font-bold' }
  };
  const currentTheme = themeStyles[theme as keyof typeof themeStyles];

  const deleteBlock = useCallback((blockId: string) => {
    setScenes(prev => prev.map(scene => ({
      ...scene,
      blocks: scene.blocks.filter(b => b.id !== blockId),
    })));
    setActiveBlockId(null);
    setSelectedItem('none');
    setContextMenu(null);
  }, [setScenes]);

  // ── Global keyboard shortcuts ─────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Never intercept while the user is typing in a field
      const el = document.activeElement as HTMLElement | null;
      if (!el) return;
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable) return;

      const isMod = e.ctrlKey || e.metaKey;

      // Delete / Backspace — remove selected block
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeBlockId) {
        deleteBlock(activeBlockId);
        return;
      }

      // Ctrl+D / Cmd+D — duplicate selected block
      if (isMod && e.key === 'd') {
        e.preventDefault();
        if (!activeBlockId) return;
        const source = (activeScene as Scene).blocks.find((b: Block) => b.id === activeBlockId);
        if (!source) return;
        const clone: Block = {
          ...JSON.parse(JSON.stringify(source)),
          id: `block-${Date.now()}`,
          x: source.x !== undefined ? source.x + 20 : undefined,
          y: source.y !== undefined ? source.y + 20 : undefined,
        };
        setScenes(prev => prev.map(scene =>
          scene.id === activeSceneId
            ? { ...scene, blocks: [...scene.blocks, clone] }
            : scene
        ));
        setActiveBlockId(clone.id);
        return;
      }

      // Ctrl+Z / Cmd+Z — undo; + Shift — redo
      if (isMod && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) { redo(); } else { undo(); }
        return;
      }

      // Ctrl+Y / Cmd+Y — alternate redo (Windows convention)
      if (isMod && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeBlockId, activeScene, activeSceneId, deleteBlock, undo, redo, setScenes, setActiveBlockId]);

  // ── Z-Index / Layering actions ────────────────────────────────────────────
  // All four mutations go through setScenes → dispatch(SET_FN) which
  // automatically pushes the current state to `past`, so every layering
  // change is fully undoable with Ctrl+Z.

  const bringForward = useCallback((blockId: string) => {
    setScenes(prev => prev.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      const idx = scene.blocks.findIndex(b => b.id === blockId);
      // Already at the top of the stack — nothing to do.
      if (idx < 0 || idx === scene.blocks.length - 1) return scene;
      const blocks = [...scene.blocks];
      [blocks[idx], blocks[idx + 1]] = [blocks[idx + 1], blocks[idx]];
      return { ...scene, blocks };
    }));
  }, [setScenes, activeSceneId]);

  const sendBackward = useCallback((blockId: string) => {
    setScenes(prev => prev.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      const idx = scene.blocks.findIndex(b => b.id === blockId);
      // Already at the bottom of the stack — nothing to do.
      if (idx <= 0) return scene;
      const blocks = [...scene.blocks];
      [blocks[idx], blocks[idx - 1]] = [blocks[idx - 1], blocks[idx]];
      return { ...scene, blocks };
    }));
  }, [setScenes, activeSceneId]);

  const bringToFront = useCallback((blockId: string) => {
    setScenes(prev => prev.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      const block = scene.blocks.find(b => b.id === blockId);
      if (!block) return scene;
      // Remove from current position and append to end (rendered on top).
      return { ...scene, blocks: [...scene.blocks.filter(b => b.id !== blockId), block] };
    }));
  }, [setScenes, activeSceneId]);

  const sendToBack = useCallback((blockId: string) => {
    setScenes(prev => prev.map(scene => {
      if (scene.id !== activeSceneId) return scene;
      const block = scene.blocks.find(b => b.id === blockId);
      if (!block) return scene;
      // Remove from current position and prepend to start (rendered beneath all others).
      return { ...scene, blocks: [block, ...scene.blocks.filter(b => b.id !== blockId)] };
    }));
  }, [setScenes, activeSceneId]);

  // ── Keyboard shortcuts: Delete/Backspace, Ctrl+Z/Y, Escape ───────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;
      if ((e.key === 'Backspace' || e.key === 'Delete') && activeBlockId) {
        e.preventDefault();
        deleteBlock(activeBlockId);
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) ||
          (e.key === 'y' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        redo();
      }
      if (e.key === 'Escape' && contextMenu) setContextMenu(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeBlockId, deleteBlock, undo, redo, contextMenu]);

  // ── Context menu: dismiss on outside click ────────────────────────────────
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu]);

  // ── Post-Stripe-return handler — runs once on mount ──────────────────────
  // Reads URL params here (not in useState) so server and client both start
  // from null and there is no hydration mismatch.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const isSuccess  = p.get('success')  === 'true';
    const isCanceled = p.get('canceled') === 'true';
    if (!isSuccess && !isCanceled) return;

    // Clean the URL so a refresh never re-triggers
    window.history.replaceState({}, '', '/studio');

    if (isSuccess) {
      const giftId = p.get('gift_id') ?? '';
      setStripeReturn({ status: 'success', giftId });
      setPaymentToast('success');
      const t = setTimeout(() => {
        navigator.clipboard.writeText(`${window.location.origin}/gift/${giftId}`).catch(() => {});
        setPublishedId(giftId);
        setPaymentToast(null);
        setShowShareModal(true);
      }, 1600);
      return () => clearTimeout(t);
    }

    // canceled
    setStripeReturn({ status: 'canceled' });
    setPaymentToast('canceled');
    const t = setTimeout(() => setPaymentToast(null), 5000);
    return () => clearTimeout(t);
  }, []);

  // ── Project loader — hydrates canvas from DB when ?id= is present ──────────
  useEffect(() => {
    if (!isLoaded || !projectId) return;

    fetch(`/api/projects/${projectId}`)
      .then(r => r.json())
      .then((data: { scenesJson?: string }) => {
        if (!data.scenesJson) { setShowTemplatePicker(true); setHydrated(true); return; }
        try {
          const { blocks, globalTheme, commentsJson } = JSON.parse(data.scenesJson) as {
            blocks: string; globalTheme: string; commentsJson?: string;
          };
          if (commentsJson) {
            try { setComments(JSON.parse(commentsJson) as CanvasComment[]); } catch { /* non-fatal */ }
          }
          const loadedScenes = JSON.parse(blocks) as Scene[];
          const g = JSON.parse(globalTheme) as Record<string, unknown>;

          dispatch({ type: 'SET_FN', update: () => loadedScenes });
          if (loadedScenes[0]) setActiveSceneId(loadedScenes[0].id);

          if (typeof g.theme            === 'string') setTheme(g.theme as string);
          if (typeof g.ambientEffect    === 'string') setAmbientEffect(g.ambientEffect as typeof ambientEffect);
          if (typeof g.canvasBackground === 'string') setCanvasBackground(g.canvasBackground);
          if (typeof g.webglSpeed       === 'number') setWebglSpeed(g.webglSpeed);
          if (typeof g.webglDensity     === 'number') setWebglDensity(g.webglDensity);
          if (typeof g.webglColor       === 'string') setWebglColor(g.webglColor);
          if (typeof g.imageUrl         === 'string') setImageUrl(g.imageUrl);
          if (typeof g.imageBorderRadius === 'number') setImageBorderRadius(g.imageBorderRadius);
          if (typeof g.imageShadow      === 'string') setImageShadow(g.imageShadow as typeof imageShadow);

          if (typeof g.headlineHtml === 'string') {
            setHeadlineText(g.headlineHtml);
            setTimeout(() => headlineEditor?.commands.setContent(g.headlineHtml as string), 0);
          }
          if (typeof g.paragraphHtml === 'string') {
            setParagraphText(g.paragraphHtml);
            setTimeout(() => paragraphEditor?.commands.setContent(g.paragraphHtml as string), 0);
          }

          // ── Sidebar state ──────────────────────────────────────────────────
          if (typeof g.selectedFont    === 'string') setSelectedFont(g.selectedFont as CanvasFont);
          if (typeof g.particlePreset  === 'string') setParticlePreset(g.particlePreset as ParticlePreset);
          if (typeof g.activeSoundscape === 'string') setActiveSoundscape(g.activeSoundscape as Soundscape);
          if (typeof g.layerOpacity    === 'number') setLayerOpacity(g.layerOpacity);
          if (typeof g.layerScale      === 'number') setLayerScale(g.layerScale);
          if (typeof g.layerRotation   === 'number') setLayerRotation(g.layerRotation);

          // ── Atmosphere environment ─────────────────────────────────────────
          if (g.environment && typeof g.environment === 'object') {
            setEnvironmentState(prev => ({ ...prev, ...(g.environment as object) }));
          }
        } catch (e) {
          console.error('[studio] Failed to parse project data:', e);
        } finally {
          setHydrated(true);
        }
      })
      .catch(err => {
        console.error('[studio] Failed to load project:', err);
        setHydrated(true);
      });
  // Run once when the editor is ready. projectId is a stable lazy-init value.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // Fonts are loaded via next/font/google in app/layout.tsx — no runtime injection needed.

  // ── Soundscape audio init ─────────────────────────────────────────────────────
  useEffect(() => {
    soundscapeRef.current = new Audio();
    soundscapeRef.current.loop   = true;
    soundscapeRef.current.volume = 0.5;
    return () => {
      if (soundscapeRef.current) {
        soundscapeRef.current.pause();
        soundscapeRef.current = null;
      }
    };
  }, []);

  // Sync soundscape volume whenever the slider changes
  useEffect(() => {
    if (soundscapeRef.current) {
      soundscapeRef.current.volume = audioVolume / 100;
    }
  }, [audioVolume]);

  // ── Canvas zoom (Ctrl+Wheel) and pan (2-finger trackpad swipe / plain scroll) ─
  useEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Pinch-to-zoom or Ctrl+Wheel → zoom
        const factor = e.deltaY < 0 ? 1.08 : 0.92;
        setCanvasZoom(z => Math.min(Math.max(z * factor, 0.15), 4));
      } else {
        // 2-finger trackpad swipe or plain scroll → pan
        setCanvasPanX(x => x - e.deltaX);
        setCanvasPanY(y => y - e.deltaY);
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // ── Canvas pan via drag on workspace background ──────────────────────────────
  useEffect(() => {
    if (!isPanningWorkspace) return;
    const handleMove = (e: MouseEvent) => {
      setCanvasPanX(panStartRef.current.px + (e.clientX - panStartRef.current.x));
      setCanvasPanY(panStartRef.current.py + (e.clientY - panStartRef.current.y));
    };
    const handleUp = () => setIsPanningWorkspace(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isPanningWorkspace]);

  const applyParticlePreset = useCallback((preset: ParticlePreset | null) => {
    setParticlePreset(preset);
    setEnvironmentState(prev => ({ ...prev, particles: preset ?? 'NONE' }));
    if (!preset) { setAmbientEffect('none'); return; }
    const p = PARTICLE_PRESETS.find(x => x.id === preset);
    if (!p) return;
    setAmbientEffect(p.effect);
    setWebglColor(p.color);
    setWebglDensity(p.density);
    setWebglSpeed(p.speed);
  }, []);

  // ── Template picker: apply a full template to the canvas ─────────────────
  // Called when the user selects a blueprint on first load. Dispatches the
  // template scenes into history, applies its atmosphere, and closes the modal.
  // Auto-save fires automatically (hydrated is already true at this point).
  const applyTemplate = useCallback((template: TemplateConfig) => {
    dispatch({ type: 'SET_FN', update: () => template.scenes });
    if (template.scenes[0]) setActiveSceneId(template.scenes[0].id);
    applyParticlePreset(template.atmosphere.particlePreset as ParticlePreset);
    setTheme(template.atmosphere.theme);
    setShowTemplatePicker(false);
  }, [applyParticlePreset]);

  const toggleSoundscape = useCallback((id: Soundscape) => {
    const audio = soundscapeRef.current;
    if (!audio) return;
    if (activeSoundscape === id) {
      audio.pause();
      audio.currentTime = 0;
      setActiveSoundscape(null);
      setSoundscapePlaying(false);
    } else {
      const track = SOUNDSCAPES.find(s => s.id === id);
      if (!track) return;
      audio.src = track.url;
      audio.play()
        .then(() => setSoundscapePlaying(true))
        .catch(() => setSoundscapePlaying(false));
      setActiveSoundscape(id);
    }
  }, [activeSoundscape]);

  // ── Debounced auto-save ──────────────────────────────────────────────────────
  const handleBackgroundClick = () => { setSelectedItem('none'); setActiveBlockId(null); };

  // --- HELPER CONSTANTS FOR UI ---
  const isTextSelected      = selectedItem === 'headline' || selectedItem === 'paragraph';
  const isImageSelected     = selectedItem === 'image';
  const isCountdownSelected = selectedItem === 'countdown';
  const isGallerySelected   = selectedItem === 'gallery-stack';
  const isAudioSelected     = selectedItem === 'audio';
  const isMapSelected       = selectedItem === 'map';
  const isIconSelected      = selectedItem === 'icon';
  const isLottieSelected    = selectedItem === 'lottie';
  const isVectorSelected    = selectedItem === 'vector';
  const isScribbleSelected  = selectedItem === 'scribble';
  const isArcTextSelected   = selectedItem === 'arc-text';
  const isNoneSelected      = selectedItem === 'none';

  // Shadow styles for image blocks
  const SHADOW_STYLES: Record<string, string> = {
    none:   'none',
    soft:   '0 4px 20px rgba(0,0,0,0.18)',
    strong: '0 8px 36px rgba(0,0,0,0.45)',
    glow:   '0 0 28px rgba(168,85,247,0.45)',
  };

  // Active block data (for countdown date picker and gallery image editor)
  const activeBlock = activeBlockId
    ? activeScene.blocks.find(b => b.id === activeBlockId) ?? null
    : null;

  // Current filter values for the active image / gallery-stack block
  const activeFilters: ImageFilters =
    activeBlock && (activeBlock.type === 'image' || activeBlock.type === 'gallery-stack')
      ? (activeBlock.filters ?? DEFAULT_FILTERS)
      : DEFAULT_FILTERS;

  const setFilter = (key: keyof ImageFilters, val: number) => {
    if (!activeBlock) return;
    updateBlock(activeBlock.id, { filters: { ...activeFilters, [key]: val } });
  };

  const resetFilters = () => {
    if (!activeBlock) return;
    updateBlock(activeBlock.id, { filters: { ...DEFAULT_FILTERS } });
  };

  // Get active editor
  const activeEditor = selectedItem === 'headline' ? headlineEditor : selectedItem === 'paragraph' ? paragraphEditor : null;

  if (!isLoaded) return null;

  const webglActive = ambientEffect === 'particles' || ambientEffect === 'ember'
                    || ambientEffect === 'starfield'  || ambientEffect === 'waves';

  // ── Assemble context value from all studio state ────────────────────────────
  const ctxValue = {
    scenes, activeScene, activeSceneId, setActiveSceneId,
    canUndo, canRedo, undo, redo, setScenes,
    handleAddScene, handleDeleteScene, handleRenameScene, handleDuplicateScene, handleSceneChange,
    selectedItem, setSelectedItem, activeBlockId, setActiveBlockId,
    activeBlock, activeFilters, setFilter, resetFilters,
    theme, setTheme, currentTheme,
    leftPanelTab, setLeftPanelTab,
    imageBorderRadius, setImageBorderRadius, imageShadow, setImageShadow, imageUrl, setImageUrl,
    ambientEffect, setAmbientEffect, webglSpeed, setWebglSpeed, webglDensity, setWebglDensity,
    webglColor, setWebglColor, webglActive,
    canvasBackground, setCanvasBackground,
    headlineEditor, paragraphEditor, activeEditor,
    isTextSelected, isImageSelected, isCountdownSelected, isGallerySelected, isAudioSelected, isMapSelected, isIconSelected, isLottieSelected, isVectorSelected, isScribbleSelected, isArcTextSelected, isNoneSelected,
    hapticsEnabled, setHapticsEnabled, contextMenu, setContextMenu,
    environment, setEnvironment,
    particlePreset, activeSoundscape, soundscapePlaying, applyParticlePreset, toggleSoundscape,
    particleDensity, setParticleDensity, particleSpeed, setParticleSpeed,
    vignetteIntensity, setVignetteIntensity, bloomIntensity, setBloomIntensity,
    audioVolume, setAudioVolume, audioFadeIn, setAudioFadeIn,
    layerOpacity, setLayerOpacity, layerScale, setLayerScale, layerRotation, setLayerRotation,
    canvasZoom, setCanvasZoom, canvasPanX, setCanvasPanX, canvasPanY, setCanvasPanY,
    isPanningWorkspace, setIsPanningWorkspace, panStartRef, workspaceRef,
    selectedFont, setSelectedFont,
    globalPrompt, setGlobalPrompt, isOrchestrating, orchestrateResult, handleOrchestrate,
    selectedTone, setSelectedTone, isRewriting, handleRewriteText,
    imagePrompt, setImagePrompt, isGeneratingImage, handleGenerateMockImage,
    sunoPrompt, setSunoPrompt, sunoLoading, sunoSuccess, handleGenerateSong,
    ttsText, setTtsText, ttsVoice, setTtsVoice, ttsLoading, ttsSuccess, handleGenerateVoice,
    selectedModel, setSelectedModel, showCreditUpsell, setShowCreditUpsell,
    iconSize, setIconSize, iconStrokeWidth, setIconStrokeWidth, iconColor, setIconColor,
    activeFeature, setActiveFeature,
    activeAIPrompt, setActiveAIPrompt,
    addBlock, addBlockAtPosition, deleteBlock, updateBlock, patchBlockProperties, handleDragEnd, sensors,
    bringForward, sendBackward, bringToFront, sendToBack,
    handleBackgroundClick,
    editingBlockId, setEditingBlockId,
    sceneDrawerOpen, setSceneDrawerOpen,
    isLeftOpen, setIsLeftOpen, isRightOpen, setIsRightOpen,
    projectId, saveStatus, isSavingGift, isPublishing, handlePublish, handlePublishLive,
    activeTool, setActiveTool,
    comments, addComment, removeComment,
  };

  return (
    <StudioCtx.Provider value={ctxValue}>

      {/* Fixed full-screen WebGL background */}
      {webglActive && (
        <div className="fixed inset-0 w-screen h-screen pointer-events-none" style={{ zIndex: -1 }}>
          <WebGLBackground mode={ambientEffect as import('@/components/ui/WebGLBackground').WebGLMode} speed={webglSpeed} density={webglDensity} color={webglColor} />
        </div>
      )}

      {/* ══════════ EXACT THREE-COLUMN LAYOUT ══════════ */}
      <div className={`fixed inset-0 flex flex-row overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white${isPanningWorkspace ? ' select-none' : ''}`}>

        {/* 1. LEFT SIDEBAR — collapses to w-0 */}
        <div className={`flex-shrink-0 bg-white dark:bg-zinc-950 overflow-y-auto overflow-x-hidden no-scrollbar transition-all duration-300 ease-in-out ${isLeftOpen ? 'w-80 border-r border-zinc-200 dark:border-zinc-800' : 'w-0 border-r-0'}`}>
          <LeftSidebar />
        </div>

        {/* 2. CENTER CANVAS — slightly lighter than panels so the card is the focal point */}
        <div className="flex-1 relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 min-w-0 flex items-center justify-center">
          <CenterCanvas />
        </div>

        {/* 3. RIGHT SIDEBAR — collapses to w-0 */}
        <div className={`flex-shrink-0 bg-white dark:bg-zinc-950 overflow-y-auto overflow-x-hidden no-scrollbar transition-all duration-300 ease-in-out ${isRightOpen ? 'w-80 border-l border-zinc-200 dark:border-zinc-800' : 'w-0 border-l-0'}`}>
          <RightSidebar />
        </div>

      </div>{/* end three-column layout */}

      {/* ── Payment return toasts ── */}
      <AnimatePresence>
        {paymentToast === 'success' && (
          <motion.div
            key="toast-success"
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{    opacity: 0, y: -24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-200 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-green-950 border border-green-500/30 shadow-[0_0_32px_rgba(34,197,94,0.25)] pointer-events-none select-none"
          >
            <LucideIcons.PartyPopper className="w-5 h-5 text-green-400 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-green-300 leading-tight">Payment successful!</p>
              <p className="text-[11px] text-green-500/80">Publishing your Aevaia…</p>
            </div>
            <svg className="animate-spin w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </motion.div>
        )}

        {paymentToast === 'canceled' && (
          <motion.div
            key="toast-canceled"
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0   }}
            exit={{    opacity: 0, y: -24 }}
            transition={{ duration: 0.3 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-200 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-neutral-900 border border-neutral-700 shadow-xl"
          >
            <span className="text-base" aria-hidden>↩</span>
            <p className="text-sm text-neutral-300">Payment canceled — your design is still saved.</p>
            <button
              type="button"
              onClick={() => setPaymentToast(null)}
              aria-label="Dismiss"
              className="ml-2 text-neutral-600 hover:text-neutral-300 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tier selection + host dashboard ── */}
      <TierModal
        isOpen={showTierModal}
        onClose={() => setShowTierModal(false)}
        giftId={pendingGiftId}
        onProceed={handleTierProceed}
      />

      {/* ── Paywall checkout modal ── */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        giftId={pendingGiftId}
        tier={pendingTier}
        guestNames={pendingGuestNames}
      />

      {/* ── Blueprint template picker — shown for brand-new empty projects ── */}
      <AnimatePresence>
        {showTemplatePicker && (
          <>
            {/* Backdrop */}
            <motion.div
              key="tpl-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md"
            />

            {/* Modal card */}
            <motion.div
              key="tpl-modal"
              initial={{ opacity: 0, y: 48, scale: 0.94 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: 48, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="fixed inset-0 z-[111] flex items-center justify-center px-6 pointer-events-none"
            >
              <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] pointer-events-auto overflow-hidden">

                {/* Header accent bar */}
                <div className="h-px w-full bg-linear-to-r from-transparent via-violet-500/60 to-transparent" />

                <div className="p-8 flex flex-col gap-7">

                  {/* Title */}
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-2xl select-none mb-1">
                      ✦
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Choose your Aevaia Blueprint
                    </h2>
                    <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                      Start with a fully pre-loaded luxury layout, or build from scratch.
                    </p>
                  </div>

                  {/* Template cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Wedding Suite */}
                    <button
                      type="button"
                      onClick={() => applyTemplate(WEDDING_SUITE_TEMPLATE)}
                      className="group relative flex flex-col items-center gap-3 p-5 rounded-2xl border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/40 transition-all duration-200 text-center"
                    >
                      <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <LucideIcons.Sparkles className="w-6 h-6 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white mb-0.5">Luxury Wedding Suite</p>
                        <p className="text-[10px] text-neutral-500 leading-relaxed">
                          Headline · Countdown · Venue Map · RSVP
                        </p>
                      </div>
                      <div className="absolute inset-0 rounded-2xl ring-1 ring-violet-500/0 group-hover:ring-violet-500/30 transition-all duration-200 pointer-events-none" />
                    </button>

                    {/* Anniversary Vault */}
                    <button
                      type="button"
                      onClick={() => applyTemplate(ANNIVERSARY_VAULT_TEMPLATE)}
                      className="group relative flex flex-col items-center gap-3 p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/40 transition-all duration-200 text-center"
                    >
                      <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <LucideIcons.Heart className="w-6 h-6 text-rose-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white mb-0.5">Anniversary Milestone</p>
                        <p className="text-[10px] text-neutral-500 leading-relaxed">
                          Paragraph · Carousel · Lottie Heart
                        </p>
                      </div>
                      <div className="absolute inset-0 rounded-2xl ring-1 ring-rose-500/0 group-hover:ring-rose-500/30 transition-all duration-200 pointer-events-none" />
                    </button>
                  </div>

                  {/* Skip */}
                  <button
                    type="button"
                    onClick={() => setShowTemplatePicker(false)}
                    className="text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors mx-auto"
                  >
                    Start with a blank canvas →
                  </button>
                </div>

                {/* Footer accent bar */}
                <div className="h-px w-full bg-linear-to-r from-transparent via-white/5 to-transparent" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── AI Battery depleted upsell ── */}
      <AnimatePresence>
        {showCreditUpsell && (
          <>
            <motion.div
              key="credit-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreditUpsell(false)}
              className="fixed inset-0 z-100 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              key="credit-card"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              className="fixed inset-0 z-101 flex items-center justify-center px-4 pointer-events-none"
            >
              <div className="w-full max-w-sm bg-neutral-950 border border-white/8 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.8)] pointer-events-auto overflow-hidden">
                <div className="h-1 w-full bg-linear-to-r from-amber-500 via-orange-400 to-amber-500" />
                <div className="p-8 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-amber-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">AI Battery Depleted</h2>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    You&apos;ve used all 10 free AI rewrites.<br />
                    Upgrade your creative energy with <span className="text-white font-semibold">50 more rewrites for €2.99</span>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCreditUpsell(false)}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-sm font-bold transition-all shadow-[0_0_24px_rgba(245,158,11,0.3)]"
                  >
                    Top Up — €2.99
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreditUpsell(false)}
                    className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Right-click block context menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-200 min-w-40 bg-neutral-900 border border-neutral-700/80 rounded-xl shadow-2xl overflow-hidden py-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => deleteBlock(contextMenu.blockId)}
            className="w-full px-3.5 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Delete Block
          </button>
        </div>
      )}

      {/* THE SHARE CENTER MODAL */}
      <AnimatePresence>
        {showShareModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-100"
            />

            {/* Card */}
            <motion.div
              initial={{ opacity: 0, y: 48, scale: 0.94 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: 48, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-105 bg-neutral-950 border border-white/8 rounded-4xl p-8 z-101 shadow-[0_0_60px_rgba(0,0,0,0.6)]"
            >
              {/* Success icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-[0_0_24px_rgba(34,197,94,0.2)]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-green-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-1 text-center">Payment Successful!</h3>
              <p className="text-neutral-500 text-sm text-center mb-7 leading-relaxed">
                Here is your Aevaia link. Share it with someone special.
              </p>

              {/* URL row */}
              <div className="bg-black/60 rounded-2xl p-4 flex items-center gap-3 border border-white/6 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-neutral-600 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                <input
                  readOnly
                  value={typeof window !== 'undefined' ? `${window.location.origin}/gift/${publishedId}` : ''}
                  aria-label="Published gift URL"
                  className="bg-transparent text-xs text-purple-300 w-full outline-none font-mono min-w-0"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/gift/${publishedId}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${copied ? 'bg-green-600 text-white' : 'bg-white/10 text-neutral-300 hover:bg-white/20'}`}
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              {/* View Gift button */}
              <a
                href={`/gift/${publishedId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mb-3 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold text-center transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              >
                View Gift
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>

              {/* Create another gift */}
              <button
                type="button"
                onClick={handleCreateAnother}
                className="w-full mb-4 py-3 rounded-2xl bg-white/6 hover:bg-white/10 text-neutral-300 hover:text-white text-sm font-semibold text-center transition-all flex items-center justify-center gap-2 border border-white/8"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Create Another Gift
              </button>

              {/* Payload summary */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-900/60 border border-neutral-800/60 mb-6 text-xs text-neutral-500">
                <span className="tabular-nums font-medium text-neutral-400">{scenes.length} scene{scenes.length !== 1 ? 's' : ''}</span>
                <span className="text-neutral-700">·</span>
                <span className="tabular-nums font-medium text-neutral-400">{scenes.reduce((acc, s) => acc + s.blocks.length, 0)} blocks</span>
                <span className="text-neutral-700">·</span>
                <span className="font-medium text-neutral-400 capitalize">{theme}</span>
              </div>

              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="w-full py-3.5 text-neutral-500 hover:text-white transition-colors text-sm font-medium rounded-xl hover:bg-neutral-900"
              >
                Back to Studio
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Publish Live Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showPublishModal && (
          <>
            {/* Backdrop */}
            <motion.div
              key="publish-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => { setShowPublishModal(false); setLiveCopied(false); }}
              className="fixed inset-0 z-200 bg-black/80 backdrop-blur-sm"
            />

            {/* Card */}
            <motion.div
              key="publish-card"
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,   scale: 1    }}
              exit={{    opacity: 0, y: 24,   scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              className="fixed inset-0 z-[201] flex items-center justify-center px-4 pointer-events-none"
            >
              <div className="w-full max-w-md bg-neutral-950 border border-white/8 rounded-3xl shadow-[0_0_80px_rgba(168,85,247,0.2)] pointer-events-auto overflow-hidden">
                <div className="h-1 w-full bg-linear-to-r from-purple-600 via-pink-500 to-purple-600" />

                <div className="p-8 space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_16px_rgba(168,85,247,0.2)]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-purple-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-white font-bold text-lg tracking-tight">Live link ready</h2>
                        <p className="text-neutral-500 text-xs mt-0.5">Your experience is now published</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowPublishModal(false); setLiveCopied(false); }}
                      aria-label="Close"
                      className="w-8 h-8 rounded-xl bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-neutral-500">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </div>

                  {/* Success indicator */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1,   opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-500/8 border border-green-500/20"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-400">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-400 text-sm font-medium">Published successfully</span>
                  </motion.div>

                  {/* URL box + copy */}
                  <div className="space-y-2">
                    <p className="text-neutral-500 text-[10px] font-semibold uppercase tracking-wider">Your live link</p>
                    <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
                      <p className="flex-1 text-purple-300 text-xs font-mono truncate">{liveUrl}</p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(liveUrl).catch(() => {});
                          setLiveCopied(true);
                          setTimeout(() => setLiveCopied(false), 2500);
                        }}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          liveCopied
                            ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                            : 'bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 hover:border-purple-500/60'
                        }`}
                      >
                        {liveCopied ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                              <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Open link CTA */}
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all shadow-[0_0_24px_rgba(168,85,247,0.3)] hover:shadow-[0_0_36px_rgba(168,85,247,0.5)]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    Open Live Experience
                  </a>

                  <p className="text-center text-[10px] text-neutral-700">
                    Share this link with anyone · No account required to view
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sonner toast container — dark theme to match studio chrome */}
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: { background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', color: '#e4e4e7' },
        }}
      />
    </StudioCtx.Provider>
  );
}
