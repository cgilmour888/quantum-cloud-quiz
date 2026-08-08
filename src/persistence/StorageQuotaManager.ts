/**
 * Artifact ID: QCQ-PER-026
 * Artifact Name: StorageQuotaManager
 * Repository Path: QCQ/frontend/src/persistence/StorageQuotaManager.ts
 */

export interface StorageQuotaSnapshot {
  readonly quotaBytes: number | null;
  readonly usageBytes: number | null;
  readonly availableBytes: number | null;
  readonly utilizationRatio: number | null;
  readonly state: 'unknown' | 'healthy' | 'warning' | 'critical';
}

export interface StorageQuotaPolicy {
  readonly warningRatio: number;
  readonly criticalRatio: number;
  readonly reservedBytes: number;
}

export const DEFAULT_STORAGE_QUOTA_POLICY: StorageQuotaPolicy = Object.freeze({
  warningRatio: 0.8,
  criticalRatio: 0.92,
  reservedBytes: 512 * 1024,
});

export class StorageQuotaManager {
  public constructor(private readonly policy: StorageQuotaPolicy = DEFAULT_STORAGE_QUOTA_POLICY) {
    if (policy.warningRatio <= 0 || policy.criticalRatio <= policy.warningRatio || policy.criticalRatio > 1) {
      throw new Error('Storage quota thresholds are invalid.');
    }
  }

  public evaluate(quotaBytes: number | null, usageBytes: number | null): StorageQuotaSnapshot {
    if (quotaBytes === null || usageBytes === null || quotaBytes <= 0 || usageBytes < 0) {
      return Object.freeze({
        quotaBytes,
        usageBytes,
        availableBytes: null,
        utilizationRatio: null,
        state: 'unknown',
      });
    }
    const utilizationRatio = Math.min(1, usageBytes / quotaBytes);
    const availableBytes = Math.max(0, quotaBytes - usageBytes - this.policy.reservedBytes);
    return Object.freeze({
      quotaBytes,
      usageBytes,
      availableBytes,
      utilizationRatio,
      state:
        utilizationRatio >= this.policy.criticalRatio
          ? 'critical'
          : utilizationRatio >= this.policy.warningRatio
            ? 'warning'
            : 'healthy',
    });
  }

  public canAllocate(snapshot: StorageQuotaSnapshot, requiredBytes: number): boolean {
    if (!Number.isFinite(requiredBytes) || requiredBytes < 0) return false;
    if (snapshot.availableBytes === null) return true;
    return snapshot.state !== 'critical' && snapshot.availableBytes >= requiredBytes;
  }
}
