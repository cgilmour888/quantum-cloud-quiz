/**
 * Artifact ID: QCQ-TBL-039
 * Artifact Name: EnergyAnimations
 * Repository Path: QCQ/frontend/src/styles/EnergyAnimations.ts
 */

import {
  createMotionProfiles,
  type MotionIntent,
  type MotionProfile,
} from './MotionProfiles';
import {
  type QcqMotionMode,
  type QcqVisualQuality,
} from './DesignTokens';

export type EnergyAnimationId =
  | 'rail-flow'
  | 'node-pulse'
  | 'tablet-breathe'
  | 'frame-charge'
  | 'lightning-flash'
  | 'portal-rotate'
  | 'xp-rise'
  | 'rank-reveal';

export interface EnergyAnimationDefinition {
  readonly id: EnergyAnimationId;
  readonly keyframesName: string;
  readonly intent: MotionIntent;
  readonly keyframes: string;
  readonly transformOrigin: string;
  readonly willChange: string;
  readonly composite: 'replace' | 'add';
}

export interface ResolvedEnergyAnimation {
  readonly definition: EnergyAnimationDefinition;
  readonly profile: MotionProfile;
  readonly animation: string;
}

export const ENERGY_ANIMATIONS: Readonly<
  Record<EnergyAnimationId, EnergyAnimationDefinition>
> = Object.freeze({
  'rail-flow': Object.freeze({
    id: 'rail-flow',
    keyframesName: 'qcq-energy-rail-flow',
    intent: 'ambient',
    keyframes:
      '0%{background-position:0% 50%;opacity:.48}50%{background-position:100% 50%;opacity:1}100%{background-position:200% 50%;opacity:.48}',
    transformOrigin: 'center',
    willChange: 'background-position, opacity',
    composite: 'replace',
  }),
  'node-pulse': Object.freeze({
    id: 'node-pulse',
    keyframesName: 'qcq-energy-node-pulse',
    intent: 'ambient',
    keyframes:
      '0%,100%{transform:scale(1);filter:brightness(.92)}50%{transform:scale(1.045);filter:brightness(1.26)}',
    transformOrigin: 'center',
    willChange: 'transform, filter',
    composite: 'replace',
  }),
  'tablet-breathe': Object.freeze({
    id: 'tablet-breathe',
    keyframesName: 'qcq-energy-tablet-breathe',
    intent: 'ambient',
    keyframes:
      '0%,100%{filter:brightness(.98) saturate(1)}50%{filter:brightness(1.045) saturate(1.08)}',
    transformOrigin: 'center',
    willChange: 'filter',
    composite: 'replace',
  }),
  'frame-charge': Object.freeze({
    id: 'frame-charge',
    keyframesName: 'qcq-energy-frame-charge',
    intent: 'progress',
    keyframes:
      '0%{clip-path:inset(0 100% 0 0);opacity:.32}100%{clip-path:inset(0 0 0 0);opacity:1}',
    transformOrigin: 'left center',
    willChange: 'clip-path, opacity',
    composite: 'replace',
  }),
  'lightning-flash': Object.freeze({
    id: 'lightning-flash',
    keyframesName: 'qcq-energy-lightning-flash',
    intent: 'lightning',
    keyframes:
      '0%{opacity:0}8%{opacity:1}18%{opacity:.18}30%{opacity:.72}44%,100%{opacity:0}',
    transformOrigin: 'center',
    willChange: 'opacity',
    composite: 'replace',
  }),
  'portal-rotate': Object.freeze({
    id: 'portal-rotate',
    keyframesName: 'qcq-energy-portal-rotate',
    intent: 'ambient',
    keyframes:
      '0%{transform:rotate(0deg) scale(.98)}50%{transform:rotate(180deg) scale(1.02)}100%{transform:rotate(360deg) scale(.98)}',
    transformOrigin: 'center',
    willChange: 'transform',
    composite: 'replace',
  }),
  'xp-rise': Object.freeze({
    id: 'xp-rise',
    keyframesName: 'qcq-energy-xp-rise',
    intent: 'celebration',
    keyframes:
      '0%{transform:translate3d(0,.75rem,0) scale(.96);opacity:0}32%{opacity:1}100%{transform:translate3d(0,-1.5rem,0) scale(1.04);opacity:0}',
    transformOrigin: 'center',
    willChange: 'transform, opacity',
    composite: 'replace',
  }),
  'rank-reveal': Object.freeze({
    id: 'rank-reveal',
    keyframesName: 'qcq-energy-rank-reveal',
    intent: 'celebration',
    keyframes:
      '0%{transform:scale(.82) rotateX(18deg);opacity:0;filter:blur(8px)}55%{transform:scale(1.04) rotateX(0);opacity:1;filter:blur(0)}100%{transform:scale(1);opacity:1}',
    transformOrigin: 'center',
    willChange: 'transform, opacity, filter',
    composite: 'replace',
  }),
});

export function resolveEnergyAnimation(
  animationId: EnergyAnimationId,
  motion: QcqMotionMode = 'full',
  quality: QcqVisualQuality = 'balanced',
): ResolvedEnergyAnimation {
  const definition = ENERGY_ANIMATIONS[animationId];
  const profile = createMotionProfiles(motion, quality)
    .profiles[definition.intent];
  const animation = profile.durationMs === 0
    ? 'none'
    : [
        definition.keyframesName,
        `${profile.durationMs}ms`,
        profile.easing,
        `${profile.delayMs}ms`,
        String(profile.iterations),
        profile.direction,
        profile.fillMode,
      ].join(' ');

  return Object.freeze({
    definition,
    profile,
    animation,
  });
}

export function createEnergyAnimationStyleSheet(): string {
  const keyframes = Object.values(ENERGY_ANIMATIONS)
    .map(
      (definition) =>
        `@keyframes ${definition.keyframesName}{${definition.keyframes}}`,
    )
    .join('\n');

  return `${keyframes}
@media (prefers-reduced-motion: reduce){
  [data-qcq-energy-animation]{animation:none!important;transition-duration:0ms!important}
}
@media (forced-colors: active){
  [data-qcq-energy-animation]{filter:none!important;text-shadow:none!important;box-shadow:none!important}
}`;
}
