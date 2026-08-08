/**
 * Artifact ID: QCQ-CMP-016
 * Artifact Name: ComposerReadinessEvaluator
 * Artifact Purpose: Evidence-based composition readiness evaluation across lifecycle, required capabilities, validation, conflicts, performance, accessibility, security, integration, and deployment evidence.
 * Artifact Layer: Phase 10 — Master Composer / RDY (Readiness Authority)
 * Artifact Dependencies: QCQ-CMP-011, QCQ-CMP-012, QCQ-CMP-015, QCQ-CMP-019
 * Artifact Dependents: QCQ-CMP-017
 * Dependency Graph: QCQ-CMP-011, QCQ-CMP-012, QCQ-CMP-015, QCQ-CMP-019 -> ComposerReadinessEvaluator -> QCQ-CMP-017
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerReadinessEvaluator.ts
 */

import type { ComposerLifecycleSnapshot } from './ComposerLifecycleEngine';
import type { ComposerCapabilitySnapshot } from './ComposerCapabilityMatrix';
import type { ComposerConflictResolutionReport } from './ComposerConflictResolver';
import type { ComposerPerformanceSnapshot } from './ComposerPerformanceProfile';

export type ComposerReadinessStatus = 'blocked' | 'conditional' | 'platform-ready' | 'enterprise-ready' | 'government-ready';

export interface ComposerReadinessEvidence {
  readonly validationPassed: boolean;
  readonly accessibilityPassed: boolean;
  readonly securityPassed: boolean;
  readonly integrationPassed: boolean;
  readonly targetRepositoryBuildPassed: boolean;
  readonly browserReviewPassed: boolean;
  readonly recoveryPassed: boolean;
  readonly deploymentPreviewPassed: boolean;
}

export interface ComposerReadinessInput {
  readonly lifecycle: ComposerLifecycleSnapshot;
  readonly capabilities: ComposerCapabilitySnapshot;
  readonly conflicts: ComposerConflictResolutionReport;
  readonly performance: ComposerPerformanceSnapshot;
  readonly evidence: ComposerReadinessEvidence;
}

export interface ComposerReadinessReport {
  readonly status: ComposerReadinessStatus;
  readonly ready: boolean;
  readonly blockers: readonly string[];
  readonly warnings: readonly string[];
  readonly evaluatedAt: string;
}

export class ComposerReadinessEvaluator {
  public evaluate(input: ComposerReadinessInput): ComposerReadinessReport {
    const blockers:string[]=[]; const warnings:string[]=[];
    if (!['ready','degraded'].includes(input.lifecycle.phase)) blockers.push(`lifecycle:${input.lifecycle.phase}`);
    if (!input.evidence.validationPassed) blockers.push('validation');
    if (!input.evidence.accessibilityPassed) blockers.push('accessibility');
    if (!input.evidence.securityPassed) blockers.push('security');
    if (!input.evidence.integrationPassed) blockers.push('integration');
    if (!input.conflicts.canContinue) blockers.push(...input.conflicts.blockingConflictIds.map((id)=>`conflict:${id}`));
    blockers.push(...input.capabilities.missingCore.map((id)=>`core-capability:${id}`));
    if (!input.performance.withinBudget) warnings.push(...input.performance.violations.map((item)=>`performance:${item}`));
    if (input.lifecycle.degraded) warnings.push('lifecycle:degraded');
    if (blockers.length>0) return this.report('blocked', blockers, warnings);

    const enterpriseMissing=input.capabilities.missingEnterprise;
    const enterpriseEvidence=input.evidence.targetRepositoryBuildPassed && input.evidence.browserReviewPassed;
    if (enterpriseMissing.length>0 || !enterpriseEvidence) {
      enterpriseMissing.forEach((id)=>warnings.push(`enterprise-capability:${id}`));
      if (!enterpriseEvidence) warnings.push('enterprise-evidence-incomplete');
      return this.report(warnings.length?'conditional':'platform-ready', [], warnings);
    }

    const governmentMissing=input.capabilities.missingGovernment;
    const governmentEvidence=input.evidence.recoveryPassed && input.evidence.deploymentPreviewPassed;
    if (governmentMissing.length===0 && governmentEvidence && input.performance.withinBudget) return this.report('government-ready', [], warnings);
    governmentMissing.forEach((id)=>warnings.push(`government-capability:${id}`));
    if (!governmentEvidence) warnings.push('government-evidence-incomplete');
    return this.report('enterprise-ready', [], warnings);
  }

  private report(status: ComposerReadinessStatus, blockers: readonly string[], warnings: readonly string[]): ComposerReadinessReport {
    return Object.freeze({ status, ready:status!=='blocked', blockers:Object.freeze([...blockers]), warnings:Object.freeze([...warnings]), evaluatedAt:new Date().toISOString() });
  }
}
