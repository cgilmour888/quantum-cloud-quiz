/**
 * Artifact ID: QCQ-TBL-042
 * Artifact Name: TabletManifest
 * Artifact Purpose: Tablet governance manifest and invariants.
 * Artifact Layer: QCQ-TBL — GOV
 * Artifact Dependencies: None
 * Artifact Dependents: QCQ-TBL-043, QCQ-TBL-044, QCQ-TBL-046, QCQ-TBL-057, QCQ-TBL-061
 * Dependency Graph: TabletManifest -> tablet governance/composition/validation/fidelity
 * Repository Path: QCQ/frontend/src/tablet/governance
 * Source File: TabletManifest.ts
 */

export type TabletModuleKind =
  | 'shell'
  | 'layout'
  | 'viewport'
  | 'frame'
  | 'interaction'
  | 'question'
  | 'validation'
  | 'fidelity';

export interface TabletModuleDescriptor {
  readonly id: string;
  readonly artifactId: string;
  readonly name: string;
  readonly kind: TabletModuleKind;
  readonly version: string;
  readonly required: boolean;
  readonly dependencies: readonly string[];
  readonly capabilities: readonly string[];
}

export const TABLET_MANIFEST = Object.freeze({
  artifactId: 'QCQ-TBL-042',
  schemaVersion: '1.0.0',
  packageVersion: '1.0.0',
  registryCapacity: 500_000,
  minimumInteractiveTargetCssPixels: 44,
  maximumQuestionOptions: 12,
  supportedResolutionClasses: Object.freeze([
    'compact',
    'desktop',
    '4k',
    '8k',
    '12k',
  ] as const),
  invariants: Object.freeze([
    'The MASTER artwork is specification-only and is never a runtime interaction surface.',
    'Every visible interactive tablet control is a semantic application element.',
    'Tablet components do not own persistence, analytics, AI, gamification, leaderboard, or SaaS state.',
    'Frame renderers consume theme variables rather than becoming a competing design-token authority.',
    'QuestionTablet receives question state through explicit props and never imports DatasetLoader directly.',
    'BorderFrameEngine never imports QuestionProgressionEngine.',
    'The primary tablet surface remains keyboard operable and screen-reader understandable.',
    'Reduced motion and forced colors override decorative fidelity.',
  ]),
});

export type TabletResolutionClass =
  (typeof TABLET_MANIFEST.supportedResolutionClasses)[number];
