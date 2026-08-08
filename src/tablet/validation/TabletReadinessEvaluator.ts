/**
 * Artifact ID: QCQ-TBL-058
 * Artifact Name: TabletReadinessEvaluator
 * Artifact Purpose: Tablet launch/readiness scoring authority combining runtime validation, capability matrix, and compliance evidence.
 * Artifact Layer: QCQ-TBL — RDY
 * Artifact Dependencies: QCQ-TBL-057, QCQ-TBL-059, QCQ-TBL-060
 * Artifact Dependents: QCQ-TBL-001, QCQ-TBL-064
 * Dependency Graph: validation + matrix + compliance -> TabletReadinessEvaluator -> shell/master capability
 * Repository Path: QCQ/frontend/src/tablet/validation
 * Source File: TabletReadinessEvaluator.ts
 */

import type {
  TabletCapabilityMatrixResult,
} from './TabletCapabilityMatrix';
import type {
  TabletComplianceResult,
} from './TabletComplianceValidator';
import type {
  TabletValidationResult,
} from './TabletValidationEngine';

export interface TabletReadinessResult {
  readonly state: 'ready' | 'degraded' | 'blocked';
  readonly score: number;
  readonly evaluatedAt: number;
  readonly blockers: readonly string[];
  readonly warnings: readonly string[];
}

export function evaluateTabletReadiness(
  validation: TabletValidationResult,
  matrix: TabletCapabilityMatrixResult,
  compliance: TabletComplianceResult,
): TabletReadinessResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  if (!validation.valid) {
    blockers.push('Tablet structural validation failed.');
    score -= 40;
  }
  if (!compliance.compliant) {
    blockers.push('Tablet compliance validation failed.');
    score -= 40;
  }
  if (!matrix.cinematicFrame) {
    warnings.push(
      'Cinematic frame effects are reduced on this rendering profile.',
    );
    score -= 5;
  }
  if (!matrix.hoverExpansion) {
    warnings.push(
      'Hover expansion is unavailable; keyboard focus expansion remains active.',
    );
    score -= 2;
  }

  score = Math.max(0, Math.min(100, score));

  return Object.freeze({
    state:
      blockers.length > 0
        ? 'blocked'
        : warnings.length > 0
          ? 'degraded'
          : 'ready',
    score,
    evaluatedAt: Date.now(),
    blockers: Object.freeze(blockers),
    warnings: Object.freeze(warnings),
  });
}
