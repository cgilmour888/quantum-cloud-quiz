/**
 * Artifact ID: QCQ-THM-008
 * Artifact Name: AccessibilityTheme
 * Repository Path: QCQ/frontend/src/styles/AccessibilityTheme.ts
 */

import {
  createColorCssVariables,
  createColorSystem,
  meetsContrast,
  type QcqColorScheme,
} from './ColorSystem';
import {
  mergeCssVariableMaps,
  type CssVariableMap,
  type QcqMotionMode,
  type QcqResolutionProfile,
} from './DesignTokens';
import {
  createMotionCssVariables,
  createMotionProfiles,
} from './MotionProfiles';
import {
  createTypographyCssVariables,
  createTypographySystem,
} from './TypographySystem';

export interface AccessibilityThemeOptions {
  readonly highContrast?: boolean;
  readonly forcedColors?: boolean;
  readonly reducedMotion?: boolean;
  readonly reducedTransparency?: boolean;
  readonly reducedSensory?: boolean;
  readonly textScale?: number;
  readonly profile?: QcqResolutionProfile;
}

export interface AccessibilityTheme {
  readonly version: '1.0.0';
  readonly scheme: QcqColorScheme;
  readonly motionMode: QcqMotionMode;
  readonly textScale: number;
  readonly minimumTargetSize: string;
  readonly focusRing: string;
  readonly contentContrastPass: boolean;
  readonly secondaryContrastPass: boolean;
  readonly cssVariables: CssVariableMap;
  readonly mediaStyleSheet: string;
}

function clampScale(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 1;
  return Math.min(2, Math.max(1, value));
}

export function createAccessibilityTheme(
  options: AccessibilityThemeOptions = {},
): AccessibilityTheme {
  const scheme: QcqColorScheme = options.forcedColors ||
    options.highContrast
    ? 'high-contrast'
    : 'dark';
  const motionMode: QcqMotionMode = options.reducedMotion ||
    options.reducedSensory
    ? 'reduced'
    : 'full';
  const textScale = clampScale(options.textScale);
  const colors = createColorSystem(scheme);
  const typography = createTypographySystem(options.profile ?? 'hd');
  const motion = createMotionProfiles(motionMode, 'balanced');
  const focusRing = scheme === 'high-contrast'
    ? '0 0 0 3px Canvas, 0 0 0 6px Highlight'
    : `0 0 0 2px ${colors.semantic.canvas}, 0 0 0 5px ${colors.semantic.focus}`;

  const variables = mergeCssVariableMaps(
    createColorCssVariables(colors),
    createTypographyCssVariables(typography),
    createMotionCssVariables(motion),
    Object.freeze({
      '--qcq-a11y-text-scale': String(textScale),
      '--qcq-a11y-minimum-target': 'max(44px, 2.75rem)',
      '--qcq-a11y-focus-ring': focusRing,
      '--qcq-a11y-transparency-factor':
        options.reducedTransparency ? '0' : '1',
      '--qcq-a11y-sensory-factor':
        options.reducedSensory ? '0.35' : '1',
    }),
  );

  const mediaStyleSheet = `
@media (prefers-reduced-motion: reduce){
  :root{--qcq-motion-mode:reduced;--qcq-motion-ambient-limit:0}
  *,*::before,*::after{scroll-behavior:auto!important}
}
@media (prefers-contrast: more){
  :root{--qcq-border-opacity:1;--qcq-surface-opacity:1}
}
@media (forced-colors: active){
  :root{--qcq-cyber-noise-opacity:0;--qcq-cyber-scanline-opacity:0}
  [data-qcq-decorative="true"]{display:none!important}
}`;

  return Object.freeze({
    version: '1.0.0',
    scheme,
    motionMode,
    textScale,
    minimumTargetSize: 'max(44px, 2.75rem)',
    focusRing,
    contentContrastPass: meetsContrast(
      colors.semantic.textPrimary,
      colors.semantic.canvas,
      'AAA',
    ),
    secondaryContrastPass: meetsContrast(
      colors.semantic.textSecondary,
      colors.semantic.canvas,
      'AA',
    ),
    cssVariables: variables,
    mediaStyleSheet,
  });
}

export const QCQ_ACCESSIBILITY_THEME =
  createAccessibilityTheme();
