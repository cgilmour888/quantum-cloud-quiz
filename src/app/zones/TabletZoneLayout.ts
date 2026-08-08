/**
 * Artifact ID: QCQ-APP-002-017
 * Artifact Name: TabletZoneLayout
 * Artifact Purpose: Primary certification-tablet spatial authority with MASTER calibration and responsive priority.
 * Artifact Layer: QCQ-APP-002 — ZON (Tablet Spatial Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> TabletZoneLayout -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/zones
 * Source File: TabletZoneLayout.ts
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

export const TABLET_ZONE_DEFINITION: LayoutZoneDefinition = Object.freeze({
  id: 'tablet',
  artifactId: 'QCQ-APP-002-017',
  name: 'TabletZoneLayout',
  role: 'main',
  ariaLabel: 'Certification question tablet',
  decorative: false,
  required: true,
  normalizedRect: Object.freeze({
    x: 0.30468750,
    y: 0.23437500,
    width: 0.40820312,
    height: 0.49913194,
  }),
  reference: Object.freeze({
    sourceWidth: 2048,
    sourceHeight: 1152,
    pixelRect: Object.freeze({ x: 624, y: 270, width: 836, height: 575 }),
    normalizedRect: Object.freeze({
      x: 0.30468750,
      y: 0.23437500,
      width: 0.40820312,
      height: 0.49913194,
    }),
    confidence: 0.96,
    calibration: 'visual-reference',
  }),
  zIndex: 30,
  overflow: 'hidden',
  pointerPolicy: 'interactive-only',
  collisionGroup: 'interactive-primary',
  capabilities: Object.freeze([
    "semantic-content","keyboard-navigation","focus-management","responsive-reflow"
  ]),
});

export const TABLET_ZONE_LIMITS = Object.freeze({
  minWidth: 320,
  minHeight: 430,
  maxWidth: 5000,
  maxHeight: 3600,
});

function createPlacement(
  context: LayoutZoneCalculationContext,
  rect: PixelRect,
): LayoutZonePlacement {
  return Object.freeze({
    zoneId: 'tablet',
    rect,
    visible: context.policy.zoneVisibility['tablet'],
    order: context.policy.zoneOrder.indexOf('tablet'),
    zIndex: TABLET_ZONE_DEFINITION.zIndex,
    overflow: TABLET_ZONE_DEFINITION.overflow,
    pointerPolicy: TABLET_ZONE_DEFINITION.pointerPolicy,
    ariaLabel: TABLET_ZONE_DEFINITION.ariaLabel,
    role: TABLET_ZONE_DEFINITION.role,
    decorative: TABLET_ZONE_DEFINITION.decorative,
    cssVariables: pixelRectToCssVariables('tablet', rect),
  });
}

export function calculateTabletZoneLayout(
  context: LayoutZoneCalculationContext,
): LayoutZonePlacement {
  const { viewport } = context;
  let rect: PixelRect;
  if (viewport.category === 'cinematic' || viewport.category === 'command') {
    rect = normalizedRectToPixels(TABLET_ZONE_DEFINITION.normalizedRect, viewport);
  } else {
    const inset = viewport.category === 'balanced'
      ? Math.max(viewport.safeArea.left, viewport.visualWidth * 0.035)
      : Math.max(viewport.safeArea.left, 10);
    const rightInset = Math.max(viewport.safeArea.right, inset);
    const width = Math.max(320, viewport.visualWidth - inset - rightInset);
    const desiredHeight = viewport.category === 'balanced'
      ? 620
      : Math.max(650, viewport.visualHeight * 0.82);
    rect = Object.freeze({
      x: inset,
      y: viewport.safeArea.top + context.gap,
      width,
      height: desiredHeight,
    });
  }
  return createPlacement(context, rect);
}
