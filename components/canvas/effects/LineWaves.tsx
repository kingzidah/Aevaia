"use client";
import { useEffect, useRef } from "react";

// Multiple sine wave lines that scroll slowly across the canvas.
// Each wave has a distinct frequency, phase speed, and brand-palette colour.
export default function LineWaves() {
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

    // Wave definitions: [amplitude-fraction, freq, phase-speed, color, lineWidth]
    const waves: [number, number, number, string, number][] = [
      [0.08, 0.012, 0.6,  "rgba(168,85,247,0.35)",  1.5],  // purple, gentle
      [0.05, 0.020, 0.9,  "rgba(244,114,182,0.25)", 1.0],  // pink, mid
      [0.06, 0.008, 0.4,  "rgba(99,102,241,0.20)",  1.2],  // indigo, slow
      [0.03, 0.030, 1.2,  "rgba(232,121,249,0.15)", 0.8],  // fuchsia, fast/subtle
    ];

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      waves.forEach(([ampFrac, freq, speed, color, lw]) => {
        const amp = h * ampFrac;
        const mid = h / 2;

        ctx.beginPath();
        ctx.lineWidth   = lw;
        ctx.strokeStyle = color;

        for (let x = 0; x <= w; x += 2) {
          const y = mid + amp * Math.sin(x * freq + t * speed);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      t += 0.04;
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
