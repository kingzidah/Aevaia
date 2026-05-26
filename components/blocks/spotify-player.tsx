"use client";

import { Music2 } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SpotifyProperties {
  spotifyUrl?: string;
  text?: string;
  title?: string;
  accentColor?: string;
}

interface SpotifyPlayerProps {
  /** AI-mutable display properties — spotifyUrl takes precedence over audioUrl */
  properties?: SpotifyProperties;
  /** Fallback: block.audioUrl if it contains a spotify.com URL */
  audioUrl?: string;
}

// ── Default preview track ──────────────────────────────────────────────────────
// "Experience" by Ludovico Einaudi — cinematic piano, instantly recognisable.
// Swap this constant to change the in-editor preview track.
const DEFAULT_EMBED =
  "https://open.spotify.com/embed/track/1BncfTJAWxrsxyT9culBrj?utm_source=generator";

// ── URL normaliser ─────────────────────────────────────────────────────────────
// Accepts any Spotify URL shape and returns a standard embed URL.

function toEmbedUrl(raw: string): string {
  // Already an embed URL — pass through
  if (raw.includes("/embed/")) return raw;

  // Spotify URI: spotify:track:ID  →  embed
  if (raw.startsWith("spotify:")) {
    const parts = raw.split(":");
    const type = parts[1];
    const id   = parts[2];
    if (type && id) return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`;
  }

  // Regular share link: open.spotify.com/(track|album|playlist|…)/ID
  const match = raw.match(
    /open\.spotify\.com\/(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/,
  );
  if (match) {
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator`;
  }

  // Unknown format — return as-is and let the iframe report the error
  return raw;
}

// ── Empty / placeholder state ──────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%)] backdrop-blur-xl">
      <div className="flex items-center gap-4 px-5 py-4">

        {/* Animated music icon ring */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-full bg-[linear-gradient(135deg,rgba(30,215,96,0.25),rgba(30,215,96,0.08))] border border-[#1ed760]/20 flex items-center justify-center">
            {/* Spotify logomark (simplified musical note) */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#1ed760]/80">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 11-.277-1.215c3.809-.87 7.077-.496 9.712 1.115a.622.622 0 01.207.857zm1.223-2.722a.779.779 0 01-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.778.778 0 01-.973-.517.779.779 0 01.517-.972c3.632-1.102 8.147-.568 11.234 1.326a.779.779 0 01.259 1.072zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.935.935 0 11-.543-1.79c3.532-1.072 9.404-.865 13.115 1.338a.935.935 0 01-.955 1.609z" />
            </svg>
          </div>
          {/* Subtle pulse ring */}
          <div className="absolute inset-0 rounded-full border border-[#1ed760]/15 animate-ping" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-xs font-semibold text-neutral-300 truncate flex items-center gap-1.5">
            <Music2 className="w-3.5 h-3.5 shrink-0" /> Select block to add Spotify track
          </p>
          <p className="text-[10px] text-neutral-600 leading-relaxed">
            Paste a Spotify URL in the Style panel to embed a track
          </p>
          {/* Fake bars */}
          <div className="flex items-end gap-px h-3 mt-1.5">
            {[3,5,8,6,4,7,5,9,6,4,8,5,7,4,6,8,5,3,6,4].map((h, i) => (
              <div
                key={i}
                className="w-px rounded-full bg-white/10"
                style={{ height: `${h * 1.5}px` }}
              />
            ))}
          </div>
        </div>

        {/* Duration placeholder */}
        <div className="shrink-0 text-right space-y-1">
          <span className="text-[10px] text-white/20 tabular-nums block">—:——</span>
          <span className="text-[9px] text-[#1ed760]/30 uppercase tracking-wider block">Spotify</span>
        </div>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function SpotifyPlayer({ properties, audioUrl }: SpotifyPlayerProps) {
  // Resolve the URL: properties override → audioUrl (if Spotify) → default preview
  const rawUrl =
    properties?.spotifyUrl?.trim() ||
    (audioUrl?.includes("spotify") ? audioUrl : "") ||
    DEFAULT_EMBED;

  const embedUrl = toEmbedUrl(rawUrl);

  // If we only have the default and the user hasn't set anything, show the
  // placeholder so new blocks don't silently start playing audio.
  const isPlaceholder =
    !properties?.spotifyUrl?.trim() &&
    !(audioUrl?.includes("spotify"));

  if (isPlaceholder) {
    return (
      <div className="w-full px-0 py-1">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="w-full px-0 py-1">
      <iframe
        title="Spotify player"
        src={embedUrl}
        width="100%"
        height="152"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="rounded-xl border-0 block"
      />
    </div>
  );
}
