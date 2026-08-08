/**
 * Artifact ID: QCQ-PER-030
 * Artifact Name: PersistenceComposerBridge
 * Repository Path: QCQ/frontend/src/persistence/PersistenceComposerBridge.ts
 */

import type { PlayerProfileStore } from './PlayerProfileStore';
import type { SaveGameEngine } from './SaveGameEngine';
import type { PlayerProgressSnapshot } from './PlayerProgressSnapshot';
import type { PlayerProfile, SaveGamePayload, SessionRestoreResult } from './PersistenceTypes';

export interface PersistenceComposerServices {
  readonly profiles: PlayerProfileStore;
  readonly saves: SaveGameEngine;
}

export interface PersistenceComposerProjection {
  readonly profile: PlayerProfile | null;
  readonly save: SaveGamePayload | null;
  readonly progress: PlayerProgressSnapshot | null;
  readonly restore: SessionRestoreResult | null;
}

export class PersistenceComposerBridge {
  public constructor(private readonly services: PersistenceComposerServices) {}

  public getServices(): PersistenceComposerServices {
    return this.services;
  }

  public createProjection(
    profile: PlayerProfile | null,
    save: SaveGamePayload | null,
    progress: PlayerProgressSnapshot | null,
    restore: SessionRestoreResult | null,
  ): PersistenceComposerProjection {
    if (profile !== null && save !== null && profile.profileId !== save.profileId) {
      throw new Error('Composer persistence projection crosses profile boundaries.');
    }
    return Object.freeze({ profile, save, progress, restore });
  }
}
