'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Public types ──────────────────────────────────────────────────────────

export type WebGLMode = 'starfield' | 'waves' | 'particles' | 'ember';

export interface WebGLBackgroundProps {
  mode:    WebGLMode;
  speed:   number;   // 0.1 – 3
  density: number;   // 0 – 1
  color:   string;   // hex
}

// ── Starfield — particles rushing toward camera, parallax on mouse ─────────

interface StarfieldProps { count: number; speed: number; color: string; }

function StarfieldSystem({ count, speed, color }: StarfieldProps) {
  const pts   = useRef<THREE.Points>(null);
  const SPREAD = 18;
  const DEPTH  = 24;

  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3]     = (Math.random() - 0.5) * SPREAD;
      a[i * 3 + 1] = (Math.random() - 0.5) * SPREAD;
      a[i * 3 + 2] = (Math.random() - 0.5) * DEPTH;
    }
    return a;
  }, [count, SPREAD, DEPTH]);

  const geo = useMemo(() => {
    const g    = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(positions, 3);
    attr.usage = THREE.DynamicDrawUsage;
    g.setAttribute('position', attr);
    return g;
  }, [positions]);

  useEffect(() => () => { geo.dispose(); }, [geo]);

  useFrame((state, delta) => {
    if (!pts.current) return;
    // Gentle camera parallax with mouse
    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x, state.mouse.x * 0.5, delta * 1.5
    );
    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y, state.mouse.y * 0.5, delta * 1.5
    );
    // Particles rush toward camera (+Z direction)
    const attr = pts.current.geometry.attributes.position as THREE.BufferAttribute;
    const pos  = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 2] += delta * speed * 3.5;
      if (pos[i * 3 + 2] > 6) pos[i * 3 + 2] -= DEPTH;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pts} geometry={geo}>
      <pointsMaterial
        color={color}
        size={0.048}
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ── Liquid Waves — animated sine-wave plane ────────────────────────────────

interface WaveProps { segments: number; speed: number; color: string; }

function WaveScene({ segments, speed, color }: WaveProps) {
  const mesh = useRef<THREE.Mesh>(null);

  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(32, 32, segments, segments);
    (g.attributes.position as THREE.BufferAttribute).usage = THREE.DynamicDrawUsage;
    return g;
  }, [segments]);

  useEffect(() => () => { geo.dispose(); }, [geo]);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    // Gently re-centre camera when switching from starfield
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, 0, delta * 2);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 0, delta * 2);

    const t    = state.clock.elapsedTime * speed;
    const attr = mesh.current.geometry.attributes.position as THREE.BufferAttribute;
    const pos  = attr.array as Float32Array;
    const n    = attr.count;
    for (let i = 0; i < n; i++) {
      const x = pos[i * 3];
      const y = pos[i * 3 + 1];
      pos[i * 3 + 2] =
        Math.sin(x * 0.28 + t)          * 0.65 +
        Math.cos(y * 0.28 + t * 0.73)   * 0.50 +
        Math.sin((x + y) * 0.17 + t * 1.3) * 0.30;
    }
    attr.needsUpdate = true;
  });

  return (
    <mesh ref={mesh} geometry={geo} rotation={[-1.15, 0, 0]} position={[0, -1.5, 0]}>
      <meshBasicMaterial color={color} wireframe transparent opacity={0.25} depthWrite={false} />
    </mesh>
  );
}

// ── Classic rising particles (particles / ember legacy modes) ─────────────

interface ClassicProps { count: number; color: string; speed: number; size: number; spread: number; }

function ClassicParticles({ count, color, speed, size, spread }: ClassicProps) {
  const pts = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3]     = (Math.random() - 0.5) * spread;
      a[i * 3 + 1] = (Math.random() - 0.5) * spread;
      a[i * 3 + 2] = (Math.random() - 0.5) * (spread * 0.12);
    }
    return a;
  }, [count, spread]);

  const geo = useMemo(() => {
    const g    = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(positions, 3);
    attr.usage = THREE.DynamicDrawUsage;
    g.setAttribute('position', attr);
    return g;
  }, [positions]);

  useEffect(() => () => { geo.dispose(); }, [geo]);

  useFrame((state, delta) => {
    if (!pts.current) return;
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, 0, delta * 2);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 0, delta * 2);
    const attr = pts.current.geometry.attributes.position as THREE.BufferAttribute;
    const pos  = attr.array as Float32Array;
    const t    = state.clock.elapsedTime;
    const half = spread / 2;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3 + 1] += delta * speed;
      pos[i3]     += Math.sin(t * 0.45 + i * 0.14) * delta * 0.055;
      if (pos[i3 + 1] > half) pos[i3 + 1] -= spread;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pts} geometry={geo}>
      <pointsMaterial color={color} size={size} transparent opacity={0.72} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ── Scene router — picks the right geometry based on mode ─────────────────

interface SceneRouterProps {
  mode:    WebGLMode;
  speed:   number;
  density: number;
  color:   string;
}

function SceneRouter({ mode, speed, density, color }: SceneRouterProps) {
  if (mode === 'starfield') {
    const count = Math.round(600 + density * 2400);
    return <StarfieldSystem count={count} speed={speed} color={color} />;
  }

  if (mode === 'waves') {
    const segs = Math.round(28 + density * 92);
    return <WaveScene segments={segs} speed={speed} color={color} />;
  }

  // Classic particles / ember
  const isEmber = mode === 'ember';
  const factor  = 0.4 + density * 0.6;
  return (
    <>
      <ClassicParticles
        count={Math.round((isEmber ? 420 : 650) * factor)}
        color={color}
        speed={(isEmber ? 0.55 : 0.18) * speed}
        size={isEmber ? 0.022 : 0.026}
        spread={14}
      />
      <ClassicParticles
        count={Math.round((isEmber ? 180 : 200) * factor)}
        color={color}
        speed={(isEmber ? 0.28 : 0.09) * speed}
        size={isEmber ? 0.036 : 0.04}
        spread={14}
      />
    </>
  );
}

// ── Exported component ─────────────────────────────────────────────────────
// The parent is responsible for positioning (fixed/absolute). The Canvas
// fills 100 % of whatever container it's placed in.

export default function WebGLBackground({ mode, speed, density, color }: WebGLBackgroundProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 60 }}
      gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
      dpr={[1, 1.5]}
    >
      <SceneRouter mode={mode} speed={speed} density={density} color={color} />
    </Canvas>
  );
}
