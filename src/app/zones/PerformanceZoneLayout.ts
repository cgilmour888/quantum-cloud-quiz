/**
 * Artifact ID: QCQ-APP-002-016
 * Artifact Name: PerformanceZoneLayout
 * Artifact Purpose: Performance-console spatial authority with MASTER calibration and accessible responsive reflow.
 * Artifact Layer: QCQ-APP-002 — ZON (Performance Spatial Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> PerformanceZoneLayout -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/zones
 * Source File: PerformanceZoneLayout.ts
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

export const PERFORMANCE_ZONE_DEFINITION: LayoutZoneDefinition = Object.freeze({
  id: 'performance',
  artifactId: 'QCQ-APP-002-016',
  name: 'PerformanceZoneLayout',
  role: 'complementary',
  ariaLabel: 'Performance console',
  decorative: false,
  required: true,
  normalizedRect: Object.freeze({
    x: 0.07324219,
    y: 0.13020833,
    width: 0.19531250,
    height: 0.63368056,
  }),
  reference: Object.freeze({
    sourceWidth: 2048,
    sourceHeight: 1152,
    pixelRect: Object.freeze({ x: 150, y: 150, width: 400, height: 730 }),
    normalizedRect: Object.freeze({
      x: 0.07324219,
      y: 0.13020833,
      width: 0.19531250,
      height: 0.63368056,
    }),
    confidence: 0.96,
    calibration: 'visual-reference',
  }),
  zIndex: 20,
  overflow: 'hidden',
  pointerPolicy: 'interactive-only',
  collisionGroup: 'interactive-console',
  capabilities: Object.freeze([
    "semantic-content","keyboard-navigation","focus-management","responsive-reflow"
  ]),
});

export const PERFORMANCE_ZONE_LIMITS = Object.freeze({
  minWidth: 220,
  minHeight: 240,
  maxWidth: 2250,
  maxHeight: 4200,
});

function createPlacement(
  context: LayoutZoneCalculationContext,
  rect: PixelRect,
): LayoutZonePlacement {
  return Object.freeze({
    zoneId: 'performance',
    rect,
    visible: context.policy.zoneVisibility['performance'],
    order: context.policy.zoneOrder.indexOf('performance'),
    zIndex: PERFORMANCE_ZONE_DEFINITION.zIndex,
    overflow: PERFORMANCE_ZONE_DEFINITION.overflow,
    pointerPolicy: PERFORMANCE_ZONE_DEFINITION.pointerPolicy,
    ariaLabel: PERFORMANCE_ZONE_DEFINITION.ariaLabel,
    role: PERFORMANCE_ZONE_DEFINITION.role,
    decorative: PERFORMANCE_ZONE_DEFINITION.decorative,
    cssVariables: pixelRectToCssVariables('performance', rect),
  });
}

export function calculatePerformanceZoneLayout(
  context: LayoutZoneCalculationContext,
): LayoutZonePlacement {
  const { viewport } = context;
  let rect: PixelRect;
  if (viewport.category === 'cinematic' || viewport.category === 'command') {
    rect = normalizedRectToPixels(PERFORMANCE_ZONE_DEFINITION.normalizedRect, viewport);
  } else {
    const tablet = context.placedZones.get('tablet');
    const inset = viewport.category === 'balanced'
      ? Math.max(viewport.safeArea.left, viewport.visualWidth * 0.035)
      : Math.max(viewport.safeArea.left, 10);
    const width = viewport.category === 'balanced'
      ? (viewport.visualWidth - inset * 2 - context.gap) / 2
      : viewport.visualWidth - inset - Math.max(viewport.safeArea.right, inset);
    rect = Object.freeze({
      x: inset,
      y: (tablet?.rect.y ?? viewport.safeArea.top) + (tablet?.rect.height ?? 0) + context.gap,
      width,
      height: viewport.category === 'balanced' ? 270 : 250,
    });
  }
  return createPlacement(context, rect);
}
