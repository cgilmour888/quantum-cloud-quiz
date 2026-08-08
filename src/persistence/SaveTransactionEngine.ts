/**
 * Artifact ID: QCQ-PER-020
 * Artifact Name: SaveTransactionEngine
 * Repository Path: QCQ/frontend/src/persistence/SaveTransactionEngine.ts
 */

export interface SaveTransactionStep {
  readonly stepId: string;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface SaveTransactionReport {
  readonly transactionId: string;
  readonly committedStepIds: readonly string[];
  readonly rolledBackStepIds: readonly string[];
  readonly status: 'committed' | 'rolled-back' | 'rollback-failed';
  readonly error: unknown;
}

export class SaveTransactionEngine {
  public async execute(
    transactionId: string,
    steps: readonly SaveTransactionStep[],
  ): Promise<SaveTransactionReport> {
    if (transactionId.trim().length === 0) throw new Error('Transaction identifier is required.');
    const ids = new Set<string>();
    for (const step of steps) {
      if (ids.has(step.stepId)) throw new Error(`Duplicate transaction step: ${step.stepId}`);
      ids.add(step.stepId);
    }

    const committed: SaveTransactionStep[] = [];
    try {
      for (const step of steps) {
        await step.commit();
        committed.push(step);
      }
      return Object.freeze({
        transactionId,
        committedStepIds: Object.freeze(committed.map((step) => step.stepId)),
        rolledBackStepIds: Object.freeze([]),
        status: 'committed',
        error: null,
      });
    } catch (error) {
      const rolledBack: string[] = [];
      let rollbackFailure: unknown = null;
      for (const step of [...committed].reverse()) {
        try {
          await step.rollback();
          rolledBack.push(step.stepId);
        } catch (rollbackError) {
          rollbackFailure = rollbackError;
          break;
        }
      }
      return Object.freeze({
        transactionId,
        committedStepIds: Object.freeze(committed.map((step) => step.stepId)),
        rolledBackStepIds: Object.freeze(rolledBack),
        status: rollbackFailure === null ? 'rolled-back' : 'rollback-failed',
        error: rollbackFailure ?? error,
      });
    }
  }
}
