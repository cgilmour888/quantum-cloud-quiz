/**
 * Artifact ID: QCQ-TBL-032
 * Artifact Name: ParticleLayer
 * Repository Path: QCQ/frontend/src/effects/ParticleLayer.tsx
 */

import {
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
} from 'react';

import {
  clampGlow,
  qcqGlowController,
  resolveGlowProfile,
  type GlowController,
  type GlowMotion,
  type GlowQuality,
} from './GlowEngine';

export type ParticleLayerQuality = GlowQuality;
export type ParticleLayerMotion = GlowMotion;

export interface ParticleLayerProps {
  readonly active?: boolean | undefined;
  readonly quality?: ParticleLayerQuality | undefined;
  readonly motion?: ParticleLayerMotion | undefined;
  readonly intensity?: number | undefined;
  readonly density?: number | undefined;
  readonly seed?: string | undefined;
  readonly className?: string | undefined;
  readonly opacity?: number | undefined;
  readonly glowController?: GlowController | undefined;
}

interface ParticleNode {
  x: number;
  y: number;
  radius: number;
  velocityX: number;
  velocityY: number;
  opacity: number;
  depth: number;
  phase: number;
  hueMix: number;
}

type ParticleStyle = CSSProperties &
  Record<
    | '--qcq-particle-opacity'
    | '--qcq-particle-intensity'
    | '--qcq-particle-primary'
    | '--qcq-particle-secondary',
    string
  >;

const styles = `
  .qcq-particle-layer {
    position: absolute;
    inset: 0;
    z-index: 2;
    overflow: hidden;
    opacity: var(--qcq-particle-opacity);
    pointer-events: none;
    contain: strict;
  }
  .qcq-particle-layer[data-active="false"],
  .qcq-particle-layer[data-quality="off"] {
    display: none;
  }
  .qcq-particle-layer__canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    mix-blend-mode: screen;
  }
  .qcq-particle-layer[data-motion="static"] .qcq-particle-layer__canvas {
    opacity: 0.72;
  }
  @media (prefers-reduced-motion: reduce) {
    .qcq-particle-layer__canvas { opacity: 0.68; }
  }
  @media (forced-colors: active) {
    .qcq-particle-layer { display: none; }
  }
`;

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function baseCount(quality: ParticleLayerQuality): number {
  switch (quality) {
    case 'cinematic': return 76;
    case 'balanced': return 42;
    case 'performance': return 20;
    case 'off': return 0;
  }
}

function targetFrameRate(quality: ParticleLayerQuality): number {
  switch (quality) {
    case 'cinematic': return 30;
    case 'balanced': return 20;
    case 'performance': return 12;
    case 'off': return 0;
  }
}

function maximumDpr(quality: ParticleLayerQuality): number {
  switch (quality) {
    case 'cinematic': return 2;
    case 'balanced': return 1.5;
    case 'performance': return 1;
    case 'off': return 1;
  }
}

function generateParticles(count: number, seed: string): ParticleNode[] {
  const random = createRandom(hashSeed(seed));
  return Array.from({ length: count }, () => ({
    x: random(),
    y: random(),
    radius: 0.45 + random() * 1.8,
    velocityX: (random() - 0.5) * 0.000026,
    velocityY: -(0.000018 + random() * 0.000052),
    opacity: 0.12 + random() * 0.42,
    depth: 0.28 + random() * 0.72,
    phase: random() * Math.PI * 2,
    hueMix: random(),
  }));
}

function drawParticles(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  particles: readonly ParticleNode[],
  intensity: number,
  flashIntensity: number,
  primary: string,
  secondary: string,
  timestamp: number,
): void {
  context.clearRect(0, 0, width, height);
  context.save();
  context.globalCompositeOperation = 'screen';
  for (const particle of particles) {
    const pulse = 0.72 + Math.sin(timestamp * 0.00055 + particle.phase) * 0.28;
    const lightningBoost = 1 + flashIntensity * (0.7 + particle.depth * 0.8);
    const alpha = clampGlow(particle.opacity * intensity * pulse * lightningBoost);
    const x = particle.x * width;
    const y = particle.y * height;
    const radius = particle.radius * (0.7 + particle.depth * 0.8) * (1 + flashIntensity * 0.25);
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius * 4.6);
    const core = particle.hueMix > 0.5 ? primary : secondary;
    gradient.addColorStop(0, `rgb(240 253 255 / ${alpha})`);
    gradient.addColorStop(0.2, core);
    gradient.addColorStop(1, 'transparent');
    context.globalAlpha = alpha;
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius * 4.6, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

export function ParticleLayer({
  active = true,
  quality = 'balanced',
  motion = 'full',
  intensity = 0.58,
  density = 1,
  seed = 'qcq-particle-layer',
  className,
  opacity = 1,
  glowController = qcqGlowController,
}: ParticleLayerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flashRef = useRef(0);
  const normalizedIntensity = clampGlow(intensity);
  const normalizedDensity = clampGlow(density, 0.25, 1.5);
  const normalizedOpacity = clampGlow(opacity);
  const glow = useMemo(
    () => resolveGlowProfile('particle', { intensity: normalizedIntensity, quality, motion }),
    [motion, normalizedIntensity, quality],
  );
  const particles = useMemo(
    () => generateParticles(
      Math.min(96, Math.round(baseCount(quality) * normalizedDensity)),
      `${seed}:${quality}:${normalizedDensity}`,
    ),
    [normalizedDensity, quality, seed],
  );
  const glowSnapshot = useSyncExternalStore(
    glowController.subscribe,
    glowController.getSnapshot,
    glowController.getSnapshot,
  );

  useEffect(() => {
    flashRef.current = glowSnapshot.flashIntensity;
  }, [glowSnapshot.flashIntensity]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas || !active || quality === 'off') return undefined;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return undefined;

    let frame = 0;
    let width = 0;
    let height = 0;
    let lastFrame = 0;
    let visible = !document.hidden;
    let intersecting = true;
    let disposed = false;
    const fps = targetFrameRate(quality);
    const minimumFrameInterval = fps > 0 ? 1000 / fps : Number.POSITIVE_INFINITY;
    const shouldAnimate = motion === 'full' && fps > 0;

    const paint = (timestamp: number): void => {
      drawParticles(
        context,
        width,
        height,
        particles,
        glow.intensity,
        flashRef.current,
        glow.palette.primary,
        glow.palette.secondary,
        timestamp,
      );
    };

    const resize = (): void => {
      const bounds = root.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      const dpr = Math.min(globalThis.devicePixelRatio || 1, maximumDpr(quality));
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(performance.now());
    };

    const render = (timestamp: number): void => {
      if (disposed) return;
      if (visible && intersecting && timestamp - lastFrame >= minimumFrameInterval) {
        const delta = Math.min(50, Math.max(0, timestamp - lastFrame || minimumFrameInterval));
        for (const particle of particles) {
          particle.x += particle.velocityX * delta * particle.depth;
          particle.y += particle.velocityY * delta * particle.depth;
          if (particle.x < -0.04) particle.x = 1.04;
          if (particle.x > 1.04) particle.x = -0.04;
          if (particle.y < -0.05) particle.y = 1.05;
        }
        paint(timestamp);
        lastFrame = timestamp;
      }
      frame = requestAnimationFrame(render);
    };

    const visibilityListener = (): void => {
      visible = !document.hidden;
      if (visible) lastFrame = performance.now();
    };
    document.addEventListener('visibilitychange', visibilityListener);

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(resize);
    resizeObserver?.observe(root);

    const intersectionObserver = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entries) => {
          intersecting = entries[0]?.isIntersecting ?? true;
        }, { rootMargin: '180px' });
    intersectionObserver?.observe(root);

    resize();
    if (shouldAnimate) frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', visibilityListener);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      context.clearRect(0, 0, width, height);
    };
  }, [active, glow, motion, particles, quality]);

  const classes = ['qcq-particle-layer', className].filter(Boolean).join(' ');
  const style: ParticleStyle = {
    '--qcq-particle-opacity': String(normalizedOpacity),
    '--qcq-particle-intensity': String(glow.intensity),
    '--qcq-particle-primary': glow.palette.primary,
    '--qcq-particle-secondary': glow.palette.secondary,
  };

  return (
    <>
      <style>{styles}</style>
      <div
        ref={rootRef}
        className={classes}
        style={style}
        data-active={String(active)}
        data-quality={quality}
        data-motion={motion}
        aria-hidden="true"
      >
        <canvas ref={canvasRef} className="qcq-particle-layer__canvas" />
      </div>
    </>
  );
}
