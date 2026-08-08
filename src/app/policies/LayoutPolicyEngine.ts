/**
 * Artifact ID: QCQ-APP-002-010
 * Artifact Name: LayoutPolicyEngine
 * Artifact Purpose: Adaptive layout policy resolution from viewport, hardware capabilities, user preferences, and active zones.
 * Artifact Layer: QCQ-APP-002 — POL (Policy Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> LayoutPolicyEngine -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/policies
 * Source File: LayoutPolicyEngine.ts
 */
import {
  DEFAULT_LAYOUT_POLICY_PREFERENCES,
  LAYOUT_POLICY_MATRIX,
} from '../config/LayoutEngine.config';
import type { LayoutCapabilities } from '../types/LayoutEngine.types';
import type {
  LayoutPolicyPreferences,
  ResolvedLayoutPolicy,
} from '../types/LayoutEngine.types';
import type { LayoutZoneId } from '../types/LayoutEngine.types';
import type { ViewportLayoutContract } from '../types/LayoutEngine.types';

function resolveAutomaticQuality(capabilities: LayoutCapabilities): 'minimal' | 'balanced' | 'ultra' {
  const memory = capabilities.graphics.deviceMemoryGigabytes;
  if (
    capabilities.preferences.forcedColors ||
    capabilities.graphics.hardwareConcurrency <= 2 ||
    (memory !== null && memory <= 2)
  ) {
    return 'minimal';
  }
  if (
    capabilities.graphics.hardwareConcurrency >= 8 &&
    (memory === null || memory >= 8) &&
    capabilities.graphics.webgl2
  ) {
    return 'ultra';
  }
  return 'balanced';
}

export class LayoutPolicyEngine {
  public resolve(
    viewport: ViewportLayoutContract,
    capabilities: LayoutCapabilities,
    preferences: LayoutPolicyPreferences = {},
    activeZones?: ReadonlySet<LayoutZoneId>,
  ): ResolvedLayoutPolicy {
    const merged = { ...DEFAULT_LAYOUT_POLICY_PREFERENCES, ...preferences };
    const matrix = LAYOUT_POLICY_MATRIX.find((entry) => entry.category === viewport.category);
    if (!matrix) {
      throw new Error(`No layout policy matrix entry exists for "${viewport.category}".`);
    }

    const requestedMotion = merged.motion ?? 'full';
    const motion = capabilities.preferences.reducedMotion
      ? 'reduced'
      : capabilities.runtime.documentVisible
        ? requestedMotion
        : 'none';
    const quality = merged.quality === 'automatic' || merged.quality === undefined
      ? resolveAutomaticQuality(capabilities)
      : merged.quality;
    const hidden = new Set(matrix.hiddenZones);
    const zoneVisibility = {} as Record<LayoutZoneId, boolean>;
    const allZones: readonly LayoutZoneId[] = [
      'environment',
      'performance',
      'tablet',
      'metrics',
      'player-banner',
    ];

    for (const zoneId of allZones) {
      zoneVisibility[zoneId] =
        !hidden.has(zoneId) &&
        (activeZones === undefined || activeZones.has(zoneId));
    }

    return Object.freeze({
      id: `qcq.policy.${viewport.category}.${quality}.${motion}`,
      viewportCategory: viewport.category,
      motion,
      quality,
      overflow: matrix.overflow,
      reading: matrix.reading,
      compactConsoles: merged.compactConsoles === true || matrix.compactConsoles,
      preserveMasterProportions: merged.preserveMasterProportions ?? true,
      allowEnvironmentEffects:
        (merged.allowEnvironmentEffects ?? true) &&
        !capabilities.preferences.forcedColors &&
        quality !== 'minimal',
      allowDecorativeAnimation:
        (merged.allowDecorativeAnimation ?? true) &&
        motion !== 'none' &&
        motion !== 'reduced',
      allowBackdropFilter:
        !capabilities.preferences.reducedTransparency &&
        !capabilities.preferences.forcedColors,
      minimumInteractiveTarget: Math.max(44, merged.minimumInteractiveTarget ?? 44),
      zoneVisibility: Object.freeze(zoneVisibility),
      zoneOrder: matrix.zoneOrder,
      textScale: matrix.textScale,
      effectScale: matrix.effectScale,
    });
  }
}
