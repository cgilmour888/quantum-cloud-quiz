/**
 * Artifact ID: QCQ-PER-031
 * Artifact Name: SnapshotArchiveEngine
 * Repository Path: QCQ/frontend/src/persistence/SnapshotArchiveEngine.ts
 */

import type { JsonValue, PersistenceStorageProvider } from './PersistenceTypes';
import { sha256Hex, stableStringify } from './SerializationEngine';

export interface SnapshotArchiveRecord {
  readonly archiveId: string;
  readonly recordId: string;
  readonly createdAt: string;
  readonly payload: JsonValue;
  readonly digest: string;
}

export interface SnapshotArchivePolicy {
  readonly maximumArchivesPerRecord: number;
  readonly keyPrefix: string;
}

export const DEFAULT_SNAPSHOT_ARCHIVE_POLICY: SnapshotArchivePolicy = Object.freeze({
  maximumArchivesPerRecord: 20,
  keyPrefix: 'qcq:v1:archive:',
});

export class SnapshotArchiveEngine {
  public constructor(
    private readonly storage: PersistenceStorageProvider,
    private readonly policy: SnapshotArchivePolicy = DEFAULT_SNAPSHOT_ARCHIVE_POLICY,
  ) {
    if (!Number.isInteger(policy.maximumArchivesPerRecord) || policy.maximumArchivesPerRecord < 1) {
      throw new Error('Snapshot archive retention count must be a positive integer.');
    }
  }

  public async archive(
    archiveId: string,
    recordId: string,
    payload: JsonValue,
    createdAt = new Date().toISOString(),
  ): Promise<SnapshotArchiveRecord> {
    const canonical = stableStringify({ archiveId, recordId, createdAt, payload });
    const record: SnapshotArchiveRecord = Object.freeze({
      archiveId,
      recordId,
      createdAt,
      payload,
      digest: await sha256Hex(canonical),
    });
    const key = this.key(recordId, archiveId);
    await this.storage.runExclusive(this.recordPrefix(recordId), async () => {
      await this.storage.setItem(key, stableStringify(record));
      await this.enforceRetention(recordId);
    });
    return record;
  }

  public async read(recordId: string, archiveId: string): Promise<SnapshotArchiveRecord | null> {
    const raw = await this.storage.getItem(this.key(recordId, archiveId));
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!this.isRecord(parsed)) throw new Error('Archived snapshot is malformed.');
    const { digest, ...unsigned } = parsed;
    const actual = await sha256Hex(stableStringify(unsigned));
    if (actual !== digest) throw new Error('Archived snapshot failed integrity verification.');
    return Object.freeze(parsed);
  }

  public async list(recordId: string): Promise<readonly string[]> {
    return this.storage.listKeys(this.recordPrefix(recordId));
  }

  public async delete(recordId: string, archiveId: string): Promise<void> {
    await this.storage.removeItem(this.key(recordId, archiveId));
  }

  private recordPrefix(recordId: string): string {
    return `${this.policy.keyPrefix}${encodeURIComponent(recordId)}:`;
  }

  private key(recordId: string, archiveId: string): string {
    return `${this.recordPrefix(recordId)}${encodeURIComponent(archiveId)}`;
  }

  private async enforceRetention(recordId: string): Promise<void> {
    const keys = await this.storage.listKeys(this.recordPrefix(recordId));
    const records: Array<{ readonly key: string; readonly createdAt: number }> = [];
    for (const key of keys) {
      const raw = await this.storage.getItem(key);
      if (raw === null) continue;
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (!this.isRecord(parsed)) continue;
        const createdAt = Date.parse(parsed.createdAt);
        records.push({ key, createdAt: Number.isFinite(createdAt) ? createdAt : 0 });
      } catch {
        records.push({ key, createdAt: 0 });
      }
    }
    records.sort((left, right) => left.createdAt - right.createdAt || left.key.localeCompare(right.key));
    const excess = records.length - this.policy.maximumArchivesPerRecord;
    for (const record of records.slice(0, Math.max(0, excess))) {
      await this.storage.removeItem(record.key);
    }
  }

  private isRecord(value: unknown): value is SnapshotArchiveRecord {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const candidate = value as Record<string, unknown>;
    return (
      typeof candidate.archiveId === 'string' &&
      typeof candidate.recordId === 'string' &&
      typeof candidate.createdAt === 'string' &&
      typeof candidate.digest === 'string' &&
      'payload' in candidate
    );
  }
}
