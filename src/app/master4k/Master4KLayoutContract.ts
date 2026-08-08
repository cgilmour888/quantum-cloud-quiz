/**
 * Artifact ID: QCQ-APP-002-026
 * Artifact Name: Master4KLayoutContract
 * Artifact Purpose: Complete MASTER spatial constitution binding definitions, capabilities, policies, constraints, and invariants.
 * Artifact Layer: QCQ-APP-002 — CTR (Fidelity Contract Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> Master4KLayoutContract -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/master4k
 * Source File: Master4KLayoutContract.ts
 */
import type {
  LayoutConstraintSet,
  LayoutZoneConstraint,
  LayoutZoneDefinition,
  LayoutZoneId,
} from '../types/LayoutEngine.types';
import {
  PERFORMANCE_ZONE_DEFINITION,
  PERFORMANCE_ZONE_LIMITS,
} from '../zones/PerformanceZoneLayout';
import {
  TABLET_ZONE_DEFINITION,
  TABLET_ZONE_LIMITS,
} from '../zones/TabletZoneLayout';
import {
  METRICS_ZONE_DEFINITION,
  METRICS_ZONE_LIMITS,
} from '../zones/MetricsZoneLayout';
import {
  PLAYER_BANNER_ZONE_DEFINITION,
  PLAYERBANNER_ZONE_LIMITS,
} from '../zones/PlayerBannerZoneLayout';
import {
  ENVIRONMENT_ZONE_DEFINITION,
  ENVIRONMENT_ZONE_LIMITS,
} from '../zones/EnvironmentZoneLayout';
import {
  MASTER_4K_LAYOUT_MANIFEST,
} from './Master4KLayoutManifest';

export const MASTER_4K_ZONE_DEFINITIONS:
  Readonly<
    Record<
      LayoutZoneId,
      LayoutZoneDefinition
    >
  > = Object.freeze({
    environment:
      ENVIRONMENT_ZONE_DEFINITION,
    performance:
      PERFORMANCE_ZONE_DEFINITION,
    tablet: TABLET_ZONE_DEFINITION,
    metrics: METRICS_ZONE_DEFINITION,
    'player-banner':
      PLAYER_BANNER_ZONE_DEFINITION,
  });

function constraint(
  definition: LayoutZoneDefinition,
  limits: {
    readonly minWidth: number;
    readonly minHeight: number;
    readonly maxWidth: number | null;
    readonly maxHeight: number | null;
  },
  priority: number,
  protectedInset: number,
): LayoutZoneConstraint {
  const preferred =
    definition.normalizedRect.width /
    Math.max(
      definition.normalizedRect.height,
      0.000001,
    );

  return Object.freeze({
    zoneId: definition.id,
    size: Object.freeze({
      minWidth: limits.minWidth,
      minHeight: limits.minHeight,
      maxWidth: limits.maxWidth,
      maxHeight: limits.maxHeight,
    }),
    aspectRatio: Object.freeze({
      minimum:
        definition.id === 'environment'
          ? null
          : preferred * 0.42,
      maximum:
        definition.id === 'environment'
          ? null
          : preferred * 2.4,
      preferred:
        definition.id === 'environment'
          ? null
          : preferred,
    }),
    normalizedBounds:
      definition.normalizedRect,
    protectedInset,
    collisionGroup:
      definition.collisionGroup,
    mayOverflowViewport:
      definition.id === 'environment',
    mayOverlapDecorativeZones: true,
    priority,
  });
}

export const MASTER_4K_LAYOUT_CONSTRAINTS:
  LayoutConstraintSet = Object.freeze({
    id: 'qcq.master.constraints',
    version: '2.0.0',
    minimumViewportWidth: 320,
    minimumViewportHeight: 568,
    minimumInteractiveTarget: 44,
    minimumTextScale: 0.8,
    maximumTextScale: 2,
    minimumZoneGap: 8,
    maximumContentWidth: 11_520,
    zoneConstraints: Object.freeze({
      environment: constraint(
        ENVIRONMENT_ZONE_DEFINITION,
        ENVIRONMENT_ZONE_LIMITS,
        10,
        0,
      ),
      performance: constraint(
        PERFORMANCE_ZONE_DEFINITION,
        PERFORMANCE_ZONE_LIMITS,
        70,
        10,
      ),
      tablet: constraint(
        TABLET_ZONE_DEFINITION,
        TABLET_ZONE_LIMITS,
        100,
        16,
      ),
      metrics: constraint(
        METRICS_ZONE_DEFINITION,
        METRICS_ZONE_LIMITS,
        70,
        10,
      ),
      'player-banner': constraint(
        PLAYER_BANNER_ZONE_DEFINITION,
        PLAYERBANNER_ZONE_LIMITS,
        80,
        8,
      ),
    }),
  });

export const MASTER_4K_ZONE_CAPABILITIES =
  Object.freeze({
    environment: Object.freeze([
      'storm',
      'lightning',
      'particles',
      'glow',
      'reflection',
      'atmospheric-depth',
    ]),
    performance: Object.freeze([
      'navigation',
      'dashboard',
      'leaderboard',
      'achievements',
      'history',
      'analytics',
      'settings',
      'logout',
    ]),
    tablet: Object.freeze([
      'question',
      'answers',
      'selection',
      'feedback',
      'focus-overlay',
    ]),
    metrics: Object.freeze([
      'score',
      'accuracy',
      'streak',
      'time',
      'questions',
      'category',
      'rank',
    ]),
    'player-banner': Object.freeze([
      'identity',
      'presence',
      'ownership',
    ]),
  });

export const MASTER_4K_ZONE_POLICIES =
  Object.freeze({
    macroScrollOwner: 'layout-root',
    primaryMainZone: 'tablet',
    environmentPointerTransparent: true,
    environmentAssistiveTechnologyHidden: true,
    consoleInternalScroll: false,
    tabletResponsivePriority: 100,
    preserveFunctionalAccessDuringReflow: true,
    phase9VisualAuthority: true,
  });

export const MASTER_4K_LAYOUT_CONTRACT =
  Object.freeze({
    artifactId: 'QCQ-APP-002-026',
    version: '2.0.0',
    manifest: MASTER_4K_LAYOUT_MANIFEST,
    definitions:
      MASTER_4K_ZONE_DEFINITIONS,
    constraints:
      MASTER_4K_LAYOUT_CONSTRAINTS,
    capabilities:
      MASTER_4K_ZONE_CAPABILITIES,
    policies:
      MASTER_4K_ZONE_POLICIES,
    invariants: Object.freeze([
      'APP-002 is the sole QCQ macro-layout authority.',
      'MASTER artwork is specification-only and is never imported as runtime raster implementation.',
      'Every interactive visible object is a semantic application component.',
      'The tablet zone owns the sole primary main landmark.',
      'Performance and Metrics are complementary regions.',
      'Player Banner is a status region and cannot obscure the tablet.',
      'Environment is decorative, pointer-transparent, and assistive-technology hidden.',
      'Responsive reflow preserves access to all functional zones.',
      'Phase 9 remains the visual token and theme authority.',
      '4K, 8K, and 12K use proportional geometry while rendering cost adapts independently.',
      'Reduced motion and forced colors override decorative fidelity.',
      'No image overlays, hotspot overlays, static interaction maps, or raster hit regions are permitted.',
    ]),
  });
