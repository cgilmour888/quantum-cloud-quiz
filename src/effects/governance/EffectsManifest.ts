/**
 * Artifact ID: QCQ-TBL-065
 * Artifact Name: EffectsManifest
 * Artifact Purpose: Effects subsystem governance manifest defining permanent authorities, ownership boundaries, lifecycle rules, and built-in effect descriptors.
 * Artifact Layer: Premium Effects / GOV
 * Artifact Dependencies: QCQ-TBL-030, QCQ-TBL-031, QCQ-TBL-032, QCQ-TBL-033, QCQ-TBL-041
 * Artifact Dependents: QCQ-TBL-066, QCQ-TBL-067, QCQ-TBL-068, QCQ-TBL-075, QCQ-TBL-078
 * Dependency Graph: existing effects -> EffectsManifest -> governance/performance/validation/master authorities
 * Repository Path: QCQ/frontend/src/effects/governance
 * Source File: EffectsManifest.ts
 */

export const EFFECTS_SCHEMA_VERSION = '1.0.0' as const;
export const EFFECTS_MANIFEST_VERSION = '1.0.0' as const;

export type EffectKey = 'storm' | 'lightning' | 'particles' | 'glow' | 'reflection';
export type EffectsQuality = 'off' | 'performance' | 'balanced' | 'cinematic';
export type EffectsMotion = 'static' | 'reduced' | 'full';
export type EffectRenderer = 'canvas2d' | 'svg' | 'css' | 'dom-neutral' | 'hybrid';
export type EffectOwnership = 'atmosphere' | 'electrical' | 'ambient-motion' | 'illumination' | 'reflection';

export interface EffectRegistrationDescriptor {
  readonly key: EffectKey;
  readonly artifactId: string;
  readonly artifactName: string;
  readonly repositoryPath: string;
  readonly ownership: EffectOwnership;
  readonly renderer: EffectRenderer;
  readonly required: boolean;
  readonly decorative: true;
  readonly pointerTransparent: true;
  readonly assistiveTechnologyHidden: true;
  readonly supportsReducedMotion: true;
  readonly supportsForcedColorsRemoval: true;
  readonly publishesSignals: readonly string[];
  readonly consumesSignals: readonly string[];
  readonly dependencies: readonly EffectKey[];
}

export interface EffectsManifestContract {
  readonly schemaVersion: typeof EFFECTS_SCHEMA_VERSION;
  readonly manifestVersion: typeof EFFECTS_MANIFEST_VERSION;
  readonly visualSpecification: 'MASTER_4K / MASTER_8K / MASTER_12K';
  readonly runtimeMasterArtworkUsage: false;
  readonly imageOverlayUsage: false;
  readonly hotspotOverlayUsage: false;
  readonly webNativeOnly: true;
  readonly ownershipBoundary: {
    readonly owns: readonly string[];
    readonly neverOwns: readonly string[];
  };
  readonly invariants: readonly string[];
  readonly effects: readonly EffectRegistrationDescriptor[];
}

const descriptor = (
  value: EffectRegistrationDescriptor,
): EffectRegistrationDescriptor => Object.freeze({
  ...value,
  publishesSignals: Object.freeze([...value.publishesSignals]),
  consumesSignals: Object.freeze([...value.consumesSignals]),
  dependencies: Object.freeze([...value.dependencies]),
});

export const BUILTIN_EFFECT_DESCRIPTORS: readonly EffectRegistrationDescriptor[] =
  Object.freeze([
    descriptor({
      key: 'storm',
      artifactId: 'QCQ-TBL-030',
      artifactName: 'StormLayer',
      repositoryPath: 'QCQ/frontend/src/effects/StormLayer.tsx',
      ownership: 'atmosphere',
      renderer: 'hybrid',
      required: true,
      decorative: true,
      pointerTransparent: true,
      assistiveTechnologyHidden: true,
      supportsReducedMotion: true,
      supportsForcedColorsRemoval: true,
      publishesSignals: ['storm:energy', 'storm:visibility'],
      consumesSignals: ['glow:flash'],
      dependencies: ['lightning', 'particles', 'glow', 'reflection'],
    }),
    descriptor({
      key: 'lightning',
      artifactId: 'QCQ-TBL-031',
      artifactName: 'LightningLayer',
      repositoryPath: 'QCQ/frontend/src/effects/LightningLayer.tsx',
      ownership: 'electrical',
      renderer: 'svg',
      required: false,
      decorative: true,
      pointerTransparent: true,
      assistiveTechnologyHidden: true,
      supportsReducedMotion: true,
      supportsForcedColorsRemoval: true,
      publishesSignals: ['lightning:strike', 'glow:flash'],
      consumesSignals: [],
      dependencies: ['glow'],
    }),
    descriptor({
      key: 'particles',
      artifactId: 'QCQ-TBL-032',
      artifactName: 'ParticleLayer',
      repositoryPath: 'QCQ/frontend/src/effects/ParticleLayer.tsx',
      ownership: 'ambient-motion',
      renderer: 'canvas2d',
      required: false,
      decorative: true,
      pointerTransparent: true,
      assistiveTechnologyHidden: true,
      supportsReducedMotion: true,
      supportsForcedColorsRemoval: true,
      publishesSignals: [],
      consumesSignals: ['glow:flash'],
      dependencies: ['glow'],
    }),
    descriptor({
      key: 'glow',
      artifactId: 'QCQ-TBL-033',
      artifactName: 'GlowEngine',
      repositoryPath: 'QCQ/frontend/src/effects/GlowEngine.ts',
      ownership: 'illumination',
      renderer: 'dom-neutral',
      required: true,
      decorative: true,
      pointerTransparent: true,
      assistiveTechnologyHidden: true,
      supportsReducedMotion: true,
      supportsForcedColorsRemoval: true,
      publishesSignals: ['glow:flash'],
      consumesSignals: [],
      dependencies: [],
    }),
    descriptor({
      key: 'reflection',
      artifactId: 'QCQ-TBL-041',
      artifactName: 'ReflectionEngine',
      repositoryPath: 'QCQ/frontend/src/effects/ReflectionEngine.ts',
      ownership: 'reflection',
      renderer: 'dom-neutral',
      required: true,
      decorative: true,
      pointerTransparent: true,
      assistiveTechnologyHidden: true,
      supportsReducedMotion: true,
      supportsForcedColorsRemoval: true,
      publishesSignals: ['reflection:profile'],
      consumesSignals: ['glow:flash'],
      dependencies: ['glow'],
    }),
  ]);

export const EFFECTS_MANIFEST: EffectsManifestContract = Object.freeze({
  schemaVersion: EFFECTS_SCHEMA_VERSION,
  manifestVersion: EFFECTS_MANIFEST_VERSION,
  visualSpecification: 'MASTER_4K / MASTER_8K / MASTER_12K',
  runtimeMasterArtworkUsage: false,
  imageOverlayUsage: false,
  hotspotOverlayUsage: false,
  webNativeOnly: true,
  ownershipBoundary: Object.freeze({
    owns: Object.freeze([
      'visual atmosphere',
      'visual energy',
      'ambient effects',
      'premium rendering coordination',
      'reactive decorative visual feedback',
    ]),
    neverOwns: Object.freeze([
      'layout',
      'question semantics',
      'answer grading',
      'dataset parsing',
      'persistence',
      'analytics',
      'gamification',
      'AI',
      'leaderboards',
      'routing',
      'accessibility semantics',
    ]),
  }),
  invariants: Object.freeze([
    'Effects never determine score, correctness, navigation, or persistence.',
    'Effects remain pointer-transparent and removable.',
    'No essential state is communicated only through color, motion, glow, lightning, particles, reflection, or sound.',
    'MASTER artwork is specification only and is never used as a runtime UI surface.',
    'Image overlays and hotspot overlays are prohibited.',
    'Reduced-motion and forced-colors behavior must remain safe and complete.',
    'Hidden or offscreen effect work must be paused or reduced.',
    'Quality adaptation may reduce decoration but may never alter gameplay behavior.',
  ]),
  effects: BUILTIN_EFFECT_DESCRIPTORS,
});

export function getBuiltinEffectDescriptor(
  key: EffectKey,
): EffectRegistrationDescriptor {
  const found = BUILTIN_EFFECT_DESCRIPTORS.find((entry) => entry.key === key);
  if (!found) throw new Error(`Unknown built-in effect "${key}".`);
  return found;
}
