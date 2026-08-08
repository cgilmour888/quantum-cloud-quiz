/**
 * Artifact ID: QCQ-PER-007
 * Artifact Name: BackupRecoveryEngine
 * Repository Path: QCQ/frontend/src/persistence/BackupRecoveryEngine.ts
 */

import {
  MAX_BACKUPS_PER_RECORD,
  PERSISTENCE_SCHEMA_VERSION,
  backupIndexStorageKey,
  backupStorageKey,
} from './PersistenceConstants';
import type {
  BackupDescriptor,
  BackupIndexPayload,
  PersistenceEnvelope,
  PersistenceRecordKind,
  PersistenceStorageProvider,
} from './PersistenceTypes';
import { PersistenceError } from './PersistenceTypes';
import { SerializationEngine, sha256Hex } from './SerializationEngine';

function createBackupId(): string {
  try {
    return `backup-${Date.now().toString(36)}-${globalThis.crypto.randomUUID()}`;
  } catch {
    return `backup-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBackupDescriptor(value: unknown): value is BackupDescriptor {
  if (!isRecord(value)) return false;
  return (
    typeof value.backupId === 'string' &&
    typeof value.sourceKey === 'string' &&
    typeof value.backupKey === 'string' &&
    typeof value.recordId === 'string' &&
    typeof value.kind === 'string' &&
    typeof value.revision === 'number' &&
    Number.isInteger(value.revision) &&
    value.revision >= 0 &&
    typeof value.createdAt === 'string' &&
    Number.isFinite(Date.parse(value.createdAt)) &&
    typeof value.byteLength === 'number' &&
    Number.isInteger(value.byteLength) &&
    value.byteLength >= 0 &&
    typeof value.digest === 'string'
  );
}

export class BackupRecoveryEngine {
  public constructor(
    private readonly storage: PersistenceStorageProvider,
    private readonly serialization: SerializationEngine,
    private readonly maximumBackups = MAX_BACKUPS_PER_RECORD,
  ) {
    if (!Number.isInteger(maximumBackups) || maximumBackups < 1) {
      throw new PersistenceError(
        'maximumBackups must be a positive integer.',
        'PERSISTENCE_BACKUP_LIMIT_INVALID',
      );
    }
  }

  public async createBackup(
    sourceKey: string,
    serializedEnvelope: string,
  ): Promise<BackupDescriptor> {
    const envelope = await this.serialization.deserialize<unknown>(
      serializedEnvelope,
    );
    const backupId = createBackupId();
    const backupKey = backupStorageKey(sourceKey, backupId);
    const descriptor: BackupDescriptor = Object.freeze({
      backupId,
      sourceKey,
      backupKey,
      recordId: envelope.recordId,
      kind: envelope.kind,
      revision: envelope.revision,
      createdAt: new Date().toISOString(),
      byteLength: this.serialization.byteLength(serializedEnvelope),
      digest: await sha256Hex(serializedEnvelope),
    });

    await this.storage.setItem(backupKey, serializedEnvelope);
    const index = await this.readIndex(sourceKey);
    const nextBackups = [descriptor, ...index.backups]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const retained = nextBackups.slice(0, this.maximumBackups);
    const removed = nextBackups.slice(this.maximumBackups);

    await this.writeIndex(sourceKey, retained);
    await Promise.all(removed.map((entry) => this.storage.removeItem(entry.backupKey)));
    return descriptor;
  }

  public async listBackups(sourceKey: string): Promise<readonly BackupDescriptor[]> {
    return (await this.readIndex(sourceKey)).backups;
  }

  public async recoverLatest<TPayload>(
    sourceKey: string,
    expectedKind: PersistenceRecordKind,
  ): Promise<PersistenceEnvelope<TPayload> | null> {
    const index = await this.readIndex(sourceKey);
    for (const descriptor of index.backups) {
      const serialized = await this.storage.getItem(descriptor.backupKey);
      if (serialized === null) continue;
      try {
        const envelope = await this.serialization.deserialize<TPayload>(
          serialized,
          expectedKind,
        );
        const rawDigest = await sha256Hex(serialized);
        if (rawDigest !== descriptor.digest) continue;
        return envelope;
      } catch {
        continue;
      }
    }
    return null;
  }

  public async deleteBackups(sourceKey: string): Promise<void> {
    const index = await this.readIndex(sourceKey);
    await Promise.all(index.backups.map((entry) => this.storage.removeItem(entry.backupKey)));
    await this.storage.removeItem(backupIndexStorageKey(sourceKey));
  }

  private async readIndex(sourceKey: string): Promise<BackupIndexPayload> {
    const raw = await this.storage.getItem(backupIndexStorageKey(sourceKey));
    if (raw === null) {
      return Object.freeze({
        schemaVersion: PERSISTENCE_SCHEMA_VERSION,
        sourceKey,
        backups: Object.freeze([]),
        updatedAt: new Date(0).toISOString(),
      });
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (
        !isRecord(parsed) ||
        parsed.schemaVersion !== PERSISTENCE_SCHEMA_VERSION ||
        parsed.sourceKey !== sourceKey ||
        !Array.isArray(parsed.backups) ||
        !parsed.backups.every(isBackupDescriptor) ||
        typeof parsed.updatedAt !== 'string' ||
        !Number.isFinite(Date.parse(parsed.updatedAt))
      ) {
        throw new Error('Invalid backup index');
      }
      return Object.freeze({
        schemaVersion: PERSISTENCE_SCHEMA_VERSION,
        sourceKey,
        backups: Object.freeze([...parsed.backups]),
        updatedAt: parsed.updatedAt,
      });
    } catch (error) {
      throw new PersistenceError(
        'Backup index is corrupted.',
        'PERSISTENCE_BACKUP_INDEX_INVALID',
        error,
      );
    }
  }

  private async writeIndex(
    sourceKey: string,
    backups: readonly BackupDescriptor[],
  ): Promise<void> {
    const payload: BackupIndexPayload = Object.freeze({
      schemaVersion: PERSISTENCE_SCHEMA_VERSION,
      sourceKey,
      backups: Object.freeze([...backups]),
      updatedAt: new Date().toISOString(),
    });
    await this.storage.setItem(
      backupIndexStorageKey(sourceKey),
      JSON.stringify(payload),
    );
  }
}
