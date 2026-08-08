/**
 * Artifact ID: QCQ-TBL-030
 * Artifact Name: StormLayer
 * Repository Path: QCQ/frontend/src/effects/StormLayer.tsx
 *
 * Composite atmospheric authority for clouds, lightning, particles, glow signals,
 * and environment-level reflections. All decorative descendants remain removable.
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react';

import {
  createGlowController,
  type GlowController,
} from './GlowEngine';
import {
  LightningLayer,
  type LightningLayerProps,
} from './LightningLayer';
import {
  ParticleLayer,
  type ParticleLayerProps,
} from './ParticleLayer';
import {
  calculateReflectionProfile,
  createReflectionCssVariables,
} from './ReflectionEngine';

import {
  RainLayer,
} from './storm/RainLayer';
import {
  resolveQuizFinaleProfile,
} from './storm/StormFinalePolicy';
import {
  ThreeCloudSystem,
} from './storm/ThreeCloudSystem';
import {
  useStormOrchestration,
} from './storm/useStormOrchestration';
import type {
  QuizFinaleRequest,
  StormCloudId,
  StormDecision,
  StormElectricalEvent,
} from './storm/StormOrchestration.types';

export type StormLayerQuality = 'off' | 'performance' | 'balanced' | 'cinematic';
export type StormLayerMotion = 'full' | 'reduced' | 'static';

export interface StormLayerProps {
  readonly active?: boolean | undefined;
  readonly quality?: StormLayerQuality | undefined;
  readonly motion?: StormLayerMotion | undefined;
  readonly intensity?: number | undefined;
  readonly seed?: string | undefined;
  readonly className?: string | undefined;
  readonly opacity?: number | undefined;
  readonly lightning?: boolean | undefined;
  readonly particles?: boolean | undefined;
  readonly rain?: boolean | undefined;
  readonly finale?: QuizFinaleRequest | null | undefined;
  readonly lightningProps?: Omit<
    LightningLayerProps,
    'glowController' | 'externalEvent'
  > | undefined;
  readonly particleProps?: Omit<ParticleLayerProps, 'glowController'> | undefined;
  readonly glowController?: GlowController | undefined;
  readonly onElectricalEvent?:
    ((event: StormElectricalEvent) => void) | undefined;
}

type StormStyle = CSSProperties &
  Record<
    | '--qcq-storm-intensity'
    | '--qcq-storm-opacity'
    | '--qcq-storm-reflection-intensity'
    | '--qcq-storm-reflection-background',
    string
  >;

interface CloudNode {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  velocity: number;
  opacity: number;
  tint: number;
  depth: number;
}

const styles = `
  .qcq-storm-layer {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    opacity: var(--qcq-storm-opacity);
    pointer-events: none;
    contain: strict;
    isolation: isolate;
  }
  .qcq-storm-layer::before,
  .qcq-storm-layer::after,
  .qcq-storm-layer__reflection {
    position: absolute;
    inset: -12%;
    content: "";
    pointer-events: none;
  }
  .qcq-storm-layer::before {
    z-index: 0;
    background:
      radial-gradient(ellipse at 18% 22%, rgb(50 89 151 / calc(0.16 * var(--qcq-storm-intensity))), transparent 44%),
      radial-gradient(ellipse at 78% 18%, rgb(99 58 149 / calc(0.14 * var(--qcq-storm-intensity))), transparent 46%),
      radial-gradient(ellipse at 48% 82%, rgb(9 47 72 / calc(0.2 * var(--qcq-storm-intensity))), transparent 52%),
      linear-gradient(180deg, rgb(5 10 27 / 88%), rgb(1 4 14 / 95%));
    filter: saturate(1.12);
  }
  .qcq-storm-layer::after {
    z-index: 1;
    background:
      repeating-linear-gradient(112deg, transparent 0 8rem, rgb(79 129 173 / 2%) 8.1rem 8.22rem),
      linear-gradient(90deg, transparent, rgb(121 73 184 / calc(0.05 * var(--qcq-storm-intensity))), transparent);
    mix-blend-mode: screen;
    opacity: 0.72;
  }
  .qcq-storm-layer__canvas {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    opacity: 0.92;
    mix-blend-mode: screen;
  }
  .qcq-storm-layer__reflection {
    z-index: 4;
    background: var(--qcq-storm-reflection-background);
    mix-blend-mode: screen;
    opacity: var(--qcq-storm-reflection-intensity);
    transition: opacity 180ms ease-out;
  }
  .qcq-storm-layer[data-quality="off"],
  .qcq-storm-layer[data-active="false"] { display: none; }
  .qcq-storm-layer[data-motion="reduced"] .qcq-storm-layer__canvas,
  .qcq-storm-layer[data-motion="static"] .qcq-storm-layer__canvas { opacity: 0.72; }
  @media (prefers-reduced-motion: reduce) {
    .qcq-storm-layer__canvas { opacity: 0.66; }
    .qcq-storm-layer__reflection { transition: none; }
  }
  @media (forced-colors: active) {
    .qcq-storm-layer { display: none; }
  }
`;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

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

function nodeCount(quality: StormLayerQuality): number {
  switch (quality) {
    case 'cinematic': return 30;
    case 'balanced': return 18;
    case 'performance': return 8;
    case 'off': return 0;
  }
}

function frameRate(quality: StormLayerQuality): number {
  switch (quality) {
    case 'cinematic': return 24;
    case 'balanced': return 15;
    case 'performance': return 8;
    case 'off': return 0;
  }
}

function maximumDpr(quality: StormLayerQuality): number {
  switch (quality) {
    case 'cinematic': return 2;
    case 'balanced': return 1.5;
    case 'performance': return 1;
    case 'off': return 1;
  }
}

function generateNodes(count: number, seed: string): CloudNode[] {
  const random = createRandom(hashSeed(seed));
  return Array.from({ length: count }, () => ({
    x: random(),
    y: random() * 0.92,
    radiusX: 0.1 + random() * 0.28,
    radiusY: 0.06 + random() * 0.16,
    velocity: 0.0007 + random() * 0.0017,
    opacity: 0.035 + random() * 0.105,
    tint: random(),
    depth: 0.35 + random() * 0.65,
  }));
}

function drawStorm(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  nodes: readonly CloudNode[],
  intensity: number,
  flashIntensity: number,
): void {
  context.clearRect(0, 0, width, height);
  context.save();
  context.globalCompositeOperation = 'screen';
  for (const node of nodes) {
    const x = node.x * width;
    const y = node.y * height;
    const radiusX = node.radiusX * width;
    const radiusY = node.radiusY * height;
    const flashBoost = 1 + flashIntensity * (0.4 + node.depth * 0.8);
    context.save();
    context.translate(x, y);
    context.scale(1, radiusY / radiusX);
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radiusX);
    const red = Math.round(36 + node.tint * 48 + flashIntensity * 30);
    const green = Math.round(68 + node.tint * 24 + flashIntensity * 46);
    const blue = Math.round(112 + node.tint * 72 + flashIntensity * 62);
    const alpha = clamp(node.opacity * intensity * flashBoost, 0, 0.72);
    gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${alpha})`);
    gradient.addColorStop(0.42, `rgba(${red}, ${green}, ${blue}, ${alpha * 0.56})`);
    gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(0, 0, radiusX, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
  context.restore();
}

export function StormLayer({
  active = true,
  quality = 'balanced',
  motion = 'full',
  intensity = 0.72,
  seed = 'qcq-storm-layer',
  className,
  opacity = 1,
  lightning = true,
  particles = true,
  rain = true,
  finale = null,
  lightningProps,
  particleProps,
  glowController,
  onElectricalEvent,
}: StormLayerProps) {
  const id = useId();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [activeElectricalEvent,setActiveElectricalEvent] =
    useState<StormElectricalEvent | null>(null);
  const [cloudIllumination,setCloudIllumination] =
    useState<Readonly<Partial<Record<StormCloudId,number>>>>({});
  const ownedGlowController = useMemo(() => createGlowController(), []);
  const resolvedGlowController = glowController ?? ownedGlowController;
  const glowSnapshot = useSyncExternalStore(
    resolvedGlowController.subscribe,
    resolvedGlowController.getSnapshot,
    resolvedGlowController.getSnapshot,
  );
  const normalizedIntensity = clamp(intensity, 0, 1);
  const normalizedOpacity = clamp(opacity, 0, 1);
  const nodes = useMemo(
    () => generateNodes(nodeCount(quality), `${seed}:${id}`),
    [id, quality, seed],
  );
  const reflection = useMemo(
    () => calculateReflectionProfile({
      surface: 'environment',
      quality,
      motion,
      baseIntensity: normalizedIntensity * 0.48,
      lightning: glowSnapshot,
    }),
    [glowSnapshot, motion, normalizedIntensity, quality],
  );

  const finaleProfile = useMemo(
    () => finale === null ? null : resolveQuizFinaleProfile(finale),
    [finale],
  );

  const handleStormDecision = useCallback(
    (decision:StormDecision):void => {
      const event=decision.event;
      setActiveElectricalEvent(event);
      onElectricalEvent?.(event);

      if(event.wholeSystemIllumination){
        setCloudIllumination({
          primary:event.intensity,
          'rear-left':event.intensity*0.78,
          'rear-right':event.intensity*0.78,
        });
        return;
      }

      const next:Partial<Record<StormCloudId,number>>={
        [event.cloudSystem]:event.intensity,
      };
      if(event.targetCloud!==null){
        next[event.targetCloud]=event.intensity*0.72;
      }
      setCloudIllumination(next);
    },
    [onElectricalEvent],
  );

  useStormOrchestration({
    active:active&&lightning&&quality!=='off'&&motion==='full',
    seed:`${seed}:orchestration`,
    rootRef,
    motion,
    quality,
    finale,
    onDecision:handleStormDecision,
  });

  useEffect(()=>{
    if(activeElectricalEvent===null) return undefined;
    const decayMs=activeElectricalEvent.discharge==='major-strike'
      ?820
      :activeElectricalEvent.discharge==='cloud-to-cloud'
        ?640
        :460;
    const timer=globalThis.setTimeout(()=>setCloudIllumination({}),decayMs);
    return ()=>globalThis.clearTimeout(timer);
  },[activeElectricalEvent]);

  useEffect(() => () => ownedGlowController.dispose(), [ownedGlowController]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root || !active || quality === 'off') return undefined;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return undefined;

    let frame = 0;
    let lastFrame = 0;
    let width = 0;
    let height = 0;
    let visible = !document.hidden;
    let intersecting = true;
    let disposed = false;
    const fps = frameRate(quality);
    const minimumFrameInterval = fps > 0 ? 1000 / fps : Number.POSITIVE_INFINITY;
    const shouldAnimate = motion === 'full' && fps > 0;

    const paint = (): void => {
      drawStorm(
        context,
        width,
        height,
        nodes,
        normalizedIntensity,
        glowSnapshot.flashIntensity,
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
      paint();
    };

    const render = (timestamp: number): void => {
      if (disposed) return;
      if (visible && intersecting && timestamp - lastFrame >= minimumFrameInterval) {
        const delta = Math.min(50, Math.max(0, timestamp - lastFrame || minimumFrameInterval));
        for (const node of nodes) {
          node.x += node.velocity * delta * node.depth;
          if (node.x - node.radiusX > 1.12) node.x = -node.radiusX;
        }
        paint();
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
        }, { rootMargin: '160px' });
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
  }, [
    active,
    glowSnapshot.flashIntensity,
    motion,
    nodes,
    normalizedIntensity,
    quality,
  ]);

  const classes = ['qcq-storm-layer', className].filter(Boolean).join(' ');
  const reflectionVariables = createReflectionCssVariables(reflection);
  const style: StormStyle = {
    '--qcq-storm-intensity': String(normalizedIntensity),
    '--qcq-storm-opacity': String(normalizedOpacity),
    '--qcq-storm-reflection-intensity': String(reflection.lightningIntensity * 0.72),
    '--qcq-storm-reflection-background': reflection.combinedBackground,
    ...reflectionVariables,
  };
  const lightningIntensity = lightningProps?.intensity ?? normalizedIntensity;
  const particleIntensity = particleProps?.intensity ?? normalizedIntensity * 0.74;

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
        data-cloud-system="three-cloud"
        data-finale-active={String(finaleProfile !== null)}
        aria-hidden="true"
      >
        <ThreeCloudSystem
          active={active}
          quality={quality}
          intensity={normalizedIntensity}
          illumination={cloudIllumination}
        />
        <canvas ref={canvasRef} className="qcq-storm-layer__canvas" />
        {rain && finaleProfile !== null ? (
          <RainLayer
            active={active}
            quality={quality}
            motion={motion}
            intensity={finaleProfile.rainIntensity}
            seed={`${seed}:finale-rain:${finaleProfile.quizId}`}
          />
        ) : null}
        {particles ? (
          <ParticleLayer
            {...particleProps}
            active={active}
            quality={quality}
            motion={motion}
            intensity={particleIntensity}
            seed={particleProps?.seed ?? `${seed}:particles`}
            glowController={resolvedGlowController}
          />
        ) : null}
        {lightning ? (
          <LightningLayer
            {...lightningProps}
            active={active}
            quality={quality}
            motion={motion}
            intensity={lightningIntensity}
            seed={lightningProps?.seed ?? `${seed}:lightning`}
            glowController={resolvedGlowController}
            externalEvent={activeElectricalEvent}
          />
        ) : null}
        <div className="qcq-storm-layer__reflection" />
      </div>
    </>
  );
}
