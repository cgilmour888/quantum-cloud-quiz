/**
 * Artifact ID: QCQ-CMP-010
 * Artifact Name: ComposerPersistenceBridge
 * Repository Path: QCQ/frontend/src/composer/ComposerPersistenceBridge.ts
 */

import {
  BackupRecoveryEngine,
} from '../persistence/BackupRecoveryEngine';
import {
  createBrowserLocalStorageProvider,
} from '../persistence/LocalStorageProvider';
import type {
  PersistenceStorageProvider,
  PlayerProfile,
  PlayerProfileCreateInput,
  SaveGamePayload,
  SessionRestoreResult,
} from '../persistence/PersistenceTypes';
import {
  PlayerProfileStore,
} from '../persistence/PlayerProfileStore';
import {
  SaveGameEngine,
} from '../persistence/SaveGameEngine';
import {
  SerializationEngine,
} from '../persistence/SerializationEngine';
import {
  SessionRestoreEngine,
} from '../persistence/SessionRestoreEngine';
import {
  PersistenceValidationEngine,
} from '../persistence/PersistenceValidationEngine';
import {
  PersistenceComposerBridge as PersistenceDomainComposerBridge,
} from '../persistence/PersistenceComposerBridge';
import {
  VersionMigrationEngine,
} from '../persistence/VersionMigrationEngine';
import type {
  ComposerConfig,
  ComposerPersistenceBridgeLike,
  ComposerPersistenceMapper,
  ComposerPersistenceSnapshot,
  ComposerRuntimeController,
  ComposerRuntimeSnapshot,
} from './ComposerTypes';

export interface ComposerPersistenceServices {
  readonly storage: PersistenceStorageProvider;
  readonly serialization: SerializationEngine;
  readonly validation: PersistenceValidationEngine;
  readonly migrations: VersionMigrationEngine;
  readonly backups: BackupRecoveryEngine;
  readonly restore: SessionRestoreEngine;
  /** QCQ-PER-030 is the sole Phase-10 access boundary for profile/save authorities. */
  readonly composer: PersistenceDomainComposerBridge;
}

export interface ComposerPersistenceBridgeOptions {
  readonly config: ComposerConfig['persistence'];
  readonly storage?: PersistenceStorageProvider | undefined;
  readonly defaultProfile?: PlayerProfileCreateInput | undefined;
}

const SERVER_SNAPSHOT: ComposerPersistenceSnapshot = Object.freeze({
  version: 0,
  status: 'idle',
  profile: null,
  activeSaveId: null,
  lastSavedAt: null,
  lastRestoredAt: null,
  error: null,
});

function createServices(
  storage: PersistenceStorageProvider,
): ComposerPersistenceServices {
  const serialization = new SerializationEngine();
  const validation = new PersistenceValidationEngine();
  const migrations = new VersionMigrationEngine(serialization);
  const backups = new BackupRecoveryEngine(
    storage,
    serialization,
  );
  const restore = new SessionRestoreEngine(
    storage,
    serialization,
    validation,
    migrations,
    backups,
  );
  const profiles = new PlayerProfileStore(
    storage,
    serialization,
    validation,
    migrations,
    backups,
  );
  const saves = new SaveGameEngine(
    storage,
    serialization,
    validation,
    backups,
    restore,
  );

  const composer = new PersistenceDomainComposerBridge({
    profiles,
    saves,
  });

  return Object.freeze({
    storage,
    serialization,
    validation,
    migrations,
    backups,
    restore,
    composer,
  });
}

function disposedError(): Error {
  return new Error(
    'ComposerPersistenceBridge has been disposed.',
  );
}

export class ComposerPersistenceBridge
  implements ComposerPersistenceBridgeLike {
  private readonly subscribers = new Set<() => void>();
  private readonly config: ComposerConfig['persistence'];
  private readonly defaultProfile:
    | PlayerProfileCreateInput
    | undefined;
  private services: ComposerPersistenceServices | null = null;
  private snapshot: ComposerPersistenceSnapshot =
    SERVER_SNAPSHOT;
  private version = 0;
  private disposed = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pending:
    | {
        readonly runtime: ComposerRuntimeSnapshot;
        readonly mapper: ComposerPersistenceMapper;
      }
    | null = null;

  public constructor(
    options: ComposerPersistenceBridgeOptions,
  ) {
    this.config = Object.freeze({ ...options.config });
    this.defaultProfile = options.defaultProfile;
    if (options.storage !== undefined) {
      this.services = createServices(options.storage);
    }
  }

  public readonly subscribe = (
    listener: () => void,
  ): (() => void) => {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  };

  public readonly getSnapshot =
    (): ComposerPersistenceSnapshot => this.snapshot;

  public readonly getServerSnapshot =
    (): ComposerPersistenceSnapshot => SERVER_SNAPSHOT;

  public getServices(): ComposerPersistenceServices {
    this.assertAvailable();
    if (this.services === null) {
      this.services = createServices(
        createBrowserLocalStorageProvider(),
      );
    }
    return this.services;
  }

  public async initialize(
    profileInput?: PlayerProfileCreateInput,
  ): Promise<PlayerProfile | null> {
    this.assertAvailable();
    if (!this.config.enabled) {
      this.commit({
        status: 'ready',
        profile: null,
        error: null,
      });
      return null;
    }

    this.commit({
      status: 'initializing',
      error: null,
    });

    try {
      const services = this.getServices();
      const domain = services.composer.getServices();
      let profile = await domain.profiles.loadActive();
      const creationInput = profileInput ?? this.defaultProfile;

      if (
        profile === null &&
        this.config.createProfileWhenMissing &&
        creationInput !== undefined
      ) {
        profile = await domain.profiles.create(creationInput);
      }

      this.commit({
        status: 'ready',
        profile,
        error: null,
      });
      return profile;
    } catch (error) {
      const normalized = error instanceof Error
        ? error
        : new Error('Persistence initialization failed.');
      this.commit({
        status: 'error',
        error: normalized,
      });
      throw normalized;
    }
  }

  public async restore(
    saveId: string,
    runtimeController: ComposerRuntimeController,
    mapper: ComposerPersistenceMapper,
  ): Promise<SessionRestoreResult> {
    this.assertAvailable();
    if (!this.config.enabled) {
      return Object.freeze({
        status: 'missing',
        source: 'none',
        message: 'Persistence is disabled.',
        warnings: Object.freeze([]),
      });
    }

    this.commit({
      status: 'restoring',
      activeSaveId: saveId,
      error: null,
    });

    try {
      const result = await this.getServices().composer.getServices().saves.load(saveId);
      if (result.status === 'restored') {
        await mapper.applyRestoredSave(
          runtimeController,
          result.envelope.payload,
          result,
        );
        this.commit({
          status: 'ready',
          activeSaveId: saveId,
          lastRestoredAt: new Date().toISOString(),
          error: null,
        });
      } else {
        this.commit({
          status: 'ready',
          activeSaveId: saveId,
          error: null,
        });
      }
      return result;
    } catch (error) {
      const normalized = error instanceof Error
        ? error
        : new Error('Session restoration failed.');
      this.commit({
        status: 'error',
        error: normalized,
      });
      throw normalized;
    }
  }

  public async save(
    runtime: ComposerRuntimeSnapshot,
    mapper: ComposerPersistenceMapper,
  ): Promise<SaveGamePayload | null> {
    this.assertAvailable();
    if (!this.config.enabled) return null;

    let profile = this.snapshot.profile;
    if (profile === null) {
      profile = await this.initialize();
    }
    if (profile === null) {
      return null;
    }

    this.commit({
      status: 'saving',
      error: null,
    });

    try {
      const services = this.getServices();
      const saveId =
        runtime.saveId ??
        this.snapshot.activeSaveId;
      let previous: SaveGamePayload | null = null;

      if (saveId !== null) {
        const domain = services.composer.getServices();
        const priorResult = await domain.saves.load(saveId);
        if (priorResult.status === 'restored') {
          previous = priorResult.envelope.payload;
        }
      }

      const candidate = await mapper.toSaveGame(
        runtime,
        profile,
        previous,
      );
      const normalized: SaveGamePayload = Object.freeze({
        ...candidate,
        profileId: profile.profileId,
        revision: Math.max(
          candidate.revision,
          (previous?.revision ?? 0) + 1,
        ),
        sequence: Math.max(
          candidate.sequence,
          (previous?.sequence ?? 0) + 1,
        ),
        createdAt:
          previous?.createdAt ??
          candidate.createdAt,
        updatedAt: new Date().toISOString(),
      });

      const persisted = await services.composer.getServices().saves.save(normalized);
      this.commit({
        status: 'ready',
        activeSaveId: persisted.payload.saveId,
        lastSavedAt: persisted.updatedAt,
        error: null,
      });
      return persisted.payload;
    } catch (error) {
      const normalized = error instanceof Error
        ? error
        : new Error('Session save failed.');
      this.commit({
        status: 'error',
        error: normalized,
      });
      throw normalized;
    }
  }

  public scheduleSave(
    runtime: ComposerRuntimeSnapshot,
    mapper: ComposerPersistenceMapper,
  ): void {
    this.assertAvailable();
    if (
      !this.config.enabled ||
      !this.config.autoSave
    ) {
      return;
    }

    this.pending = Object.freeze({
      runtime,
      mapper,
    });
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      const pending = this.pending;
      this.pending = null;
      if (pending !== null) {
        void this.save(
          pending.runtime,
          pending.mapper,
        ).catch(() => undefined);
      }
    }, this.config.autoSaveDelayMs);
  }

  public async flush(): Promise<void> {
    this.assertAvailable();
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const pending = this.pending;
    this.pending = null;
    if (pending !== null) {
      await this.save(
        pending.runtime,
        pending.mapper,
      );
    }
  }

  public dispose(): void {
    if (this.disposed) return;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.pending = null;
    this.disposed = true;
    this.version += 1;
    this.snapshot = Object.freeze({
      ...this.snapshot,
      version: this.version,
      status: 'disposed',
    });
    this.subscribers.forEach((listener) => listener());
    this.subscribers.clear();
  }

  private assertAvailable(): void {
    if (this.disposed) throw disposedError();
  }

  private commit(
    changes: Partial<
      Omit<ComposerPersistenceSnapshot, 'version'>
    >,
  ): void {
    this.version += 1;
    this.snapshot = Object.freeze({
      ...this.snapshot,
      ...changes,
      version: this.version,
    });
    this.subscribers.forEach((listener) => listener());
  }
}

export function createComposerPersistenceBridge(
  options: ComposerPersistenceBridgeOptions,
): ComposerPersistenceBridge {
  return new ComposerPersistenceBridge(options);
}
