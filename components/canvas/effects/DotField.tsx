"use client";
import { useEffect, useRef } from "react";

// A grid of softly pulsing dots.  Each dot breathes independently using a
// phase offset so the whole field undulates like a living texture.
export default function DotField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let id: number;
    let t = 0;

    const SPACING = 28;
    const BASE_R  = 1.5;
    const PULSE   = 1.2;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cols = Math.ceil(w / SPACING) + 1;
      const rows = Math.ceil(h / SPACING) + 1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * SPACING;
          const y = row * SPACING;
          // Phase offset creates a ripple across the grid
          const phase = (col + row) * 0.4;
          const alpha = 0.15 + 0.20 * (0.5 + 0.5 * Math.sin(t * 1.5 + phase));
          const r     = BASE_R + PULSE * (0.5 + 0.5 * Math.sin(t + phase));

          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(168,85,247,${alpha.toFixed(3)})`;
          ctx.fill();
        }
      }

      t += 0.025;
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
