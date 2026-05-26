"use client";

import React, { useState, useEffect, useRef } from "react";
import DOMPurify from "isomorphic-dompurify";
import * as LucideIcons from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import CountdownBlock from "@/components/canvas/CountdownBlock";
import AmbientEffects from "@/components/canvas/AmbientEffects";
import AtmosphereRenderer from "@/components/studio/atmosphere-renderer";
import MasonryGallery from "@/components/blocks/masonry-gallery";
import AudioBlock from "@/components/blocks/audio-block";
import { ShinyText, BlurWords } from "@/components/blocks/text-animations";
import GoogleMap from "@/components/blocks/google-map";
import RsvpForm from "@/components/blocks/rsvp-form";
import ScribbleBlock from "@/components/blocks/scribble-block";
import ArcTextBlock from "@/components/blocks/arc-text-block";
import VideoBlock from "@/components/blocks/video-block";
import LottiePlayer from "@/components/blocks/lottie-player";
import CarouselSlideshow from "@/components/blocks/carousel-slideshow";
import VectorArt from "@/components/blocks/vector-art";
import type { WebGLMode } from "@/components/ui/WebGLBackground";
import { getEffectComponent } from "@/lib/effectsRegistry";

const WebGLBackground = dynamic(
  () => import("@/components/ui/WebGLBackground"),
  { ssr: false, loading: () => null }
);

// ─── Types (sourced from centralised types/studio.ts) ─────────────────────
// Local duplicates removed; re-exports preserved for existing importers.

import type {
  ImageFilters,
  Block,
  Scene,
  GlobalState,
  GiftPayload,
} from "@/types/studio";
import {
  DEFAULT_IMAGE_FILTERS as DEFAULT_FILTERS,
  buildFilterString,
} from "@/types/studio";

export type { Block, Scene, GlobalState, GiftPayload };

// Soundscape URL map — mirrors studio SOUNDSCAPES constant
const SOUNDSCAPE_URLS: Record<string, string> = {
  "cinematic-strings":  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "acoustic-nostalgia": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "lo-fi-solitude":     "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
};

// ─── Theme map ────────────────────────────────────────────────────────────

const THEMES: Record<string, {
  page: string; headline: string; paragraph: string; imageArea: string; nav: string;
}> = {
  minimalist: {
    page:      "bg-neutral-100",
    headline:  "text-neutral-800 font-sans",
    paragraph: "text-neutral-600 font-sans",
    imageArea: "bg-neutral-200",
    nav:       "border-neutral-300 text-neutral-500 hover:bg-neutral-200",
  },
  "dark-romance": {
    page:      "bg-slate-950",
    headline:  "text-rose-200 font-serif tracking-widest",
    paragraph: "text-rose-400/80 font-serif italic",
    imageArea: "bg-slate-900",
    nav:       "border-white/15 text-white/50 hover:bg-white/10",
  },
  "bright-birthday": {
    page:      "bg-yellow-50",
    headline:  "text-pink-600 font-black tracking-tight",
    paragraph: "text-purple-600 font-bold",
    imageArea: "bg-blue-200",
    nav:       "border-pink-300 text-pink-400 hover:bg-pink-50",
  },
};

const SHADOW_STYLES: Record<string, string> = {
  none:   "none",
  soft:   "0 4px 20px rgba(0,0,0,0.18)",
  strong: "0 8px 36px rgba(0,0,0,0.45)",
  glow:   "0 0 28px rgba(168,85,247,0.45)",
};

// ─── Block renderer ───────────────────────────────────────────────────────

function ViewerBlock({ block, g, theme, giftId }: {
  block:  Block;
  g:      GlobalState;
  theme:  typeof THEMES[string];
  giftId: string;
}) {
  switch (block.type) {

    case "headline": {
      const hFont    = (block.properties?.fontFamily as string) || (g.selectedFont ?? undefined);
      const hSize    = (block.properties?.fontSize   as number) || 48;
      const hColor   = (block.properties?.color      as string) || undefined;
      const hAnimType = block.properties?.animationType as string | undefined;
      const hStyle   = { fontFamily: hFont, fontSize: `${hSize}px`, lineHeight: 1.2, color: hColor };

      if (hAnimType === 'blur-words') {
        const plainText = (block.content || g.headlineHtml || "").replace(/<[^>]*>/g, '');
        return <BlurWords text={plainText} className="text-center" style={hStyle} />;
      }
      const hContent = (
        <div
          className="text-center"
          style={hStyle}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.content || g.headlineHtml || "") }}
        />
      );
      return hAnimType === 'shiny' ? <ShinyText>{hContent}</ShinyText> : hContent;
    }

    case "paragraph": {
      const pFont    = (block.properties?.fontFamily as string) || (g.selectedFont ?? undefined);
      const pSize    = (block.properties?.fontSize   as number) || 16;
      const pColor   = (block.properties?.color      as string) || undefined;
      const pAnimType = block.properties?.animationType as string | undefined;
      const pStyle   = { fontFamily: pFont, fontSize: `${pSize}px`, lineHeight: 1.6, color: pColor };

      if (pAnimType === 'blur-words') {
        const plainText = (block.content || g.paragraphHtml || "").replace(/<[^>]*>/g, '');
        return <BlurWords text={plainText} className="text-center" style={pStyle} />;
      }
      const pContent = (
        <div
          className="text-center"
          style={pStyle}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.content || g.paragraphHtml || "") }}
        />
      );
      return pAnimType === 'shiny' ? <ShinyText>{pContent}</ShinyText> : pContent;
    }

    case "image": {
      // Per-block URL (AI-generated) takes precedence over legacy global imageUrl
      const src = block.content || g.imageUrl;
      if (!src) return null;
      return (
        <div
          className="w-full overflow-hidden"
          style={{ borderRadius: `${g.imageBorderRadius}px`, boxShadow: SHADOW_STYLES[g.imageShadow] ?? "none" }}
        >
          <div
            className={`w-full aspect-video overflow-hidden ${theme.imageArea}`}
            style={{ borderRadius: `${g.imageBorderRadius}px` }}
          >
            <img
              src={src}
              alt="Gift image"
              className="w-full h-full object-cover"
              style={{ filter: buildFilterString(block.filters ?? DEFAULT_FILTERS) }}
            />
          </div>
        </div>
      );
    }

    case "icon": {
      const iconName = block.content || "Heart";
      const iconSize = (block.properties?.iconSize        as number) || 64;
      const iconStr  = (block.properties?.iconStrokeWidth as number) || 2;
      const iconCol  = (block.properties?.iconColor       as string) || "#ec4899";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const IconComp = (LucideIcons as any)[iconName] ?? LucideIcons.HelpCircle;
      return (
        <div className="flex items-center justify-center py-2">
          {React.createElement(IconComp, { size: iconSize, strokeWidth: iconStr, color: iconCol })}
        </div>
      );
    }

    case "countdown":
      if (!block.targetDate) return null;
      return <CountdownBlock targetDate={block.targetDate} />;
    case "button": {
      const btnLabel  = block.content || "Click Here";
      const btnColor  = (block.properties?.accentColor as string) || "#10b981";
      const btnRadius = (block.properties?.blockBorderRadius as number) ?? 12;
      return (
        <div className="flex items-center justify-center py-2">
          <button
            type="button"
            style={{ backgroundColor: btnColor, borderRadius: `${btnRadius}px` }}
            className="px-8 py-3 text-white text-sm font-bold tracking-wide shadow-lg"
          >
            {btnLabel}
          </button>
        </div>
      );
    }
    case "video":
      return <VideoBlock content={block.content} />;
    case "gallery-stack":
      return <MasonryGallery images={block.images} properties={block.properties} />;
    case "audio":
      return <AudioBlock audioUrl={block.audioUrl} audioVolume={block.audioVolume ?? 80} />;
    case "map":
      return <GoogleMap properties={block.properties} />;
    case "rsvp-form":
      return <RsvpForm properties={block.properties} giftId={giftId} />;
    case "scribble":
      return (
        <ScribbleBlock
          paths={(block.properties?.scribblePaths as string[]) ?? []}
          strokeColor={(block.properties?.scribbleColor as string) ?? '#a855f7'}
          strokeWidth={(block.properties?.scribbleWidth as number) ?? 3}
          onPathsChange={() => {}}
          readOnly
        />
      );
    case "arc-text":
      return (
        <ArcTextBlock
          text={(block.properties?.arcText as string) ?? undefined}
          radius={(block.properties?.arcRadius as number) ?? undefined}
          color={(block.properties?.arcColor as string) ?? undefined}
          fontSize={(block.properties?.arcFontSize as number) ?? undefined}
          startAngle={(block.properties?.arcStartAngle as number) ?? undefined}
        />
      );
    case "lottie":
      return <LottiePlayer properties={block.properties} />;
    case "carousel":
      return <CarouselSlideshow images={block.images} properties={block.properties} />;
    case "vector":
      return <VectorArt properties={block.properties} />;
    default:
      return null;
  }
}

// ─── Main exported viewer ─────────────────────────────────────────────────

export default function GiftViewer({ payload }: { payload: GiftPayload }) {
  const [opened,    setOpened]   = useState(false);
  const [sceneIdx,  setSceneIdx] = useState(0);
  const [viewportW, setViewportW] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1920
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Spacebar-to-pan is editor-only and deliberately absent here.
  const CANVAS_BASE_WIDTH = 1920;
  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const scaleFactor = Math.min(1, viewportW / CANVAS_BASE_WIDTH);

  const { global: g, scenes } = payload;
  const theme   = THEMES[g.theme ?? "minimalist"] ?? THEMES.minimalist;
  const scene   = scenes[sceneIdx] ?? scenes[0];
  const isFirst = sceneIdx === 0;
  const isLast  = sceneIdx === scenes.length - 1;

  const particles = g.environment?.particles ?? "NONE";

  const webglActive =
    g.ambientEffect === "particles" || g.ambientEffect === "ember" ||
    g.ambientEffect === "starfield" || g.ambientEffect === "waves";

  const soundscapeRef = useRef<HTMLAudioElement | null>(null);

  // Fonts loaded globally via next/font/google in app/layout.tsx — no runtime injection needed.

  useEffect(() => {
    if (!g.bgMusicUrl) return;
    const audio = new Audio(g.bgMusicUrl);
    audio.loop         = true;
    audio.volume       = (g.bgMusicVolume ?? 80) / 100;
    audio.playbackRate = g.bgMusicSpeed ?? 1;
    audioRef.current   = audio;
    return () => { audio.pause(); audio.src = ""; };
  }, [g.bgMusicUrl, g.bgMusicVolume, g.bgMusicSpeed]);

  useEffect(() => {
    if (!g.activeSoundscape) return;
    const url = SOUNDSCAPE_URLS[g.activeSoundscape];
    if (!url) return;
    const audio = new Audio(url);
    audio.loop   = true;
    audio.volume = 0.35;
    soundscapeRef.current = audio;
    return () => { audio.pause(); audio.src = ""; };
  }, [g.activeSoundscape]);

  const handleOpen = () => {
    setOpened(true);
    audioRef.current?.play().catch(() => {});
    soundscapeRef.current?.play().catch(() => {});
  };

  return (
    <div className={`relative min-h-screen w-full overflow-hidden overflow-x-hidden ${theme.page}`}>

      {/* Ambient / WebGL effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Effects-registry background — renders exactly what the creator chose */}
        {g.canvasBackground && g.canvasBackground !== 'none' && (() => {
          const Effect = getEffectComponent(g.canvasBackground!);
          return Effect ? <Effect /> : null;
        })()}
        <AmbientEffects effect={g.ambientEffect} />
        {webglActive && (
          <WebGLBackground
            mode={g.ambientEffect as WebGLMode}
            speed={g.webglSpeed   ?? 1}
            density={g.webglDensity ?? 0.5}
            color={g.webglColor   ?? "#c4b5fd"}
          />
        )}
        {/* CSS particle atmosphere (snow, embers, blossoms) */}
        <AtmosphereRenderer particles={particles} />
      </div>

      {/* "Tap to open" overlay */}
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.6 }}
            onClick={handleOpen}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer bg-neutral-950 select-none"
          >
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
              className="mb-8"
            >
              <LucideIcons.Mail className="w-20 h-20 text-white/80" aria-label="Gift envelope" />
            </motion.div>
            <p className="text-white text-2xl font-semibold mb-2 tracking-tight">You have a gift</p>
            <p className="text-neutral-500 text-sm mb-10">Crafted especially for you</p>
            <motion.div
              animate={{ opacity: [0.45, 1, 0.45] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
              className="px-7 py-3 rounded-full border border-white/20 text-white/60 text-sm"
            >
              Tap anywhere to open
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gift content */}
      <AnimatePresence>
        {opened && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.7 }}
            className="relative z-10 min-h-screen flex flex-col"
          >
            <div className="flex-1 flex items-center justify-center px-6 py-16">
              <div
                className="w-full max-w-xl"
                style={{
                  opacity:         (g.layerOpacity  ?? 100) / 100,
                  transform:       `scale(${((g.layerScale ?? 100) / 100) * scaleFactor}) rotate(${g.layerRotation ?? 0}deg)`,
                  transformOrigin: "top center",
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={scene.id}
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -28 }}
                    transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
                    className="relative flex flex-col gap-8"
                  >
                    {/* Per-scene atmosphere (ensures it scrolls with content) */}
                    <AtmosphereRenderer particles={particles} />
                    {scene.blocks
                      .filter(b => b.x === undefined)
                      .map(block => (
                        <ViewerBlock key={block.id} block={block} g={g} theme={theme} giftId={payload.id} />
                      ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Scene navigation */}
            {scenes.length > 1 && (
              <div className="shrink-0 flex items-center justify-center gap-5 pb-14">
                <button
                  type="button"
                  aria-label="Previous scene"
                  disabled={isFirst}
                  onClick={() => setSceneIdx(i => i - 1)}
                  className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all disabled:opacity-20 ${theme.nav}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>

                <div className="flex items-center gap-2">
                  {scenes.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      aria-label={`Go to scene ${i + 1}`}
                      onClick={() => setSceneIdx(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === sceneIdx
                          ? "w-6 h-2 bg-current opacity-70"
                          : "w-2 h-2 bg-current opacity-25 hover:opacity-50"
                      } ${theme.nav.includes("text-rose") ? "text-rose-300" : "text-current"}`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  aria-label="Next scene"
                  disabled={isLast}
                  onClick={() => setSceneIdx(i => i + 1)}
                  className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all disabled:opacity-20 ${theme.nav}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
