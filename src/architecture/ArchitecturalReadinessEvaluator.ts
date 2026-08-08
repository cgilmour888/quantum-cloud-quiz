/**
 * Artifact ID: QCQ-ARC-010
 * Artifact Name: ArchitecturalReadinessEvaluator
 * Artifact Purpose: Enterprise and government readiness authority combining architecture compliance, ownership certification, integration health, repository evidence, and unresolved conflicts.
 * Artifact Layer: Architecture / RDY
 * Artifact Dependencies: QCQ-ARC-001, QCQ-ARC-002, QCQ-ARC-006, QCQ-ARC-007, QCQ-ARC-008, QCQ-ARC-009
 * Artifact Dependents: None
 * Dependency Graph: ownership/compliance/certification/integration/conflict/repository evidence -> ArchitecturalReadinessEvaluator -> release/governance decision
 * Repository Path: QCQ/frontend/src/architecture
 * Source File: ArchitecturalReadinessEvaluator.ts
 */

import type {
  OwnershipRegistry,
} from './OwnershipRegistry';
import {
  OWNERSHIP_MANIFEST,
} from './OwnershipManifest';
import type {
  ArchitecturalComplianceReport,
} from './ArchitecturalComplianceEngine';
import type {
  OwnershipCertificationReport,
} from './OwnershipCertificationEngine';
import type {
  IntegrationGovernanceRegistry,
} from './IntegrationGovernanceRegistry';
import type {
  IntegrationConflictResolutionReport,
} from './IntegrationConflictResolver';

export type ArchitecturalReadinessGrade =
  | 'blocked'
  | 'conditional'
  | 'enterprise-ready'
  | 'government-ready';

export interface RepositoryArchitectureEvidence {
  readonly installedInTargetRepository: boolean;
  readonly typecheckPassed: boolean;
  readonly lintPassed: boolean;
  readonly testsPassed: boolean;
  readonly productionBuildPassed: boolean;
  readonly npmAuditReviewed: boolean;
  readonly dependencyGraphSynchronized: boolean;
  readonly ownershipContractSynchronized: boolean;
  readonly integrationChecklistPassed: boolean;
  readonly recoveryArchiveVerified: boolean;
  readonly accessibilityValidationPassed: boolean;
  readonly securityReviewPassed: boolean;
  readonly deploymentPreviewPassed: boolean;
}

export interface ArchitecturalReadinessReport {
  readonly grade: ArchitecturalReadinessGrade;
  readonly score: number;
  readonly generatedAt: number;
  readonly architecturallyCertified: boolean;
  readonly ownershipCertified: boolean;
  readonly integrationCertified: boolean;
  readonly enterpriseReady: boolean;
  readonly governmentReady: boolean;
  readonly blockers: readonly string[];
  readonly advisories: readonly string[];
  readonly evidence: Readonly<Record<string, boolean | number | string>>;
}

export interface ArchitecturalReadinessInput {
  readonly compliance: ArchitecturalComplianceReport;
  readonly ownershipCertification: OwnershipCertificationReport;
  readonly integrationResolution: IntegrationConflictResolutionReport;
  readonly repository: RepositoryArchitectureEvidence;
  readonly requireGovernmentGrade?: boolean;
}

function failure(
  condition: boolean,
  message: string,
  penalty: number,
  blockers: string[],
): number {
  if (condition) return 0;
  blockers.push(message);
  return penalty;
}

export class ArchitecturalReadinessEvaluator {
  public constructor(
    private readonly ownership: OwnershipRegistry,
    private readonly integrations: IntegrationGovernanceRegistry,
  ) {}

  public evaluate(
    input: ArchitecturalReadinessInput,
  ): ArchitecturalReadinessReport {
    const blockers: string[] = [];
    const advisories: string[] = [];
    let score = 100;

    score -= failure(
      input.compliance.compliant,
      'Architectural compliance is not passing.',
      25,
      blockers,
    );
    score -= failure(
      input.ownershipCertification.certified,
      'Ownership certification is not passing.',
      20,
      blockers,
    );
    score -= failure(
      input.integrationResolution.safeToIntegrate,
      'Integration conflict resolution has unresolved errors.',
      20,
      blockers,
    );
    score -= failure(
      input.repository.installedInTargetRepository,
      'Architecture governance is not verified as installed in the target repository.',
      10,
      blockers,
    );
    score -= failure(
      input.repository.typecheckPassed,
      'Target repository TypeScript gate has not passed.',
      10,
      blockers,
    );
    score -= failure(
      input.repository.lintPassed,
      'Target repository lint gate has not passed.',
      8,
      blockers,
    );
    score -= failure(
      input.repository.testsPassed,
      'Applicable automated tests have not passed.',
      8,
      blockers,
    );
    score -= failure(
      input.repository.productionBuildPassed,
      'Production build has not passed.',
      12,
      blockers,
    );
    score -= failure(
      input.repository.dependencyGraphSynchronized,
      'Dependency graph is not synchronized to executable repository state.',
      8,
      blockers,
    );
    score -= failure(
      input.repository.ownershipContractSynchronized,
      'Architectural ownership contract is not synchronized to executable repository state.',
      8,
      blockers,
    );
    score -= failure(
      input.repository.integrationChecklistPassed,
      'Integration checklist has not passed.',
      8,
      blockers,
    );
    score -= failure(
      input.repository.accessibilityValidationPassed,
      'Accessibility validation has not passed.',
      10,
      blockers,
    );
    score -= failure(
      input.repository.securityReviewPassed,
      'Security review has not passed.',
      10,
      blockers,
    );

    if (!input.repository.npmAuditReviewed) {
      advisories.push(
        'npm audit or the equivalent dependency-security review remains pending.',
      );
    }
    if (!input.repository.recoveryArchiveVerified) {
      advisories.push(
        'Golden recovery archive restoration has not been verified.',
      );
    }
    if (!input.repository.deploymentPreviewPassed) {
      advisories.push(
        'Protected deployment preview has not been verified.',
      );
    }

    const activeIntegrations =
      this.integrations.list('active').length;
    const ownershipSnapshot =
      this.ownership.getSnapshot();
    const exclusiveResponsibilities =
      ownershipSnapshot.responsibilities.filter(
        (responsibility) => responsibility.exclusive,
      );
    const activelyOwnedExclusive =
      exclusiveResponsibilities.filter((responsibility) => {
        const owner = this.ownership.getOwner(
          responsibility.id,
        );
        return owner?.status === 'active';
      }).length;

    if (
      activelyOwnedExclusive !==
      exclusiveResponsibilities.length
    ) {
      blockers.push(
        'Not every exclusive responsibility has an active owner.',
      );
      score -= 20;
    }

    score = Math.max(0, Math.min(100, score));

    const architecturallyCertified =
      input.compliance.compliant &&
      input.integrationResolution
        .unresolvedConstitutionalConflicts === 0;
    const ownershipCertified =
      input.ownershipCertification.certified;
    const integrationCertified =
      input.integrationResolution.safeToIntegrate;

    const enterpriseReady =
      architecturallyCertified &&
      ownershipCertified &&
      integrationCertified &&
      input.repository.installedInTargetRepository &&
      input.repository.typecheckPassed &&
      input.repository.lintPassed &&
      input.repository.testsPassed &&
      input.repository.productionBuildPassed &&
      input.repository.dependencyGraphSynchronized &&
      input.repository.ownershipContractSynchronized &&
      input.repository.integrationChecklistPassed &&
      input.repository.accessibilityValidationPassed;

    const governmentReady =
      enterpriseReady &&
      input.repository.securityReviewPassed &&
      input.repository.npmAuditReviewed &&
      input.repository.recoveryArchiveVerified &&
      input.repository.deploymentPreviewPassed;

    let grade: ArchitecturalReadinessGrade;
    if (governmentReady) {
      grade = 'government-ready';
    } else if (
      enterpriseReady &&
      !input.requireGovernmentGrade
    ) {
      grade = 'enterprise-ready';
    } else if (
      blockers.length === 0 ||
      score >= 75
    ) {
      grade = 'conditional';
    } else {
      grade = 'blocked';
    }

    return Object.freeze({
      grade,
      score,
      generatedAt: Date.now(),
      architecturallyCertified,
      ownershipCertified,
      integrationCertified,
      enterpriseReady,
      governmentReady,
      blockers: Object.freeze(blockers),
      advisories: Object.freeze(advisories),
      evidence: Object.freeze({
        manifestVersion:
          OWNERSHIP_MANIFEST.manifestVersion,
        registryRevision:
          ownershipSnapshot.revision,
        exclusiveResponsibilities:
          exclusiveResponsibilities.length,
        activelyOwnedExclusive,
        activeIntegrations,
        unresolvedConstitutionalConflicts:
          input.integrationResolution
            .unresolvedConstitutionalConflicts,
        complianceChecks:
          input.compliance.checks.length,
        ownershipCertificates:
          input.ownershipCertification
            .certificates.length,
      }),
    });
  }
}
