"use client";
import { useEffect, useRef } from "react";

// A receding perspective grid that slowly scrolls toward the viewer — a
// classic retro sci-fi aesthetic rendered entirely on a 2D canvas.
export default function Grid() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let id: number;
    let t = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Number of vertical grid columns and horizontal grid rows visible
    const COLS = 12;
    const ROWS = 10;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Horizon line — grid converges here
      const horizon = h * 0.42;
      // Viewport bottom
      const bottom  = h;

      ctx.lineWidth = 0.5;

      // Vertical lines that fan out from a vanishing point at canvas centre
      for (let i = 0; i <= COLS; i++) {
        const xBottom = (i / COLS) * w;
        const xTop    = w / 2 + (xBottom - w / 2) * 0.01; // near-zero spread at horizon

        const alpha = 0.10 + 0.15 * Math.abs(i / COLS - 0.5) * 2;
        ctx.strokeStyle = `rgba(168,85,247,${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(xTop,    horizon);
        ctx.lineTo(xBottom, bottom);
        ctx.stroke();
      }

      // Horizontal lines — spaced exponentially to simulate depth, scrolling over time
      for (let j = 0; j <= ROWS; j++) {
        // Depth value [0,1]: 0 = at horizon, 1 = at viewer
        const depth = (j / ROWS + (t * 0.15) % 1);
        // Perspective divide: map depth to y position below horizon
        const y = horizon + (bottom - horizon) * Math.pow(depth, 2.2);
        if (y > bottom) continue;

        const alpha = 0.05 + 0.20 * Math.pow(depth, 1.8);
        ctx.strokeStyle = `rgba(168,85,247,${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      t += 0.008;
      id = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(id); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
