/**
 * Artifact ID: QCQ-THM-002
 * Artifact Name: TypographySystem
 * Repository Path: QCQ/frontend/src/styles/TypographySystem.ts
 */

import {
  QCQ_PRIMITIVE_TOKENS,
  createFluidValue,
  type CssVariableMap,
  type QcqResolutionProfile,
} from './DesignTokens';

export type TypographyRole =
  | 'display'
  | 'headline'
  | 'title'
  | 'body'
  | 'body-strong'
  | 'label'
  | 'caption'
  | 'metric'
  | 'code';

export interface TypographyStyle {
  readonly fontFamily: string;
  readonly fontSize: string;
  readonly fontWeight: number;
  readonly lineHeight: number;
  readonly letterSpacing: string;
  readonly textTransform: 'none' | 'uppercase';
  readonly fontVariantNumeric: 'normal' | 'tabular-nums';
}

export interface TypographySystem {
  readonly version: '1.0.0';
  readonly profile: QcqResolutionProfile;
  readonly minimumReadableSizePx: number;
  readonly roles: Readonly<Record<TypographyRole, TypographyStyle>>;
}

interface TypographyScale {
  readonly display: readonly [number, number, number];
  readonly headline: readonly [number, number, number];
  readonly title: readonly [number, number, number];
  readonly body: readonly [number, number, number];
  readonly label: readonly [number, number, number];
  readonly caption: readonly [number, number, number];
  readonly metric: readonly [number, number, number];
}

const PROFILE_SCALES: Readonly<Record<QcqResolutionProfile, TypographyScale>> =
  Object.freeze({
    compact: Object.freeze({
      display: [24, 3.1, 42] as const,
      headline: [20, 2.25, 32] as const,
      title: [17, 1.65, 24] as const,
      body: [15, 1.05, 18] as const,
      label: [13, 0.8, 15] as const,
      caption: [12, 0.7, 14] as const,
      metric: [18, 1.7, 28] as const,
    }),
    hd: Object.freeze({
      display: [28, 2.8, 52] as const,
      headline: [22, 2.1, 38] as const,
      title: [18, 1.5, 28] as const,
      body: [16, 0.95, 20] as const,
      label: [13, 0.72, 16] as const,
      caption: [12, 0.65, 15] as const,
      metric: [20, 1.5, 34] as const,
    }),
    qhd: Object.freeze({
      display: [31, 2.55, 60] as const,
      headline: [24, 1.9, 44] as const,
      title: [19, 1.4, 31] as const,
      body: [16, 0.88, 22] as const,
      label: [14, 0.68, 17] as const,
      caption: [12, 0.58, 16] as const,
      metric: [22, 1.38, 40] as const,
    }),
    '4k': Object.freeze({
      display: [34, 2.25, 68] as const,
      headline: [26, 1.72, 50] as const,
      title: [20, 1.25, 34] as const,
      body: [17, 0.78, 24] as const,
      label: [14, 0.58, 18] as const,
      caption: [13, 0.52, 17] as const,
      metric: [24, 1.2, 46] as const,
    }),
    '8k': Object.freeze({
      display: [38, 1.5, 78] as const,
      headline: [29, 1.2, 58] as const,
      title: [22, 0.9, 40] as const,
      body: [18, 0.56, 27] as const,
      label: [15, 0.42, 20] as const,
      caption: [14, 0.38, 19] as const,
      metric: [28, 0.86, 54] as const,
    }),
  });

function fluid(scale: readonly [number, number, number]): string {
  return createFluidValue(scale[0], scale[1], scale[2]);
}

export function createTypographySystem(
  profile: QcqResolutionProfile = 'hd',
): TypographySystem {
  const tokens = QCQ_PRIMITIVE_TOKENS.typography;
  const scale = PROFILE_SCALES[profile];

  return Object.freeze({
    version: '1.0.0',
    profile,
    minimumReadableSizePx: 12,
    roles: Object.freeze({
      display: Object.freeze({
        fontFamily: tokens.fontDisplay,
        fontSize: fluid(scale.display),
        fontWeight: tokens.weightBold,
        lineHeight: 1,
        letterSpacing: tokens.trackingHud,
        textTransform: 'uppercase',
        fontVariantNumeric: 'normal',
      }),
      headline: Object.freeze({
        fontFamily: tokens.fontDisplay,
        fontSize: fluid(scale.headline),
        fontWeight: tokens.weightBold,
        lineHeight: tokens.lineHeightCompact,
        letterSpacing: tokens.trackingWide,
        textTransform: 'uppercase',
        fontVariantNumeric: 'normal',
      }),
      title: Object.freeze({
        fontFamily: tokens.fontSans,
        fontSize: fluid(scale.title),
        fontWeight: tokens.weightSemibold,
        lineHeight: 1.25,
        letterSpacing: tokens.trackingTight,
        textTransform: 'none',
        fontVariantNumeric: 'normal',
      }),
      body: Object.freeze({
        fontFamily: tokens.fontSans,
        fontSize: fluid(scale.body),
        fontWeight: tokens.weightRegular,
        lineHeight: tokens.lineHeightNormal,
        letterSpacing: tokens.trackingNormal,
        textTransform: 'none',
        fontVariantNumeric: 'normal',
      }),
      'body-strong': Object.freeze({
        fontFamily: tokens.fontSans,
        fontSize: fluid(scale.body),
        fontWeight: tokens.weightSemibold,
        lineHeight: tokens.lineHeightNormal,
        letterSpacing: tokens.trackingNormal,
        textTransform: 'none',
        fontVariantNumeric: 'normal',
      }),
      label: Object.freeze({
        fontFamily: tokens.fontSans,
        fontSize: fluid(scale.label),
        fontWeight: tokens.weightSemibold,
        lineHeight: 1.25,
        letterSpacing: tokens.trackingWide,
        textTransform: 'uppercase',
        fontVariantNumeric: 'normal',
      }),
      caption: Object.freeze({
        fontFamily: tokens.fontSans,
        fontSize: fluid(scale.caption),
        fontWeight: tokens.weightMedium,
        lineHeight: 1.35,
        letterSpacing: tokens.trackingNormal,
        textTransform: 'none',
        fontVariantNumeric: 'normal',
      }),
      metric: Object.freeze({
        fontFamily: tokens.fontMono,
        fontSize: fluid(scale.metric),
        fontWeight: tokens.weightSemibold,
        lineHeight: 1,
        letterSpacing: tokens.trackingWide,
        textTransform: 'none',
        fontVariantNumeric: 'tabular-nums',
      }),
      code: Object.freeze({
        fontFamily: tokens.fontMono,
        fontSize: fluid(scale.caption),
        fontWeight: tokens.weightRegular,
        lineHeight: tokens.lineHeightRelaxed,
        letterSpacing: tokens.trackingNormal,
        textTransform: 'none',
        fontVariantNumeric: 'tabular-nums',
      }),
    }),
  });
}

export const QCQ_TYPOGRAPHY_SYSTEM = createTypographySystem('hd');

export function createTypographyCssVariables(
  system: TypographySystem,
): CssVariableMap {
  const variables: Record<`--qcq-${string}`, string> = {};
  for (const [role, style] of Object.entries(system.roles)) {
    variables[`--qcq-type-${role}-family`] = style.fontFamily;
    variables[`--qcq-type-${role}-size`] = style.fontSize;
    variables[`--qcq-type-${role}-weight`] = String(style.fontWeight);
    variables[`--qcq-type-${role}-line-height`] = String(style.lineHeight);
    variables[`--qcq-type-${role}-tracking`] = style.letterSpacing;
    variables[`--qcq-type-${role}-transform`] = style.textTransform;
    variables[`--qcq-type-${role}-numeric`] = style.fontVariantNumeric;
  }
  return Object.freeze(variables);
}
