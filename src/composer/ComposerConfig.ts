/**
 * Artifact ID: QCQ-CMP-003
 * Artifact Name: ComposerConfig
 * Repository Path: QCQ/frontend/src/composer/ComposerConfig.ts
 */

import {
  COMPOSER_DEFAULT_TEXT,
  COMPOSER_LIMITS,
  COMPOSER_ZONE_ORDER,
} from './ComposerConstants';
import type {
  ComposerConfig,
  ComposerConfigInput,
} from './ComposerTypes';

export const DEFAULT_COMPOSER_CONFIG: ComposerConfig =
  Object.freeze({
    version: '1.0.0',
    applicationTitle: COMPOSER_DEFAULT_TEXT.applicationTitle,
    applicationSubtitle: COMPOSER_DEFAULT_TEXT.applicationSubtitle,
    activeZones: COMPOSER_ZONE_ORDER,
    visual: Object.freeze({
      quality: 'balanced',
      resolution: 'hd',
      density: 'comfortable',
      motion: 'full',
      frameIntensity: 0.94,
      stormIntensity: 0.68,
      particlesEnabled: true,
      lightningEnabled: true,
      reflectionsEnabled: true,
      glowIntensity: 0.85,
    }),
    accessibility: Object.freeze({
      highContrast: false,
      reducedMotion: false,
      reducedTransparency: false,
      reducedSensory: false,
      screenReaderOptimized: false,
      textScale: 1,
      minimumTargetSizePx: COMPOSER_LIMITS.minimumTargetSizePx,
      announceStatusChanges: true,
    }),
    persistence: Object.freeze({
      enabled: true,
      autoRestore: true,
      autoSave: true,
      autoSaveDelayMs: 1_200,
      createProfileWhenMissing: true,
      includeBackups: true,
    }),
    validation: Object.freeze({
      strict: true,
      requireRegisteredBuiltins: true,
      rejectWarnings: false,
      validateOnEveryRegistryChange: false,
    }),
    debug: false,
  });

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

function uniqueZones(
  zones: readonly ComposerConfig['activeZones'][number][],
): ComposerConfig['activeZones'] {
  return Object.freeze([...new Set(zones)]);
}

export function resolveComposerConfig(
  input: ComposerConfigInput = {},
): ComposerConfig {
  const visual = {
    ...DEFAULT_COMPOSER_CONFIG.visual,
    ...input.visual,
  };
  const accessibility = {
    ...DEFAULT_COMPOSER_CONFIG.accessibility,
    ...input.accessibility,
  };
  const persistence = {
    ...DEFAULT_COMPOSER_CONFIG.persistence,
    ...input.persistence,
  };
  const validation = {
    ...DEFAULT_COMPOSER_CONFIG.validation,
    ...input.validation,
  };

  return Object.freeze({
    version: '1.0.0',
    applicationTitle:
      input.applicationTitle?.trim() ||
      DEFAULT_COMPOSER_CONFIG.applicationTitle,
    applicationSubtitle:
      input.applicationSubtitle?.trim() ||
      DEFAULT_COMPOSER_CONFIG.applicationSubtitle,
    activeZones: uniqueZones(
      input.activeZones ?? DEFAULT_COMPOSER_CONFIG.activeZones,
    ),
    visual: Object.freeze({
      ...visual,
      frameIntensity: clamp(visual.frameIntensity, 0, 1),
      stormIntensity: clamp(visual.stormIntensity, 0, 1),
      glowIntensity: clamp(visual.glowIntensity, 0, 1),
    }),
    accessibility: Object.freeze({
      ...accessibility,
      textScale: clamp(
        accessibility.textScale,
        COMPOSER_LIMITS.minimumTextScale,
        COMPOSER_LIMITS.maximumTextScale,
      ),
      minimumTargetSizePx: Math.max(
        COMPOSER_LIMITS.minimumTargetSizePx,
        Math.round(accessibility.minimumTargetSizePx),
      ),
    }),
    persistence: Object.freeze({
      ...persistence,
      autoSaveDelayMs: Math.round(
        clamp(
          persistence.autoSaveDelayMs,
          COMPOSER_LIMITS.minimumAutoSaveDelayMs,
          COMPOSER_LIMITS.maximumAutoSaveDelayMs,
        ),
      ),
    }),
    validation: Object.freeze(validation),
    debug: input.debug ?? DEFAULT_COMPOSER_CONFIG.debug,
  });
}

export function composerConfigEquals(
  left: ComposerConfig,
  right: ComposerConfig,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
