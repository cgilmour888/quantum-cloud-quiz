/**
 * Artifact ID: QCQ-TBL-041
 * Artifact Name: ReflectionEngine
 * Repository Path: QCQ/frontend/src/effects/ReflectionEngine.ts
 *
 * NOTE: QCQ-TBL-034 is permanently assigned to PlayerProfileStore. ReflectionEngine
 * therefore receives the next non-colliding QCQ-TBL identifier.
 */

import {
  clampGlow,
  resolveGlowProfile,
  type GlowMotion,
  type GlowQuality,
  type GlowSignalSnapshot,
} from './GlowEngine';

export type ReflectionSurface =
  | 'platinum-frame'
  | 'tablet-glass'
  | 'answer-surface'
  | 'metric-panel'
  | 'energy-rail'
  | 'environment';

export interface ReflectionVector {
  readonly x: number;
  readonly y: number;
}

export interface ReflectionOptions {
  readonly surface: ReflectionSurface;
  readonly quality?: GlowQuality | undefined;
  readonly motion?: GlowMotion | undefined;
  readonly baseIntensity?: number | undefined;
  readonly roughness?: number | undefined;
  readonly lightDirection?: Partial<ReflectionVector> | undefined;
  readonly lightning?: GlowSignalSnapshot | undefined;
}

export interface ReflectionProfile {
  readonly surface: ReflectionSurface;
  readonly intensity: number;
  readonly lightningIntensity: number;
  readonly roughness: number;
  readonly highlightXPercent: number;
  readonly highlightYPercent: number;
  readonly highlightWidthPercent: number;
  readonly highlightAngleDeg: number;
  readonly highlightColor: string;
  readonly secondaryColor: string;
  readonly metallicGradient: string;
  readonly lightningGradient: string;
  readonly combinedBackground: string;
  readonly filter: string;
  readonly mixBlendMode: 'screen' | 'soft-light' | 'overlay';
}

export type ReflectionCssVariable =
  | '--qcq-reflection-intensity'
  | '--qcq-reflection-lightning-intensity'
  | '--qcq-reflection-highlight-x'
  | '--qcq-reflection-highlight-y'
  | '--qcq-reflection-highlight-width'
  | '--qcq-reflection-highlight-angle'
  | '--qcq-reflection-highlight-color'
  | '--qcq-reflection-secondary-color'
  | '--qcq-reflection-metallic-gradient'
  | '--qcq-reflection-lightning-gradient';

interface SurfaceTuning {
  readonly intensity: number;
  readonly roughness: number;
  readonly width: number;
  readonly blendMode: ReflectionProfile['mixBlendMode'];
}

const SURFACE_TUNING: Readonly<Record<ReflectionSurface, SurfaceTuning>> = Object.freeze({
  'platinum-frame': Object.freeze({ intensity: 0.92, roughness: 0.24, width: 18, blendMode: 'screen' }),
  'tablet-glass': Object.freeze({ intensity: 0.74, roughness: 0.14, width: 30, blendMode: 'soft-light' }),
  'answer-surface': Object.freeze({ intensity: 0.48, roughness: 0.32, width: 38, blendMode: 'soft-light' }),
  'metric-panel': Object.freeze({ intensity: 0.58, roughness: 0.28, width: 28, blendMode: 'overlay' }),
  'energy-rail': Object.freeze({ intensity: 0.86, roughness: 0.18, width: 14, blendMode: 'screen' }),
  environment: Object.freeze({ intensity: 0.42, roughness: 0.48, width: 52, blendMode: 'screen' }),
});

function normalizeVector(value: Partial<ReflectionVector> | undefined): ReflectionVector {
  const x = Number.isFinite(value?.x) ? value?.x ?? 0.38 : 0.38;
  const y = Number.isFinite(value?.y) ? value?.y ?? -0.72 : -0.72;
  const length = Math.hypot(x, y) || 1;
  return Object.freeze({ x: x / length, y: y / length });
}

function round(value: number, precision = 1000): number {
  return Math.round(value * precision) / precision;
}

export function calculateReflectionProfile(options: ReflectionOptions): ReflectionProfile {
  const tuning = SURFACE_TUNING[options.surface];
  const quality = options.quality ?? 'balanced';
  const motion = options.motion ?? 'full';
  const roughness = clampGlow(options.roughness ?? tuning.roughness);
  const baseIntensity = clampGlow(options.baseIntensity ?? tuning.intensity);
  const lightningIntensity = motion === 'full'
    ? clampGlow(options.lightning?.flashIntensity ?? 0)
    : 0;
  const glow = resolveGlowProfile('reflection', {
    intensity: clampGlow(baseIntensity + lightningIntensity * 0.48),
    quality,
    motion,
  });
  const light = normalizeVector(options.lightDirection);
  const highlightXPercent = round(50 + light.x * 34, 100);
  const highlightYPercent = round(50 + light.y * 30, 100);
  const highlightWidthPercent = round(tuning.width + roughness * 28, 100);
  const highlightAngleDeg = round(Math.atan2(light.y, light.x) * (180 / Math.PI) + 90, 100);
  const intensity = round(glow.intensity * (1 - roughness * 0.38));
  const flashColor = options.lightning?.flashColor ?? glow.palette.core;
  const metallicGradient = [
    `linear-gradient(${highlightAngleDeg}deg, transparent 0%`,
    `rgb(255 255 255 / ${round(intensity * 0.05)}) ${Math.max(0, 48 - highlightWidthPercent / 2)}%`,
    `rgb(215 246 255 / ${round(intensity * 0.32)}) 50%`,
    `rgb(125 151 190 / ${round(intensity * 0.12)}) ${Math.min(100, 52 + highlightWidthPercent / 2)}%`,
    'transparent 100%)',
  ].join(', ');
  const lightningGradient = `radial-gradient(ellipse at ${highlightXPercent}% ${highlightYPercent}%, ${flashColor} 0%, rgb(148 198 255 / ${round(lightningIntensity * 0.36)}) 12%, transparent 58%)`;
  const combinedBackground = lightningIntensity > 0
    ? `${lightningGradient}, ${metallicGradient}`
    : metallicGradient;

  return Object.freeze({
    surface: options.surface,
    intensity,
    lightningIntensity: round(lightningIntensity),
    roughness: round(roughness),
    highlightXPercent,
    highlightYPercent,
    highlightWidthPercent,
    highlightAngleDeg,
    highlightColor: glow.palette.core,
    secondaryColor: glow.palette.secondary,
    metallicGradient,
    lightningGradient,
    combinedBackground,
    filter: glow.filter,
    mixBlendMode: tuning.blendMode,
  });
}

export function createReflectionCssVariables(
  profile: ReflectionProfile,
): Readonly<Record<ReflectionCssVariable, string>> {
  return Object.freeze({
    '--qcq-reflection-intensity': String(profile.intensity),
    '--qcq-reflection-lightning-intensity': String(profile.lightningIntensity),
    '--qcq-reflection-highlight-x': `${profile.highlightXPercent}%`,
    '--qcq-reflection-highlight-y': `${profile.highlightYPercent}%`,
    '--qcq-reflection-highlight-width': `${profile.highlightWidthPercent}%`,
    '--qcq-reflection-highlight-angle': `${profile.highlightAngleDeg}deg`,
    '--qcq-reflection-highlight-color': profile.highlightColor,
    '--qcq-reflection-secondary-color': profile.secondaryColor,
    '--qcq-reflection-metallic-gradient': profile.metallicGradient,
    '--qcq-reflection-lightning-gradient': profile.lightningGradient,
  });
}
