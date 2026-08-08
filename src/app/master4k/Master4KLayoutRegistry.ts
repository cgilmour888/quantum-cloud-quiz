/**
 * Artifact ID: QCQ-APP-002-024
 * Artifact Name: Master4KLayoutRegistry
 * Artifact Purpose: Canonical five-zone MASTER-derived registration authority.
 * Artifact Layer: QCQ-APP-002 — REG (Fidelity Registration Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> Master4KLayoutRegistry -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/master4k
 * Source File: Master4KLayoutRegistry.ts
 */
import {
  LayoutZoneRegistry,
} from '../registry/LayoutZoneRegistry';
import {
  PERFORMANCE_ZONE_DEFINITION,
  calculatePerformanceZoneLayout,
} from '../zones/PerformanceZoneLayout';
import {
  TABLET_ZONE_DEFINITION,
  calculateTabletZoneLayout,
} from '../zones/TabletZoneLayout';
import {
  METRICS_ZONE_DEFINITION,
  calculateMetricsZoneLayout,
} from '../zones/MetricsZoneLayout';
import {
  PLAYER_BANNER_ZONE_DEFINITION,
  calculatePlayerBannerZoneLayout,
} from '../zones/PlayerBannerZoneLayout';
import {
  ENVIRONMENT_ZONE_DEFINITION,
  calculateEnvironmentZoneLayout,
} from '../zones/EnvironmentZoneLayout';

export function createMaster4KLayoutRegistry():
  LayoutZoneRegistry {
  return new LayoutZoneRegistry()
    .register({
      definition:
        ENVIRONMENT_ZONE_DEFINITION,
      calculate:
        calculateEnvironmentZoneLayout,
    })
    .register({
      definition:
        TABLET_ZONE_DEFINITION,
      calculate:
        calculateTabletZoneLayout,
    })
    .register({
      definition:
        PERFORMANCE_ZONE_DEFINITION,
      calculate:
        calculatePerformanceZoneLayout,
    })
    .register({
      definition:
        METRICS_ZONE_DEFINITION,
      calculate:
        calculateMetricsZoneLayout,
    })
    .register({
      definition:
        PLAYER_BANNER_ZONE_DEFINITION,
      calculate:
        calculatePlayerBannerZoneLayout,
    })
    .seal();
}
