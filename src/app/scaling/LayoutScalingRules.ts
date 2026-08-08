/**
 * Artifact ID: QCQ-APP-002-014
 * Artifact Name: LayoutScalingRules
 * Artifact Purpose: Normalized MASTER geometry conversion, CSS variable generation, and proportional scaling rules.
 * Artifact Layer: QCQ-APP-002 — RSP (Scaling Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> LayoutScalingRules -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/scaling
 * Source File: LayoutScalingRules.ts
 */
import {
  MASTER_4K_REFERENCE_HEIGHT,
  MASTER_4K_REFERENCE_WIDTH,
} from '../constants/LayoutEngine.constants';
import type { NormalizedRect, PixelRect } from '../types/LayoutEngine.types';
import type { ViewportLayoutContract } from '../types/LayoutEngine.types';

export interface LayoutScaleFactors {
  readonly x: number;
  readonly y: number;
  readonly uniform: number;
  readonly text: number;
  readonly effects: number;
}

export function clampLayoutNumber(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function resolveScaleFactors(
  viewport: ViewportLayoutContract,
  textScale = 1,
  effectScale = 1,
): LayoutScaleFactors {
  const x = viewport.visualWidth / MASTER_4K_REFERENCE_WIDTH;
  const y = viewport.visualHeight / MASTER_4K_REFERENCE_HEIGHT;
  const uniform = Math.min(x, y);
  return Object.freeze({
    x,
    y,
    uniform,
    text: clampLayoutNumber(uniform * textScale, 0.72, 1.45),
    effects: clampLayoutNumber(uniform * effectScale, 0.25, 1.5),
  });
}

export function normalizedRectToPixels(
  rect: NormalizedRect,
  viewport: ViewportLayoutContract,
): PixelRect {
  const usableWidth = Math.max(1, viewport.visualWidth - viewport.safeArea.left - viewport.safeArea.right);
  const usableHeight = Math.max(1, viewport.visualHeight - viewport.safeArea.top - viewport.safeArea.bottom);
  return Object.freeze({
    x: viewport.safeArea.left + rect.x * usableWidth,
    y: viewport.safeArea.top + rect.y * usableHeight,
    width: rect.width * usableWidth,
    height: rect.height * usableHeight,
  });
}

export function pixelRectToCssVariables(
  zoneName: string,
  rect: PixelRect,
): Readonly<Record<string, string>> {
  return Object.freeze({
    [`--qcq-zone-${zoneName}-x`]: `${rect.x.toFixed(3)}px`,
    [`--qcq-zone-${zoneName}-y`]: `${rect.y.toFixed(3)}px`,
    [`--qcq-zone-${zoneName}-width`]: `${rect.width.toFixed(3)}px`,
    [`--qcq-zone-${zoneName}-height`]: `${rect.height.toFixed(3)}px`,
  });
}

export function fitRectWithinBounds(rect: PixelRect, bounds: PixelRect): PixelRect {
  const width = Math.min(rect.width, bounds.width);
  const height = Math.min(rect.height, bounds.height);
  return Object.freeze({
    x: clampLayoutNumber(rect.x, bounds.x, bounds.x + bounds.width - width),
    y: clampLayoutNumber(rect.y, bounds.y, bounds.y + bounds.height - height),
    width,
    height,
  });
}
