"use client";
import { useEffect, useRef } from "react";

// Concentric rings that slowly pulse outward from the canvas centre, like
// ripples on still water.  Each ring fades in at the centre and dissolves
// at the edge, creating a perpetual breathing motion.
export default function MagicRings() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let id: number;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const RING_COUNT   = 7;
    const CYCLE        = 4000; // ms for one ring to travel from centre to edge
    const startTime    = performance.now();

    const draw = (now: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx   = w / 2;
      const cy   = h / 2;
      const maxR = Math.hypot(cx, cy) * 0.85;

      for (let i = 0; i < RING_COUNT; i++) {
        // Stagger each ring evenly across the cycle
        const elapsed = ((now - startTime) + (i / RING_COUNT) * CYCLE) % CYCLE;
        const progress = elapsed / CYCLE;            // 0 → 1
        const r = progress * maxR;

        // Alpha: fade in from centre, fade out before edge
        const alpha = progress < 0.2
          ? progress / 0.2
          : progress > 0.7
            ? 1 - (progress - 0.7) / 0.3
            : 1;

        // Hue shifts slowly across rings for a gradient rainbow feel
        const hue = (260 + i * 15) % 360;

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${hue},80%,65%,${(alpha * 0.35).toFixed(3)})`;
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      }

      id = requestAnimationFrame(draw);
    };

    id = requestAnimationFrame(draw);
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
