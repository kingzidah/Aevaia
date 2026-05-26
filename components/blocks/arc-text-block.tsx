"use client";

// ── Arc Text Block ─────────────────────────────────────────────────────────────
// Renders text along a circular arc using SVG <textPath>.
// The arc is computed as a semi-circle (top half) centred in the viewBox.
// Curvature is controlled by `radius` — larger = flatter perceived arc.

interface ArcTextProps {
  text?:       string;
  radius?:     number;  // 80–200, default 120
  color?:      string;  // hex, default #ffffff
  fontSize?:   number;  // 12–48, default 22
  startAngle?: number;  // 0–360°, default 0 (top)
}

export default function ArcTextBlock({
  text       = 'Forever & Always',
  radius     = 120,
  color      = '#ffffff',
  fontSize   = 22,
  startAngle = 0,
}: ArcTextProps) {
  const cx = 200;
  const cy = 180;
  const r  = Math.max(80, Math.min(200, radius));

  // Convert startAngle (0 = top) to SVG arc start/end in radians.
  // We draw a 180° (half-circle) arc from left to right across the top.
  const degToRad = (d: number) => (d * Math.PI) / 180;
  const offset   = degToRad(startAngle);

  // Arc goes from –90°+offset to +90°+offset (i.e. the top half)
  const startRad = -Math.PI / 2 + offset;
  const endRad   =  Math.PI / 2 + offset;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  const arcId = 'arc-path';

  return (
    <div className="w-full flex items-center justify-center py-2">
      <svg
        viewBox="0 0 400 220"
        preserveAspectRatio="xMidYMid meet"
        className="w-full max-h-44"
        aria-label={text}
      >
        <defs>
          <path
            id={arcId}
            d={`M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`}
          />
        </defs>
        <text
          fill={color}
          fontSize={fontSize}
          fontFamily="var(--font-playfair), Georgia, serif"
          fontWeight="600"
          letterSpacing="2"
        >
          <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
            {text}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
