/**
 * Artifact ID: QCQ-THM-004
 * Artifact Name: ElevationSystem
 * Repository Path: QCQ/frontend/src/styles/ElevationSystem.ts
 */

import {
  QCQ_PRIMITIVE_TOKENS,
  type CssVariableMap,
  type QcqVisualQuality,
} from './DesignTokens';

export type ElevationLevel =
  | 'flat'
  | 'raised'
  | 'panel'
  | 'floating'
  | 'overlay'
  | 'dialog';

export interface ElevationProfile {
  readonly level: ElevationLevel;
  readonly zIndex: number;
  readonly boxShadow: string;
  readonly backdropFilter: string;
  readonly surfaceOpacity: number;
  readonly borderOpacity: number;
  readonly transform: string;
}

export interface ElevationSystem {
  readonly version: '1.0.0';
  readonly quality: QcqVisualQuality;
  readonly profiles: Readonly<Record<ElevationLevel, ElevationProfile>>;
  readonly overlayRules: {
    readonly maximumModalDepth: number;
    readonly backgroundInert: true;
    readonly focusContainmentRequired: true;
    readonly nestedDialogProhibited: true;
  };
}

const LEVELS: readonly ElevationLevel[] = Object.freeze([
  'flat',
  'raised',
  'panel',
  'floating',
  'overlay',
  'dialog',
]);

const QUALITY_FACTOR: Readonly<Record<QcqVisualQuality, number>> =
  Object.freeze({
    performance: 0.62,
    balanced: 0.84,
    cinematic: 1,
  });

const LEVEL_FACTOR: Readonly<Record<ElevationLevel, number>> =
  Object.freeze({
    flat: 0,
    raised: 0.24,
    panel: 0.42,
    floating: 0.68,
    overlay: 0.86,
    dialog: 1,
  });

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function profileFor(
  level: ElevationLevel,
  quality: QcqVisualQuality,
): ElevationProfile {
  const factor = LEVEL_FACTOR[level] * QUALITY_FACTOR[quality];
  const blur = Math.round(12 + factor * 42);
  const spread = Math.round(factor * 5);
  const vertical = Math.round(2 + factor * 18);
  const ambientOpacity = round(0.18 + factor * 0.34);
  const keyOpacity = round(0.12 + factor * 0.26);
  const z = QCQ_PRIMITIVE_TOKENS.depth;

  const zIndex: Readonly<Record<ElevationLevel, number>> = Object.freeze({
    flat: z.zContent,
    raised: z.zContent + 1,
    panel: z.zContent + 2,
    floating: z.zFloating,
    overlay: z.zOverlay,
    dialog: z.zDialog,
  });

  return Object.freeze({
    level,
    zIndex: zIndex[level],
    boxShadow: factor === 0
      ? 'none'
      : [
          `0 ${vertical}px ${blur}px ${spread}px rgb(0 2 12 / ${ambientOpacity})`,
          `0 ${Math.max(1, Math.round(vertical * 0.35))}px ${Math.max(4, Math.round(blur * 0.3))}px rgb(189 239 255 / ${keyOpacity})`,
        ].join(', '),
    backdropFilter: level === 'overlay' || level === 'dialog'
      ? `blur(${Math.round(8 + factor * 18)}px) saturate(${round(1 + factor * 0.3)})`
      : 'none',
    surfaceOpacity: round(0.82 + factor * 0.14),
    borderOpacity: round(0.3 + factor * 0.46),
    transform: factor === 0
      ? 'translateZ(0)'
      : `translate3d(0, ${round(-factor * 2)}px, 0)`,
  });
}

export function createElevationSystem(
  quality: QcqVisualQuality = 'balanced',
): ElevationSystem {
  const profiles = {} as Record<ElevationLevel, ElevationProfile>;
  for (const level of LEVELS) {
    profiles[level] = profileFor(level, quality);
  }
  return Object.freeze({
    version: '1.0.0',
    quality,
    profiles: Object.freeze(profiles),
    overlayRules: Object.freeze({
      maximumModalDepth: 1,
      backgroundInert: true,
      focusContainmentRequired: true,
      nestedDialogProhibited: true,
    }),
  });
}

export const QCQ_ELEVATION_SYSTEM =
  createElevationSystem('balanced');

export function createElevationCssVariables(
  system: ElevationSystem,
): CssVariableMap {
  const variables: Record<`--qcq-${string}`, string> = {};
  for (const [level, profile] of Object.entries(system.profiles)) {
    variables[`--qcq-elevation-${level}-z`] = String(profile.zIndex);
    variables[`--qcq-elevation-${level}-shadow`] = profile.boxShadow;
    variables[`--qcq-elevation-${level}-backdrop`] =
      profile.backdropFilter;
    variables[`--qcq-elevation-${level}-surface-opacity`] =
      String(profile.surfaceOpacity);
    variables[`--qcq-elevation-${level}-border-opacity`] =
      String(profile.borderOpacity);
    variables[`--qcq-elevation-${level}-transform`] =
      profile.transform;
  }
  return Object.freeze(variables);
}
