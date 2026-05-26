"use client";
import { useEffect, useRef } from "react";

// Colorful ink-splash particles that emit from the cursor as it moves across
// the canvas.  Listens on window so it never intercepts pointer events on blocks.
export default function SplashCursor() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let id: number;
    let hue = 260;

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      life: number; maxLife: number;
      r: number; hue: number;
    }
    const particles: Particle[] = [];

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Only emit if cursor is over the canvas
      if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) return;
      hue = (hue + 4) % 360;
      for (let i = 0; i < 5; i++) {
        particles.push({
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 3.5,
          vy: (Math.random() - 0.5) * 3.5 - 0.8,
          life: 0,
          maxLife: 35 + Math.random() * 30,
          r: 5 + Math.random() * 14,
          hue: hue + Math.random() * 40 - 20,
        });
      }
    };
    window.addEventListener("mousemove", onMouseMove);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Semi-transparent clear creates a soft motion trail
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(0, 0, w, h);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.06; // gentle gravity
        p.r  *= 0.96;

        if (p.life >= p.maxLife || p.r < 0.5) { particles.splice(i, 1); continue; }

        const alpha = (1 - p.life / p.maxLife) * 0.55;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grad.addColorStop(0, `hsla(${p.hue},90%,65%,${alpha})`);
        grad.addColorStop(1, `hsla(${p.hue},80%,45%,0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      id = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
