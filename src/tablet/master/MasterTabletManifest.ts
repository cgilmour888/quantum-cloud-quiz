/**
 * Artifact ID: QCQ-TBL-061
 * Artifact Name: MasterTabletManifest
 * Artifact Purpose: MASTER-derived tablet fidelity manifest calibrated from the supplied 16:9 reference frames without runtime image dependency.
 * Artifact Layer: QCQ-TBL — GOV
 * Artifact Dependencies: QCQ-TBL-042, QCQ-TBL-049, QCQ-TBL-053
 * Artifact Dependents: QCQ-TBL-062, QCQ-TBL-063, QCQ-TBL-064
 * Dependency Graph: tablet/frame/interaction manifests -> MasterTabletManifest -> registry/contract/capability
 * Repository Path: QCQ/frontend/src/tablet/master
 * Source File: MasterTabletManifest.ts
 */

export interface NormalizedRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface MasterTabletAnchor {
  readonly id:
    | 'tablet-outer'
    | 'tablet-inner'
    | 'question-region'
    | 'answers-region'
    | 'left-console'
    | 'right-console'
    | 'player-banner';
  readonly rect: NormalizedRect;
  readonly purpose: string;
}

export const MASTER_TABLET_MANIFEST = Object.freeze({
  artifactId: 'QCQ-TBL-061',
  schemaVersion: '1.0.0',
  referenceAspectRatio: 16 / 9,
  calibrationRepresentation: Object.freeze({
    width: 1024,
    height: 576,
  }),
  canonicalTargets: Object.freeze({
    fourK: Object.freeze({ width: 3840, height: 2160 }),
    eightK: Object.freeze({ width: 7680, height: 4320 }),
    twelveK: Object.freeze({ width: 11_520, height: 6480 }),
  }),
  anchors: Object.freeze([
    Object.freeze({
      id: 'tablet-outer',
      rect: Object.freeze({
        x: 0.292,
        y: 0.268,
        width: 0.424,
        height: 0.475,
      }),
      purpose: 'Primary tablet structural envelope',
    }),
    Object.freeze({
      id: 'tablet-inner',
      rect: Object.freeze({
        x: 0.311,
        y: 0.326,
        width: 0.386,
        height: 0.378,
      }),
      purpose: 'Interactive tablet aperture',
    }),
    Object.freeze({
      id: 'question-region',
      rect: Object.freeze({
        x: 0.336,
        y: 0.363,
        width: 0.337,
        height: 0.119,
      }),
      purpose: 'Question prompt allocation',
    }),
    Object.freeze({
      id: 'answers-region',
      rect: Object.freeze({
        x: 0.336,
        y: 0.507,
        width: 0.337,
        height: 0.166,
      }),
      purpose: 'Answer interaction allocation',
    }),
    Object.freeze({
      id: 'left-console',
      rect: Object.freeze({
        x: 0.093,
        y: 0.128,
        width: 0.158,
        height: 0.645,
      }),
      purpose: 'Performance/navigation console relationship',
    }),
    Object.freeze({
      id: 'right-console',
      rect: Object.freeze({
        x: 0.752,
        y: 0.132,
        width: 0.166,
        height: 0.641,
      }),
      purpose: 'Metrics console relationship',
    }),
    Object.freeze({
      id: 'player-banner',
      rect: Object.freeze({
        x: 0.377,
        y: 0.899,
        width: 0.252,
        height: 0.101,
      }),
      purpose: 'Player identity banner relationship',
    }),
  ] satisfies readonly MasterTabletAnchor[]),
  visualObservations: Object.freeze([
    'Central tablet is the dominant cognitive focal point.',
    'Outer tablet frame uses layered metallic cyan/blue geometry with purple and orange edge energy.',
    'Corner nodes visually anchor the tablet shell at four quadrants.',
    'Question prompt occupies the upper third of the inner tablet aperture.',
    'Four answer rows occupy the lower half of the inner tablet aperture.',
    'Left and right consoles are persistent peripheral instruments rather than tablet children.',
    'Player identity is centered below the tablet on the global canvas.',
    'Storm, cloud, lightning, and atmospheric depth remain outside tablet ownership.',
  ]),
  runtimeArtworkUsage: false,
  imageOverlayUsage: false,
  hotspotOverlayUsage: false,
});
