/**
 * Artifact ID: QCQ-TBL-078
 * Artifact Name: MasterEffectsManifest
 * Artifact Purpose: MASTER-derived visual-phenomena manifest describing the storm, lightning, particles, glow, reflections, depth, energy, and metallic response that web-native effects must reproduce.
 * Artifact Layer: Premium Effects / GOV
 * Artifact Dependencies: QCQ-TBL-065
 * Artifact Dependents: QCQ-TBL-079, QCQ-TBL-080
 * Dependency Graph: EffectsManifest + MASTER visual observations -> MasterEffectsManifest -> registry/contract
 * Repository Path: QCQ/frontend/src/effects/master
 * Source File: MasterEffectsManifest.ts
 */

import type { EffectKey } from '../governance/EffectsManifest';

export const MASTER_EFFECTS_SCHEMA_VERSION = '1.0.0' as const;

export type MasterVisualRegion =
  | 'outer-frame'
  | 'storm-sky'
  | 'central-tablet'
  | 'performance-console'
  | 'metrics-console'
  | 'lower-platform'
  | 'player-banner';

export interface MasterEffectPhenomenon {
  readonly id: string;
  readonly name: string;
  readonly owner: EffectKey | 'frame-system' | 'environment-composition';
  readonly regions: readonly MasterVisualRegion[];
  readonly fidelityWeight: number;
  readonly requiredAtBalanced: boolean;
  readonly requiredAtCinematic: boolean;
  readonly description: string;
}

export interface MasterEffectsManifest {
  readonly schemaVersion: typeof MASTER_EFFECTS_SCHEMA_VERSION;
  readonly visualSpecification: readonly ['MASTER_4K', 'MASTER_8K', 'MASTER_12K'];
  readonly referenceAspectRatio: '16:9';
  readonly runtimeImageDependency: false;
  readonly rasterOverlayDependency: false;
  readonly phenomena: readonly MasterEffectPhenomenon[];
  readonly invariants: readonly string[];
}

function phenomenon(
  value: MasterEffectPhenomenon,
): MasterEffectPhenomenon {
  return Object.freeze({ ...value, regions: Object.freeze([...value.regions]) });
}

export const MASTER_EFFECTS_MANIFEST: MasterEffectsManifest = Object.freeze({
  schemaVersion: MASTER_EFFECTS_SCHEMA_VERSION,
  visualSpecification: Object.freeze(['MASTER_4K', 'MASTER_8K', 'MASTER_12K'] as const),
  referenceAspectRatio: '16:9',
  runtimeImageDependency: false,
  rasterOverlayDependency: false,
  phenomena: Object.freeze([
    phenomenon({
      id: 'master.fx.storm-supercell',
      name: 'Central volumetric storm supercell',
      owner: 'storm',
      regions: ['storm-sky'],
      fidelityWeight: 1,
      requiredAtBalanced: true,
      requiredAtCinematic: true,
      description: 'Layered dark storm mass with purple-blue internal electrical illumination and dimensional cloud depth.',
    }),
    phenomenon({
      id: 'master.fx.lightning-network',
      name: 'Branched electrical sky activity',
      owner: 'lightning',
      regions: ['storm-sky', 'outer-frame'],
      fidelityWeight: 0.95,
      requiredAtBalanced: true,
      requiredAtCinematic: true,
      description: 'Infrequent branched lightning with restrained full-scene flash response and no repeated strobe behavior.',
    }),
    phenomenon({
      id: 'master.fx.energy-rail-response',
      name: 'Frame energy transport response',
      owner: 'glow',
      regions: ['outer-frame', 'central-tablet', 'performance-console', 'metrics-console'],
      fidelityWeight: 0.92,
      requiredAtBalanced: true,
      requiredAtCinematic: true,
      description: 'Cyan, violet, blue, emerald, and orange energy distributed through structural rails without taking frame ownership.',
    }),
    phenomenon({
      id: 'master.fx.atmospheric-particles',
      name: 'Ambient atmospheric particles',
      owner: 'particles',
      regions: ['storm-sky', 'lower-platform'],
      fidelityWeight: 0.62,
      requiredAtBalanced: false,
      requiredAtCinematic: true,
      description: 'Sparse depth-cued particles and rain-like energy detail supporting dimensional atmosphere.',
    }),
    phenomenon({
      id: 'master.fx.floor-reflection',
      name: 'Wet metallic lower-platform reflection',
      owner: 'reflection',
      regions: ['lower-platform', 'player-banner'],
      fidelityWeight: 0.9,
      requiredAtBalanced: true,
      requiredAtCinematic: true,
      description: 'Low-opacity reflective response to neon rails, lightning, tablet glow, and lower-platform energy.',
    }),
    phenomenon({
      id: 'master.fx.depth-separation',
      name: 'Atmospheric depth separation',
      owner: 'environment-composition',
      regions: ['storm-sky', 'central-tablet', 'lower-platform'],
      fidelityWeight: 0.86,
      requiredAtBalanced: true,
      requiredAtCinematic: true,
      description: 'Foreground, interface, environment, and horizon separation using luminance, haze, scale, and parallax-compatible layers.',
    }),
    phenomenon({
      id: 'master.fx.metallic-light-response',
      name: 'Layered metallic light response',
      owner: 'reflection',
      regions: ['outer-frame', 'central-tablet', 'performance-console', 'metrics-console', 'player-banner'],
      fidelityWeight: 0.88,
      requiredAtBalanced: true,
      requiredAtCinematic: true,
      description: 'Controlled highlights and secondary reflections that make metal and glass appear illuminated rather than flat.',
    }),
  ]),
  invariants: Object.freeze([
    'MASTER visual references are measured specifications, never runtime interaction surfaces.',
    'Fidelity is evaluated by phenomena, hierarchy, geometry relationship, materials, light response, and motion behavior.',
    'Effects may simplify under performance or accessibility policies without reducing functional completeness.',
    'No phenomenon may intercept pointer input or become required to understand gameplay state.',
    'The outer frame remains owned by frame authorities; glow and reflection only provide lighting response.',
    'The environment zone remains owned by APP-002; effect systems provide atmosphere within that allocated zone.',
  ]),
});
