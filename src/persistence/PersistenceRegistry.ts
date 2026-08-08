/**
 * Artifact ID: QCQ-PER-011
 * Artifact Name: PersistenceRegistry
 * Repository Path: QCQ/frontend/src/persistence/PersistenceRegistry.ts
 */

export type PersistenceArtifactKind =
  | 'contract'
  | 'constant'
  | 'store'
  | 'engine'
  | 'provider'
  | 'registry'
  | 'policy'
  | 'graph'
  | 'capability'
  | 'bridge'
  | 'monitor'
  | 'manifest'
  | 'ledger'
  | 'audit';

export interface PersistenceArtifactRegistration {
  readonly artifactId: string;
  readonly artifactName: string;
  readonly sourceFile: string;
  readonly repositoryPath: string;
  readonly kind: PersistenceArtifactKind;
  readonly authority: string;
  readonly dependencies: readonly string[];
  readonly capabilities: readonly string[];
  readonly version: string;
}

export interface PersistenceRegistrySnapshot {
  readonly entries: readonly PersistenceArtifactRegistration[];
  readonly artifactIds: readonly string[];
  readonly capabilities: readonly string[];
}

function freezeRegistration(
  registration: PersistenceArtifactRegistration,
): PersistenceArtifactRegistration {
  return Object.freeze({
    ...registration,
    dependencies: Object.freeze([...registration.dependencies]),
    capabilities: Object.freeze([...registration.capabilities]),
  });
}

export class PersistenceRegistry {
  private readonly entries = new Map<string, PersistenceArtifactRegistration>();

  public register(registration: PersistenceArtifactRegistration): void {
    if (this.entries.has(registration.artifactId)) {
      throw new Error(`Persistence artifact already registered: ${registration.artifactId}`);
    }
    if (
      [...this.entries.values()].some(
        (entry) => entry.repositoryPath === registration.repositoryPath,
      )
    ) {
      throw new Error(
        `Persistence repository path already owned: ${registration.repositoryPath}`,
      );
    }
    this.entries.set(registration.artifactId, freezeRegistration(registration));
  }

  public registerMany(
    registrations: readonly PersistenceArtifactRegistration[],
  ): void {
    const ids = new Set<string>();
    const paths = new Set<string>();
    for (const registration of registrations) {
      if (ids.has(registration.artifactId)) {
        throw new Error(`Duplicate persistence artifact in batch: ${registration.artifactId}`);
      }
      if (paths.has(registration.repositoryPath)) {
        throw new Error(
          `Duplicate persistence path in batch: ${registration.repositoryPath}`,
        );
      }
      ids.add(registration.artifactId);
      paths.add(registration.repositoryPath);
    }
    for (const registration of registrations) {
      if (this.entries.has(registration.artifactId)) {
        throw new Error(`Persistence artifact already registered: ${registration.artifactId}`);
      }
      if (
        [...this.entries.values()].some(
          (entry) => entry.repositoryPath === registration.repositoryPath,
        )
      ) {
        throw new Error(
          `Persistence repository path already owned: ${registration.repositoryPath}`,
        );
      }
    }
    for (const registration of registrations) this.register(registration);
  }

  public get(artifactId: string): PersistenceArtifactRegistration | null {
    return this.entries.get(artifactId) ?? null;
  }

  public require(artifactId: string): PersistenceArtifactRegistration {
    const entry = this.entries.get(artifactId);
    if (!entry) throw new Error(`Persistence artifact is not registered: ${artifactId}`);
    return entry;
  }

  public hasCapability(capability: string): boolean {
    return [...this.entries.values()].some((entry) =>
      entry.capabilities.includes(capability),
    );
  }

  public byKind(kind: PersistenceArtifactKind): readonly PersistenceArtifactRegistration[] {
    return Object.freeze(
      [...this.entries.values()].filter((entry) => entry.kind === kind),
    );
  }

  public snapshot(): PersistenceRegistrySnapshot {
    const entries = Object.freeze(
      [...this.entries.values()].sort((left, right) =>
        left.artifactId.localeCompare(right.artifactId),
      ),
    );
    const capabilities = Object.freeze(
      [...new Set(entries.flatMap((entry) => entry.capabilities))].sort(),
    );
    return Object.freeze({
      entries,
      artifactIds: Object.freeze(entries.map((entry) => entry.artifactId)),
      capabilities,
    });
  }
}
