/**
 * Artifact ID: QCQ-TBL-031
 * Artifact Name: LightningLayer
 * Repository Path: QCQ/frontend/src/effects/LightningLayer.tsx
 */

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
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

import {
  createLightningStrikeFromElectricalEvent,
} from './storm/LightningExternalGeometry';
import type {
  StormElectricalEvent,
} from './storm/StormOrchestration.types';

export type LightningLayerQuality = GlowQuality;
export type LightningLayerMotion = GlowMotion;

export interface LightningStrikeEvent {
  readonly id: string;
  readonly sequence: number;
  readonly timestamp: number;
  readonly intensity: number;
  readonly originX: number;
  readonly terminalX: number;
  readonly branchCount: number;
  readonly cloudSystem?: StormElectricalEvent['cloudSystem'] | undefined;
  readonly targetCloud?: StormElectricalEvent['targetCloud'] | undefined;
  readonly discharge?: StormElectricalEvent['discharge'] | undefined;
  readonly depth?: StormElectricalEvent['depth'] | undefined;
}

export interface LightningLayerProps {
  readonly active?: boolean | undefined;
  readonly quality?: LightningLayerQuality | undefined;
  readonly motion?: LightningLayerMotion | undefined;
  readonly intensity?: number | undefined;
  readonly seed?: string | undefined;
  readonly className?: string | undefined;
  readonly strikeIntervalMs?: readonly [number, number] | undefined;
  readonly strikeDurationMs?: number | undefined;
  readonly branchProbability?: number | undefined;
  readonly glowController?: GlowController | undefined;
  readonly externalEvent?: StormElectricalEvent | null | undefined;
  readonly onStrike?: ((event: LightningStrikeEvent) => void) | undefined;
}

interface Point {
  readonly x: number;
  readonly y: number;
}

interface LightningPath {
  readonly d: string;
  readonly opacity: number;
  readonly width: number;
}

interface LightningStrike {
  readonly id: string;
  readonly sequence: number;
  readonly timestamp: number;
  readonly intensity: number;
  readonly originX: number;
  readonly terminalX: number;
  readonly main: LightningPath;
  readonly branches: readonly LightningPath[];
}

type LightningStyle = CSSProperties &
  Record<
    | '--qcq-lightning-intensity'
    | '--qcq-lightning-flash-opacity'
    | '--qcq-lightning-duration'
    | '--qcq-lightning-primary'
    | '--qcq-lightning-secondary',
    string
  >;

const DEFAULT_INTERVAL: readonly [number, number] = Object.freeze([7200, 13800]);

const styles = `
  .qcq-lightning-layer {
    position: absolute;
    inset: 0;
    z-index: 3;
    overflow: hidden;
    pointer-events: none;
    contain: strict;
    isolation: isolate;
  }
  .qcq-lightning-layer[data-active="false"],
  .qcq-lightning-layer[data-quality="off"] {
    display: none;
  }
  .qcq-lightning-layer__svg,
  .qcq-lightning-layer__flash,
  .qcq-lightning-layer__ambient {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .qcq-lightning-layer__svg {
    overflow: visible;
    mix-blend-mode: screen;
    animation: qcq-lightning-strike var(--qcq-lightning-duration) cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .qcq-lightning-layer__aura {
    fill: none;
    stroke: var(--qcq-lightning-secondary);
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    opacity: calc(0.26 * var(--qcq-lightning-intensity));
  }
  .qcq-lightning-layer__core {
    fill: none;
    stroke: var(--qcq-lightning-primary);
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    opacity: calc(0.96 * var(--qcq-lightning-intensity));
  }
  .qcq-lightning-layer__flash {
    background:
      radial-gradient(ellipse at 50% 3%, rgb(222 247 255 / calc(var(--qcq-lightning-flash-opacity) * 0.62)), transparent 54%),
      linear-gradient(180deg, rgb(134 182 255 / calc(var(--qcq-lightning-flash-opacity) * 0.22)), transparent 62%);
    mix-blend-mode: screen;
    animation: qcq-lightning-flash var(--qcq-lightning-duration) ease-out both;
  }
  .qcq-lightning-layer__ambient {
    opacity: 0;
    background: radial-gradient(ellipse at 50% 12%, rgb(140 182 240 / 8%), transparent 58%);
  }
  .qcq-lightning-layer[data-motion="reduced"] .qcq-lightning-layer__svg,
  .qcq-lightning-layer[data-motion="static"] .qcq-lightning-layer__svg,
  .qcq-lightning-layer[data-motion="reduced"] .qcq-lightning-layer__flash,
  .qcq-lightning-layer[data-motion="static"] .qcq-lightning-layer__flash {
    display: none;
  }
  .qcq-lightning-layer[data-motion="reduced"] .qcq-lightning-layer__ambient,
  .qcq-lightning-layer[data-motion="static"] .qcq-lightning-layer__ambient {
    opacity: calc(0.3 * var(--qcq-lightning-intensity));
  }
  @keyframes qcq-lightning-strike {
    0% { opacity: 0; }
    4% { opacity: 1; }
    12% { opacity: 0.34; }
    19% { opacity: 0.96; }
    33% { opacity: 0.22; }
    100% { opacity: 0; }
  }
  @keyframes qcq-lightning-flash {
    0% { opacity: 0; }
    4% { opacity: 1; }
    14% { opacity: 0.18; }
    22% { opacity: 0.52; }
    100% { opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .qcq-lightning-layer__svg,
    .qcq-lightning-layer__flash {
      display: none;
    }
    .qcq-lightning-layer__ambient {
      opacity: calc(0.24 * var(--qcq-lightning-intensity));
    }
  }
  @media (forced-colors: active) {
    .qcq-lightning-layer { display: none; }
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

function segmentCount(quality: LightningLayerQuality): number {
  switch (quality) {
    case 'cinematic': return 18;
    case 'balanced': return 14;
    case 'performance': return 10;
    case 'off': return 0;
  }
}

function maximumBranches(quality: LightningLayerQuality): number {
  switch (quality) {
    case 'cinematic': return 8;
    case 'balanced': return 5;
    case 'performance': return 2;
    case 'off': return 0;
  }
}

function pointsToPath(points: readonly Point[]): string {
  const first = points[0];
  if (first === undefined) return '';
  return points.slice(1).reduce(
    (path, point) => `${path} L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`,
  );
}

function createBranch(
  source: Point,
  random: () => number,
  direction: number,
  intensity: number,
): LightningPath {
  const points: Point[] = [source];
  const count = 3 + Math.floor(random() * 4);
  let x = source.x;
  let y = source.y;
  for (let index = 0; index < count; index += 1) {
    x += direction * (30 + random() * 75) + (random() - 0.5) * 24;
    y += 28 + random() * 74;
    points.push({ x: Math.min(990, Math.max(10, x)), y: Math.min(990, y) });
  }
  return Object.freeze({
    d: pointsToPath(points),
    opacity: 0.34 + intensity * 0.42,
    width: 0.55 + intensity * 0.72,
  });
}

function generateStrike(
  seed: string,
  sequence: number,
  quality: LightningLayerQuality,
  intensity: number,
  branchProbability: number,
): LightningStrike {
  const random = createRandom(hashSeed(`${seed}:${sequence}`));
  const count = segmentCount(quality);
  const originX = 170 + random() * 660;
  let x = originX;
  let y = -20;
  const points: Point[] = [{ x, y }];
  const branches: LightningPath[] = [];
  const branchLimit = maximumBranches(quality);

  for (let index = 1; index <= count; index += 1) {
    const progress = index / count;
    const drift = (random() - 0.5) * (120 - progress * 44);
    const pullToCenter = (500 - x) * 0.018;
    x = Math.min(970, Math.max(30, x + drift + pullToCenter));
    y = progress * 1040 - 20;
    const point = { x, y };
    points.push(point);
    if (
      branches.length < branchLimit
      && index > 2
      && index < count - 2
      && random() < branchProbability
    ) {
      branches.push(createBranch(point, random, random() < 0.5 ? -1 : 1, intensity));
    }
  }

  return Object.freeze({
    id: `${hashSeed(`${seed}:${sequence}:strike`).toString(16)}-${sequence}`,
    sequence,
    timestamp: Date.now(),
    intensity,
    originX,
    terminalX: x,
    main: Object.freeze({
      d: pointsToPath(points),
      opacity: 1,
      width: 1.05 + intensity * 1.35,
    }),
    branches: Object.freeze(branches),
  });
}


function normalizeInterval(interval: readonly [number, number]): readonly [number, number] {
  const first = Number.isFinite(interval[0]) ? interval[0] : DEFAULT_INTERVAL[0];
  const second = Number.isFinite(interval[1]) ? interval[1] : DEFAULT_INTERVAL[1];
  const minimum = Math.max(3500, Math.min(first, second));
  const maximum = Math.max(minimum + 500, Math.max(first, second));
  return Object.freeze([Math.round(minimum), Math.round(maximum)]);
}

export function LightningLayer({
  active = true,
  quality = 'balanced',
  motion = 'full',
  intensity = 0.78,
  seed = 'qcq-lightning-layer',
  className,
  strikeIntervalMs = DEFAULT_INTERVAL,
  strikeDurationMs = 760,
  branchProbability = 0.34,
  glowController = qcqGlowController,
  externalEvent,
  onStrike,
}: LightningLayerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const sequenceRef = useRef(0);
  const instanceId = useId().replaceAll(':', '');
  const [strike, setStrike] = useState<LightningStrike | null>(null);
  const normalizedIntensity = clampGlow(intensity);
  const renderedIntensity =
    externalEvent === undefined || externalEvent === null
      ? normalizedIntensity
      : clampGlow(externalEvent.intensity);
  const normalizedBranchProbability = clampGlow(branchProbability, 0.08, 0.72);
  const durationMs = Math.round(Math.min(1200, Math.max(420, strikeDurationMs)));
  const interval = useMemo(
    () => normalizeInterval(strikeIntervalMs),
    [strikeIntervalMs],
  );
  const glow = useMemo(
    () => resolveGlowProfile('lightning-flash', { intensity: renderedIntensity, quality, motion }),
    [motion, quality, renderedIntensity],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (
      externalEvent !== undefined ||
      !root ||
      !active ||
      quality === 'off' ||
      motion !== 'full'
    ) return undefined;

    let disposed = false;
    let pageVisible = !document.hidden;
    let intersecting = true;
    let strikeTimer: number | undefined;
    let clearTimer: number | undefined;

    const clearTimers = (): void => {
      if (strikeTimer !== undefined) globalThis.clearTimeout(strikeTimer);
      if (clearTimer !== undefined) globalThis.clearTimeout(clearTimer);
      strikeTimer = undefined;
      clearTimer = undefined;
    };

    const nextDelay = (): number => {
      const nextSequence = sequenceRef.current + 1;
      const random = createRandom(hashSeed(`${seed}:delay:${nextSequence}`));
      return Math.round(interval[0] + random() * (interval[1] - interval[0]));
    };

    const schedule = (delay: number): void => {
      if (disposed) return;
      strikeTimer = window.setTimeout(() => {
        if (disposed) return;
        if (!pageVisible || !intersecting) {
          schedule(Math.max(1200, Math.round(interval[0] * 0.45)));
          return;
        }

        sequenceRef.current += 1;
        const next = generateStrike(
          seed,
          sequenceRef.current,
          quality,
          normalizedIntensity,
          normalizedBranchProbability,
        );
        setStrike(next);
        glowController.pulse({
          source: 'QCQ-TBL-031',
          role: 'lightning-flash',
          intensity: normalizedIntensity,
          durationMs: Math.min(durationMs, 680),
          color: glow.palette.core,
          timestamp: next.timestamp,
        });
        onStrike?.({
          id: next.id,
          sequence: next.sequence,
          timestamp: next.timestamp,
          intensity: next.intensity,
          originX: next.originX,
          terminalX: next.terminalX,
          branchCount: next.branches.length,
        });
        clearTimer = window.setTimeout(() => {
          if (!disposed) setStrike(null);
        }, durationMs);
        schedule(nextDelay());
      }, delay);
    };

    const visibilityListener = (): void => {
      pageVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', visibilityListener);

    const intersectionObserver = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entries) => {
          intersecting = entries[0]?.isIntersecting ?? true;
        }, { rootMargin: '200px' });
    intersectionObserver?.observe(root);

    schedule(Math.min(1800, Math.round(interval[0] * 0.28)));

    return () => {
      disposed = true;
      clearTimers();
      document.removeEventListener('visibilitychange', visibilityListener);
      intersectionObserver?.disconnect();
      glowController.clear('QCQ-TBL-031');
    };
  }, [
    active,
    durationMs,
    externalEvent,
    glow.palette.core,
    glowController,
    interval,
    motion,
    normalizedBranchProbability,
    normalizedIntensity,
    onStrike,
    quality,
    seed,
  ]);


  useEffect(() => {
    if (
      externalEvent === undefined ||
      externalEvent === null ||
      !active ||
      quality === 'off' ||
      motion !== 'full'
    ) return undefined;

    const eventIntensity=clampGlow(externalEvent.intensity);
    const next=createLightningStrikeFromElectricalEvent(
      externalEvent,
      quality,
      normalizedBranchProbability,
    );

    glowController.pulse({
      source:'QCQ-TBL-031',
      role:'lightning-flash',
      intensity:eventIntensity,
      durationMs:Math.min(durationMs,680),
      color:glow.palette.core,
      timestamp:externalEvent.scheduledAt,
    });

    onStrike?.({
      id:externalEvent.id,
      sequence:externalEvent.sequence,
      timestamp:externalEvent.scheduledAt,
      intensity:eventIntensity,
      originX:externalEvent.originX*1000,
      terminalX:externalEvent.terminalX*1000,
      branchCount:next?.branches.length??0,
      cloudSystem:externalEvent.cloudSystem,
      targetCloud:externalEvent.targetCloud,
      discharge:externalEvent.discharge,
      depth:externalEvent.depth,
    });

    if(next===null) return undefined;

    const presentTimer=globalThis.setTimeout(()=>setStrike(next),0);
    const clearTimer=globalThis.setTimeout(()=>setStrike(null),durationMs);

    return ()=>{
      globalThis.clearTimeout(presentTimer);
      globalThis.clearTimeout(clearTimer);
    };
  },[
    active,
    durationMs,
    externalEvent,
    glow.palette.core,
    glowController,
    motion,
    normalizedBranchProbability,
    onStrike,
    quality,
  ]);

  const classes = ['qcq-lightning-layer', className].filter(Boolean).join(' ');
  const style: LightningStyle = {
    '--qcq-lightning-intensity': String(glow.intensity),
    '--qcq-lightning-flash-opacity': String(glow.outerOpacity),
    '--qcq-lightning-duration': `${durationMs}ms`,
    '--qcq-lightning-primary': glow.palette.core,
    '--qcq-lightning-secondary': glow.palette.primary,
  };
  const filterId = `qcq-lightning-blur-${instanceId}`;
  const visibleStrike = active && quality !== 'off' && motion === 'full' ? strike : null;

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
        data-source-mode={externalEvent === undefined ? 'internal' : 'orchestrated'}
        aria-hidden="true"
      >
        <div className="qcq-lightning-layer__ambient" />
        {visibleStrike === null ? null : (
          <>
            <svg
              key={visibleStrike.id}
              className="qcq-lightning-layer__svg"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
              focusable="false"
            >
              <defs>
                <filter id={filterId} x="-30%" y="-20%" width="160%" height="150%">
                  <feGaussianBlur stdDeviation="7" />
                </filter>
              </defs>
              <path
                className="qcq-lightning-layer__aura"
                d={visibleStrike.main.d}
                strokeWidth={visibleStrike.main.width * 7}
                filter={`url(#${filterId})`}
              />
              <path
                className="qcq-lightning-layer__core"
                d={visibleStrike.main.d}
                strokeWidth={visibleStrike.main.width}
              />
              {visibleStrike.branches.map((branch, index) => (
                <g key={`${visibleStrike.id}-branch-${index}`} opacity={branch.opacity}>
                  <path
                    className="qcq-lightning-layer__aura"
                    d={branch.d}
                    strokeWidth={branch.width * 5}
                    filter={`url(#${filterId})`}
                  />
                  <path
                    className="qcq-lightning-layer__core"
                    d={branch.d}
                    strokeWidth={branch.width}
                  />
                </g>
              ))}
            </svg>
            <div key={`${visibleStrike.id}-flash`} className="qcq-lightning-layer__flash" />
          </>
        )}
      </div>
    </>
  );
}
