"use client";
import { useEffect, useRef } from "react";

// A grid of thin line segments that each independently rotate to point toward
// the cursor — like compass needles reacting to a moving magnet.
// When the cursor is absent the lines face a slow drift angle.
export default function MagnetLines() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let id: number;
    let t = 0;
    let mouseX = -10000; // off-canvas until first move
    let mouseY = -10000;

    const SPACING = 36;
    const HALF    = 10;

    // Each line has a smoothed current angle for organic easing
    const angles = new Map<string, number>();

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      angles.clear();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Reset to off-canvas when cursor leaves bounds (replaces mouseleave listener).
      if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        mouseX = x;
        mouseY = y;
      } else {
        mouseX = -10000;
        mouseY = -10000;
      }
    };
    window.addEventListener("mousemove", onMouseMove);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.lineCap   = "round";
      ctx.lineWidth = 1.2;

      const cols = Math.ceil(w / SPACING) + 1;
      const rows = Math.ceil(h / SPACING) + 1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = (col + 0.5) * SPACING;
          const cy = (row + 0.5) * SPACING;
          const key = `${col},${row}`;

          // Target angle: toward cursor when close, drift when far
          const dist  = Math.hypot(mouseX - cx, mouseY - cy);
          const infl  = Math.max(0, 1 - dist / (Math.max(w, h) * 0.55));
          const targetAngle = infl > 0.01
            ? Math.atan2(mouseY - cy, mouseX - cx)
            : t * 0.2 + (col * 0.3 + row * 0.5); // gentle drift

          // Smooth toward target
          const prev = angles.get(key) ?? targetAngle;
          let diff = targetAngle - prev;
          // Wrap angular difference to [-π, π]
          while (diff >  Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const current = prev + diff * 0.12;
          angles.set(key, current);

          const hue   = 260 + infl * 60;
          const alpha = 0.12 + 0.30 * infl;
          ctx.strokeStyle = `hsla(${hue},80%,65%,${alpha.toFixed(3)})`;

          const dx = Math.cos(current) * HALF;
          const dy = Math.sin(current) * HALF;
          ctx.beginPath();
          ctx.moveTo(cx - dx, cy - dy);
          ctx.lineTo(cx + dx, cy + dy);
          ctx.stroke();
        }
      }

      t += 0.01;
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
