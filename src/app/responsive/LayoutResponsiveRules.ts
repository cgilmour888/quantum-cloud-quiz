/**
 * Artifact ID: QCQ-APP-002-013
 * Artifact Name: LayoutResponsiveRules
 * Artifact Purpose: Responsive-mode authority governing stacked, paired, command, and MASTER-fixed spatial behavior.
 * Artifact Layer: QCQ-APP-002 — RSP (Responsive Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> LayoutResponsiveRules -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/responsive
 * Source File: LayoutResponsiveRules.ts
 */
import type { LayoutViewportCategory } from '../types/LayoutEngine.types';
import type { LayoutZoneId } from '../types/LayoutEngine.types';

export type LayoutResponsiveMode = 'master-fixed' | 'master-fluid' | 'stacked-pairs' | 'stacked-single';

export interface LayoutResponsiveRule {
  readonly category: LayoutViewportCategory;
  readonly mode: LayoutResponsiveMode;
  readonly zoneOrder: readonly LayoutZoneId[];
  readonly contentHeightMultiplier: number;
  readonly consoleColumns: 1 | 2;
  readonly centerTablet: boolean;
}

export const LAYOUT_RESPONSIVE_RULES: Readonly<Record<LayoutViewportCategory, LayoutResponsiveRule>> =
  Object.freeze({
    cinematic: Object.freeze({
      category: 'cinematic',
      mode: 'master-fixed',
      zoneOrder: Object.freeze(['environment', 'performance', 'tablet', 'metrics', 'player-banner'] satisfies readonly LayoutZoneId[]),
      contentHeightMultiplier: 1,
      consoleColumns: 2,
      centerTablet: true,
    }),
    command: Object.freeze({
      category: 'command',
      mode: 'master-fluid',
      zoneOrder: Object.freeze(['environment', 'performance', 'tablet', 'metrics', 'player-banner'] satisfies readonly LayoutZoneId[]),
      contentHeightMultiplier: 1,
      consoleColumns: 2,
      centerTablet: true,
    }),
    balanced: Object.freeze({
      category: 'balanced',
      mode: 'stacked-pairs',
      zoneOrder: Object.freeze(['environment', 'tablet', 'performance', 'metrics', 'player-banner'] satisfies readonly LayoutZoneId[]),
      contentHeightMultiplier: 1.65,
      consoleColumns: 2,
      centerTablet: true,
    }),
    compact: Object.freeze({
      category: 'compact',
      mode: 'stacked-single',
      zoneOrder: Object.freeze(['environment', 'tablet', 'performance', 'metrics', 'player-banner'] satisfies readonly LayoutZoneId[]),
      contentHeightMultiplier: 2.55,
      consoleColumns: 1,
      centerTablet: false,
    }),
    micro: Object.freeze({
      category: 'micro',
      mode: 'stacked-single',
      zoneOrder: Object.freeze(['environment', 'tablet', 'performance', 'metrics', 'player-banner'] satisfies readonly LayoutZoneId[]),
      contentHeightMultiplier: 2.8,
      consoleColumns: 1,
      centerTablet: false,
    }),
  });

export function getResponsiveRule(category: LayoutViewportCategory): LayoutResponsiveRule {
  return LAYOUT_RESPONSIVE_RULES[category];
}
