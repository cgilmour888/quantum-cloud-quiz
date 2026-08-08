/**
 * Artifact ID: QCQ-TBL-049
 * Artifact Name: FrameManifest
 * Artifact Purpose: Frame subsystem governance manifest defining frame layers, fidelity rules, and renderer invariants.
 * Artifact Layer: QCQ-TBL — GOV
 * Artifact Dependencies: None
 * Artifact Dependents: QCQ-TBL-050, QCQ-TBL-051, QCQ-TBL-052, QCQ-TBL-004
 * Dependency Graph: FrameManifest -> frame registry/policy/capabilities -> BorderFrameEngine
 * Repository Path: QCQ/frontend/src/tablet/frame
 * Source File: FrameManifest.ts
 */

export type FrameLayerId =
  | 'outer-shell'
  | 'inner-shell'
  | 'corner-nodes'
  | 'energy-rails'
  | 'platinum-glow';

export interface FrameLayerDescriptor {
  readonly id: FrameLayerId;
  readonly artifactId: string;
  readonly name: string;
  readonly decorative: boolean;
  readonly required: boolean;
  readonly zIndex: number;
}

export const FRAME_MANIFEST = Object.freeze({
  artifactId: 'QCQ-TBL-049',
  schemaVersion: '1.0.0',
  layers: Object.freeze([
    Object.freeze({
      id: 'platinum-glow',
      artifactId: 'QCQ-TBL-009',
      name: 'PlatinumFrameGlow',
      decorative: true,
      required: false,
      zIndex: 0,
    }),
    Object.freeze({
      id: 'outer-shell',
      artifactId: 'QCQ-TBL-005',
      name: 'OuterFrameRenderer',
      decorative: true,
      required: true,
      zIndex: 1,
    }),
    Object.freeze({
      id: 'energy-rails',
      artifactId: 'QCQ-TBL-008',
      name: 'EdgeEnergyRail',
      decorative: true,
      required: false,
      zIndex: 2,
    }),
    Object.freeze({
      id: 'corner-nodes',
      artifactId: 'QCQ-TBL-007',
      name: 'CornerNodeRenderer',
      decorative: true,
      required: true,
      zIndex: 3,
    }),
    Object.freeze({
      id: 'inner-shell',
      artifactId: 'QCQ-TBL-006',
      name: 'InnerFrameRenderer',
      decorative: true,
      required: true,
      zIndex: 4,
    }),
  ] satisfies readonly FrameLayerDescriptor[]),
  invariants: Object.freeze([
    'Frame layers are pointer-transparent.',
    'Frame layers are hidden from assistive technology.',
    'Frame renderers may not own question or progression state.',
    'Frame renderers consume external visual-system variables.',
    'Reduced motion disables energy transport animation.',
    'Forced colors preserves boundaries without decorative glow.',
  ]),
});
