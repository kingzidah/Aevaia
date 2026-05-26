"use client";

import { useRef, useCallback, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ScribbleBlockProps {
  paths?:       string[];   // serialised SVG path `d` strings
  strokeColor?: string;
  strokeWidth?: number;
  onPathsChange: (paths: string[]) => void;
  readOnly?: boolean;
}

// ── Smooth path builder (quadratic bezier) ────────────────────────────────────
// Converts a sequence of {x,y} points into a smooth SVG path string.

function toSvgPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ScribbleBlock({
  paths = [],
  strokeColor = '#a855f7',
  strokeWidth = 3,
  onPathsChange,
  readOnly = false,
}: ScribbleBlockProps) {
  const svgRef        = useRef<SVGSVGElement>(null);
  const currentPts    = useRef<{ x: number; y: number }[]>([]);
  const [liveD, setLiveD] = useState<string>('');
  const isDrawing     = useRef(false);

  const getLocalXY = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    currentPts.current = [getLocalXY(e)];
    setLiveD('');
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing.current || readOnly) return;
    currentPts.current.push(getLocalXY(e));
    setLiveD(toSvgPath(currentPts.current));
  };

  const onPointerUp = () => {
    if (!isDrawing.current || readOnly) return;
    isDrawing.current = false;
    const d = toSvgPath(currentPts.current);
    if (d) onPathsChange([...paths, d]);
    currentPts.current = [];
    setLiveD('');
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-white/3 border border-white/8">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center justify-end gap-2 px-3 py-1.5 border-b border-white/8">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-neutral-600">
            Draw freely · {paths.length} stroke{paths.length !== 1 ? 's' : ''}
          </span>
          {paths.length > 0 && (
            <button
              type="button"
              onClick={() => onPathsChange(paths.slice(0, -1))}
              title="Undo last stroke"
              className="text-[9px] text-neutral-600 hover:text-red-400 transition-colors font-semibold px-1.5 py-0.5 rounded"
            >
              Undo
            </button>
          )}
          {paths.length > 0 && (
            <button
              type="button"
              onClick={() => onPathsChange([])}
              title="Clear all strokes"
              className="text-[9px] text-neutral-600 hover:text-red-400 transition-colors font-semibold px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Drawing surface */}
      <svg
        ref={svgRef}
        viewBox="0 0 400 240"
        preserveAspectRatio="xMidYMid meet"
        className={`w-full h-56 block ${readOnly ? '' : 'cursor-crosshair touch-none'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* Committed strokes */}
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {/* In-progress stroke */}
        {liveD && (
          <path
            d={liveD}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* Empty state hint */}
        {paths.length === 0 && !liveD && !readOnly && (
          <text
            x="200" y="128"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(115,115,115,0.6)"
            fontSize="12"
            fontFamily="system-ui, sans-serif"
          >
            Click and drag to draw
          </text>
        )}
      </svg>
    </div>
  );
}
