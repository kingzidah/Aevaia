"use client";
import { useEffect, useRef } from "react";

const WORDS = ["LOVE", "FOREVER", "CHERISH", "ADORE", "ALWAYS", "YOURS"];

// Romantic words emerge from blur and dissolve back into it — a soft watermark
// effect that lives entirely in the background behind canvas content.
export default function BlurText() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let id: number;
    let frame = 0;
    const FRAMES_PER_WORD = 200;

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

      const wordIdx   = Math.floor(frame / FRAMES_PER_WORD) % WORDS.length;
      const progress  = (frame % FRAMES_PER_WORD) / FRAMES_PER_WORD;

      // Fade + blur curve: in → hold → out
      let alpha: number;
      let blurPx: number;
      if (progress < 0.18) {
        alpha  = progress / 0.18;
        blurPx = (1 - alpha) * 16;
      } else if (progress < 0.72) {
        alpha  = 1;
        blurPx = 0;
      } else {
        const out = (progress - 0.72) / 0.28;
        alpha  = 1 - out;
        blurPx = out * 16;
      }

      const fontSize = Math.min(w * 0.28, h * 0.28, 140);

      ctx.save();
      if (blurPx > 0.3) ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
      ctx.globalAlpha  = alpha * 0.07; // subtle watermark — never competes with blocks
      ctx.font         = `bold ${fontSize}px var(--font-playfair, Georgia, serif)`;
      ctx.fillStyle    = "rgb(168,85,247)";
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.letterSpacing = "0.12em";
      ctx.fillText(WORDS[wordIdx], w / 2, h / 2);
      ctx.restore();

      frame++;
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
