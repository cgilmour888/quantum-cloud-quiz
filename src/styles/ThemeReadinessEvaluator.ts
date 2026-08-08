/**
 * Artifact ID: QCQ-THM-015
 * Artifact Name: ThemeReadinessEvaluator
 * Artifact Purpose: Final evidence-aware readiness authority for integrating, previewing, and releasing the Phase 9 visual system without overstating certification.
 * Artifact Layer: Phase 9 — Visual Authority / RDY
 * Artifact Dependencies: QCQ-THM-012, QCQ-THM-013, QCQ-THM-014
 * Artifact Dependents: integration quality gates, protected preview, production release governance
 * Dependency Graph: Compliance + CapabilityMatrix + ThemeCertification + repository evidence -> ThemeReadinessEvaluator -> integration/release decision
 * Repository Path: QCQ/frontend/src/styles
 * Source File: ThemeReadinessEvaluator.ts
 */

import type { VisualComplianceReport } from './VisualComplianceValidator';
import {
  getVisualCapability,
  type VisualCapabilityId,
  type VisualCapabilityMatrix,
} from './VisualCapabilityMatrix';
import type { ThemeCertificationResult } from './ThemeCertificationEngine';

export type ThemeReadinessStatus =
  | 'blocked'
  | 'conditional'
  | 'platinum-plus-ready'
  | 'master-4k-ready'
  | 'master-8k-ready'
  | 'master-12k-ready'
  | 'enterprise-visual-ready'
  | 'government-visual-ready';

export interface ThemeRepositoryEvidence {
  readonly cleanInstallPass?: boolean;
  readonly strictTypeScriptPass?: boolean;
  readonly eslintPass?: boolean;
  readonly unitTestsPass?: boolean;
  readonly productionBuildPass?: boolean;
  readonly browserMatrixPass?: boolean;
  readonly accessibilityAuditPass?: boolean;
  readonly performanceAuditPass?: boolean;
  readonly visualRegressionPass?: boolean;
  readonly longDurationPass?: boolean;
  readonly protectedPreviewPass?: boolean;
  readonly recoveryBuildPass?: boolean;
}

export interface ThemeReadinessResult {
  readonly schemaVersion: '1.0.0';
  readonly ready: boolean;
  readonly status: ThemeReadinessStatus;
  readonly blockers: readonly string[];
  readonly pending: readonly string[];
  readonly satisfied: readonly string[];
  readonly nextRequiredGate: string | null;
}

function evidenceState(
  evidence: ThemeRepositoryEvidence,
  key: keyof ThemeRepositoryEvidence,
  label: string,
  blockers: string[],
  pending: string[],
  satisfied: string[],
): void {
  const value = evidence[key];
  if (value === true) satisfied.push(label);
  else if (value === false) blockers.push(label);
  else pending.push(label);
}

function capabilitiesSupported(
  matrix: VisualCapabilityMatrix,
  ids: readonly VisualCapabilityId[],
): boolean {
  return ids.every((id) => getVisualCapability(matrix, id).status === 'supported');
}

export function evaluateThemeReadiness(
  compliance: VisualComplianceReport,
  capabilities: VisualCapabilityMatrix,
  certification: ThemeCertificationResult,
  evidence: ThemeRepositoryEvidence = {},
): ThemeReadinessResult {
  const blockers: string[] = [];
  const pending: string[] = [];
  const satisfied: string[] = [];

  if (compliance.compliant) satisfied.push('Phase 9 visual compliance');
  else blockers.push('Phase 9 visual compliance');

  if (capabilities.blockedCount === 0) satisfied.push('No blocked visual capabilities');
  else blockers.push(`${capabilities.blockedCount} visual capabilities blocked`);

  if (certification.certified) satisfied.push(`Theme certification ${certification.level}`);
  else if (certification.level === 'none') pending.push('Theme certification evidence');
  else blockers.push(`Theme certification ${certification.level} rejected`);

  evidenceState(evidence, 'cleanInstallPass', 'clean npm installation', blockers, pending, satisfied);
  evidenceState(evidence, 'strictTypeScriptPass', 'strict TypeScript', blockers, pending, satisfied);
  evidenceState(evidence, 'eslintPass', 'zero-warning ESLint', blockers, pending, satisfied);
  evidenceState(evidence, 'unitTestsPass', 'unit/integration tests', blockers, pending, satisfied);
  evidenceState(evidence, 'productionBuildPass', 'production build', blockers, pending, satisfied);
  evidenceState(evidence, 'browserMatrixPass', 'browser/device matrix', blockers, pending, satisfied);
  evidenceState(evidence, 'accessibilityAuditPass', 'accessibility audit', blockers, pending, satisfied);
  evidenceState(evidence, 'performanceAuditPass', 'visual performance audit', blockers, pending, satisfied);
  evidenceState(evidence, 'visualRegressionPass', 'visual regression', blockers, pending, satisfied);
  evidenceState(evidence, 'longDurationPass', 'long-duration stability', blockers, pending, satisfied);
  evidenceState(evidence, 'protectedPreviewPass', 'protected deployment preview', blockers, pending, satisfied);
  evidenceState(evidence, 'recoveryBuildPass', 'clean-room recovery build', blockers, pending, satisfied);

  let status: ThemeReadinessStatus = 'conditional';
  if (blockers.length > 0) {
    status = 'blocked';
  } else if (pending.length === 0) {
    const governmentCapabilities = capabilitiesSupported(capabilities, [
      'phase9-integrated',
      'phase10-composition-integrated',
      'visual-fidelity-foundation-integrated',
      'master-4k-runtime',
      'master-8k-runtime',
      'forced-colors-runtime',
      'reduced-motion-runtime',
      'zoom-200-runtime',
      'keyboard-touch-stylus-runtime',
      'performance-budget',
      'long-duration-stability',
      'visual-regression',
      'no-raster-shortcuts',
    ]);
    const enterpriseCapabilities = capabilitiesSupported(capabilities, [
      'phase9-integrated',
      'phase10-composition-integrated',
      'master-4k-runtime',
      'forced-colors-runtime',
      'reduced-motion-runtime',
      'zoom-200-runtime',
      'performance-budget',
      'long-duration-stability',
      'no-raster-shortcuts',
    ]);
    const master12 = capabilitiesSupported(capabilities, ['master-12k-readiness']);
    const master8 = capabilitiesSupported(capabilities, ['master-8k-runtime']);
    const master4 = capabilitiesSupported(capabilities, ['master-4k-runtime']);

    if (governmentCapabilities && certification.level === 'government-visual-ready') {
      status = 'government-visual-ready';
    } else if (enterpriseCapabilities && (
      certification.level === 'enterprise-visual-ready' ||
      certification.level === 'government-visual-ready'
    )) {
      status = 'enterprise-visual-ready';
    } else if (master12) {
      status = 'master-12k-ready';
    } else if (master8) {
      status = 'master-8k-ready';
    } else if (master4) {
      status = 'master-4k-ready';
    } else {
      status = 'platinum-plus-ready';
    }
  }

  return Object.freeze({
    schemaVersion: '1.0.0',
    ready: blockers.length === 0 && pending.length === 0,
    status,
    blockers: Object.freeze(blockers),
    pending: Object.freeze(pending),
    satisfied: Object.freeze(satisfied),
    nextRequiredGate: blockers[0] ?? pending[0] ?? null,
  });
}
