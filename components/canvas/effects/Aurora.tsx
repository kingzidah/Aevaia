"use client";
import { useEffect, useRef } from "react";

// Soft aurora-borealis effect: large translucent gradient blobs slowly drift
// and shift hue across the canvas, rendered via a 2D canvas loop.
export default function Aurora() {
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

    // Three slowly moving blob centers
    const blobs = [
      { x: 0.2, y: 0.3, r: 0.55, h: 270 }, // purple
      { x: 0.7, y: 0.6, r: 0.50, h: 200 }, // teal-blue
      { x: 0.5, y: 0.1, r: 0.45, h: 320 }, // pink
    ];

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      blobs.forEach((b, i) => {
        const cx = (b.x + Math.sin(t * 0.4 + i * 2.1) * 0.12) * w;
        const cy = (b.y + Math.cos(t * 0.3 + i * 1.7) * 0.10) * h;
        const r  = b.r * Math.max(w, h);
        const hue = (b.h + t * 10) % 360;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0,   `hsla(${hue},80%,60%,0.28)`);
        grad.addColorStop(0.5, `hsla(${hue},70%,50%,0.12)`);
        grad.addColorStop(1,   `hsla(${hue},60%,40%,0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      t += 0.004;
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
