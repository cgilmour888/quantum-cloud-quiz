/**
 * Artifact ID: QCQ-PER-032
 * Artifact Name: RecoverySimulationEngine
 * Repository Path: QCQ/frontend/src/persistence/RecoverySimulationEngine.ts
 */

export interface RecoverySimulationScenario {
  readonly scenarioId: string;
  readonly description: string;
  readonly critical: boolean;
  execute(): Promise<{ readonly restored: boolean; readonly verified: boolean; readonly elapsedMilliseconds: number }>;
}

export interface RecoverySimulationResult {
  readonly scenarioId: string;
  readonly passed: boolean;
  readonly critical: boolean;
  readonly restored: boolean;
  readonly verified: boolean;
  readonly elapsedMilliseconds: number;
  readonly errorMessage: string | null;
}

export interface RecoverySimulationReport {
  readonly generatedAt: string;
  readonly passed: boolean;
  readonly results: readonly RecoverySimulationResult[];
}

export class RecoverySimulationEngine {
  public async run(
    scenarios: readonly RecoverySimulationScenario[],
    generatedAt = new Date().toISOString(),
  ): Promise<RecoverySimulationReport> {
    const ids = new Set<string>();
    const results: RecoverySimulationResult[] = [];
    for (const scenario of scenarios) {
      if (ids.has(scenario.scenarioId)) throw new Error(`Duplicate recovery scenario: ${scenario.scenarioId}`);
      ids.add(scenario.scenarioId);
      try {
        const result = await scenario.execute();
        results.push(Object.freeze({
          scenarioId: scenario.scenarioId,
          passed: result.restored && result.verified,
          critical: scenario.critical,
          restored: result.restored,
          verified: result.verified,
          elapsedMilliseconds: result.elapsedMilliseconds,
          errorMessage: null,
        }));
      } catch (error) {
        results.push(Object.freeze({
          scenarioId: scenario.scenarioId,
          passed: false,
          critical: scenario.critical,
          restored: false,
          verified: false,
          elapsedMilliseconds: 0,
          errorMessage: error instanceof Error ? error.message : String(error),
        }));
      }
    }
    return Object.freeze({
      generatedAt,
      passed: results.every((result) => result.passed || !result.critical),
      results: Object.freeze(results),
    });
  }
}
