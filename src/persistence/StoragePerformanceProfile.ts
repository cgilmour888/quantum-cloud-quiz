/**
 * Artifact ID: QCQ-PER-027
 * Artifact Name: StoragePerformanceProfile
 * Repository Path: QCQ/frontend/src/persistence/StoragePerformanceProfile.ts
 */

export type StoragePerformanceOperation = 'read' | 'write' | 'delete' | 'serialize' | 'deserialize';

export interface StoragePerformanceSample {
  readonly operation: StoragePerformanceOperation;
  readonly durationMilliseconds: number;
  readonly bytes: number | null;
}

export interface StoragePerformanceSnapshot {
  readonly sampleCount: number;
  readonly averageLatencyMilliseconds: number;
  readonly p95LatencyMilliseconds: number;
  readonly throughputBytesPerSecond: number | null;
  readonly byOperation: Readonly<Record<StoragePerformanceOperation, number>>;
}

const OPERATIONS: readonly StoragePerformanceOperation[] = Object.freeze([
  'read',
  'write',
  'delete',
  'serialize',
  'deserialize',
]);

export class StoragePerformanceProfile {
  private readonly samples: StoragePerformanceSample[] = [];

  public record(sample: StoragePerformanceSample): void {
    if (!Number.isFinite(sample.durationMilliseconds) || sample.durationMilliseconds < 0) {
      throw new Error('Storage performance duration must be a non-negative finite number.');
    }
    if (sample.bytes !== null && (!Number.isFinite(sample.bytes) || sample.bytes < 0)) {
      throw new Error('Storage performance byte count must be null or non-negative.');
    }
    this.samples.push(Object.freeze({ ...sample }));
  }

  public async measure<T>(
    operation: StoragePerformanceOperation,
    work: () => Promise<T>,
    bytes: number | null = null,
  ): Promise<T> {
    const started = globalThis.performance?.now?.() ?? Date.now();
    try {
      return await work();
    } finally {
      const ended = globalThis.performance?.now?.() ?? Date.now();
      this.record({ operation, durationMilliseconds: Math.max(0, ended - started), bytes });
    }
  }

  public snapshot(): StoragePerformanceSnapshot {
    const durations = this.samples.map((sample) => sample.durationMilliseconds).sort((a, b) => a - b);
    const totalDuration = durations.reduce((sum, value) => sum + value, 0);
    const byteSamples = this.samples.filter(
      (sample): sample is StoragePerformanceSample & { readonly bytes: number } => sample.bytes !== null,
    );
    const totalBytes = byteSamples.reduce((sum, sample) => sum + sample.bytes, 0);
    const byteDuration = byteSamples.reduce((sum, sample) => sum + sample.durationMilliseconds, 0);
    const byOperation = Object.fromEntries(
      OPERATIONS.map((operation) => {
        const values = this.samples.filter((sample) => sample.operation === operation);
        return [
          operation,
          values.length === 0
            ? 0
            : values.reduce((sum, sample) => sum + sample.durationMilliseconds, 0) / values.length,
        ];
      }),
    ) as Record<StoragePerformanceOperation, number>;
    const p95Index = durations.length === 0 ? 0 : Math.min(durations.length - 1, Math.ceil(durations.length * 0.95) - 1);
    return Object.freeze({
      sampleCount: this.samples.length,
      averageLatencyMilliseconds: durations.length === 0 ? 0 : totalDuration / durations.length,
      p95LatencyMilliseconds: durations[p95Index] ?? 0,
      throughputBytesPerSecond: byteDuration <= 0 ? null : totalBytes / (byteDuration / 1000),
      byOperation: Object.freeze(byOperation),
    });
  }
}
