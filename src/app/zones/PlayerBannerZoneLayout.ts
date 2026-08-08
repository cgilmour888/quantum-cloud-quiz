/**
 * Artifact ID: QCQ-APP-002-019
 * Artifact Name: PlayerBannerZoneLayout
 * Artifact Purpose: Player identity/status spatial authority with MASTER calibration and collision-safe responsive placement.
 * Artifact Layer: QCQ-APP-002 — ZON (Identity Spatial Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> PlayerBannerZoneLayout -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/zones
 * Source File: PlayerBannerZoneLayout.ts
 */
import type {
  LayoutZoneCalculationContext,
  LayoutZoneDefinition,
  LayoutZonePlacement,
  PixelRect,
} from '../types/LayoutEngine.types';
import {
  normalizedRectToPixels,
  pixelRectToCssVariables,
} from '../scaling/LayoutScalingRules';

export const PLAYER_BANNER_ZONE_DEFINITION: LayoutZoneDefinition = Object.freeze({
  id: 'player-banner',
  artifactId: 'QCQ-APP-002-019',
  name: 'PlayerBannerZoneLayout',
  role: 'status',
  ariaLabel: 'Player status banner',
  decorative: false,
  required: true,
  normalizedRect: Object.freeze({
    x: 0.37011719,
    y: 0.88541667,
    width: 0.25976562,
    height: 0.10416667,
  }),
  reference: Object.freeze({
    sourceWidth: 2048,
    sourceHeight: 1152,
    pixelRect: Object.freeze({ x: 758, y: 1020, width: 532, height: 120 }),
    normalizedRect: Object.freeze({
      x: 0.37011719,
      y: 0.88541667,
      width: 0.25976562,
      height: 0.10416667,
    }),
    confidence: 0.96,
    calibration: 'visual-reference',
  }),
  zIndex: 40,
  overflow: 'hidden',
  pointerPolicy: 'interactive-only',
  collisionGroup: 'interactive-status',
  capabilities: Object.freeze([
    "semantic-content","keyboard-navigation","focus-management","responsive-reflow"
  ]),
});

export const PLAYERBANNER_ZONE_LIMITS = Object.freeze({
  minWidth: 280,
  minHeight: 76,
  maxWidth: 3200,
  maxHeight: 900,
});

function createPlacement(
  context: LayoutZoneCalculationContext,
  rect: PixelRect,
): LayoutZonePlacement {
  return Object.freeze({
    zoneId: 'player-banner',
    rect,
    visible: context.policy.zoneVisibility['player-banner'],
    order: context.policy.zoneOrder.indexOf('player-banner'),
    zIndex: PLAYER_BANNER_ZONE_DEFINITION.zIndex,
    overflow: PLAYER_BANNER_ZONE_DEFINITION.overflow,
    pointerPolicy: PLAYER_BANNER_ZONE_DEFINITION.pointerPolicy,
    ariaLabel: PLAYER_BANNER_ZONE_DEFINITION.ariaLabel,
    role: PLAYER_BANNER_ZONE_DEFINITION.role,
    decorative: PLAYER_BANNER_ZONE_DEFINITION.decorative,
    cssVariables: pixelRectToCssVariables('player-banner', rect),
  });
}

export function calculatePlayerBannerZoneLayout(
  context: LayoutZoneCalculationContext,
): LayoutZonePlacement {
  const { viewport } = context;
  let rect: PixelRect;
  if (viewport.category === 'cinematic' || viewport.category === 'command') {
    rect = normalizedRectToPixels(PLAYER_BANNER_ZONE_DEFINITION.normalizedRect, viewport);
  } else {
    const performance = context.placedZones.get('performance');
    const metrics = context.placedZones.get('metrics');
    const bottom = Math.max(
      (performance?.rect.y ?? 0) + (performance?.rect.height ?? 0),
      (metrics?.rect.y ?? 0) + (metrics?.rect.height ?? 0),
    );
    const width = Math.min(
      3200,
      viewport.visualWidth - Math.max(viewport.safeArea.left, 10) - Math.max(viewport.safeArea.right, 10),
    );
    rect = Object.freeze({
      x: (viewport.visualWidth - width) / 2,
      y: bottom + context.gap,
      width,
      height: viewport.category === 'balanced' ? 112 : 104,
    });
  }
  return createPlacement(context, rect);
}
