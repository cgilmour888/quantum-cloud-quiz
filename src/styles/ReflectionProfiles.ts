/**
 * Artifact ID: QCQ-THM-006
 * Artifact Name: ReflectionProfiles
 * Repository Path: QCQ/frontend/src/styles/ReflectionProfiles.ts
 *
 * Declarative presets consumed by QCQ-TBL-041 ReflectionEngine.
 */

import {
  calculateReflectionProfile,
  createReflectionCssVariables,
  type ReflectionOptions,
  type ReflectionProfile,
  type ReflectionSurface,
} from '../effects/ReflectionEngine';
import type { GlowSignalSnapshot } from '../effects/GlowEngine';
import {
  mergeCssVariableMaps,
  type CssVariableMap,
  type QcqVisualQuality,
} from './DesignTokens';

export type ReflectionPresetId =
  | 'frame-platinum'
  | 'frame-oxidized'
  | 'tablet-glass'
  | 'answer-surface'
  | 'metric-console'
  | 'energy-rail'
  | 'environment';

export interface ReflectionPreset {
  readonly id: ReflectionPresetId;
  readonly surface: ReflectionSurface;
  readonly baseIntensity: number;
  readonly roughness: number;
  readonly lightDirection: {
    readonly x: number;
    readonly y: number;
  };
}

const QUALITY_MAP: Readonly<
  Record<QcqVisualQuality, NonNullable<ReflectionOptions['quality']>>
> = Object.freeze({
  performance: 'performance',
  balanced: 'balanced',
  cinematic: 'cinematic',
});

export const REFLECTION_PRESETS: Readonly<
  Record<ReflectionPresetId, ReflectionPreset>
> = Object.freeze({
  'frame-platinum': Object.freeze({
    id: 'frame-platinum',
    surface: 'platinum-frame',
    baseIntensity: 0.72,
    roughness: 0.22,
    lightDirection: Object.freeze({ x: 0.42, y: -0.78 }),
  }),
  'frame-oxidized': Object.freeze({
    id: 'frame-oxidized',
    surface: 'platinum-frame',
    baseIntensity: 0.48,
    roughness: 0.58,
    lightDirection: Object.freeze({ x: 0.34, y: -0.72 }),
  }),
  'tablet-glass': Object.freeze({
    id: 'tablet-glass',
    surface: 'tablet-glass',
    baseIntensity: 0.58,
    roughness: 0.18,
    lightDirection: Object.freeze({ x: 0.5, y: -0.86 }),
  }),
  'answer-surface': Object.freeze({
    id: 'answer-surface',
    surface: 'answer-surface',
    baseIntensity: 0.34,
    roughness: 0.42,
    lightDirection: Object.freeze({ x: 0.32, y: -0.68 }),
  }),
  'metric-console': Object.freeze({
    id: 'metric-console',
    surface: 'metric-panel',
    baseIntensity: 0.4,
    roughness: 0.38,
    lightDirection: Object.freeze({ x: 0.44, y: -0.7 }),
  }),
  'energy-rail': Object.freeze({
    id: 'energy-rail',
    surface: 'energy-rail',
    baseIntensity: 0.66,
    roughness: 0.16,
    lightDirection: Object.freeze({ x: 0.72, y: -0.46 }),
  }),
  environment: Object.freeze({
    id: 'environment',
    surface: 'environment',
    baseIntensity: 0.42,
    roughness: 0.5,
    lightDirection: Object.freeze({ x: 0.28, y: -0.8 }),
  }),
});

export function resolveReflectionPreset(
  presetId: ReflectionPresetId,
  quality: QcqVisualQuality = 'balanced',
  lightning?: GlowSignalSnapshot,
): ReflectionProfile {
  const preset = REFLECTION_PRESETS[presetId];
  return calculateReflectionProfile({
    surface: preset.surface,
    quality: QUALITY_MAP[quality],
    baseIntensity: preset.baseIntensity,
    roughness: preset.roughness,
    lightDirection: preset.lightDirection,
    lightning,
  });
}

export function createReflectionPresetCssVariables(
  presetId: ReflectionPresetId,
  quality: QcqVisualQuality = 'balanced',
  lightning?: GlowSignalSnapshot,
): CssVariableMap {
  const profile = resolveReflectionPreset(presetId, quality, lightning);
  const prefix = `--qcq-reflection-${presetId}`;
  return mergeCssVariableMaps(
    createReflectionCssVariables(profile),
    Object.freeze({
      [`${prefix}-background`]: profile.combinedBackground,
      [`${prefix}-filter`]: profile.filter,
      [`${prefix}-blend-mode`]: profile.mixBlendMode,
      [`${prefix}-intensity`]: String(profile.intensity),
    }),
  );
}
