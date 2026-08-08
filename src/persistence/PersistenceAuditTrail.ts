/**
 * Artifact ID: QCQ-PER-038
 * Artifact Name: PersistenceAuditTrail
 * Repository Path: QCQ/frontend/src/persistence/PersistenceAuditTrail.ts
 */

import type { JsonValue } from './PersistenceTypes';
import { sha256Hex, stableStringify } from './SerializationEngine';

export interface PersistenceAuditRecord {
  readonly sequence: number;
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredAt: string;
  readonly actor: string;
  readonly properties: Readonly<Record<string, JsonValue>>;
  readonly previousDigest: string | null;
  readonly digest: string;
}

export interface PersistenceAuditSink {
  append(record: PersistenceAuditRecord): Promise<void> | void;
}

export class PersistenceAuditTrail {
  private readonly records: PersistenceAuditRecord[] = [];

  public constructor(private readonly sink: PersistenceAuditSink | null = null) {}

  public async record(
    eventId: string,
    eventType: string,
    actor: string,
    properties: Readonly<Record<string, JsonValue>>,
    occurredAt = new Date().toISOString(),
  ): Promise<PersistenceAuditRecord> {
    if (eventId.trim().length === 0 || eventType.trim().length === 0) {
      throw new Error('Persistence audit identity and event type are required.');
    }
    const previous = this.records.at(-1) ?? null;
    const unsigned = {
      sequence: this.records.length + 1,
      eventId,
      eventType,
      occurredAt,
      actor,
      properties: Object.freeze({ ...properties }),
      previousDigest: previous?.digest ?? null,
    };
    const record: PersistenceAuditRecord = Object.freeze({
      ...unsigned,
      digest: await sha256Hex(stableStringify(unsigned)),
    });
    this.records.push(record);
    await this.sink?.append(record);
    return record;
  }

  public async verify(): Promise<boolean> {
    let previousDigest: string | null = null;
    for (const record of this.records) {
      const { digest, ...unsigned } = record;
      if (unsigned.previousDigest !== previousDigest) return false;
      if ((await sha256Hex(stableStringify(unsigned))) !== digest) return false;
      previousDigest = digest;
    }
    return true;
  }

  public snapshot(): readonly PersistenceAuditRecord[] {
    return Object.freeze([...this.records]);
  }
}
