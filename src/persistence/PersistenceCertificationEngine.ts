/**
 * Artifact ID: QCQ-PER-022
 * Artifact Name: PersistenceCertificationEngine
 * Repository Path: QCQ/frontend/src/persistence/PersistenceCertificationEngine.ts
 */

import type { PersistenceReadinessReport } from './PersistenceReadinessEvaluator';
import type { PersistenceComplianceReport } from './PersistenceComplianceValidator';

export interface PersistenceIntegrityCertificationInput {
  readonly valid: boolean;
  readonly inspectedRecords: number;
  readonly failures: number;
}

export interface PersistenceCertificationReport {
  readonly certificationId: string;
  readonly generatedAt: string;
  readonly certified: boolean;
  readonly readinessScore: number;
  readonly complianceScore: number;
  readonly integrityValid: boolean;
  readonly findings: readonly string[];
}

export class PersistenceCertificationEngine {
  public certify(
    certificationId: string,
    readiness: PersistenceReadinessReport,
    compliance: PersistenceComplianceReport,
    integrity: PersistenceIntegrityCertificationInput,
    generatedAt = new Date().toISOString(),
  ): PersistenceCertificationReport {
    if (certificationId.trim().length === 0) throw new Error('Certification identifier is required.');
    const findings: string[] = [
      ...readiness.blockers,
      ...readiness.warnings,
      ...compliance.violations,
      ...compliance.warnings,
    ];
    if (!integrity.valid) {
      findings.push(
        `Integrity verification failed for ${integrity.failures} of ${integrity.inspectedRecords} inspected records.`,
      );
    }
    const certified =
      readiness.state === 'ready' &&
      readiness.score === 100 &&
      compliance.valid &&
      compliance.score === 100 &&
      integrity.valid;

    return Object.freeze({
      certificationId,
      generatedAt,
      certified,
      readinessScore: readiness.score,
      complianceScore: compliance.score,
      integrityValid: integrity.valid,
      findings: Object.freeze(findings),
    });
  }
}
