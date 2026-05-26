"use client";

import { useState } from "react";
import * as LucideIcons from "lucide-react";

function parseEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const videoId =
        u.hostname === "youtu.be"
          ? u.pathname.slice(1).split("?")[0]
          : u.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const videoId = u.pathname.split("/").filter(Boolean).pop();
      if (videoId) return `https://player.vimeo.com/video/${videoId}`;
    }
    // If already an embed URL, return as-is
    if (url.includes("/embed/") || url.includes("player.vimeo")) return url;
    return null;
  } catch {
    return null;
  }
}

interface Props {
  content?: string;
  onContentChange?: (url: string) => void;
}

export default function VideoBlock({ content, onContentChange }: Props) {
  const [inputUrl, setInputUrl] = useState(content || "");

  const embedUrl = content ? parseEmbedUrl(content) : null;

  if (embedUrl) {
    return (
      <div className="w-full aspect-video rounded-xl overflow-hidden bg-zinc-950">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title="Embedded video"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="w-full px-5 pt-5 pb-6 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
          <LucideIcons.Video className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-white">Video Embed</p>
          <p className="text-[10px] text-zinc-500">Paste a YouTube or Vimeo link</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onContentChange?.(inputUrl.trim());
            }
          }}
          placeholder="https://youtube.com/watch?v=..."
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 transition-all"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onContentChange?.(inputUrl.trim());
          }}
          disabled={!inputUrl.trim()}
          className="px-3.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        >
          Embed
        </button>
      </div>

      <p className="text-[10px] text-zinc-700 text-center">
        Supports YouTube · Vimeo
      </p>
    </div>
  );
}
