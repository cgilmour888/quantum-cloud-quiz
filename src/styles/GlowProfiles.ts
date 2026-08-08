/**
 * Artifact ID: QCQ-THM-005
 * Artifact Name: GlowProfiles
 * Repository Path: QCQ/frontend/src/styles/GlowProfiles.ts
 *
 * Declarative presets consumed by QCQ-TBL-033 GlowEngine. This file does not
 * duplicate glow computation; it centralizes approved role-level inputs.
 */

import {
  createGlowCssVariables,
  resolveGlowProfile,
  type GlowProfile,
  type GlowProfileOptions,
  type GlowRole,
} from '../effects/GlowEngine';
import {
  mergeCssVariableMaps,
  type CssVariableMap,
  type QcqVisualQuality,
} from './DesignTokens';

export type GlowPresetId =
  | 'frame-resting'
  | 'frame-energized'
  | 'node-idle'
  | 'node-active'
  | 'rail-flow'
  | 'answer-hover'
  | 'answer-selected'
  | 'button-primary'
  | 'lightning-flash'
  | 'xp-award'
  | 'rank-up'
  | 'certification-complete';

export interface GlowPreset {
  readonly id: GlowPresetId;
  readonly role: GlowRole;
  readonly options: GlowProfileOptions;
  readonly maximumIntensity: number;
  readonly decorative: boolean;
}

const QUALITY_MAP: Readonly<
  Record<QcqVisualQuality, NonNullable<GlowProfileOptions['quality']>>
> = Object.freeze({
  performance: 'performance',
  balanced: 'balanced',
  cinematic: 'cinematic',
});

export const GLOW_PRESETS: Readonly<Record<GlowPresetId, GlowPreset>> =
  Object.freeze({
    'frame-resting': Object.freeze({
      id: 'frame-resting',
      role: 'frame',
      options: Object.freeze({ intensity: 0.46 }),
      maximumIntensity: 0.68,
      decorative: true,
    }),
    'frame-energized': Object.freeze({
      id: 'frame-energized',
      role: 'frame',
      options: Object.freeze({ intensity: 0.82 }),
      maximumIntensity: 0.92,
      decorative: true,
    }),
    'node-idle': Object.freeze({
      id: 'node-idle',
      role: 'node',
      options: Object.freeze({ intensity: 0.42 }),
      maximumIntensity: 0.62,
      decorative: true,
    }),
    'node-active': Object.freeze({
      id: 'node-active',
      role: 'node',
      options: Object.freeze({ intensity: 0.9 }),
      maximumIntensity: 1,
      decorative: true,
    }),
    'rail-flow': Object.freeze({
      id: 'rail-flow',
      role: 'rail',
      options: Object.freeze({ intensity: 0.72 }),
      maximumIntensity: 0.86,
      decorative: true,
    }),
    'answer-hover': Object.freeze({
      id: 'answer-hover',
      role: 'answer-hover',
      options: Object.freeze({ intensity: 0.58 }),
      maximumIntensity: 0.74,
      decorative: false,
    }),
    'answer-selected': Object.freeze({
      id: 'answer-selected',
      role: 'answer-hover',
      options: Object.freeze({
        intensity: 0.82,
        palette: Object.freeze({
          primary: '#76efff',
          secondary: '#548dff',
          core: '#ffffff',
        }),
      }),
      maximumIntensity: 0.9,
      decorative: false,
    }),
    'button-primary': Object.freeze({
      id: 'button-primary',
      role: 'button',
      options: Object.freeze({ intensity: 0.68 }),
      maximumIntensity: 0.82,
      decorative: false,
    }),
    'lightning-flash': Object.freeze({
      id: 'lightning-flash',
      role: 'lightning-flash',
      options: Object.freeze({ intensity: 1 }),
      maximumIntensity: 1,
      decorative: true,
    }),
    'xp-award': Object.freeze({
      id: 'xp-award',
      role: 'xp',
      options: Object.freeze({ intensity: 0.84 }),
      maximumIntensity: 0.94,
      decorative: true,
    }),
    'rank-up': Object.freeze({
      id: 'rank-up',
      role: 'rank',
      options: Object.freeze({ intensity: 0.9 }),
      maximumIntensity: 1,
      decorative: true,
    }),
    'certification-complete': Object.freeze({
      id: 'certification-complete',
      role: 'certification',
      options: Object.freeze({ intensity: 0.94 }),
      maximumIntensity: 1,
      decorative: true,
    }),
  });

export function resolveGlowPreset(
  presetId: GlowPresetId,
  quality: QcqVisualQuality = 'balanced',
  intensityScale = 1,
): GlowProfile {
  const preset = GLOW_PRESETS[presetId];
  const requestedIntensity = Math.min(
    preset.maximumIntensity,
    Math.max(0, (preset.options.intensity ?? 1) * intensityScale),
  );
  return resolveGlowProfile(preset.role, {
    ...preset.options,
    intensity: requestedIntensity,
    quality: QUALITY_MAP[quality],
  });
}

export function createGlowPresetCssVariables(
  presetId: GlowPresetId,
  quality: QcqVisualQuality = 'balanced',
  intensityScale = 1,
): CssVariableMap {
  const profile = resolveGlowPreset(presetId, quality, intensityScale);
  const prefix = `--qcq-glow-${presetId}`;
  return mergeCssVariableMaps(
    createGlowCssVariables(profile),
    Object.freeze({
      [`${prefix}-box-shadow`]: profile.boxShadow,
      [`${prefix}-text-shadow`]: profile.textShadow,
      [`${prefix}-filter`]: profile.filter,
      [`${prefix}-intensity`]: String(profile.intensity),
    }),
  );
}
