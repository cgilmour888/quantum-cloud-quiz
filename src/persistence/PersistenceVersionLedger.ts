/**
 * Artifact ID: QCQ-PER-037
 * Artifact Name: PersistenceVersionLedger
 * Repository Path: QCQ/frontend/src/persistence/PersistenceVersionLedger.ts
 */

import { sha256Hex, stableStringify } from './SerializationEngine';

export interface PersistenceVersionLedgerEntry {
  readonly sequence: number;
  readonly schemaVersion: string;
  readonly migrationId: string | null;
  readonly previousDigest: string | null;
  readonly digest: string;
  readonly recordedAt: string;
  readonly notes: string;
}

export class PersistenceVersionLedger {
  private readonly entries: PersistenceVersionLedgerEntry[] = [];

  public async append(
    schemaVersion: string,
    migrationId: string | null,
    notes: string,
    recordedAt = new Date().toISOString(),
  ): Promise<PersistenceVersionLedgerEntry> {
    const previous = this.entries.at(-1) ?? null;
    const unsigned = {
      sequence: this.entries.length + 1,
      schemaVersion,
      migrationId,
      previousDigest: previous?.digest ?? null,
      recordedAt,
      notes,
    };
    const entry: PersistenceVersionLedgerEntry = Object.freeze({
      ...unsigned,
      digest: await sha256Hex(stableStringify(unsigned)),
    });
    this.entries.push(entry);
    return entry;
  }

  public async verify(): Promise<boolean> {
    let previousDigest: string | null = null;
    for (const entry of this.entries) {
      const { digest, ...unsigned } = entry;
      if (unsigned.previousDigest !== previousDigest) return false;
      if ((await sha256Hex(stableStringify(unsigned))) !== digest) return false;
      previousDigest = digest;
    }
    return true;
  }

  public snapshot(): readonly PersistenceVersionLedgerEntry[] {
    return Object.freeze([...this.entries]);
  }
}
