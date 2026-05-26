"use client";

import { useMemo } from "react";

interface Props {
  particles: string;
}

const KEYFRAMES = `
@keyframes hc-snow-fall {
  0%   { transform: translateY(-10px) translateX(0px) rotate(0deg); opacity: 0.8; }
  50%  { transform: translateY(50%) translateX(12px) rotate(180deg); opacity: 0.6; }
  100% { transform: translateY(110%) translateX(-8px) rotate(360deg); opacity: 0; }
}
@keyframes hc-ember-rise {
  0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0.9; }
  50%  { transform: translateY(-45%) translateX(14px) scale(0.7); opacity: 0.6; }
  100% { transform: translateY(-100%) translateX(-6px) scale(0.3); opacity: 0; }
}
@keyframes hc-blossom-fall {
  0%   { transform: translateY(-10px) translateX(0) rotate(0deg) scale(1); opacity: 0.85; }
  40%  { transform: translateY(40%) translateX(18px) rotate(120deg) scale(0.9); opacity: 0.65; }
  100% { transform: translateY(110%) translateX(-10px) rotate(270deg) scale(0.7); opacity: 0; }
}
`;

function useParticles(count: number, seed: number) {
  return useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const r = ((seed * (i + 1) * 1664525 + 1013904223) >>> 0) / 0xffffffff;
      const r2 = (((seed + 1) * (i + 1) * 22695477 + 1) >>> 0) / 0xffffffff;
      const r3 = (((seed + 3) * (i + 1) * 1664525 + 1664525) >>> 0) / 0xffffffff;
      return {
        id: i,
        left: r * 100,
        size: 4 + r2 * 8,
        delay: r3 * 6,
        duration: 4 + r2 * 5,
      };
    });
  }, [count, seed]);
}

function SnowLayer() {
  const flakes = useParticles(28, 42);
  return (
    <>
      {flakes.map(f => (
        <div
          key={f.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${f.left}%`,
            top: 0,
            width: f.size,
            height: f.size,
            opacity: 0,
            animation: `hc-snow-fall ${f.duration}s ${f.delay}s linear infinite`,
            boxShadow: `0 0 ${f.size * 0.6}px rgba(186,230,253,0.7)`,
          }}
        />
      ))}
    </>
  );
}

function EmberLayer() {
  const embers = useParticles(22, 77);
  return (
    <>
      {embers.map(f => (
        <div
          key={f.id}
          className="absolute rounded-full"
          style={{
            left: `${f.left}%`,
            bottom: 0,
            width: f.size,
            height: f.size,
            opacity: 0,
            background: `radial-gradient(circle, #fde68a ${20}%, #f97316 55%, #ef4444 100%)`,
            animation: `hc-ember-rise ${f.duration}s ${f.delay}s ease-out infinite`,
            boxShadow: `0 0 ${f.size}px #f97316, 0 0 ${f.size * 2}px rgba(239,68,68,0.4)`,
          }}
        />
      ))}
    </>
  );
}

function BlossomLayer() {
  const petals = useParticles(24, 13);
  return (
    <>
      {petals.map(f => (
        <div
          key={f.id}
          className="absolute"
          style={{
            left: `${f.left}%`,
            top: 0,
            width: f.size * 1.4,
            height: f.size,
            opacity: 0,
            background: `radial-gradient(ellipse, #fbcfe8 30%, #fda4af 100%)`,
            borderRadius: "50% 20% 50% 20%",
            animation: `hc-blossom-fall ${f.duration}s ${f.delay}s ease-in infinite`,
            boxShadow: `0 0 ${f.size * 0.4}px rgba(253,164,175,0.5)`,
          }}
        />
      ))}
    </>
  );
}

export default function AtmosphereRenderer({ particles }: Props) {
  if (particles === 'NONE') return null;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <style>{KEYFRAMES}</style>
      {particles === 'falling-snow'     && <SnowLayer />}
      {particles === 'glowing-embers'   && <EmberLayer />}
      {particles === 'falling-blossoms' && <BlossomLayer />}
    </div>
  );
}
