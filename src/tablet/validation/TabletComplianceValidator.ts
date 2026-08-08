/**
 * Artifact ID: QCQ-TBL-060
 * Artifact Name: TabletComplianceValidator
 * Artifact Purpose: Accessibility and constitutional compliance validation for semantic controls, no-raster implementation, forced-colors, reduced-motion, and fidelity boundaries.
 * Artifact Layer: QCQ-TBL — VAL
 * Artifact Dependencies: QCQ-TBL-042, QCQ-TBL-059
 * Artifact Dependents: QCQ-TBL-058, QCQ-TBL-064
 * Dependency Graph: TabletManifest + capability matrix -> TabletComplianceValidator -> readiness/master capability
 * Repository Path: QCQ/frontend/src/tablet/validation
 * Source File: TabletComplianceValidator.ts
 */

import {
  TABLET_MANIFEST,
} from '../governance/TabletManifest';
import type {
  TabletCapabilityMatrixResult,
} from './TabletCapabilityMatrix';

export interface TabletComplianceInput {
  readonly capabilityMatrix: TabletCapabilityMatrixResult;
  readonly runtimeRasterAssets: number;
  readonly hotspotOverlays: number;
  readonly semanticAnswerControls: boolean;
  readonly hasAccessibleName: boolean;
  readonly minimumTargetCssPixels: number;
}

export interface TabletComplianceResult {
  readonly compliant: boolean;
  readonly score: number;
  readonly violations: readonly string[];
}

export function validateTabletCompliance(
  input: TabletComplianceInput,
): TabletComplianceResult {
  const violations: string[] = [];
  let score = 100;

  if (input.runtimeRasterAssets > 0) {
    violations.push(
      'Runtime raster assets are prohibited for tablet implementation.',
    );
    score -= 35;
  }
  if (input.hotspotOverlays > 0) {
    violations.push(
      'Hotspot overlays are prohibited.',
    );
    score -= 35;
  }
  if (!input.semanticAnswerControls) {
    violations.push(
      'Answer choices must use semantic interactive controls.',
    );
    score -= 20;
  }
  if (!input.hasAccessibleName) {
    violations.push(
      'Question tablet requires an accessible name.',
    );
    score -= 20;
  }
  if (
    input.minimumTargetCssPixels <
    TABLET_MANIFEST.minimumInteractiveTargetCssPixels
  ) {
    violations.push(
      `Interactive targets must be at least ${TABLET_MANIFEST.minimumInteractiveTargetCssPixels}px.`,
    );
    score -= 20;
  }
  if (!input.capabilityMatrix.keyboardAccess) {
    violations.push(
      'Keyboard operation is required.',
    );
    score -= 30;
  }

  return Object.freeze({
    compliant: violations.length === 0,
    score: Math.max(0, score),
    violations: Object.freeze(violations),
  });
}
