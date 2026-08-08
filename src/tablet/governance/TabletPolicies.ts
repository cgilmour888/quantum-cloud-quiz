/**
 * Artifact ID: QCQ-TBL-044
 * Artifact Name: TabletPolicies
 * Artifact Purpose: Tablet runtime and accessibility policy authority.
 * Artifact Layer: QCQ-TBL — POL
 * Artifact Dependencies: QCQ-TBL-042, QCQ-TBL-045
 * Artifact Dependents: QCQ-TBL-002, QCQ-TBL-010, QCQ-TBL-046, QCQ-TBL-057
 * Dependency Graph: manifest + capabilities -> TabletPolicies -> layout/question/composition/validation
 * Repository Path: QCQ/frontend/src/tablet/governance
 * Source File: TabletPolicies.ts
 */

import {
  TABLET_MANIFEST,
} from './TabletManifest';
import {
  type TabletCapabilitiesSnapshot,
} from './TabletCapabilities';

export interface TabletPolicy {
  readonly minimumInteractiveTarget: number;
  readonly allowDecorativeMotion: boolean;
  readonly allowFrameGlow: boolean;
  readonly allowEnergyRailAnimation: boolean;
  readonly allowHoverExpansion: boolean;
  readonly preserveQuestionFocus: boolean;
  readonly useForcedColorFallback: boolean;
  readonly optionColumns: 1 | 2;
  readonly maximumVisibleAnswerLines: number;
}

export function resolveTabletPolicy(
  capabilities: TabletCapabilitiesSnapshot,
): TabletPolicy {
  const compact = capabilities.width < 780;
  const constrained =
    capabilities.forcedColors ||
    capabilities.reducedMotion;

  return Object.freeze({
    minimumInteractiveTarget:
      capabilities.pointerCoarse
        ? 48
        : TABLET_MANIFEST.minimumInteractiveTargetCssPixels,
    allowDecorativeMotion:
      !capabilities.reducedMotion &&
      !capabilities.forcedColors,
    allowFrameGlow:
      !capabilities.forcedColors,
    allowEnergyRailAnimation:
      !constrained,
    allowHoverExpansion:
      capabilities.hover && capabilities.pointerFine,
    preserveQuestionFocus: true,
    useForcedColorFallback:
      capabilities.forcedColors,
    optionColumns:
      compact ? 1 : 1,
    maximumVisibleAnswerLines:
      compact ? 3 : 2,
  });
}
