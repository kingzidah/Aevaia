"use client";
import { useEffect, useRef } from "react";

// A sweeping beam of soft light that moves slowly across the canvas surface —
// the premium "shiny card" sheen you see on foil-printed stationery.
export default function ShinyText() {
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

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Beam sweeps back and forth
      const beamX = ((Math.sin(t * 0.35) + 1) / 2) * (w + 300) - 150;
      const beamW = w * 0.40;

      const grad = ctx.createLinearGradient(beamX - beamW / 2, 0, beamX + beamW / 2, 0);
      grad.addColorStop(0,    "rgba(255,255,255,0)");
      grad.addColorStop(0.35, "rgba(255,255,255,0.04)");
      grad.addColorStop(0.5,  "rgba(255,255,255,0.10)");
      grad.addColorStop(0.65, "rgba(255,255,255,0.04)");
      grad.addColorStop(1,    "rgba(255,255,255,0)");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Three thin diagonal specular streaks within the beam
      for (let i = 0; i < 3; i++) {
        const phase  = (t * 0.28 + i * 2.1) % (Math.PI * 2);
        const lx     = beamX + Math.cos(phase) * beamW * 0.38;
        const la     = Math.max(0, Math.sin(phase) * 0.055);
        const lg     = ctx.createLinearGradient(lx - 1, 0, lx + 1, h);
        lg.addColorStop(0,   "rgba(255,255,255,0)");
        lg.addColorStop(0.5, `rgba(255,255,255,${la.toFixed(3)})`);
        lg.addColorStop(1,   "rgba(255,255,255,0)");
        ctx.fillStyle = lg;
        ctx.fillRect(lx - 1.5, 0, 3, h);
      }

      t += 0.014;
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
