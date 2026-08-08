/**
 * Artifact ID: QCQ-PER-029
 * Artifact Name: PersistenceAnalyticsBridge
 * Repository Path: QCQ/frontend/src/persistence/PersistenceAnalyticsBridge.ts
 */

import type { PersistenceHealthSnapshot } from './PersistenceHealthMonitor';
import type { StoragePerformanceSnapshot } from './StoragePerformanceProfile';
import type { StorageQuotaSnapshot } from './StorageQuotaManager';

export interface PersistenceAnalyticsSnapshot {
  readonly generatedAt: string;
  readonly health: PersistenceHealthSnapshot;
  readonly storage: StorageQuotaSnapshot;
  readonly performance: StoragePerformanceSnapshot;
  readonly saveCount: number;
  readonly restoreCount: number;
  readonly recoveryCount: number;
}

export interface PersistenceAnalyticsConsumer {
  ingest(snapshot: PersistenceAnalyticsSnapshot): Promise<void> | void;
}

export class PersistenceAnalyticsBridge {
  public constructor(private readonly consumer: PersistenceAnalyticsConsumer) {}

  public async publish(snapshot: PersistenceAnalyticsSnapshot): Promise<void> {
    if (snapshot.saveCount < 0 || snapshot.restoreCount < 0 || snapshot.recoveryCount < 0) {
      throw new Error('Persistence analytics counters cannot be negative.');
    }
    await this.consumer.ingest(Object.freeze({ ...snapshot }));
  }
}
