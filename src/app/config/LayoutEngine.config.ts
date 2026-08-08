/**
 * Artifact ID: QCQ-APP-002-003
 * Artifact Name: LayoutEngine.config
 * Artifact Purpose: Canonical runtime configuration, responsive policy matrix, measurement controls, and visual-reference dimensions.
 * Artifact Layer: QCQ-APP-002 — CFG (Configuration Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> LayoutEngine.config -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/config
 * Source File: LayoutEngine.config.ts
 */
import {
  DEFAULT_LAYOUT_ZONE_ORDER,
  MASTER_4K_REFERENCE_HEIGHT,
  MASTER_4K_REFERENCE_WIDTH,
  QCQ_LAYOUT_ENGINE_ARTIFACT_ID,
  QCQ_LAYOUT_ENGINE_VERSION,
} from '../constants/LayoutEngine.constants';
import type {
  LayoutEngineConfiguration as LayoutEngineConfigurationContract,
  LayoutPolicyMatrixEntry,
  LayoutPolicyPreferences,
  LayoutZoneId,
} from '../types/LayoutEngine.types';
import {
  DEFAULT_LAYOUT_COMPOSITION_CONFIG,
} from '../composition/LayoutComposition.config';

export type LayoutEngineConfiguration =
  LayoutEngineConfigurationContract;

export const DEFAULT_LAYOUT_POLICY_PREFERENCES:
  LayoutPolicyPreferences = Object.freeze({
    motion: 'full',
    quality: 'automatic',
    compactConsoles: false,
    preserveMasterProportions: true,
    allowEnvironmentEffects: true,
    allowDecorativeAnimation: true,
    minimumInteractiveTarget: 44,
  });

export const LAYOUT_POLICY_MATRIX:
  readonly LayoutPolicyMatrixEntry[] =
  Object.freeze([
    Object.freeze({
      category: 'cinematic',
      overflow: 'contain',
      reading: 'focus-overlay',
      compactConsoles: false,
      zoneOrder: DEFAULT_LAYOUT_ZONE_ORDER,
      hiddenZones: Object.freeze([]),
      textScale: 1,
      effectScale: 1,
    }),
    Object.freeze({
      category: 'command',
      overflow: 'contain',
      reading: 'focus-overlay',
      compactConsoles: false,
      zoneOrder: DEFAULT_LAYOUT_ZONE_ORDER,
      hiddenZones: Object.freeze([]),
      textScale: 0.98,
      effectScale: 0.9,
    }),
    Object.freeze({
      category: 'balanced',
      overflow: 'scroll',
      reading: 'focus-overlay',
      compactConsoles: true,
      zoneOrder: Object.freeze([
        'environment',
        'tablet',
        'performance',
        'metrics',
        'player-banner',
      ] satisfies readonly LayoutZoneId[]),
      hiddenZones: Object.freeze([]),
      textScale: 0.94,
      effectScale: 0.72,
    }),
    Object.freeze({
      category: 'compact',
      overflow: 'scroll',
      reading: 'focus-overlay',
      compactConsoles: true,
      zoneOrder: Object.freeze([
        'environment',
        'tablet',
        'performance',
        'metrics',
        'player-banner',
      ] satisfies readonly LayoutZoneId[]),
      hiddenZones: Object.freeze([]),
      textScale: 0.9,
      effectScale: 0.48,
    }),
    Object.freeze({
      category: 'micro',
      overflow: 'scroll',
      reading: 'modal',
      compactConsoles: true,
      zoneOrder: Object.freeze([
        'environment',
        'tablet',
        'performance',
        'metrics',
        'player-banner',
      ] satisfies readonly LayoutZoneId[]),
      hiddenZones: Object.freeze([]),
      textScale: 0.86,
      effectScale: 0.28,
    }),
  ]);

export const DEFAULT_LAYOUT_ENGINE_CONFIG:
  LayoutEngineConfiguration = Object.freeze({
    artifactId: QCQ_LAYOUT_ENGINE_ARTIFACT_ID,
    version: QCQ_LAYOUT_ENGINE_VERSION,
    referenceViewport: Object.freeze({
      width: MASTER_4K_REFERENCE_WIDTH,
      height: MASTER_4K_REFERENCE_HEIGHT,
    }),
    policyPreferences:
      DEFAULT_LAYOUT_POLICY_PREFERENCES,
    composition:
      DEFAULT_LAYOUT_COMPOSITION_CONFIG,
    measurement: Object.freeze({
      minimumWidth: 320,
      minimumHeight: 568,
      resizeDebounceMilliseconds: 16,
      useVisualViewport: true,
    }),
    diagnostics: Object.freeze({
      warnOnConstraintCorrection: true,
      exposeDebugAttributes: false,
    }),
  });

export function createLayoutEngineConfiguration(
  overrides: Partial<LayoutEngineConfiguration> = {},
): LayoutEngineConfiguration {
  const measurement = Object.freeze({
    ...DEFAULT_LAYOUT_ENGINE_CONFIG.measurement,
    ...(overrides.measurement ?? {}),
  });
  const diagnostics = Object.freeze({
    ...DEFAULT_LAYOUT_ENGINE_CONFIG.diagnostics,
    ...(overrides.diagnostics ?? {}),
  });
  const referenceViewport = Object.freeze({
    ...DEFAULT_LAYOUT_ENGINE_CONFIG.referenceViewport,
    ...(overrides.referenceViewport ?? {}),
  });

  if (
    measurement.minimumWidth < 320 ||
    measurement.minimumHeight < 320
  ) {
    throw new Error(
      'Layout minimum dimensions are below the supported interaction envelope.',
    );
  }
  if (
    referenceViewport.width <= 0 ||
    referenceViewport.height <= 0
  ) {
    throw new Error(
      'Reference viewport dimensions must be positive.',
    );
  }

  return Object.freeze({
    ...DEFAULT_LAYOUT_ENGINE_CONFIG,
    ...overrides,
    artifactId: QCQ_LAYOUT_ENGINE_ARTIFACT_ID,
    version: QCQ_LAYOUT_ENGINE_VERSION,
    referenceViewport,
    measurement,
    diagnostics,
    policyPreferences: Object.freeze({
      ...DEFAULT_LAYOUT_POLICY_PREFERENCES,
      ...(overrides.policyPreferences ?? {}),
    }),
    composition: Object.freeze({
      ...DEFAULT_LAYOUT_COMPOSITION_CONFIG,
      ...(overrides.composition ?? {}),
    }),
  });
}
