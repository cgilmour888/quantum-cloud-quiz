/**
 * Artifact ID: QCQ-TBL-067
 * Artifact Name: EffectsPolicies
 * Artifact Purpose: Runtime policy authority for motion, visibility, accessibility, quality, intensity, and ownership boundaries.
 * Artifact Layer: Premium Effects / POL
 * Artifact Dependencies: QCQ-TBL-065, QCQ-TBL-068
 * Artifact Dependents: QCQ-TBL-069, QCQ-TBL-075, QCQ-TBL-076
 * Dependency Graph: manifest + capabilities -> EffectsPolicies -> coordinator/validation/compliance
 * Repository Path: QCQ/frontend/src/effects/governance
 * Source File: EffectsPolicies.ts
 */

import type {
  EffectKey,
  EffectsMotion,
  EffectsQuality,
} from './EffectsManifest';
import type { EffectsCapabilitySnapshot } from './EffectsCapabilities';

export interface EffectsPolicy {
  readonly quality: EffectsQuality;
  readonly motion: EffectsMotion;
  readonly globalIntensity: number;
  readonly lightningEnabled: boolean;
  readonly particlesEnabled: boolean;
  readonly reflectionsEnabled: boolean;
  readonly hiddenTabPolicy: 'pause';
  readonly offscreenPolicy: 'pause-or-throttle';
  readonly forcedColorsPolicy: 'remove-decorative-effects';
  readonly reducedMotionPolicy: 'static-or-reduced';
  readonly pointerEvents: 'none';
  readonly assistiveTechnologyExposure: 'hidden';
  readonly maxFlashFrequencyHz: number;
  readonly maxContinuousFlashSeconds: number;
  readonly semanticOwnershipProhibited: true;
  readonly runtimeRasterSurfaceProhibited: true;
  readonly effectOverrides: Readonly<Partial<Record<EffectKey, boolean>>>;
}

export interface EffectsPolicyPreferences {
  readonly requestedQuality?: EffectsQuality;
  readonly requestedMotion?: EffectsMotion;
  readonly intensity?: number;
  readonly lightning?: boolean;
  readonly particles?: boolean;
  readonly reflections?: boolean;
  readonly effectOverrides?: Partial<Record<EffectKey, boolean>>;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function qualityRank(value: EffectsQuality): number {
  return ({ off: 0, performance: 1, balanced: 2, cinematic: 3 } as const)[value];
}

function lowerQuality(
  requested: EffectsQuality,
  ceiling: EffectsQuality,
): EffectsQuality {
  return qualityRank(requested) <= qualityRank(ceiling) ? requested : ceiling;
}

export function resolveEffectsPolicy(
  capabilities: EffectsCapabilitySnapshot,
  preferences: EffectsPolicyPreferences = {},
): EffectsPolicy {
  let ceiling: EffectsQuality = 'cinematic';
  if (!capabilities.browser || !capabilities.canvas2D || !capabilities.svg) ceiling = 'off';
  else if (
    capabilities.saveData ||
    capabilities.hardwareConcurrency <= 2 ||
    (capabilities.deviceMemoryGB !== null && capabilities.deviceMemoryGB <= 2)
  ) ceiling = 'performance';
  else if (
    capabilities.hardwareConcurrency <= 4 ||
    (capabilities.deviceMemoryGB !== null && capabilities.deviceMemoryGB <= 4)
  ) ceiling = 'balanced';

  let requested = preferences.requestedQuality ?? 'balanced';
  if (capabilities.forcedColors) requested = 'off';
  const quality = lowerQuality(requested, ceiling);

  const motion: EffectsMotion = capabilities.prefersReducedMotion
    ? 'reduced'
    : preferences.requestedMotion ?? 'full';

  const active = quality !== 'off';
  return Object.freeze({
    quality,
    motion,
    globalIntensity: active ? clamp01(preferences.intensity ?? 0.78) : 0,
    lightningEnabled: active && !capabilities.forcedColors && (preferences.lightning ?? true),
    particlesEnabled: active && !capabilities.forcedColors && (preferences.particles ?? true),
    reflectionsEnabled: active && !capabilities.forcedColors && (preferences.reflections ?? true),
    hiddenTabPolicy: 'pause',
    offscreenPolicy: 'pause-or-throttle',
    forcedColorsPolicy: 'remove-decorative-effects',
    reducedMotionPolicy: 'static-or-reduced',
    pointerEvents: 'none',
    assistiveTechnologyExposure: 'hidden',
    maxFlashFrequencyHz: 2.5,
    maxContinuousFlashSeconds: 0.45,
    semanticOwnershipProhibited: true,
    runtimeRasterSurfaceProhibited: true,
    effectOverrides: Object.freeze({ ...(preferences.effectOverrides ?? {}) }),
  });
}
