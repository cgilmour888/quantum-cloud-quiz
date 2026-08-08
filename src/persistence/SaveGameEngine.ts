/**
 * Artifact ID: QCQ-TBL-035
 * Artifact Name: SaveGameEngine
 * Repository Path: QCQ/frontend/src/persistence/SaveGameEngine.ts
 */

import {
  IDENTIFIER_PATTERN,
  MAX_SAVE_GAME_BYTES,
  PERSISTENCE_SCHEMA_VERSION,
  SAVE_GAME_KEY_PREFIX,
  saveGameStorageKey,
} from './PersistenceConstants';
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
import { SessionRestoreEngine } from './SessionRestoreEngine';

export class SaveGameEngine {
  public constructor(
    private readonly storage: PersistenceStorageProvider,
    private readonly serialization: SerializationEngine,
    private readonly validation: PersistenceValidationEngine,
    private readonly backups: BackupRecoveryEngine,
    private readonly restoreEngine: SessionRestoreEngine,
  ) {}

  public async save(
    payload: SaveGamePayload,
  ): Promise<PersistenceEnvelope<SaveGamePayload>> {
    this.validation.assertSaveGame(payload);
    if (!IDENTIFIER_PATTERN.test(payload.saveId)) {
      throw new PersistenceError(
        'Save-game identifier is invalid.',
        'PERSISTENCE_SAVE_ID_INVALID',
      );
    }
    const key = saveGameStorageKey(payload.saveId);

    return this.storage.runExclusive(key, async () => {
      const existing = await this.storage.getItem(key);
      if (existing !== null) {
        const current = await this.serialization.deserialize<SaveGamePayload>(
          existing,
          'save-game',
        );
        this.validation.assertSaveGame(current.payload);
        if (
          payload.revision <= current.payload.revision ||
          payload.sequence <= current.payload.sequence
        ) {
          throw new PersistenceError(
            'Save-game revision and sequence must increase monotonically.',
            'PERSISTENCE_SAVE_REVISION_CONFLICT',
          );
        }
        await this.backups.createBackup(key, existing);
      }

      const envelope = await this.serialization.createEnvelope(
        'save-game',
        payload.saveId,
        payload.revision,
        PERSISTENCE_SCHEMA_VERSION,
        payload,
        {
          createdAt: payload.createdAt,
          updatedAt: payload.updatedAt,
        },
      );
      const serialized = this.serialization.serialize(envelope);
      if (this.serialization.byteLength(serialized) > MAX_SAVE_GAME_BYTES) {
        throw new PersistenceError(
          'Save game exceeds the configured size limit.',
          'PERSISTENCE_SAVE_TOO_LARGE',
        );
      }

      try {
        await this.storage.setItem(key, serialized);
        const persisted = await this.storage.getItem(key);
        if (persisted === null) {
          throw new PersistenceError(
            'Save game disappeared immediately after writing.',
            'PERSISTENCE_SAVE_VERIFY_MISSING',
          );
        }
        const verified = await this.serialization.deserialize<SaveGamePayload>(
          persisted,
          'save-game',
        );
        this.validation.assertSaveGame(verified.payload);
        return verified;
      } catch (error) {
        if (existing !== null) {
          await this.storage.setItem(key, existing);
        } else {
          await this.storage.removeItem(key);
        }
        throw error;
      }
    });
  }

  public async load(saveId: string): Promise<SessionRestoreResult> {
    this.assertSaveId(saveId);
    return this.restoreEngine.restore(saveGameStorageKey(saveId));
  }

  public async recoverFromBackup(
    saveId: string,
  ): Promise<PersistenceEnvelope<SaveGamePayload> | null> {
    this.assertSaveId(saveId);
    const key = saveGameStorageKey(saveId);
    const recovered = await this.backups.recoverLatest<SaveGamePayload>(
      key,
      'save-game',
    );
    if (recovered) this.validation.assertSaveGame(recovered.payload);
    return recovered;
  }

  public async listSaveIds(): Promise<readonly string[]> {
    const keys = await this.storage.listKeys(SAVE_GAME_KEY_PREFIX);
    return Object.freeze(
      keys.map((key) => decodeURIComponent(key.slice(SAVE_GAME_KEY_PREFIX.length))),
    );
  }

  public async delete(saveId: string, includeBackups = false): Promise<void> {
    this.assertSaveId(saveId);
    const key = saveGameStorageKey(saveId);
    await this.storage.runExclusive(key, async () => {
      await this.storage.removeItem(key);
      if (includeBackups) await this.backups.deleteBackups(key);
    });
  }

  private assertSaveId(saveId: string): void {
    if (!IDENTIFIER_PATTERN.test(saveId)) {
      throw new PersistenceError(
        'Save-game identifier is invalid.',
        'PERSISTENCE_SAVE_ID_INVALID',
      );
    }
  }
}
