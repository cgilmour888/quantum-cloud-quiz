/**
 * Artifact ID: QCQ-TBL-077
 * Artifact Name: EffectsReadinessEvaluator
 * Artifact Purpose: Production-readiness authority combining validation, compliance, capability, budget, and performance evidence into a release decision.
 * Artifact Layer: Premium Effects / RDY
 * Artifact Dependencies: QCQ-TBL-068, QCQ-TBL-072, QCQ-TBL-074, QCQ-TBL-075, QCQ-TBL-076
 * Artifact Dependents: QCQ-TBL-080
 * Dependency Graph: capabilities + performance + budget + validation + compliance -> readiness -> master contract/release gate
 * Repository Path: QCQ/frontend/src/effects/validation
 * Source File: EffectsReadinessEvaluator.ts
 */

import type { EffectsCapabilitySnapshot } from '../governance/EffectsCapabilities';
import type { EffectsPerformanceProfile } from '../performance/EffectsPerformanceProfile';
import type { EffectsBudgetSnapshot } from '../performance/EffectsBudgetManager';
import type { EffectsValidationReport } from './EffectsValidator';
import type { EffectsComplianceReport } from './EffectsComplianceEngine';

export type EffectsReadinessGrade = 'blocked' | 'conditional' | 'ready';

export interface EffectsReadinessReport {
  readonly grade: EffectsReadinessGrade;
  readonly score: number;
  readonly generatedAt: number;
  readonly blockers: readonly string[];
  readonly advisories: readonly string[];
  readonly productionReady: boolean;
}

export interface EffectsReadinessEvidence {
  readonly capabilities: EffectsCapabilitySnapshot;
  readonly performance: EffectsPerformanceProfile;
  readonly budget: EffectsBudgetSnapshot;
  readonly validation: EffectsValidationReport;
  readonly compliance: EffectsComplianceReport;
  readonly targetRepositoryTypecheckPassed: boolean;
  readonly targetRepositoryLintPassed: boolean;
  readonly targetRepositoryBuildPassed: boolean;
  readonly reducedMotionReviewed: boolean;
  readonly forcedColorsReviewed: boolean;
  readonly visualReviewPassed: boolean;
}

export function evaluateEffectsReadiness(
  evidence: EffectsReadinessEvidence,
): EffectsReadinessReport {
  const blockers: string[] = [];
  const advisories: string[] = [];
  let score = 100;

  if (!evidence.validation.valid) { blockers.push('Effects validation failed.'); score -= 30; }
  if (!evidence.compliance.compliant) { blockers.push('Effects compliance failed.'); score -= 30; }
  if (!evidence.budget.withinBudget) { blockers.push('Effects budget is exceeded.'); score -= 20; }
  if (!evidence.targetRepositoryTypecheckPassed) { blockers.push('Target repository TypeScript gate has not passed.'); score -= 20; }
  if (!evidence.targetRepositoryLintPassed) { blockers.push('Target repository lint gate has not passed.'); score -= 15; }
  if (!evidence.targetRepositoryBuildPassed) { blockers.push('Target repository production build has not passed.'); score -= 25; }
  if (!evidence.reducedMotionReviewed) { blockers.push('Reduced-motion behavior is not verified.'); score -= 15; }
  if (!evidence.forcedColorsReviewed) { blockers.push('Forced-colors behavior is not verified.'); score -= 15; }
  if (!evidence.visualReviewPassed) { blockers.push('MASTER-convergence visual review has not passed.'); score -= 15; }

  if (evidence.performance.deviceClass === 'constrained') {
    advisories.push('Constrained device class should default to Performance effects quality.');
  }
  if (!evidence.capabilities.webgl2) {
    advisories.push('WebGL2 is unavailable; current baseline remains valid because core effects use CSS/SVG/Canvas 2D.');
  }
  if (evidence.capabilities.saveData) {
    advisories.push('Data-saver is active; decorative effects should remain at Performance quality or Off.');
  }

  score = Math.max(0, Math.min(100, score));
  const grade: EffectsReadinessGrade =
    blockers.length === 0 ? 'ready' :
    score >= 70 ? 'conditional' : 'blocked';

  return Object.freeze({
    grade,
    score,
    generatedAt: Date.now(),
    blockers: Object.freeze(blockers),
    advisories: Object.freeze(advisories),
    productionReady: grade === 'ready',
  });
}
