/**
 * Artifact ID: QCQ-PER-004
 * Artifact Name: SerializationEngine
 * Repository Path: QCQ/frontend/src/persistence/SerializationEngine.ts
 */

import {
  PERSISTENCE_CANONICALIZATION,
  PERSISTENCE_CHECKSUM_ALGORITHM,
  PERSISTENCE_FORMAT,
} from './PersistenceConstants';
import type {
  PersistenceEnvelope,
  PersistenceRecordKind,
  UnsignedPersistenceEnvelope,
} from './PersistenceTypes';
import { PersistenceError } from './PersistenceTypes';

const textEncoder = new TextEncoder();

function normalizeNumber(value: number): number {
  if (!Number.isFinite(value)) {
    throw new PersistenceError(
      'Persistence data cannot contain NaN or infinite numbers.',
      'PERSISTENCE_NON_FINITE_NUMBER',
    );
  }
  return Object.is(value, -0) ? 0 : value;
}

function canonicalize(value: unknown, seen: WeakSet<object>): unknown {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (typeof value === 'number') return normalizeNumber(value);
  if (typeof value === 'undefined') {
    throw new PersistenceError(
      'Persistence data cannot contain undefined values.',
      'PERSISTENCE_UNDEFINED_VALUE',
    );
  }
  if (
    typeof value === 'bigint' ||
    typeof value === 'function' ||
    typeof value === 'symbol'
  ) {
    throw new PersistenceError(
      `Persistence data cannot contain ${typeof value} values.`,
      'PERSISTENCE_UNSUPPORTED_VALUE',
    );
  }
  if (typeof value !== 'object') {
    throw new PersistenceError(
      'Persistence data contains an unsupported value.',
      'PERSISTENCE_UNSUPPORTED_VALUE',
    );
  }
  if (seen.has(value)) {
    throw new PersistenceError(
      'Persistence data cannot contain circular references.',
      'PERSISTENCE_CIRCULAR_REFERENCE',
    );
  }

  seen.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map((entry) => canonicalize(entry, seen));
    }

    if (Object.getPrototypeOf(value) !== Object.prototype) {
      throw new PersistenceError(
        'Persistence objects must be plain records or arrays.',
        'PERSISTENCE_NON_PLAIN_OBJECT',
      );
    }

    const record = value as Record<string, unknown>;
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      normalized[key] = canonicalize(record[key], seen);
    }
    return normalized;
  } finally {
    seen.delete(value);
  }
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value, new WeakSet<object>()));
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function sha256Hex(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new PersistenceError(
      'Web Crypto SHA-256 is unavailable in this runtime.',
      'PERSISTENCE_CRYPTO_UNAVAILABLE',
    );
  }
  const digest = await subtle.digest('SHA-256', textEncoder.encode(value));
  return toHex(digest);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class SerializationEngine {
  public async createEnvelope<TPayload>(
    kind: PersistenceRecordKind,
    recordId: string,
    revision: number,
    schemaVersion: string,
    payload: TPayload,
    timestamps: { readonly createdAt: string; readonly updatedAt: string },
  ): Promise<PersistenceEnvelope<TPayload>> {
    const unsigned: UnsignedPersistenceEnvelope<TPayload> = Object.freeze({
      format: PERSISTENCE_FORMAT,
      schemaVersion,
      kind,
      recordId,
      revision,
      createdAt: timestamps.createdAt,
      updatedAt: timestamps.updatedAt,
      payload,
    });

    const digest = await sha256Hex(stableStringify(unsigned));
    return Object.freeze({
      ...unsigned,
      checksum: Object.freeze({
        algorithm: PERSISTENCE_CHECKSUM_ALGORITHM,
        canonicalization: PERSISTENCE_CANONICALIZATION,
        digest,
      }),
    });
  }

  public serialize<TPayload>(
    envelope: PersistenceEnvelope<TPayload>,
  ): string {
    return stableStringify(envelope);
  }

  public parse(serialized: string): unknown {
    try {
      return JSON.parse(serialized) as unknown;
    } catch (error) {
      throw new PersistenceError(
        'Persisted data is not valid JSON.',
        'PERSISTENCE_INVALID_JSON',
        error,
      );
    }
  }

  public async deserialize<TPayload>(
    serialized: string,
    expectedKind?: PersistenceRecordKind,
  ): Promise<PersistenceEnvelope<TPayload>> {
    const parsed = this.parse(serialized);
    if (!isRecord(parsed)) {
      throw new PersistenceError(
        'Persisted data is not an envelope object.',
        'PERSISTENCE_INVALID_ENVELOPE',
      );
    }

    const checksum = parsed.checksum;
    if (!isRecord(checksum) || typeof checksum.digest !== 'string') {
      throw new PersistenceError(
        'Persisted envelope checksum is missing.',
        'PERSISTENCE_CHECKSUM_MISSING',
      );
    }
    if (
      checksum.algorithm !== PERSISTENCE_CHECKSUM_ALGORITHM ||
      checksum.canonicalization !== PERSISTENCE_CANONICALIZATION
    ) {
      throw new PersistenceError(
        'Persisted envelope uses an unsupported integrity format.',
        'PERSISTENCE_CHECKSUM_UNSUPPORTED',
      );
    }

    const unsigned = { ...parsed };
    delete unsigned.checksum;
    const actualDigest = await sha256Hex(stableStringify(unsigned));
    if (actualDigest !== checksum.digest) {
      throw new PersistenceError(
        'Persisted envelope failed checksum verification.',
        'PERSISTENCE_CHECKSUM_MISMATCH',
      );
    }

    if (
      parsed.format !== PERSISTENCE_FORMAT ||
      typeof parsed.schemaVersion !== 'string' ||
      typeof parsed.kind !== 'string' ||
      typeof parsed.recordId !== 'string' ||
      typeof parsed.revision !== 'number' ||
      typeof parsed.createdAt !== 'string' ||
      typeof parsed.updatedAt !== 'string' ||
      !('payload' in parsed)
    ) {
      throw new PersistenceError(
        'Persisted envelope metadata is invalid.',
        'PERSISTENCE_INVALID_ENVELOPE',
      );
    }

    if (expectedKind !== undefined && parsed.kind !== expectedKind) {
      throw new PersistenceError(
        `Expected ${expectedKind} but received ${String(parsed.kind)}.`,
        'PERSISTENCE_KIND_MISMATCH',
      );
    }

    return parsed as unknown as PersistenceEnvelope<TPayload>;
  }

  public byteLength(serialized: string): number {
    return textEncoder.encode(serialized).byteLength;
  }
}
