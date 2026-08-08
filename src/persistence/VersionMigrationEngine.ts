/**
 * Artifact ID: QCQ-PER-006
 * Artifact Name: VersionMigrationEngine
 * Repository Path: QCQ/frontend/src/persistence/VersionMigrationEngine.ts
 */

import { PERSISTENCE_SCHEMA_VERSION } from './PersistenceConstants';
import type {
  MigrationContext,
  PersistenceEnvelope,
  PersistenceMigrationStep,
} from './PersistenceTypes';
import { PersistenceError } from './PersistenceTypes';
import { SerializationEngine } from './SerializationEngine';

function migrationKey(fromVersion: string, toVersion: string): string {
  return `${fromVersion}->${toVersion}`;
}

export class VersionMigrationEngine {
  private readonly migrations = new Map<string, PersistenceMigrationStep>();

  public constructor(
    private readonly serialization: SerializationEngine,
    steps: readonly PersistenceMigrationStep[] = [],
  ) {
    steps.forEach((step) => this.register(step));
  }

  public register(step: PersistenceMigrationStep): void {
    if (step.fromVersion === step.toVersion) {
      throw new PersistenceError(
        'A migration step must change the schema version.',
        'PERSISTENCE_MIGRATION_NOOP',
      );
    }
    const key = migrationKey(step.fromVersion, step.toVersion);
    if (this.migrations.has(key)) {
      throw new PersistenceError(
        `Migration ${key} is already registered.`,
        'PERSISTENCE_MIGRATION_DUPLICATE',
      );
    }
    this.migrations.set(key, step);
  }

  public canMigrate(fromVersion: string, toVersion = PERSISTENCE_SCHEMA_VERSION): boolean {
    if (fromVersion === toVersion) return true;
    return this.resolvePath(fromVersion, toVersion) !== null;
  }

  public async migrate<TPayload>(
    envelope: PersistenceEnvelope<unknown>,
    toVersion = PERSISTENCE_SCHEMA_VERSION,
  ): Promise<PersistenceEnvelope<TPayload>> {
    if (envelope.schemaVersion === toVersion) {
      return envelope as PersistenceEnvelope<TPayload>;
    }

    const path = this.resolvePath(envelope.schemaVersion, toVersion);
    if (!path) {
      throw new PersistenceError(
        `No migration path exists from ${envelope.schemaVersion} to ${toVersion}.`,
        'PERSISTENCE_MIGRATION_UNSUPPORTED',
      );
    }

    let payload: unknown = envelope.payload;
    let currentVersion = envelope.schemaVersion;
    const migratedAt = new Date().toISOString();

    for (const step of path) {
      const context: MigrationContext = Object.freeze({
        recordKind: envelope.kind,
        recordId: envelope.recordId,
        fromVersion: currentVersion,
        toVersion: step.toVersion,
        migratedAt,
      });
      payload = step.migrate(payload, context);
      currentVersion = step.toVersion;
    }

    return this.serialization.createEnvelope<TPayload>(
      envelope.kind,
      envelope.recordId,
      envelope.revision + 1,
      toVersion,
      payload as TPayload,
      {
        createdAt: envelope.createdAt,
        updatedAt: migratedAt,
      },
    );
  }

  private resolvePath(
    fromVersion: string,
    toVersion: string,
  ): readonly PersistenceMigrationStep[] | null {
    const queue: Array<{
      readonly version: string;
      readonly path: readonly PersistenceMigrationStep[];
    }> = [{ version: fromVersion, path: [] }];
    const visited = new Set<string>([fromVersion]);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      for (const step of this.migrations.values()) {
        if (step.fromVersion !== current.version || visited.has(step.toVersion)) continue;
        const nextPath = [...current.path, step];
        if (step.toVersion === toVersion) return Object.freeze(nextPath);
        visited.add(step.toVersion);
        queue.push({ version: step.toVersion, path: nextPath });
      }
    }
    return null;
  }
}
