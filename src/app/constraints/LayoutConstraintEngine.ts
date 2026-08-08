/**
 * Artifact ID: QCQ-APP-002-011
 * Artifact Name: LayoutConstraintEngine
 * Artifact Purpose: Enforcement of zone size, safe-area, collision, and placement constraints.
 * Artifact Layer: QCQ-APP-002 — CNS (Constraint Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> LayoutConstraintEngine -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/constraints
 * Source File: LayoutConstraintEngine.ts
 */
import type {
  LayoutConstraintSet,
  LayoutConstraintViolation,
} from '../types/LayoutEngine.types';
import type {
  LayoutZoneId,
  LayoutZonePlacement,
  PixelRect,
} from '../types/LayoutEngine.types';
import type { ViewportLayoutContract } from '../types/LayoutEngine.types';
import { pixelRectToCssVariables } from '../scaling/LayoutScalingRules';

function intersects(left: PixelRect, right: PixelRect, gap: number): boolean {
  return !(
    left.x + left.width + gap <= right.x ||
    right.x + right.width + gap <= left.x ||
    left.y + left.height + gap <= right.y ||
    right.y + right.height + gap <= left.y
  );
}

export interface LayoutConstraintResult {
  readonly placements: ReadonlyMap<LayoutZoneId, LayoutZonePlacement>;
  readonly violations: readonly LayoutConstraintViolation[];
}

export class LayoutConstraintEngine {
  public enforce(
    placements: ReadonlyMap<LayoutZoneId, LayoutZonePlacement>,
    constraints: LayoutConstraintSet,
    viewport: ViewportLayoutContract,
    gap: number,
  ): LayoutConstraintResult {
    const corrected = new Map<LayoutZoneId, LayoutZonePlacement>();
    const violations: LayoutConstraintViolation[] = [];

    for (const [zoneId, placement] of placements) {
      const constraint = constraints.zoneConstraints[zoneId];
      if (!placement.visible || zoneId === 'environment') {
        corrected.set(zoneId, placement);
        continue;
      }

      const rect = { ...placement.rect };
      const original = { ...placement.rect };
      rect.width = Math.max(constraint.size.minWidth, rect.width);
      rect.height = Math.max(constraint.size.minHeight, rect.height);
      if (constraint.size.maxWidth !== null) rect.width = Math.min(constraint.size.maxWidth, rect.width);
      if (constraint.size.maxHeight !== null) rect.height = Math.min(constraint.size.maxHeight, rect.height);

      const correctedSize = rect.width !== original.width || rect.height !== original.height;
      if (correctedSize) {
        violations.push({
          code: rect.width < original.width || rect.height < original.height ? 'above-maximum-size' : 'below-minimum-size',
          zoneId,
          message: `Zone "${zoneId}" was resized to satisfy its size contract.`,
          severity: 'warning',
          corrected: true,
        });
      }

      if (!constraint.mayOverflowViewport && viewport.category !== 'compact' && viewport.category !== 'micro') {
        const minX = viewport.safeArea.left;
        const minY = viewport.safeArea.top;
        const maxX = viewport.visualWidth - viewport.safeArea.right - rect.width;
        const maxY = viewport.visualHeight - viewport.safeArea.bottom - rect.height;
        const nextX = Math.min(Math.max(rect.x, minX), Math.max(minX, maxX));
        const nextY = Math.min(Math.max(rect.y, minY), Math.max(minY, maxY));
        if (nextX !== rect.x || nextY !== rect.y) {
          rect.x = nextX;
          rect.y = nextY;
          violations.push({
            code: 'outside-safe-area',
            zoneId,
            message: `Zone "${zoneId}" was moved inside the viewport safe area.`,
            severity: 'warning',
            corrected: true,
          });
        }
      }

      const frozenRect = Object.freeze(rect);
      corrected.set(zoneId, Object.freeze({
        ...placement,
        rect: frozenRect,
        cssVariables: pixelRectToCssVariables(zoneId, frozenRect),
      }));
    }

    const interactive = [...corrected.values()].filter(
      (placement) => placement.visible && !placement.decorative,
    );
    for (let leftIndex = 0; leftIndex < interactive.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < interactive.length; rightIndex += 1) {
        const left = interactive[leftIndex]!;
        const right = interactive[rightIndex]!;
        if (intersects(left.rect, right.rect, Math.max(0, gap * 0.2))) {
          violations.push({
            code: 'zone-collision',
            zoneId: right.zoneId,
            message: `Zone "${right.zoneId}" intersects zone "${left.zoneId}".`,
            severity: 'error',
            corrected: false,
          });
        }
      }
    }

    return Object.freeze({
      placements: corrected,
      violations: Object.freeze(violations),
    });
  }
}
