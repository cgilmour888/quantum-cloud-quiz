/**
 * Artifact ID: QCQ-ARC-003
 * Artifact Name: ArchitecturalPolicyEngine
 * Artifact Purpose: Policy authority that evaluates proposed ownership, dependency, and integration changes against immutable QCQ architectural rules.
 * Artifact Layer: Architecture / POL
 * Artifact Dependencies: QCQ-ARC-001, QCQ-ARC-002
 * Artifact Dependents: QCQ-ARC-006, QCQ-ARC-009, QCQ-ARC-010
 * Dependency Graph: OwnershipManifest + OwnershipRegistry -> ArchitecturalPolicyEngine -> compliance/conflict/readiness
 * Repository Path: QCQ/frontend/src/architecture
 * Source File: ArchitecturalPolicyEngine.ts
 */

import type { OwnershipRegistry } from './OwnershipRegistry';
import {
  LAYER_DEPENDENCY_RULES,
  OWNERSHIP_MANIFEST,
  getProtectedOwnership,
  getResponsibilityDefinition,
  type ArchitecturalDependency,
  type ArtifactArchitectureDescriptor,
  type OwnershipAssignment,
} from './OwnershipManifest';

export type ArchitecturalPolicyDecision =
  | 'allow'
  | 'deny'
  | 'review';

export type ArchitecturalPolicySeverity =
  | 'constitutional'
  | 'error'
  | 'warning'
  | 'info';

export interface ArchitecturalPolicyFinding {
  readonly code: string;
  readonly decision: ArchitecturalPolicyDecision;
  readonly severity: ArchitecturalPolicySeverity;
  readonly message: string;
  readonly subject: string;
  readonly rule: string;
}

export interface ArchitecturalPolicyReport {
  readonly allowed: boolean;
  readonly generatedAt: number;
  readonly findings: readonly ArchitecturalPolicyFinding[];
}

export interface OwnershipProposal {
  readonly type: 'ownership';
  readonly assignment: OwnershipAssignment;
}

export interface DependencyProposal {
  readonly type: 'dependency';
  readonly dependency: ArchitecturalDependency;
  readonly from: ArtifactArchitectureDescriptor;
  readonly to: ArtifactArchitectureDescriptor;
}

export interface IntegrationProposal {
  readonly type: 'integration';
  readonly sourceArtifactId: string;
  readonly targetArtifactId: string;
  readonly responsibilityId: string;
  readonly transfersOwnership: boolean;
  readonly rationale: string;
}

export type ArchitecturalProposal =
  | OwnershipProposal
  | DependencyProposal
  | IntegrationProposal;

function finding(
  code: string,
  decision: ArchitecturalPolicyDecision,
  severity: ArchitecturalPolicySeverity,
  message: string,
  subject: string,
  rule: string,
): ArchitecturalPolicyFinding {
  return Object.freeze({
    code,
    decision,
    severity,
    message,
    subject,
    rule,
  });
}

export class ArchitecturalPolicyEngine {
  public constructor(
    private readonly registry: OwnershipRegistry,
  ) {}

  public evaluate(
    proposal: ArchitecturalProposal,
  ): ArchitecturalPolicyReport {
    const findings: ArchitecturalPolicyFinding[] = [];

    switch (proposal.type) {
      case 'ownership':
        this.evaluateOwnership(proposal.assignment, findings);
        break;
      case 'dependency':
        this.evaluateDependency(proposal, findings);
        break;
      case 'integration':
        this.evaluateIntegration(proposal, findings);
        break;
    }

    if (findings.length === 0) {
      findings.push(
        finding(
          'ARC-POL-000',
          'allow',
          'info',
          'No constitutional or architectural policy violation was detected.',
          proposal.type,
          'default-allow-after-explicit-rules',
        ),
      );
    }

    return Object.freeze({
      allowed: !findings.some((entry) => entry.decision === 'deny'),
      generatedAt: Date.now(),
      findings: Object.freeze(findings),
    });
  }

  public evaluateBatch(
    proposals: readonly ArchitecturalProposal[],
  ): ArchitecturalPolicyReport {
    const reports = proposals.map((proposal) => this.evaluate(proposal));
    return Object.freeze({
      allowed: reports.every((report) => report.allowed),
      generatedAt: Date.now(),
      findings: Object.freeze(
        reports.flatMap((report) => report.findings),
      ),
    });
  }

  private evaluateOwnership(
    assignment: OwnershipAssignment,
    findings: ArchitecturalPolicyFinding[],
  ): void {
    const definition = getResponsibilityDefinition(
      assignment.responsibilityId,
    );
    if (!definition) {
      findings.push(
        finding(
          'ARC-POL-001',
          'deny',
          'error',
          `Unknown responsibility "${assignment.responsibilityId}".`,
          assignment.responsibilityId,
          'registered-responsibilities-only',
        ),
      );
      return;
    }

    const protectedAssignment = getProtectedOwnership(
      assignment.responsibilityId,
    );
    if (
      protectedAssignment &&
      protectedAssignment.ownerArtifactId !== assignment.ownerArtifactId
    ) {
      findings.push(
        finding(
          'ARC-POL-002',
          'deny',
          'constitutional',
          `${assignment.responsibilityId} is protected by ${protectedAssignment.ownerArtifactId}; proposed owner ${assignment.ownerArtifactId} is prohibited.`,
          assignment.responsibilityId,
          'permanent-protected-ownership',
        ),
      );
    }

    const existing = this.registry.getOwner(
      assignment.responsibilityId,
    );
    if (
      existing &&
      existing.status === 'active' &&
      existing.assignment.ownerArtifactId !== assignment.ownerArtifactId &&
      definition.exclusive
    ) {
      findings.push(
        finding(
          'ARC-POL-003',
          'deny',
          'constitutional',
          `Exclusive responsibility is already owned by ${existing.assignment.ownerArtifactId}.`,
          assignment.responsibilityId,
          'single-owner-principle',
        ),
      );
    }

    if (
      definition.criticality === 'constitutional' &&
      assignment.ownerLayer !== definition.layer
    ) {
      findings.push(
        finding(
          'ARC-POL-004',
          'deny',
          'constitutional',
          `Constitutional responsibility requires layer "${definition.layer}", not "${assignment.ownerLayer}".`,
          assignment.responsibilityId,
          'constitutional-layer-affinity',
        ),
      );
    }
  }

  private evaluateDependency(
    proposal: DependencyProposal,
    findings: ArchitecturalPolicyFinding[],
  ): void {
    const { dependency, from, to } = proposal;

    if (
      dependency.fromArtifactId !== from.artifactId ||
      dependency.toArtifactId !== to.artifactId
    ) {
      findings.push(
        finding(
          'ARC-POL-010',
          'deny',
          'error',
          'Dependency endpoints do not match the supplied artifact descriptors.',
          `${dependency.fromArtifactId}->${dependency.toArtifactId}`,
          'dependency-endpoint-integrity',
        ),
      );
      return;
    }

    if (from.artifactId === to.artifactId) {
      findings.push(
        finding(
          'ARC-POL-011',
          'deny',
          'error',
          'Self dependencies are prohibited.',
          from.artifactId,
          'no-self-dependency',
        ),
      );
    }

    const explicit = LAYER_DEPENDENCY_RULES.find(
      (rule) => rule.from === from.layer && rule.to === to.layer,
    );
    if (explicit && !explicit.allowed) {
      findings.push(
        finding(
          'ARC-POL-012',
          'deny',
          'constitutional',
          explicit.rationale,
          `${from.layer}->${to.layer}`,
          'layer-dependency-direction',
        ),
      );
    }

    if (
      from.layer === 'tablet' &&
      (to.layer === 'application' || to.layer === 'layout')
    ) {
      findings.push(
        finding(
          'ARC-POL-013',
          'deny',
          'constitutional',
          'Reusable TBL code may not depend upon APP or application macro-layout code.',
          `${from.artifactId}->${to.artifactId}`,
          'APP-depends-on-TBL-not-reverse',
        ),
      );
    }

    if (
      from.layer === 'gameplay' &&
      ['leaderboards', 'ai', 'analytics'].includes(to.layer)
    ) {
      findings.push(
        finding(
          'ARC-POL-014',
          'deny',
          'error',
          'Core gameplay may publish evidence outward but may not require optional enhancement domains.',
          `${from.layer}->${to.layer}`,
          'core-does-not-depend-on-enhancement',
        ),
      );
    }
  }

  private evaluateIntegration(
    proposal: IntegrationProposal,
    findings: ArchitecturalPolicyFinding[],
  ): void {
    const owner = this.registry.getOwner(
      proposal.responsibilityId,
    );
    if (!owner) {
      findings.push(
        finding(
          'ARC-POL-020',
          'review',
          'warning',
          `No active owner is registered for responsibility "${proposal.responsibilityId}".`,
          proposal.responsibilityId,
          'integration-requires-known-owner',
        ),
      );
    }

    if (proposal.transfersOwnership) {
      findings.push(
        finding(
          'ARC-POL-021',
          'deny',
          'constitutional',
          'An integration contract may not silently transfer responsibility ownership.',
          `${proposal.sourceArtifactId}->${proposal.targetArtifactId}`,
          'integration-does-not-transfer-ownership',
        ),
      );
    }

    if (
      proposal.sourceArtifactId === proposal.targetArtifactId
    ) {
      findings.push(
        finding(
          'ARC-POL-022',
          'deny',
          'error',
          'Self-integration records are prohibited.',
          proposal.sourceArtifactId,
          'no-self-integration',
        ),
      );
    }
  }

  public constitutionalInvariants(): readonly string[] {
    return OWNERSHIP_MANIFEST.invariants;
  }
}
