/**
 * Artifact ID: QCQ-TBL-064
 * Artifact Name: MasterTabletCapabilityEngine
 * Artifact Purpose: MASTER fidelity readiness evaluation engine for 4K/8K/12K spatial, interaction, accessibility, and rendering readiness.
 * Artifact Layer: QCQ-TBL — CAP
 * Artifact Dependencies: QCQ-TBL-058, QCQ-TBL-059, QCQ-TBL-060, QCQ-TBL-061, QCQ-TBL-063
 * Artifact Dependents: QCQ-TBL-001, launch/integration certification
 * Dependency Graph: readiness + capability/compliance + MASTER contract -> MasterTabletCapabilityEngine -> shell/launch gates
 * Repository Path: QCQ/frontend/src/tablet/master
 * Source File: MasterTabletCapabilityEngine.ts
 */

import type {
  TabletReadinessResult,
} from '../validation/TabletReadinessEvaluator';
import type {
  TabletCapabilityMatrixResult,
} from '../validation/TabletCapabilityMatrix';
import type {
  TabletComplianceResult,
} from '../validation/TabletComplianceValidator';
import {
  MASTER_TABLET_MANIFEST,
} from './MasterTabletManifest';

export interface MasterTabletCapabilityResult {
  readonly ready: boolean;
  readonly score: number;
  readonly fourKReady: boolean;
  readonly eightKReady: boolean;
  readonly twelveKReady: boolean;
  readonly interactionReady: boolean;
  readonly accessibilityReady: boolean;
  readonly rasterIndependent: boolean;
  readonly blockers: readonly string[];
}

export function evaluateMasterTabletCapability(
  readiness: TabletReadinessResult,
  matrix: TabletCapabilityMatrixResult,
  compliance: TabletComplianceResult,
): MasterTabletCapabilityResult {
  const blockers: string[] = [];

  if (readiness.state === 'blocked') {
    blockers.push(...readiness.blockers);
  }
  if (!compliance.compliant) {
    blockers.push(...compliance.violations);
  }
  if (!matrix.keyboardAccess) {
    blockers.push('Keyboard capability is required.');
  }

  const rasterIndependent =
    MASTER_TABLET_MANIFEST.runtimeArtworkUsage === false &&
    MASTER_TABLET_MANIFEST.imageOverlayUsage === false &&
    MASTER_TABLET_MANIFEST.hotspotOverlayUsage === false;

  if (!rasterIndependent) {
    blockers.push(
      'MASTER tablet must remain independent of runtime artwork.',
    );
  }

  const base = Math.min(
    readiness.score,
    compliance.score,
    matrix.fidelityScore,
  );

  return Object.freeze({
    ready: blockers.length === 0,
    score: Math.max(0, base),
    fourKReady: blockers.length === 0,
    eightKReady: blockers.length === 0,
    twelveKReady: blockers.length === 0,
    interactionReady:
      matrix.coreInteractive &&
      matrix.keyboardAccess,
    accessibilityReady:
      compliance.compliant &&
      matrix.reducedMotionReady &&
      matrix.forcedColorsReady,
    rasterIndependent,
    blockers: Object.freeze(blockers),
  });
}
