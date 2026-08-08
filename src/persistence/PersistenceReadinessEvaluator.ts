/**
 * Artifact ID: QCQ-PER-021
 * Artifact Name: PersistenceReadinessEvaluator
 * Repository Path: QCQ/frontend/src/persistence/PersistenceReadinessEvaluator.ts
 */

export interface PersistenceReadinessInput {
  readonly providerReady: boolean;
  readonly dependencyGraphValid: boolean;
  readonly ownershipValid: boolean;
  readonly capabilityCoverage: number;
  readonly migrationReady: boolean;
  readonly recoveryReady: boolean;
  readonly integrityReady: boolean;
  readonly autosaveReady: boolean;
}

export interface PersistenceReadinessReport {
  readonly state: 'ready' | 'degraded' | 'blocked';
  readonly score: number;
  readonly criteria: Readonly<Record<keyof PersistenceReadinessInput, boolean | number>>;
  readonly blockers: readonly string[];
  readonly warnings: readonly string[];
}

function clampScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

export class PersistenceReadinessEvaluator {
  public evaluate(input: PersistenceReadinessInput): PersistenceReadinessReport {
    const blockers: string[] = [];
    const warnings: string[] = [];
    if (!input.providerReady) blockers.push('Persistence provider is not ready.');
    if (!input.dependencyGraphValid) blockers.push('Persistence dependency graph is invalid.');
    if (!input.ownershipValid) blockers.push('Persistence ownership registry is invalid.');
    if (!input.integrityReady) blockers.push('Persistence integrity verification is not ready.');
    if (!input.migrationReady) warnings.push('Schema migration readiness is incomplete.');
    if (!input.recoveryReady) warnings.push('Recovery readiness is incomplete.');
    if (!input.autosaveReady) warnings.push('Autosave readiness is incomplete.');
    if (input.capabilityCoverage < 1) {
      warnings.push(`Capability coverage is ${(input.capabilityCoverage * 100).toFixed(1)}%.`);
    }

    const score = clampScore(
      (input.providerReady ? 15 : 0) +
        (input.dependencyGraphValid ? 15 : 0) +
        (input.ownershipValid ? 15 : 0) +
        Math.max(0, Math.min(1, input.capabilityCoverage)) * 15 +
        (input.migrationReady ? 10 : 0) +
        (input.recoveryReady ? 10 : 0) +
        (input.integrityReady ? 15 : 0) +
        (input.autosaveReady ? 5 : 0),
    );

    return Object.freeze({
      state: blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'degraded' : 'ready',
      score,
      criteria: Object.freeze({ ...input }),
      blockers: Object.freeze(blockers),
      warnings: Object.freeze(warnings),
    });
  }
}
