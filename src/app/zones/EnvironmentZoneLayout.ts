/**
 * Artifact ID: QCQ-APP-002-020
 * Artifact Name: EnvironmentZoneLayout
 * Artifact Purpose: Pointer-transparent atmospheric environment spatial authority spanning the layout canvas.
 * Artifact Layer: QCQ-APP-002 — ZON (Environment Spatial Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> EnvironmentZoneLayout -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/zones
 * Source File: EnvironmentZoneLayout.ts
 */
import type {
  LayoutZoneCalculationContext,
  LayoutZoneDefinition,
  LayoutZonePlacement,
  PixelRect,
} from '../types/LayoutEngine.types';
import {
  pixelRectToCssVariables,
} from '../scaling/LayoutScalingRules';

export const ENVIRONMENT_ZONE_DEFINITION: LayoutZoneDefinition = Object.freeze({
  id: 'environment',
  artifactId: 'QCQ-APP-002-020',
  name: 'EnvironmentZoneLayout',
  role: 'presentation',
  ariaLabel: 'Quantum Certification Quest environment',
  decorative: true,
  required: true,
  normalizedRect: Object.freeze({
    x: 0.00000000,
    y: 0.00000000,
    width: 1.00000000,
    height: 1.00000000,
  }),
  reference: Object.freeze({
    sourceWidth: 2048,
    sourceHeight: 1152,
    pixelRect: Object.freeze({ x: 0, y: 0, width: 2048, height: 1152 }),
    normalizedRect: Object.freeze({
      x: 0.00000000,
      y: 0.00000000,
      width: 1.00000000,
      height: 1.00000000,
    }),
    confidence: 0.96,
    calibration: 'visual-reference',
  }),
  zIndex: 0,
  overflow: 'clip',
  pointerPolicy: 'none',
  collisionGroup: 'decorative-background',
  capabilities: Object.freeze([
    "storm-effects","lightning-effects","particle-effects","reflection-effects"
  ]),
});

export const ENVIRONMENT_ZONE_LIMITS = Object.freeze({
  minWidth: 320,
  minHeight: 568,
  maxWidth: null,
  maxHeight: null,
});

function createPlacement(
  context: LayoutZoneCalculationContext,
  rect: PixelRect,
): LayoutZonePlacement {
  return Object.freeze({
    zoneId: 'environment',
    rect,
    visible: context.policy.zoneVisibility['environment'],
    order: context.policy.zoneOrder.indexOf('environment'),
    zIndex: ENVIRONMENT_ZONE_DEFINITION.zIndex,
    overflow: ENVIRONMENT_ZONE_DEFINITION.overflow,
    pointerPolicy: ENVIRONMENT_ZONE_DEFINITION.pointerPolicy,
    ariaLabel: ENVIRONMENT_ZONE_DEFINITION.ariaLabel,
    role: ENVIRONMENT_ZONE_DEFINITION.role,
    decorative: ENVIRONMENT_ZONE_DEFINITION.decorative,
    cssVariables: pixelRectToCssVariables('environment', rect),
  });
}

export function calculateEnvironmentZoneLayout(
  context: LayoutZoneCalculationContext,
): LayoutZonePlacement {
  const rect = Object.freeze({
    x: 0,
    y: 0,
    width: context.viewport.visualWidth,
    height: context.viewport.visualHeight,
  });
  return createPlacement(context, rect);
}
