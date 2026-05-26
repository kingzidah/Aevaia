'use client';

type AmbientEffect = 'none' | 'fireflies' | 'floating-orbs' | 'particles' | 'ember' | 'starfield' | 'waves';

interface AmbientEffectsProps {
  effect: AmbientEffect;
}

const FIREFLIES = [
  { top: '8%',  left: '12%', size: 4, delay: 0,    duration: 5.2, driftX: 18,  driftY: -28 },
  { top: '22%', left: '74%', size: 6, delay: 1.1,  duration: 6.8, driftX: -22, driftY: -35 },
  { top: '45%', left: '30%', size: 3, delay: 0.4,  duration: 4.5, driftX: 25,  driftY: 20  },
  { top: '60%', left: '85%', size: 5, delay: 2.2,  duration: 7.1, driftX: -15, driftY: -25 },
  { top: '15%', left: '50%', size: 4, delay: 1.7,  duration: 5.9, driftX: 30,  driftY: 18  },
  { top: '78%', left: '20%', size: 6, delay: 0.8,  duration: 6.3, driftX: 20,  driftY: -30 },
  { top: '35%', left: '65%', size: 3, delay: 3.0,  duration: 4.8, driftX: -28, driftY: 22  },
  { top: '90%', left: '55%', size: 5, delay: 1.4,  duration: 5.5, driftX: 15,  driftY: -20 },
  { top: '50%', left: '8%',  size: 4, delay: 2.6,  duration: 7.4, driftX: 22,  driftY: 30  },
  { top: '70%', left: '42%', size: 6, delay: 0.2,  duration: 6.0, driftX: -20, driftY: -18 },
  { top: '28%', left: '90%', size: 3, delay: 1.9,  duration: 5.1, driftX: -30, driftY: 25  },
  { top: '5%',  left: '38%', size: 5, delay: 3.4,  duration: 6.7, driftX: 18,  driftY: 28  },
  { top: '82%', left: '78%', size: 4, delay: 0.6,  duration: 4.9, driftX: -25, driftY: -22 },
  { top: '42%', left: '18%', size: 6, delay: 2.8,  duration: 7.8, driftX: 28,  driftY: -15 },
  { top: '65%', left: '60%', size: 3, delay: 1.3,  duration: 5.6, driftX: -18, driftY: 32  },
];

const ORBS = [
  { top: '-15%', left: '-10%', size: 500, color: 'rgba(168,85,247,0.35)',  delay: 0,   duration: 18 },
  { top: '40%',  left: '55%',  size: 420, color: 'rgba(236,72,153,0.28)',  delay: 4,   duration: 22 },
  { top: '70%',  left: '-5%',  size: 380, color: 'rgba(59,130,246,0.25)',  delay: 8,   duration: 20 },
  { top: '10%',  left: '70%',  size: 320, color: 'rgba(16,185,129,0.2)',   delay: 2,   duration: 25 },
];

export default function AmbientEffects({ effect }: AmbientEffectsProps) {
  if (effect === 'none') return null;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-lg">
      {effect === 'fireflies' && (
        <>
          {FIREFLIES.map((f, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                top: f.top,
                left: f.left,
                width: f.size,
                height: f.size,
                background: `radial-gradient(circle, rgba(253,224,71,1) 0%, rgba(251,191,36,0.6) 60%, transparent 100%)`,
                boxShadow: `0 0 ${f.size * 3}px ${f.size}px rgba(253,224,71,0.5)`,
                animation: `firefly-float ${f.duration}s ease-in-out ${f.delay}s infinite`,
                '--drift-x': `${f.driftX}px`,
                '--drift-y': `${f.driftY}px`,
              } as React.CSSProperties}
            />
          ))}
        </>
      )}

      {effect === 'floating-orbs' && (
        <>
          {ORBS.map((orb, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                top: orb.top,
                left: orb.left,
                width: orb.size,
                height: orb.size,
                background: orb.color,
                filter: 'blur(80px)',
                animation: `orb-drift ${orb.duration}s ease-in-out ${orb.delay}s infinite`,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
