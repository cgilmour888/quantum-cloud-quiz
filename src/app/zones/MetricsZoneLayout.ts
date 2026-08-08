/**
 * Artifact ID: QCQ-APP-002-018
 * Artifact Name: MetricsZoneLayout
 * Artifact Purpose: Metrics-console spatial authority with MASTER calibration and accessible responsive reflow.
 * Artifact Layer: QCQ-APP-002 — ZON (Metrics Spatial Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> MetricsZoneLayout -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/zones
 * Source File: MetricsZoneLayout.ts
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

export const METRICS_ZONE_DEFINITION: LayoutZoneDefinition = Object.freeze({
  id: 'metrics',
  artifactId: 'QCQ-APP-002-018',
  name: 'MetricsZoneLayout',
  role: 'complementary',
  ariaLabel: 'Metrics console',
  decorative: false,
  required: true,
  normalizedRect: Object.freeze({
    x: 0.74121094,
    y: 0.13020833,
    width: 0.17822266,
    height: 0.63368056,
  }),
  reference: Object.freeze({
    sourceWidth: 2048,
    sourceHeight: 1152,
    pixelRect: Object.freeze({ x: 1518, y: 150, width: 365, height: 730 }),
    normalizedRect: Object.freeze({
      x: 0.74121094,
      y: 0.13020833,
      width: 0.17822266,
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

export const METRICS_ZONE_LIMITS = Object.freeze({
  minWidth: 220,
  minHeight: 240,
  maxWidth: 2100,
  maxHeight: 4200,
});

function createPlacement(
  context: LayoutZoneCalculationContext,
  rect: PixelRect,
): LayoutZonePlacement {
  return Object.freeze({
    zoneId: 'metrics',
    rect,
    visible: context.policy.zoneVisibility['metrics'],
    order: context.policy.zoneOrder.indexOf('metrics'),
    zIndex: METRICS_ZONE_DEFINITION.zIndex,
    overflow: METRICS_ZONE_DEFINITION.overflow,
    pointerPolicy: METRICS_ZONE_DEFINITION.pointerPolicy,
    ariaLabel: METRICS_ZONE_DEFINITION.ariaLabel,
    role: METRICS_ZONE_DEFINITION.role,
    decorative: METRICS_ZONE_DEFINITION.decorative,
    cssVariables: pixelRectToCssVariables('metrics', rect),
  });
}

export function calculateMetricsZoneLayout(
  context: LayoutZoneCalculationContext,
): LayoutZonePlacement {
  const { viewport } = context;
  let rect: PixelRect;
  if (viewport.category === 'cinematic' || viewport.category === 'command') {
    rect = normalizedRectToPixels(METRICS_ZONE_DEFINITION.normalizedRect, viewport);
  } else if (viewport.category === 'balanced') {
    const performance = context.placedZones.get('performance');
    const inset = Math.max(viewport.safeArea.right, viewport.visualWidth * 0.035);
    rect = Object.freeze({
      x: (performance?.rect.x ?? inset) + (performance?.rect.width ?? 0) + context.gap,
      y: performance?.rect.y ?? viewport.safeArea.top,
      width: performance?.rect.width ?? (viewport.visualWidth - inset * 2 - context.gap) / 2,
      height: 270,
    });
  } else {
    const performance = context.placedZones.get('performance');
    const inset = Math.max(viewport.safeArea.left, 10);
    rect = Object.freeze({
      x: inset,
      y: (performance?.rect.y ?? viewport.safeArea.top) + (performance?.rect.height ?? 0) + context.gap,
      width: viewport.visualWidth - inset - Math.max(viewport.safeArea.right, inset),
      height: 250,
    });
  }
  return createPlacement(context, rect);
}
