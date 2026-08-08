/**
 * Artifact ID: QCQ-PER-040
 * Artifact Name: PersistenceIntegrityEngine
 * Repository Path: QCQ/frontend/src/persistence/PersistenceIntegrityEngine.ts
 */

import type { PersistenceStorageProvider, SaveGamePayload } from './PersistenceTypes';
import { SAVE_GAME_KEY_PREFIX } from './PersistenceConstants';
import { SerializationEngine } from './SerializationEngine';
import { PersistenceValidationEngine } from './PersistenceValidationEngine';

export interface PersistenceIntegrityRecordResult {
  readonly key: string;
  readonly valid: boolean;
  readonly recordId: string | null;
  readonly errorMessage: string | null;
}

export type PersistenceIntegrityDomain =
  | 'save'
  | 'profile'
  | 'backup'
  | 'snapshot'
  | 'migration'
  | 'archive'
  | 'ledger'
  | 'audit';

export interface PersistenceIntegrityProbe {
  readonly probeId: string;
  readonly domain: PersistenceIntegrityDomain;
  inspect(): Promise<readonly PersistenceIntegrityRecordResult[]>;
}

export interface PersistenceIntegrityReport {
  readonly generatedAt: string;
  readonly valid: boolean;
  readonly inspectedRecords: number;
  readonly failures: number;
  readonly results: readonly PersistenceIntegrityRecordResult[];
  readonly domains: readonly PersistenceIntegrityDomain[];
}

export class PersistenceIntegrityEngine {
  public constructor(
    private readonly storage: PersistenceStorageProvider,
    private readonly serialization: SerializationEngine,
    private readonly validation: PersistenceValidationEngine,
  ) {}

  public async verifySaveGames(
    generatedAt = new Date().toISOString(),
  ): Promise<PersistenceIntegrityReport> {
    const keys = await this.storage.listKeys(SAVE_GAME_KEY_PREFIX);
    const results: PersistenceIntegrityRecordResult[] = [];
    for (const key of keys) {
      try {
        const raw = await this.storage.getItem(key);
        if (raw === null) throw new Error('Record disappeared during integrity inspection.');
        const envelope = await this.serialization.deserialize<SaveGamePayload>(raw, 'save-game');
        this.validation.assertSaveGame(envelope.payload);
        results.push(Object.freeze({ key, valid: true, recordId: envelope.recordId, errorMessage: null }));
      } catch (error) {
        results.push(Object.freeze({
          key,
          valid: false,
          recordId: null,
          errorMessage: error instanceof Error ? error.message : String(error),
        }));
      }
    }
    const failures = results.filter((result) => !result.valid).length;
    return Object.freeze({
      generatedAt,
      valid: failures === 0,
      inspectedRecords: results.length,
      failures,
      results: Object.freeze(results),
      domains: Object.freeze(['save'] as const),
    });
  }

  public async verify(
    probes: readonly PersistenceIntegrityProbe[],
    generatedAt = new Date().toISOString(),
  ): Promise<PersistenceIntegrityReport> {
    const ids = new Set<string>();
    const domains = new Set<PersistenceIntegrityDomain>();
    const results: PersistenceIntegrityRecordResult[] = [];
    for (const probe of probes) {
      if (ids.has(probe.probeId)) throw new Error(`Duplicate integrity probe: ${probe.probeId}`);
      ids.add(probe.probeId);
      domains.add(probe.domain);
      try {
        results.push(...(await probe.inspect()));
      } catch (error) {
        results.push(Object.freeze({
          key: `probe:${probe.probeId}`,
          valid: false,
          recordId: null,
          errorMessage: error instanceof Error ? error.message : String(error),
        }));
      }
    }
    const failures = results.filter((result) => !result.valid).length;
    return Object.freeze({
      generatedAt,
      valid: failures === 0,
      inspectedRecords: results.length,
      failures,
      results: Object.freeze(results),
      domains: Object.freeze([...domains].sort()),
    });
  }
}
