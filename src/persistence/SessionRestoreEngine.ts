/**
 * Artifact ID: QCQ-PER-005
 * Artifact Name: SessionRestoreEngine
 * Repository Path: QCQ/frontend/src/persistence/SessionRestoreEngine.ts
 */

import { PERSISTENCE_SCHEMA_VERSION } from './PersistenceConstants';
import type {
  PersistenceEnvelope,
  PersistenceStorageProvider,
  SaveGamePayload,
  SessionRestoreResult,
} from './PersistenceTypes';
import { PersistenceError } from './PersistenceTypes';
import { BackupRecoveryEngine } from './BackupRecoveryEngine';
import { PersistenceValidationEngine } from './PersistenceValidationEngine';
import { SerializationEngine } from './SerializationEngine';
import { VersionMigrationEngine } from './VersionMigrationEngine';

export class SessionRestoreEngine {
  public constructor(
    private readonly storage: PersistenceStorageProvider,
    private readonly serialization: SerializationEngine,
    private readonly validation: PersistenceValidationEngine,
    private readonly migration: VersionMigrationEngine,
    private readonly backups: BackupRecoveryEngine,
  ) {}

  public async restore(sourceKey: string): Promise<SessionRestoreResult> {
    const primary = await this.storage.getItem(sourceKey);
    if (primary !== null) {
      try {
        const prepared = await this.prepare(primary);
        return Object.freeze({
          status: 'restored',
          source: 'primary',
          envelope: prepared.envelope,
          migrated: prepared.migrated,
          warnings: Object.freeze([]),
        });
      } catch (primaryError) {
        const recovered = await this.restoreBackup(sourceKey, primaryError);
        if (recovered) return recovered;
        return Object.freeze({
          status: 'invalid',
          source: 'primary',
          message:
            primaryError instanceof Error
              ? primaryError.message
              : 'Primary save is invalid.',
          warnings: Object.freeze(['No valid backup was available.']),
        });
      }
    }

    const backup = await this.restoreBackup(
      sourceKey,
      new PersistenceError(
        'Primary save does not exist.',
        'PERSISTENCE_SAVE_MISSING',
      ),
    );
    if (backup) return backup;
    return Object.freeze({
      status: 'missing',
      source: 'none',
      message: 'No primary save or valid backup exists.',
      warnings: Object.freeze([]),
    });
  }

  private async prepare(
    serialized: string,
  ): Promise<{
    readonly envelope: PersistenceEnvelope<SaveGamePayload>;
    readonly migrated: boolean;
  }> {
    const rawEnvelope = await this.serialization.deserialize<unknown>(
      serialized,
      'save-game',
    );

    const migrated =
      rawEnvelope.schemaVersion === PERSISTENCE_SCHEMA_VERSION
        ? (rawEnvelope as PersistenceEnvelope<SaveGamePayload>)
        : await this.migration.migrate<SaveGamePayload>(
            rawEnvelope,
            PERSISTENCE_SCHEMA_VERSION,
          );

    this.validation.assertSaveGame(migrated.payload);
    return Object.freeze({
      envelope: migrated,
      migrated: rawEnvelope.schemaVersion !== migrated.schemaVersion,
    });
  }

  private async restoreBackup(
    sourceKey: string,
    cause: unknown,
  ): Promise<SessionRestoreResult | null> {
    const backup = await this.backups.recoverLatest<SaveGamePayload>(
      sourceKey,
      'save-game',
    );
    if (!backup) return null;

    try {
      const migrated =
        backup.schemaVersion === PERSISTENCE_SCHEMA_VERSION
          ? backup
          : await this.migration.migrate<SaveGamePayload>(
              backup,
              PERSISTENCE_SCHEMA_VERSION,
            );
      this.validation.assertSaveGame(migrated.payload);
      return Object.freeze({
        status: 'restored',
        source: 'backup',
        envelope: migrated,
        migrated: backup.schemaVersion !== migrated.schemaVersion,
        warnings: Object.freeze([
          `Primary save could not be used: ${
            cause instanceof Error ? cause.message : 'unknown failure'
          }`,
        ]),
      });
    } catch {
      return null;
    }
  }
}
