/**
 * Artifact ID: QCQ-PER-019
 * Artifact Name: SaveConflictResolver
 * Repository Path: QCQ/frontend/src/persistence/SaveConflictResolver.ts
 */

import type { SaveGamePayload } from './PersistenceTypes';

export type SaveConflictStrategy =
  | 'accept-local'
  | 'accept-remote'
  | 'identical'
  | 'manual-reconciliation';

export interface SaveConflictResolution {
  readonly strategy: SaveConflictStrategy;
  readonly winner: SaveGamePayload | null;
  readonly reasons: readonly string[];
}

function timestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export class SaveConflictResolver {
  public resolve(
    local: SaveGamePayload,
    remote: SaveGamePayload,
  ): SaveConflictResolution {
    if (local.saveId !== remote.saveId || local.profileId !== remote.profileId) {
      return Object.freeze({
        strategy: 'manual-reconciliation',
        winner: null,
        reasons: Object.freeze(['Save identities do not match.']),
      });
    }

    if (
      local.revision === remote.revision &&
      local.sequence === remote.sequence &&
      local.updatedAt === remote.updatedAt
    ) {
      return Object.freeze({
        strategy: 'identical',
        winner: local,
        reasons: Object.freeze(['Revision, sequence, and update timestamp are identical.']),
      });
    }

    const localTuple = [local.revision, local.sequence, timestamp(local.updatedAt)] as const;
    const remoteTuple = [remote.revision, remote.sequence, timestamp(remote.updatedAt)] as const;
    const compare =
      localTuple[0] - remoteTuple[0] ||
      localTuple[1] - remoteTuple[1] ||
      localTuple[2] - remoteTuple[2];

    if (compare === 0) {
      return Object.freeze({
        strategy: 'manual-reconciliation',
        winner: null,
        reasons: Object.freeze(['Conflicting payloads have indistinguishable ordering metadata.']),
      });
    }

    const localWins = compare > 0;
    return Object.freeze({
      strategy: localWins ? 'accept-local' : 'accept-remote',
      winner: localWins ? local : remote,
      reasons: Object.freeze([
        localWins
          ? 'Local save is newer by revision, sequence, or timestamp.'
          : 'Remote save is newer by revision, sequence, or timestamp.',
      ]),
    });
  }
}
