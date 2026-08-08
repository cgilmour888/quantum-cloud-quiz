/**
 * Artifact ID: QCQ-ARC-006
 * Artifact Name: ArchitecturalComplianceEngine
 * Artifact Purpose: Constitutional compliance authority combining ownership, duplication, dependency, and policy evidence into an auditable architectural compliance decision.
 * Artifact Layer: Architecture / CMP
 * Artifact Dependencies: QCQ-ARC-001, QCQ-ARC-002, QCQ-ARC-003, QCQ-ARC-004, QCQ-ARC-005
 * Artifact Dependents: QCQ-ARC-007, QCQ-ARC-009, QCQ-ARC-010
 * Dependency Graph: ownership + manifest + policy + duplicate + dependency evidence -> ArchitecturalComplianceEngine -> certification/conflict/readiness
 * Repository Path: QCQ/frontend/src/architecture
 * Source File: ArchitecturalComplianceEngine.ts
 */

import type {
  OwnershipRegistry,
  OwnershipRegistrySnapshot,
} from './OwnershipRegistry';
import {
  OWNERSHIP_MANIFEST,
} from './OwnershipManifest';
import {
  ArchitecturalPolicyEngine,
  type ArchitecturalProposal,
} from './ArchitecturalPolicyEngine';
import {
  DuplicateResponsibilityDetector,
  type DuplicateResponsibilityReport,
} from './DuplicateResponsibilityDetector';
import {
  DependencyValidationEngine,
  type DependencyValidationReport,
} from './DependencyValidationEngine';

export type ArchitecturalComplianceStatus =
  | 'pass'
  | 'fail';

export interface ArchitecturalComplianceCheck {
  readonly id: string;
  readonly status: ArchitecturalComplianceStatus;
  readonly requirement: string;
  readonly evidence: string;
}

export interface ArchitecturalComplianceReport {
  readonly compliant: boolean;
  readonly generatedAt: number;
  readonly checks: readonly ArchitecturalComplianceCheck[];
  readonly duplicateReport: DuplicateResponsibilityReport;
  readonly dependencyReport: DependencyValidationReport;
  readonly policyViolationCount: number;
}

export interface ArchitecturalRuntimeEvidence {
  readonly primaryMainCount: number;
  readonly pageSkipLinkCount: number;
  readonly tabletScrollOwnerCount: number;
  readonly tblImportsAppLayer: boolean;
  readonly gradingMutatedByPresentation: boolean;
  readonly runtimeMasterArtworkUsage: boolean;
  readonly imageOverlayUsage: boolean;
  readonly hotspotOverlayUsage: boolean;
  readonly effectsInterceptPointerInput: boolean;
  readonly optionalEnhancementBlocksCore: boolean;
}

export interface ArchitecturalComplianceInput {
  readonly runtime: ArchitecturalRuntimeEvidence;
  readonly proposals?: readonly ArchitecturalProposal[];
}

function check(
  id: string,
  requirement: string,
  passed: boolean,
  evidence: string,
): ArchitecturalComplianceCheck {
  return Object.freeze({
    id,
    status: passed ? 'pass' : 'fail',
    requirement,
    evidence,
  });
}

export class ArchitecturalComplianceEngine {
  private readonly policyEngine: ArchitecturalPolicyEngine;
  private readonly duplicateDetector =
    new DuplicateResponsibilityDetector();
  private readonly dependencyEngine: DependencyValidationEngine;

  public constructor(
    private readonly registry: OwnershipRegistry,
  ) {
    this.policyEngine = new ArchitecturalPolicyEngine(registry);
    this.dependencyEngine =
      new DependencyValidationEngine(this.policyEngine);
  }

  public evaluate(
    input: ArchitecturalComplianceInput,
  ): ArchitecturalComplianceReport {
    const snapshot = this.registry.getSnapshot();
    const duplicateReport =
      this.duplicateDetector.analyze(snapshot);
    const dependencyReport =
      this.dependencyEngine.validate(snapshot);
    const policyReport =
      this.policyEngine.evaluateBatch(input.proposals ?? []);

    const checks = [
      check(
        'ARC-C001',
        'Every exclusive responsibility has one owner.',
        duplicateReport.clean,
        `${duplicateReport.conflicts.length} ownership conflict(s).`,
      ),
      check(
        'ARC-C002',
        'Registered dependencies satisfy direction and cycle rules.',
        dependencyReport.valid,
        `${dependencyReport.issues.length} dependency issue(s), ${dependencyReport.cycleCount} cycle(s).`,
      ),
      check(
        'ARC-C003',
        'Proposed architecture changes satisfy policy.',
        policyReport.allowed,
        `${policyReport.findings.filter((finding) => finding.decision === 'deny').length} denied policy finding(s).`,
      ),
      check(
        'ARC-C004',
        'APP-002 remains sole primary application landmark owner.',
        input.runtime.primaryMainCount === 1,
        `primaryMainCount=${input.runtime.primaryMainCount}`,
      ),
      check(
        'ARC-C005',
        'Application exposes one page skip link.',
        input.runtime.pageSkipLinkCount === 1,
        `pageSkipLinkCount=${input.runtime.pageSkipLinkCount}`,
      ),
      check(
        'ARC-C006',
        'TBL-003 remains the single tablet scroll owner.',
        input.runtime.tabletScrollOwnerCount === 1,
        `tabletScrollOwnerCount=${input.runtime.tabletScrollOwnerCount}`,
      ),
      check(
        'ARC-C007',
        'TBL code does not depend upon APP source.',
        !input.runtime.tblImportsAppLayer,
        `tblImportsAppLayer=${String(input.runtime.tblImportsAppLayer)}`,
      ),
      check(
        'ARC-C008',
        'Presentation state never mutates authoritative grading.',
        !input.runtime.gradingMutatedByPresentation,
        `gradingMutatedByPresentation=${String(input.runtime.gradingMutatedByPresentation)}`,
      ),
      check(
        'ARC-C009',
        'MASTER artwork is never a runtime UI surface.',
        !input.runtime.runtimeMasterArtworkUsage,
        `runtimeMasterArtworkUsage=${String(input.runtime.runtimeMasterArtworkUsage)}`,
      ),
      check(
        'ARC-C010',
        'Image overlays are prohibited.',
        !input.runtime.imageOverlayUsage,
        `imageOverlayUsage=${String(input.runtime.imageOverlayUsage)}`,
      ),
      check(
        'ARC-C011',
        'Hotspot overlays are prohibited.',
        !input.runtime.hotspotOverlayUsage,
        `hotspotOverlayUsage=${String(input.runtime.hotspotOverlayUsage)}`,
      ),
      check(
        'ARC-C012',
        'Decorative effects do not intercept pointer input.',
        !input.runtime.effectsInterceptPointerInput,
        `effectsInterceptPointerInput=${String(input.runtime.effectsInterceptPointerInput)}`,
      ),
      check(
        'ARC-C013',
        'Optional enhancements never block core offline gameplay.',
        !input.runtime.optionalEnhancementBlocksCore,
        `optionalEnhancementBlocksCore=${String(input.runtime.optionalEnhancementBlocksCore)}`,
      ),
      check(
        'ARC-C014',
        'Constitutional manifest preserves web-native visual implementation.',
        !OWNERSHIP_MANIFEST.runtimeMasterArtworkUsage &&
          !OWNERSHIP_MANIFEST.imageOverlayUsage &&
          !OWNERSHIP_MANIFEST.hotspotOverlayUsage,
        `manifestVersion=${OWNERSHIP_MANIFEST.manifestVersion}`,
      ),
    ];

    return Object.freeze({
      compliant: checks.every(
        (entry) => entry.status === 'pass',
      ),
      generatedAt: Date.now(),
      checks: Object.freeze(checks),
      duplicateReport,
      dependencyReport,
      policyViolationCount: policyReport.findings.filter(
        (finding) => finding.decision === 'deny',
      ).length,
    });
  }

  public snapshot(): OwnershipRegistrySnapshot {
    return this.registry.getSnapshot();
  }
}
