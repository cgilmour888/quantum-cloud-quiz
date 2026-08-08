/**
 * Artifact ID: QCQ-ARC-009
 * Artifact Name: IntegrationConflictResolver
 * Artifact Purpose: Deterministic conflict-resolution authority that ranks architectural remedies while preserving permanent ownership and dependency direction.
 * Artifact Layer: Architecture / RES
 * Artifact Dependencies: QCQ-ARC-001, QCQ-ARC-002, QCQ-ARC-003, QCQ-ARC-004, QCQ-ARC-005, QCQ-ARC-006, QCQ-ARC-008
 * Artifact Dependents: QCQ-ARC-010
 * Dependency Graph: ownership/policy/duplicate/dependency/compliance/integration evidence -> IntegrationConflictResolver -> readiness
 * Repository Path: QCQ/frontend/src/architecture
 * Source File: IntegrationConflictResolver.ts
 */

import type { OwnershipRegistry } from './OwnershipRegistry';
import {
  getProtectedOwnership,
} from './OwnershipManifest';
import type {
  DuplicateResponsibilityConflict,
  DuplicateResponsibilityReport,
} from './DuplicateResponsibilityDetector';
import type {
  DependencyIssue,
  DependencyValidationReport,
} from './DependencyValidationEngine';
import type {
  ArchitecturalComplianceReport,
} from './ArchitecturalComplianceEngine';
import type {
  IntegrationContract,
  IntegrationGovernanceRegistry,
} from './IntegrationGovernanceRegistry';

export type IntegrationConflictType =
  | 'ownership'
  | 'dependency'
  | 'integration'
  | 'compliance';

export type IntegrationResolutionAction =
  | 'preserve-owner'
  | 'remove-shadow-claim'
  | 'reverse-dependency'
  | 'introduce-adapter'
  | 'make-dependency-optional'
  | 'suspend-integration'
  | 'split-responsibility'
  | 'constitutional-review'
  | 'no-action';

export interface IntegrationConflict {
  readonly conflictId: string;
  readonly type: IntegrationConflictType;
  readonly severity: 'constitutional' | 'error' | 'warning';
  readonly subject: string;
  readonly message: string;
  readonly relatedArtifacts: readonly string[];
}

export interface IntegrationResolution {
  readonly conflictId: string;
  readonly action: IntegrationResolutionAction;
  readonly priority: number;
  readonly preservesPermanentIds: true;
  readonly transfersOwnership: false;
  readonly rationale: string;
  readonly requiredFollowUp: readonly string[];
}

export interface IntegrationConflictResolutionReport {
  readonly generatedAt: number;
  readonly conflicts: readonly IntegrationConflict[];
  readonly resolutions: readonly IntegrationResolution[];
  readonly unresolvedConstitutionalConflicts: number;
  readonly safeToIntegrate: boolean;
}

function conflict(
  id: string,
  type: IntegrationConflictType,
  severity: IntegrationConflict['severity'],
  subject: string,
  message: string,
  relatedArtifacts: readonly string[],
): IntegrationConflict {
  return Object.freeze({
    conflictId: id,
    type,
    severity,
    subject,
    message,
    relatedArtifacts: Object.freeze([...relatedArtifacts]),
  });
}

export class IntegrationConflictResolver {
  public constructor(
    private readonly ownership: OwnershipRegistry,
    private readonly integrations: IntegrationGovernanceRegistry,
  ) {}

  public resolve(input: {
    readonly duplicateReport: DuplicateResponsibilityReport;
    readonly dependencyReport: DependencyValidationReport;
    readonly complianceReport: ArchitecturalComplianceReport;
  }): IntegrationConflictResolutionReport {
    const conflicts: IntegrationConflict[] = [];

    for (const duplicate of input.duplicateReport.conflicts) {
      conflicts.push(this.fromDuplicate(duplicate));
    }
    for (const dependency of input.dependencyReport.issues) {
      if (dependency.severity === 'info') continue;
      conflicts.push(this.fromDependency(dependency));
    }
    for (const contract of this.integrations.list()) {
      const integrationConflict =
        this.validateIntegrationContract(contract);
      if (integrationConflict) {
        conflicts.push(integrationConflict);
      }
    }
    if (!input.complianceReport.compliant) {
      conflicts.push(
        conflict(
          'ARC-RES-COMPLIANCE',
          'compliance',
          'error',
          'architectural-compliance',
          'Architectural compliance is not passing.',
          [],
        ),
      );
    }

    const unique = new Map<string, IntegrationConflict>();
    for (const entry of conflicts) {
      unique.set(entry.conflictId, entry);
    }
    const normalized = [...unique.values()];
    const resolutions = normalized.map(
      (entry) => this.recommend(entry),
    );
    const unresolvedConstitutionalConflicts =
      normalized.filter(
        (entry) => entry.severity === 'constitutional',
      ).length;

    return Object.freeze({
      generatedAt: Date.now(),
      conflicts: Object.freeze(normalized),
      resolutions: Object.freeze(resolutions),
      unresolvedConstitutionalConflicts,
      safeToIntegrate:
        unresolvedConstitutionalConflicts === 0 &&
        !normalized.some(
          (entry) => entry.severity === 'error',
        ),
    });
  }

  private fromDuplicate(
    duplicate: DuplicateResponsibilityConflict,
  ): IntegrationConflict {
    return conflict(
      `ARC-RES-DUP-${duplicate.id}`,
      'ownership',
      duplicate.severity,
      duplicate.responsibilityId,
      duplicate.message,
      duplicate.artifactIds,
    );
  }

  private fromDependency(
    dependency: DependencyIssue,
  ): IntegrationConflict {
    return conflict(
      `ARC-RES-DPN-${dependency.code}-${dependency.fromArtifactId}-${dependency.toArtifactId}`,
      'dependency',
      dependency.severity === 'constitutional'
        ? 'constitutional'
        : dependency.severity === 'warning'
          ? 'warning'
          : 'error',
      `${dependency.fromArtifactId}->${dependency.toArtifactId}`,
      dependency.message,
      [
        dependency.fromArtifactId,
        dependency.toArtifactId,
      ],
    );
  }

  private validateIntegrationContract(
    contract: IntegrationContract,
  ): IntegrationConflict | null {
    const owner = this.ownership.getOwner(
      contract.responsibilityId,
    );
    if (!owner) {
      return conflict(
        `ARC-RES-INT-${contract.integrationId}`,
        'integration',
        'error',
        contract.integrationId,
        `Integration references unowned responsibility "${contract.responsibilityId}".`,
        [
          contract.sourceArtifactId,
          contract.targetArtifactId,
        ],
      );
    }

    if (contract.transfersOwnership) {
      return conflict(
        `ARC-RES-INT-XFER-${contract.integrationId}`,
        'integration',
        'constitutional',
        contract.integrationId,
        'Integration attempts to transfer ownership.',
        [
          contract.sourceArtifactId,
          contract.targetArtifactId,
        ],
      );
    }

    return null;
  }

  private recommend(
    entry: IntegrationConflict,
  ): IntegrationResolution {
    const protectedOwner =
      getProtectedOwnership(entry.subject);

    let action: IntegrationResolutionAction;
    let rationale: string;
    let followUp: readonly string[];

    if (
      entry.type === 'ownership' &&
      protectedOwner
    ) {
      action = 'preserve-owner';
      rationale =
        `Preserve constitutional owner ${protectedOwner.ownerArtifactId}; integration cannot displace protected ownership.`;
      followUp = [
        'Remove or reclassify shadow ownership claims.',
        'Represent legitimate cross-module use as a dependency or integration contract.',
      ];
    } else if (
      entry.type === 'ownership'
    ) {
      action = 'remove-shadow-claim';
      rationale =
        'Single-owner governance requires one owner and explicit consumers.';
      followUp = [
        'Choose the canonical owner from established architecture evidence.',
        'Convert non-owner claims into dependency or integration records.',
      ];
    } else if (
      entry.type === 'dependency' &&
      /TBL|tablet|APP|application|layout/iu.test(
        entry.message + entry.subject,
      )
    ) {
      action = 'introduce-adapter';
      rationale =
        'Preserve APP -> TBL dependency direction through a composition or adapter boundary.';
      followUp = [
        'Move APP-specific knowledge above the reusable tablet domain.',
        'Retest the dependency graph for cycles and reverse imports.',
      ];
    } else if (
      entry.type === 'integration'
    ) {
      action = 'suspend-integration';
      rationale =
        'An invalid integration must be suspended until responsibility ownership is explicit.';
      followUp = [
        'Resolve ownership first.',
        'Re-register the integration without ownership transfer.',
      ];
    } else if (
      entry.severity === 'constitutional'
    ) {
      action = 'constitutional-review';
      rationale =
        'Constitutional conflicts require an explicit architecture amendment rather than silent refactoring.';
      followUp = [
        'Record the proposed amendment.',
        'Demonstrate why the existing owner or invariant is insufficient.',
        'Regenerate ownership and dependency evidence before approval.',
      ];
    } else {
      action = 'no-action';
      rationale =
        'No deterministic ownership-preserving automatic remedy is safer than explicit review.';
      followUp = ['Review the conflict with architecture evidence.'];
    }

    return Object.freeze({
      conflictId: entry.conflictId,
      action,
      priority:
        entry.severity === 'constitutional'
          ? 100
          : entry.severity === 'error'
            ? 80
            : 50,
      preservesPermanentIds: true,
      transfersOwnership: false,
      rationale,
      requiredFollowUp: Object.freeze([...followUp]),
    });
  }
}
