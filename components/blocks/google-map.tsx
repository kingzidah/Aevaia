"use client";

import { MapPin } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface MapProperties {
  address?: string;
  embedUrl?: string;
  text?: string;
  title?: string;
  accentColor?: string;
}

interface GoogleMapProps {
  properties?: MapProperties;
}

// ── Default preview location ───────────────────────────────────────────────────
// The Louvre Museum, Paris — renders without an API key via the q= embed method.
// Replace DEFAULT_ADDRESS to change the in-editor preview location.
const DEFAULT_ADDRESS = "Louvre Museum, Paris, France";

// ── URL builder ───────────────────────────────────────────────────────────────

function buildEmbedUrl(properties?: MapProperties): string {
  // Explicit embed URL takes highest priority
  if (properties?.embedUrl?.trim()) return properties.embedUrl.trim();

  const address = properties?.address?.trim() || DEFAULT_ADDRESS;
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

// ── Empty / placeholder state ──────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] backdrop-blur-xl">
      <div className="flex items-center gap-4 px-5 py-5">

        {/* Map-pin icon container */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-[linear-gradient(135deg,rgba(16,185,129,0.22),rgba(16,185,129,0.08))] border border-emerald-500/20 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.6}
              stroke="currentColor"
              className="w-5 h-5 text-emerald-400/80"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-full border border-emerald-500/12 animate-ping" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-xs font-semibold text-neutral-300 truncate flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" /> Select block to set event location
          </p>
          <p className="text-[10px] text-neutral-600 leading-relaxed">
            Type an address in the Style panel to embed Google Maps
          </p>
          {/* Fake road lines */}
          <div className="flex flex-col gap-1 mt-1.5">
            {[{ w: "w-3/5" }, { w: "w-2/5" }, { w: "w-4/5" }].map(({ w }, i) => (
              <div key={i} className={`${w} h-px bg-white/8 rounded-full`} />
            ))}
          </div>
        </div>

        {/* Decorative mini grid */}
        <div className="shrink-0 grid grid-cols-3 gap-0.5 opacity-20">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm ${i === 4 ? "bg-emerald-400" : "bg-white/20"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function GoogleMap({ properties }: GoogleMapProps) {
  const hasAddress =
    !!(properties?.address?.trim() || properties?.embedUrl?.trim());

  if (!hasAddress) {
    return (
      <div className="w-full py-1">
        <EmptyState />
      </div>
    );
  }

  const src = buildEmbedUrl(properties);

  return (
    <div className="w-full py-1">
      <div className="w-full rounded-xl overflow-hidden border border-white/8 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
        <iframe
          title="Venue map"
          src={src}
          width="100%"
          height="280"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block border-0"
          aria-label="Google Maps venue embed"
        />
      </div>
    </div>
  );
}
