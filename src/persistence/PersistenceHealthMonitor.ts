/**
 * Artifact ID: QCQ-PER-024
 * Artifact Name: PersistenceHealthMonitor
 * Repository Path: QCQ/frontend/src/persistence/PersistenceHealthMonitor.ts
 */

export type PersistenceHealthEventType =
  | 'save-success'
  | 'save-failure'
  | 'restore-success'
  | 'restore-failure'
  | 'backup-created'
  | 'recovery-success'
  | 'recovery-failure'
  | 'migration-success'
  | 'migration-failure'
  | 'provider-error';

export interface PersistenceHealthEvent {
  readonly type: PersistenceHealthEventType;
  readonly at: number;
  readonly latencyMilliseconds: number | null;
}

export interface PersistenceHealthSnapshot {
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly eventCount: number;
  readonly saveSuccessRate: number | null;
  readonly restoreSuccessRate: number | null;
  readonly recoverySuccessRate: number | null;
  readonly migrationSuccessRate: number | null;
  readonly providerErrors: number;
  readonly averageLatencyMilliseconds: number | null;
}

function rate(events: readonly PersistenceHealthEvent[], success: PersistenceHealthEventType, failure: PersistenceHealthEventType): number | null {
  const passed = events.filter((event) => event.type === success).length;
  const failed = events.filter((event) => event.type === failure).length;
  return passed + failed === 0 ? null : passed / (passed + failed);
}

export class PersistenceHealthMonitor {
  private readonly events: PersistenceHealthEvent[] = [];

  public record(event: PersistenceHealthEvent): void {
    this.events.push(Object.freeze({ ...event }));
  }

  public snapshot(): PersistenceHealthSnapshot {
    const latencies = this.events
      .map((event) => event.latencyMilliseconds)
      .filter((value): value is number => value !== null && Number.isFinite(value) && value >= 0);
    const saveSuccessRate = rate(this.events, 'save-success', 'save-failure');
    const restoreSuccessRate = rate(this.events, 'restore-success', 'restore-failure');
    const recoverySuccessRate = rate(this.events, 'recovery-success', 'recovery-failure');
    const migrationSuccessRate = rate(this.events, 'migration-success', 'migration-failure');
    const providerErrors = this.events.filter((event) => event.type === 'provider-error').length;
    const rates = [saveSuccessRate, restoreSuccessRate, recoverySuccessRate, migrationSuccessRate].filter(
      (value): value is number => value !== null,
    );
    const minimumRate = rates.length === 0 ? 1 : Math.min(...rates);
    const status = providerErrors > 0 || minimumRate < 0.8 ? 'unhealthy' : minimumRate < 0.98 ? 'degraded' : 'healthy';
    return Object.freeze({
      status,
      eventCount: this.events.length,
      saveSuccessRate,
      restoreSuccessRate,
      recoverySuccessRate,
      migrationSuccessRate,
      providerErrors,
      averageLatencyMilliseconds:
        latencies.length === 0 ? null : latencies.reduce((sum, value) => sum + value, 0) / latencies.length,
    });
  }

  public clear(): void {
    this.events.length = 0;
  }
}
