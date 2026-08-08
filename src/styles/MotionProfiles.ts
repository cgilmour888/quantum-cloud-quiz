/**
 * Artifact ID: QCQ-THM-007
 * Artifact Name: MotionProfiles
 * Repository Path: QCQ/frontend/src/styles/MotionProfiles.ts
 */

import {
  QCQ_PRIMITIVE_TOKENS,
  type CssVariableMap,
  type QcqMotionMode,
  type QcqVisualQuality,
} from './DesignTokens';

export type MotionIntent =
  | 'acknowledge'
  | 'enter'
  | 'exit'
  | 'focus'
  | 'selection'
  | 'progress'
  | 'ambient'
  | 'celebration'
  | 'lightning';

export interface MotionProfile {
  readonly intent: MotionIntent;
  readonly durationMs: number;
  readonly delayMs: number;
  readonly easing: string;
  readonly iterations: number | 'infinite';
  readonly direction: 'normal' | 'alternate';
  readonly fillMode: 'none' | 'forwards' | 'both';
  readonly essential: boolean;
}

export interface MotionProfileSet {
  readonly version: '1.0.0';
  readonly mode: QcqMotionMode;
  readonly quality: QcqVisualQuality;
  readonly profiles: Readonly<Record<MotionIntent, MotionProfile>>;
  readonly maximumConcurrentAmbientAnimations: number;
}

const INTENT_TUNING: Readonly<
  Record<MotionIntent, Omit<MotionProfile, 'intent' | 'durationMs'> & {
    readonly baseDurationMs: number;
  }>
> = Object.freeze({
  acknowledge: Object.freeze({
    baseDurationMs: 110,
    delayMs: 0,
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
    iterations: 1,
    direction: 'normal',
    fillMode: 'both',
    essential: true,
  }),
  enter: Object.freeze({
    baseDurationMs: 280,
    delayMs: 0,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    iterations: 1,
    direction: 'normal',
    fillMode: 'both',
    essential: false,
  }),
  exit: Object.freeze({
    baseDurationMs: 180,
    delayMs: 0,
    easing: 'cubic-bezier(0.7, 0, 0.84, 0)',
    iterations: 1,
    direction: 'normal',
    fillMode: 'both',
    essential: false,
  }),
  focus: Object.freeze({
    baseDurationMs: 140,
    delayMs: 0,
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
    iterations: 1,
    direction: 'normal',
    fillMode: 'both',
    essential: true,
  }),
  selection: Object.freeze({
    baseDurationMs: 190,
    delayMs: 0,
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    iterations: 1,
    direction: 'normal',
    fillMode: 'both',
    essential: true,
  }),
  progress: Object.freeze({
    baseDurationMs: 360,
    delayMs: 0,
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
    iterations: 1,
    direction: 'normal',
    fillMode: 'both',
    essential: false,
  }),
  ambient: Object.freeze({
    baseDurationMs: 3200,
    delayMs: 0,
    easing: 'linear',
    iterations: 'infinite',
    direction: 'alternate',
    fillMode: 'both',
    essential: false,
  }),
  celebration: Object.freeze({
    baseDurationMs: 780,
    delayMs: 0,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    iterations: 1,
    direction: 'normal',
    fillMode: 'both',
    essential: false,
  }),
  lightning: Object.freeze({
    baseDurationMs: 220,
    delayMs: 0,
    easing: 'linear',
    iterations: 1,
    direction: 'normal',
    fillMode: 'both',
    essential: false,
  }),
});

const QUALITY_MULTIPLIER: Readonly<Record<QcqVisualQuality, number>> =
  Object.freeze({
    performance: 0.82,
    balanced: 1,
    cinematic: 1.12,
  });

function durationFor(
  tuning: (typeof INTENT_TUNING)[MotionIntent],
  mode: QcqMotionMode,
  quality: QcqVisualQuality,
): number {
  if (mode === 'static') return 0;
  if (mode === 'reduced') {
    return tuning.essential
      ? Math.min(120, tuning.baseDurationMs)
      : 0;
  }
  return Math.round(tuning.baseDurationMs * QUALITY_MULTIPLIER[quality]);
}

export function createMotionProfiles(
  mode: QcqMotionMode = 'full',
  quality: QcqVisualQuality = 'balanced',
): MotionProfileSet {
  const profiles = {} as Record<MotionIntent, MotionProfile>;
  for (const [intent, tuning] of Object.entries(INTENT_TUNING) as Array<
    [MotionIntent, (typeof INTENT_TUNING)[MotionIntent]]
  >) {
    profiles[intent] = Object.freeze({
      intent,
      durationMs: durationFor(tuning, mode, quality),
      delayMs: mode === 'full' ? tuning.delayMs : 0,
      easing: tuning.easing,
      iterations:
        mode === 'full'
          ? tuning.iterations
          : 1,
      direction: tuning.direction,
      fillMode: tuning.fillMode,
      essential: tuning.essential,
    });
  }

  return Object.freeze({
    version: '1.0.0',
    mode,
    quality,
    profiles: Object.freeze(profiles),
    maximumConcurrentAmbientAnimations:
      mode !== 'full'
        ? 0
        : quality === 'cinematic'
          ? 8
          : quality === 'balanced'
            ? 5
            : 2,
  });
}

export const QCQ_MOTION_PROFILES =
  createMotionProfiles('full', 'balanced');

export function createMotionCssVariables(
  set: MotionProfileSet,
): CssVariableMap {
  const variables: Record<`--qcq-${string}`, string> = {
    '--qcq-motion-mode': set.mode,
    '--qcq-motion-quality': set.quality,
    '--qcq-motion-ambient-limit':
      String(set.maximumConcurrentAmbientAnimations),
    '--qcq-motion-ease-standard':
      QCQ_PRIMITIVE_TOKENS.motion.easeStandard,
  };
  for (const [intent, profile] of Object.entries(set.profiles)) {
    variables[`--qcq-motion-${intent}-duration`] =
      `${profile.durationMs}ms`;
    variables[`--qcq-motion-${intent}-delay`] =
      `${profile.delayMs}ms`;
    variables[`--qcq-motion-${intent}-easing`] = profile.easing;
    variables[`--qcq-motion-${intent}-iterations`] =
      String(profile.iterations);
  }
  return Object.freeze(variables);
}
