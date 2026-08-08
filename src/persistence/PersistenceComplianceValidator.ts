/**
 * Artifact ID: QCQ-PER-023
 * Artifact Name: PersistenceComplianceValidator
 * Repository Path: QCQ/frontend/src/persistence/PersistenceComplianceValidator.ts
 */

export interface PersistenceComplianceInput {
  readonly permanentIdsUnique: boolean;
  readonly sourcePathsUnique: boolean;
  readonly singleOwnershipValid: boolean;
  readonly dependencyGraphValid: boolean;
  readonly strictTypeSafety: boolean;
  readonly integrityVerificationEnabled: boolean;
  readonly backupRecoveryEnabled: boolean;
  readonly migrationsForwardOnly: boolean;
  readonly destructiveOperationsGoverned: boolean;
  readonly telemetryRequiresConsent: boolean;
  readonly directNetworkCallsPresent: boolean;
}

export interface PersistenceComplianceReport {
  readonly valid: boolean;
  readonly score: number;
  readonly violations: readonly string[];
  readonly warnings: readonly string[];
}

export class PersistenceComplianceValidator {
  public validate(input: PersistenceComplianceInput): PersistenceComplianceReport {
    const violations: string[] = [];
    const warnings: string[] = [];
    const checks: Array<[boolean, string]> = [
      [input.permanentIdsUnique, 'Permanent persistence identifiers must be unique.'],
      [input.sourcePathsUnique, 'Persistence source paths must be unique.'],
      [input.singleOwnershipValid, 'Persistence responsibilities must have one primary owner.'],
      [input.dependencyGraphValid, 'Persistence dependency graph must be complete and acyclic.'],
      [input.strictTypeSafety, 'Persistence production source must satisfy strict type safety.'],
      [input.integrityVerificationEnabled, 'Integrity verification must be enabled.'],
      [input.backupRecoveryEnabled, 'Backup and recovery must be enabled.'],
      [input.migrationsForwardOnly, 'Schema migrations must be forward-only.'],
      [input.destructiveOperationsGoverned, 'Destructive persistence operations must be governed.'],
      [input.telemetryRequiresConsent, 'Persistence telemetry must require explicit consent.'],
      [!input.directNetworkCallsPresent, 'Persistence core must not contain direct network calls.'],
    ];
    for (const [passed, message] of checks) if (!passed) violations.push(message);
    if (input.telemetryRequiresConsent && !input.directNetworkCallsPresent) {
      warnings.push('External telemetry sinks still require integration-time privacy review.');
    }
    const score = Math.round(((checks.length - violations.length) / checks.length) * 100);
    return Object.freeze({
      valid: violations.length === 0,
      score,
      violations: Object.freeze(violations),
      warnings: Object.freeze(warnings),
    });
  }
}
