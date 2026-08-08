/**
 * Artifact ID: QCQ-PER-033
 * Artifact Name: DisasterRecoveryValidator
 * Repository Path: QCQ/frontend/src/persistence/DisasterRecoveryValidator.ts
 */

import type { RecoverySimulationReport } from './RecoverySimulationEngine';

export interface DisasterRecoveryObjective {
  readonly maximumRecoveryTimeMilliseconds: number;
  readonly requireAllCriticalScenarios: boolean;
  readonly minimumScenarioPassRatio: number;
}

export interface DisasterRecoveryReport {
  readonly valid: boolean;
  readonly scenarioPassRatio: number;
  readonly maximumObservedRecoveryTimeMilliseconds: number;
  readonly violations: readonly string[];
}

export class DisasterRecoveryValidator {
  public validate(
    simulation: RecoverySimulationReport,
    objective: DisasterRecoveryObjective,
  ): DisasterRecoveryReport {
    if (
      !Number.isFinite(objective.maximumRecoveryTimeMilliseconds) ||
      objective.maximumRecoveryTimeMilliseconds < 0 ||
      !Number.isFinite(objective.minimumScenarioPassRatio) ||
      objective.minimumScenarioPassRatio < 0 ||
      objective.minimumScenarioPassRatio > 1
    ) {
      throw new Error('Disaster-recovery objectives are invalid.');
    }
    const violations: string[] = [];
    const total = simulation.results.length;
    const passed = simulation.results.filter((result) => result.passed).length;
    const ratio = total === 0 ? 0 : passed / total;
    const maximumObserved = Math.max(0, ...simulation.results.map((result) => result.elapsedMilliseconds));
    if (ratio < objective.minimumScenarioPassRatio) {
      violations.push(`Recovery scenario pass ratio ${ratio.toFixed(3)} is below the required threshold.`);
    }
    if (maximumObserved > objective.maximumRecoveryTimeMilliseconds) {
      violations.push('Observed recovery time exceeds the configured recovery-time objective.');
    }
    if (
      objective.requireAllCriticalScenarios &&
      simulation.results.some((result) => result.critical && !result.passed)
    ) {
      violations.push('At least one critical disaster-recovery scenario failed.');
    }
    return Object.freeze({
      valid: violations.length === 0,
      scenarioPassRatio: ratio,
      maximumObservedRecoveryTimeMilliseconds: maximumObserved,
      violations: Object.freeze(violations),
    });
  }
}
