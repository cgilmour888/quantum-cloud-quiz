/**
 * Artifact ID: QCQ-TBL-034
 * Artifact Name: PlayerProfileStore
 * Repository Path: QCQ/frontend/src/persistence/PlayerProfileStore.ts
 */

import {
  ACTIVE_PROFILE_KEY,
  IDENTIFIER_PATTERN,
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  DEFAULT_AUDIO_PREFERENCES,
  DEFAULT_PRIVACY_PREFERENCES,
  DEFAULT_VISUAL_EFFECT_PREFERENCES,
  MAX_PROFILE_BYTES,
  PERSISTENCE_SCHEMA_VERSION,
  PLAYER_PROFILE_KEY_PREFIX,
  profileStorageKey,
} from './PersistenceConstants';
import type {
  PlayerProfile,
  PlayerProfileCreateInput,
  PersistenceEnvelope,
  PersistenceStorageProvider,
} from './PersistenceTypes';
import { PersistenceError } from './PersistenceTypes';
import { BackupRecoveryEngine } from './BackupRecoveryEngine';
import { PersistenceValidationEngine } from './PersistenceValidationEngine';
import { SerializationEngine } from './SerializationEngine';
import { VersionMigrationEngine } from './VersionMigrationEngine';

type ProfileListener = (profile: PlayerProfile | null) => void;

function createProfileId(): string {
  try {
    return `profile-${globalThis.crypto.randomUUID()}`;
  } catch {
    return `profile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

function assertProfileId(profileId: string): void {
  if (!IDENTIFIER_PATTERN.test(profileId)) {
    throw new PersistenceError(
      'Player profile identifier is invalid.',
      'PERSISTENCE_PROFILE_ID_INVALID',
    );
  }
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested);
    }
  }
  return value;
}

export class PlayerProfileStore {
  private activeProfile: PlayerProfile | null = null;
  private readonly listeners = new Set<ProfileListener>();

  public constructor(
    private readonly storage: PersistenceStorageProvider,
    private readonly serialization: SerializationEngine,
    private readonly validation: PersistenceValidationEngine,
    private readonly migration: VersionMigrationEngine,
    private readonly backups: BackupRecoveryEngine,
  ) {}

  public readonly getSnapshot = (): PlayerProfile | null => this.activeProfile;
  public readonly getServerSnapshot = (): PlayerProfile | null => null;

  public readonly subscribe = (listener: ProfileListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public async create(
    input: PlayerProfileCreateInput,
  ): Promise<PlayerProfile> {
    const now = new Date().toISOString();
    const profile: PlayerProfile = deepFreeze({
      schemaVersion: PERSISTENCE_SCHEMA_VERSION,
      profileId: input.profileId ?? createProfileId(),
      revision: 1,
      displayName: input.displayName.trim(),
      locale: input.locale ?? globalThis.navigator?.language ?? 'en-US',
      timeZone:
        input.timeZone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone ??
        'UTC',
      createdAt: now,
      updatedAt: now,
      certificationTracks: [],
      organizationMemberships: [],
      accessibility: {
        ...DEFAULT_ACCESSIBILITY_PREFERENCES,
        ...input.accessibility,
        announceDecorativeEffects: false,
      },
      visualEffects: {
        ...DEFAULT_VISUAL_EFFECT_PREFERENCES,
        ...input.visualEffects,
      },
      audio: {
        ...DEFAULT_AUDIO_PREFERENCES,
        ...input.audio,
      },
      privacy: {
        ...DEFAULT_PRIVACY_PREFERENCES,
        ...input.privacy,
      },
      metadata: input.metadata ?? {},
    });

    this.validation.assertPlayerProfile(profile);
    await this.persist(profile, true);
    return profile;
  }

  public async load(profileId: string): Promise<PlayerProfile | null> {
    assertProfileId(profileId);
    const key = profileStorageKey(profileId);
    return this.storage.runExclusive(key, async () => {
      const raw = await this.storage.getItem(key);
      if (raw === null) return null;
      const envelope = await this.serialization.deserialize<unknown>(
        raw,
        'player-profile',
      );
      const migrated =
        envelope.schemaVersion === PERSISTENCE_SCHEMA_VERSION
          ? (envelope as PersistenceEnvelope<PlayerProfile>)
          : await this.migration.migrate<PlayerProfile>(
              envelope,
              PERSISTENCE_SCHEMA_VERSION,
            );
      this.validation.assertPlayerProfile(migrated.payload);
      this.setActive(deepFreeze(migrated.payload));
      await this.storage.setItem(ACTIVE_PROFILE_KEY, profileId);
      return this.activeProfile;
    });
  }

  public async loadActive(): Promise<PlayerProfile | null> {
    const profileId = await this.storage.getItem(ACTIVE_PROFILE_KEY);
    return profileId === null ? null : this.load(profileId);
  }

  public async update(
    updater: (current: PlayerProfile) => PlayerProfile,
  ): Promise<PlayerProfile> {
    const current = this.activeProfile;
    if (!current) {
      throw new PersistenceError(
        'No active player profile is loaded.',
        'PERSISTENCE_PROFILE_NOT_LOADED',
      );
    }

    const nextCandidate = updater(current);
    const next: PlayerProfile = deepFreeze({
      ...nextCandidate,
      schemaVersion: PERSISTENCE_SCHEMA_VERSION,
      profileId: current.profileId,
      revision: current.revision + 1,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
      accessibility: {
        ...nextCandidate.accessibility,
        announceDecorativeEffects: false,
      },
    });
    this.validation.assertPlayerProfile(next);
    await this.persist(next, true);
    return next;
  }

  public async delete(profileId: string): Promise<void> {
    assertProfileId(profileId);
    const key = profileStorageKey(profileId);
    await this.storage.runExclusive(key, async () => {
      await this.storage.removeItem(key);
      const activeId = await this.storage.getItem(ACTIVE_PROFILE_KEY);
      if (activeId === profileId) {
        await this.storage.removeItem(ACTIVE_PROFILE_KEY);
        this.setActive(null);
      }
    });
  }

  public async listProfileIds(): Promise<readonly string[]> {
    const keys = await this.storage.listKeys(PLAYER_PROFILE_KEY_PREFIX);
    return Object.freeze(
      keys.map((key) => decodeURIComponent(key.slice(PLAYER_PROFILE_KEY_PREFIX.length))),
    );
  }

  private async persist(
    profile: PlayerProfile,
    activate: boolean,
  ): Promise<void> {
    const key = profileStorageKey(profile.profileId);
    assertProfileId(profile.profileId);
    await this.storage.runExclusive(key, async () => {
      const existing = await this.storage.getItem(key);
      if (existing !== null) {
        const current = await this.serialization.deserialize<PlayerProfile>(
          existing,
          'player-profile',
        );
        this.validation.assertPlayerProfile(current.payload);
        if (profile.revision <= current.revision) {
          throw new PersistenceError(
            'Player profile revision must increase monotonically.',
            'PERSISTENCE_PROFILE_REVISION_CONFLICT',
          );
        }
        await this.backups.createBackup(key, existing);
      }

      const envelope = await this.serialization.createEnvelope(
        'player-profile',
        profile.profileId,
        profile.revision,
        PERSISTENCE_SCHEMA_VERSION,
        profile,
        {
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        },
      );
      const serialized = this.serialization.serialize(envelope);
      if (this.serialization.byteLength(serialized) > MAX_PROFILE_BYTES) {
        throw new PersistenceError(
          'Player profile exceeds the configured size limit.',
          'PERSISTENCE_PROFILE_TOO_LARGE',
        );
      }

      try {
        await this.storage.setItem(key, serialized);
        const persisted = await this.storage.getItem(key);
        if (persisted === null) {
          throw new PersistenceError(
            'Player profile disappeared immediately after writing.',
            'PERSISTENCE_PROFILE_VERIFY_MISSING',
          );
        }
        const verified = await this.serialization.deserialize<PlayerProfile>(
          persisted,
          'player-profile',
        );
        this.validation.assertPlayerProfile(verified.payload);
      } catch (error) {
        if (existing !== null) {
          await this.storage.setItem(key, existing);
        } else {
          await this.storage.removeItem(key);
        }
        throw error;
      }

      if (activate) {
        await this.storage.setItem(ACTIVE_PROFILE_KEY, profile.profileId);
        this.setActive(profile);
      }
    });
  }

  private setActive(profile: PlayerProfile | null): void {
    this.activeProfile = profile;
    this.listeners.forEach((listener) => listener(profile));
  }
}
