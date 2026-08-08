/**
 * Artifact ID: QCQ-TBL-038
 * Artifact Name: CyberEffects
 * Repository Path: QCQ/frontend/src/styles/CyberEffects.ts
 */

import type { GlowSignalSnapshot } from '../effects/GlowEngine';
import {
  mergeCssVariableMaps,
  type CssVariableMap,
  type QcqVisualQuality,
} from './DesignTokens';
import {
  createGlowPresetCssVariables,
  type GlowPresetId,
} from './GlowProfiles';
import {
  createReflectionPresetCssVariables,
  type ReflectionPresetId,
} from './ReflectionProfiles';

export type CyberEffectId =
  | 'frame-command'
  | 'node-reactor'
  | 'rail-flow'
  | 'tablet-depth'
  | 'answer-interaction'
  | 'lightning-response'
  | 'xp-celebration'
  | 'certification-completion';

export interface CyberEffectDefinition {
  readonly id: CyberEffectId;
  readonly glowPreset: GlowPresetId;
  readonly reflectionPreset: ReflectionPresetId;
  readonly circuitOpacity: number;
  readonly scanlineOpacity: number;
  readonly noiseOpacity: number;
  readonly chromaticAberrationPx: number;
  readonly saturation: number;
  readonly contrast: number;
  readonly decorative: boolean;
}

export interface ResolvedCyberEffect {
  readonly definition: CyberEffectDefinition;
  readonly cssVariables: CssVariableMap;
  readonly filter: string;
  readonly backgroundOverlay: string;
}

export const CYBER_EFFECTS: Readonly<
  Record<CyberEffectId, CyberEffectDefinition>
> = Object.freeze({
  'frame-command': Object.freeze({
    id: 'frame-command',
    glowPreset: 'frame-resting',
    reflectionPreset: 'frame-platinum',
    circuitOpacity: 0.28,
    scanlineOpacity: 0.035,
    noiseOpacity: 0.025,
    chromaticAberrationPx: 0.35,
    saturation: 1.12,
    contrast: 1.08,
    decorative: true,
  }),
  'node-reactor': Object.freeze({
    id: 'node-reactor',
    glowPreset: 'node-active',
    reflectionPreset: 'energy-rail',
    circuitOpacity: 0.38,
    scanlineOpacity: 0.02,
    noiseOpacity: 0.015,
    chromaticAberrationPx: 0.25,
    saturation: 1.2,
    contrast: 1.12,
    decorative: true,
  }),
  'rail-flow': Object.freeze({
    id: 'rail-flow',
    glowPreset: 'rail-flow',
    reflectionPreset: 'energy-rail',
    circuitOpacity: 0.44,
    scanlineOpacity: 0.018,
    noiseOpacity: 0.012,
    chromaticAberrationPx: 0.2,
    saturation: 1.24,
    contrast: 1.1,
    decorative: true,
  }),
  'tablet-depth': Object.freeze({
    id: 'tablet-depth',
    glowPreset: 'frame-resting',
    reflectionPreset: 'tablet-glass',
    circuitOpacity: 0.1,
    scanlineOpacity: 0.024,
    noiseOpacity: 0.018,
    chromaticAberrationPx: 0.12,
    saturation: 1.04,
    contrast: 1.08,
    decorative: true,
  }),
  'answer-interaction': Object.freeze({
    id: 'answer-interaction',
    glowPreset: 'answer-hover',
    reflectionPreset: 'answer-surface',
    circuitOpacity: 0.08,
    scanlineOpacity: 0,
    noiseOpacity: 0,
    chromaticAberrationPx: 0,
    saturation: 1.06,
    contrast: 1.06,
    decorative: false,
  }),
  'lightning-response': Object.freeze({
    id: 'lightning-response',
    glowPreset: 'lightning-flash',
    reflectionPreset: 'environment',
    circuitOpacity: 0.52,
    scanlineOpacity: 0.05,
    noiseOpacity: 0.025,
    chromaticAberrationPx: 0.48,
    saturation: 1.32,
    contrast: 1.16,
    decorative: true,
  }),
  'xp-celebration': Object.freeze({
    id: 'xp-celebration',
    glowPreset: 'xp-award',
    reflectionPreset: 'metric-console',
    circuitOpacity: 0.22,
    scanlineOpacity: 0.012,
    noiseOpacity: 0.01,
    chromaticAberrationPx: 0.16,
    saturation: 1.18,
    contrast: 1.08,
    decorative: true,
  }),
  'certification-completion': Object.freeze({
    id: 'certification-completion',
    glowPreset: 'certification-complete',
    reflectionPreset: 'frame-platinum',
    circuitOpacity: 0.3,
    scanlineOpacity: 0.018,
    noiseOpacity: 0.012,
    chromaticAberrationPx: 0.22,
    saturation: 1.26,
    contrast: 1.12,
    decorative: true,
  }),
});

function qualityScale(quality: QcqVisualQuality): number {
  return quality === 'cinematic'
    ? 1
    : quality === 'balanced'
      ? 0.78
      : 0.48;
}

export function resolveCyberEffect(
  effectId: CyberEffectId,
  quality: QcqVisualQuality = 'balanced',
  lightning?: GlowSignalSnapshot,
): ResolvedCyberEffect {
  const definition = CYBER_EFFECTS[effectId];
  const scale = qualityScale(quality);
  const filter = [
    `saturate(${definition.saturation})`,
    `contrast(${definition.contrast})`,
    definition.chromaticAberrationPx > 0
      ? `drop-shadow(${definition.chromaticAberrationPx * scale}px 0 0 rgb(53 220 255 / 22%))`
      : '',
  ].filter(Boolean).join(' ');
  const backgroundOverlay = [
    `repeating-linear-gradient(180deg, transparent 0 3px, rgb(118 239 255 / ${definition.scanlineOpacity * scale}) 4px)`,
    `radial-gradient(circle at 50% 50%, rgb(53 220 255 / ${definition.circuitOpacity * scale * 0.12}), transparent 68%)`,
  ].join(', ');

  return Object.freeze({
    definition,
    filter,
    backgroundOverlay,
    cssVariables: mergeCssVariableMaps(
      createGlowPresetCssVariables(
        definition.glowPreset,
        quality,
        scale,
      ),
      createReflectionPresetCssVariables(
        definition.reflectionPreset,
        quality,
        lightning,
      ),
      Object.freeze({
        '--qcq-cyber-filter': filter,
        '--qcq-cyber-background-overlay': backgroundOverlay,
        '--qcq-cyber-circuit-opacity':
          String(definition.circuitOpacity * scale),
        '--qcq-cyber-scanline-opacity':
          String(definition.scanlineOpacity * scale),
        '--qcq-cyber-noise-opacity':
          String(definition.noiseOpacity * scale),
        '--qcq-cyber-chromatic-aberration':
          `${definition.chromaticAberrationPx * scale}px`,
      }),
    ),
  });
}
