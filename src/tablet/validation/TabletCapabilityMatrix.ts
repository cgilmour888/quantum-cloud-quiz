/**
 * Artifact ID: QCQ-TBL-059
 * Artifact Name: TabletCapabilityMatrix
 * Artifact Purpose: Resolution and capability certification matrix for compact, desktop, 4K, 8K, and 12K tablet surfaces.
 * Artifact Layer: QCQ-TBL — CAP
 * Artifact Dependencies: QCQ-TBL-042, QCQ-TBL-045, QCQ-TBL-052, QCQ-TBL-056
 * Artifact Dependents: QCQ-TBL-058, QCQ-TBL-060, QCQ-TBL-064
 * Dependency Graph: tablet/frame/interaction capabilities -> TabletCapabilityMatrix -> readiness/compliance/master capability
 * Repository Path: QCQ/frontend/src/tablet/validation
 * Source File: TabletCapabilityMatrix.ts
 */

import type {
  TabletCapabilitiesSnapshot,
} from '../governance/TabletCapabilities';
import type {
  FrameCapabilitiesSnapshot,
} from '../frame/FrameCapabilities';
import type {
  InteractionCapabilitiesSnapshot,
} from '../interaction/InteractionCapabilities';

export interface TabletCapabilityMatrixResult {
  readonly resolutionClass:
    TabletCapabilitiesSnapshot['resolutionClass'];
  readonly coreInteractive: boolean;
  readonly semanticSvg: boolean;
  readonly cinematicFrame: boolean;
  readonly hoverExpansion: boolean;
  readonly keyboardAccess: boolean;
  readonly reducedMotionReady: boolean;
  readonly forcedColorsReady: boolean;
  readonly highResolutionReady: boolean;
  readonly fidelityScore: number;
}

export function evaluateTabletCapabilityMatrix(
  tablet: TabletCapabilitiesSnapshot,
  frame: FrameCapabilitiesSnapshot,
  interaction: InteractionCapabilitiesSnapshot,
): TabletCapabilityMatrixResult {
  const highResolutionReady =
    tablet.resolutionClass === '4k' ||
    tablet.resolutionClass === '8k' ||
    tablet.resolutionClass === '12k';

  const semanticSvg = tablet.svg && frame.svg;
  const cinematicFrame =
    semanticSvg &&
    !frame.forcedColors &&
    !frame.reducedTransparency;
  const hoverExpansion =
    interaction.hover &&
    interaction.stylusHoverPossible;

  let fidelityScore = 70;
  if (semanticSvg) fidelityScore += 10;
  if (cinematicFrame) fidelityScore += 10;
  if (frame.webgl2) fidelityScore += 5;
  if (highResolutionReady) fidelityScore += 5;

  return Object.freeze({
    resolutionClass: tablet.resolutionClass,
    coreInteractive: true,
    semanticSvg,
    cinematicFrame,
    hoverExpansion,
    keyboardAccess: interaction.keyboard,
    reducedMotionReady: true,
    forcedColorsReady: true,
    highResolutionReady,
    fidelityScore: Math.min(100, fidelityScore),
  });
}
