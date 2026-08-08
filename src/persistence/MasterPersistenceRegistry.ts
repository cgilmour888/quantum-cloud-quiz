/**
 * Artifact ID: QCQ-PER-036
 * Artifact Name: MasterPersistenceRegistry
 * Repository Path: QCQ/frontend/src/persistence/MasterPersistenceRegistry.ts
 */

import { MASTER_PERSISTENCE_MANIFEST } from './MasterPersistenceManifest';

export interface MasterPersistenceRegistryEntry {
  readonly artifactId: string;
  readonly artifactName: string;
  readonly sourceFile: string;
  readonly authority: string;
  readonly domain: string;
}

export class MasterPersistenceRegistry {
  private readonly entries = new Map<string, MasterPersistenceRegistryEntry>();

  public constructor() {
    for (const artifact of MASTER_PERSISTENCE_MANIFEST.artifacts) {
      if (this.entries.has(artifact.artifactId)) {
        throw new Error(`Duplicate master persistence identifier: ${artifact.artifactId}`);
      }
      this.entries.set(artifact.artifactId, Object.freeze({ ...artifact }));
    }
    if (this.entries.size !== MASTER_PERSISTENCE_MANIFEST.artifactCount) {
      throw new Error('Master persistence registry size does not match manifest.');
    }
  }

  public get(artifactId: string): MasterPersistenceRegistryEntry | null {
    return this.entries.get(artifactId) ?? null;
  }

  public require(artifactId: string): MasterPersistenceRegistryEntry {
    const entry = this.entries.get(artifactId);
    if (!entry) throw new Error(`Unknown persistence artifact: ${artifactId}`);
    return entry;
  }

  public byDomain(domain: string): readonly MasterPersistenceRegistryEntry[] {
    return Object.freeze([...this.entries.values()].filter((entry) => entry.domain === domain));
  }

  public snapshot(): readonly MasterPersistenceRegistryEntry[] {
    return Object.freeze([...this.entries.values()]);
  }
}
