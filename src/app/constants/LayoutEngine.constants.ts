/**
 * Artifact ID: QCQ-APP-002-004
 * Artifact Name: LayoutEngine.constants
 * Artifact Purpose: Permanent identifiers, dimensions, zone order, semantics, CSS data attributes, and runtime limits.
 * Artifact Layer: QCQ-APP-002 — CNT (Constants Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> LayoutEngine.constants -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/constants
 * Source File: LayoutEngine.constants.ts
 */
import type {
  LayoutZoneId,
} from '../types/LayoutEngine.types';

export const QCQ_LAYOUT_ENGINE_ID =
  'QCQ-APP-002' as const;
export const QCQ_LAYOUT_ENGINE_ARTIFACT_ID =
  'QCQ-APP-002-001' as const;
export const QCQ_LAYOUT_ENGINE_NAME =
  'LayoutEngine' as const;
export const QCQ_LAYOUT_ENGINE_VERSION =
  '2.0.0' as const;
export const QCQ_LAYOUT_ENGINE_SCHEMA_VERSION =
  '2.0.0' as const;

export const MASTER_REFERENCE_WIDTH = 2048;
export const MASTER_REFERENCE_HEIGHT = 1152;
export const MASTER_REFERENCE_ASPECT_RATIO =
  MASTER_REFERENCE_WIDTH /
  MASTER_REFERENCE_HEIGHT;

export const MASTER_4K_REFERENCE_WIDTH = 3840;
export const MASTER_4K_REFERENCE_HEIGHT = 2160;
export const MASTER_8K_REFERENCE_WIDTH = 7680;
export const MASTER_8K_REFERENCE_HEIGHT = 4320;
export const MASTER_12K_REFERENCE_WIDTH = 11520;
export const MASTER_12K_REFERENCE_HEIGHT = 6480;
export const MASTER_4K_REFERENCE_ASPECT_RATIO =
  16 / 9;

export const LAYOUT_ZONE_IDS =
  Object.freeze([
    'environment',
    'performance',
    'tablet',
    'metrics',
    'player-banner',
  ] satisfies readonly LayoutZoneId[]);

export const DEFAULT_LAYOUT_ZONE_ORDER =
  Object.freeze([
    'environment',
    'performance',
    'tablet',
    'metrics',
    'player-banner',
  ] satisfies readonly LayoutZoneId[]);

export const ACCESSIBLE_LAYOUT_ZONE_ORDER =
  Object.freeze([
    'tablet',
    'performance',
    'metrics',
    'player-banner',
    'environment',
  ] satisfies readonly LayoutZoneId[]);

export const LAYOUT_ZONE_ARIA_LABELS:
  Readonly<Record<LayoutZoneId, string>> =
  Object.freeze({
    environment:
      'Quantum Certification Quest environment',
    performance: 'Performance console',
    tablet: 'Certification question tablet',
    metrics: 'Metrics console',
    'player-banner': 'Player status banner',
  });

export const LAYOUT_ZONE_Z_INDEX:
  Readonly<Record<LayoutZoneId, number>> =
  Object.freeze({
    environment: 0,
    performance: 20,
    tablet: 30,
    metrics: 20,
    'player-banner': 40,
  });

export const LAYOUT_ZONE_COLLISION_GROUPS:
  Readonly<Record<LayoutZoneId, string>> =
  Object.freeze({
    environment: 'decorative-background',
    performance: 'interactive-console',
    tablet: 'interactive-primary',
    metrics: 'interactive-console',
    'player-banner': 'interactive-status',
  });

export const LAYOUT_DATA_ATTRIBUTES =
  Object.freeze({
    engine: 'data-qcq-layout-engine',
    artifact: 'data-qcq-layout-artifact',
    version: 'data-qcq-layout-version',
    ready: 'data-qcq-layout-ready',
    category: 'data-qcq-layout-category',
    quality: 'data-qcq-layout-quality',
    motion: 'data-qcq-layout-motion',
    orientation: 'data-qcq-layout-orientation',
    zone: 'data-qcq-layout-zone',
    visible: 'data-qcq-layout-visible',
    debug: 'data-qcq-layout-debug',
    reference: 'data-qcq-master-reference',
  });

export const LAYOUT_CSS_VARIABLE_PREFIX =
  '--qcq-layout-' as const;

export const LAYOUT_CONSTITUTIONAL_INVARIANTS =
  Object.freeze([
    'APP-002 is the sole macro-layout authority.',
    'Exactly one primary main landmark belongs to the tablet zone.',
    'The environment zone is decorative, assistive-technology hidden, and pointer transparent.',
    'Performance and metrics are complementary regions.',
    'Player banner is a status region and must not cover the tablet interaction surface.',
    'MASTER artwork is specification-only and never imported as a runtime raster.',
    'Every interactive visible object remains a real semantic component.',
    'Phase 9 remains the visual-token and theme authority.',
    'Responsive modes may reflow zones but may not silently discard the tablet.',
    'Reduced-motion and forced-colors preferences override decorative fidelity.',
  ] as const);

export const LAYOUT_RUNTIME_LIMITS =
  Object.freeze({
    registryCapacity: 500_000,
    minimumViewportWidth: 320,
    minimumViewportHeight: 568,
    minimumInteractiveTarget: 44,
    maximumDevicePixelRatio: 3,
    maximumSafeContentWidth: 11_520,
    minimumTextScale: 0.8,
    maximumTextScale: 2,
  } as const);
