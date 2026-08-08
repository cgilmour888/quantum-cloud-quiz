/**
 * Artifact ID: QCQ-PER-002
 * Artifact Name: PersistenceConstants
 * Repository Path: QCQ/frontend/src/persistence/PersistenceConstants.ts
 */

import type {
  AccessibilityPreferences,
  AudioPreferences,
  PersistenceSchemaVersion,
  PrivacyPreferences,
  VisualEffectPreferences,
} from './PersistenceTypes';

export const PERSISTENCE_SCHEMA_VERSION: PersistenceSchemaVersion = '1.0.0';
export const PERSISTENCE_FORMAT = 'qcq-persistence' as const;
export const PERSISTENCE_CANONICALIZATION = 'qcq-stable-json-v1' as const;
export const PERSISTENCE_CHECKSUM_ALGORITHM = 'SHA-256' as const;

export const PERSISTENCE_NAMESPACE = 'qcq:v1';
export const PLAYER_PROFILE_KEY_PREFIX = `${PERSISTENCE_NAMESPACE}:profile:`;
export const ACTIVE_PROFILE_KEY = `${PERSISTENCE_NAMESPACE}:profile:active`;
export const SAVE_GAME_KEY_PREFIX = `${PERSISTENCE_NAMESPACE}:save:`;
export const BACKUP_KEY_PREFIX = `${PERSISTENCE_NAMESPACE}:backup:`;
export const BACKUP_INDEX_KEY_PREFIX = `${PERSISTENCE_NAMESPACE}:backup-index:`;
export const STAGING_KEY_PREFIX = `${PERSISTENCE_NAMESPACE}:staging:`;
export const PERSISTENCE_MANIFEST_KEY = `${PERSISTENCE_NAMESPACE}:manifest`;

export const MAX_PROFILE_BYTES = 512 * 1024;
export const MAX_SAVE_GAME_BYTES = 4 * 1024 * 1024;
export const MAX_BACKUPS_PER_RECORD = 5;
export const MAX_STRING_LENGTH = 32_768;
export const MAX_COLLECTION_ITEMS = 50_000;
export const MAX_METADATA_KEYS = 256;
export const MAX_STORAGE_UTILIZATION_RATIO = 0.92;

export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences =
  Object.freeze({
    motion: 'system',
    reducedTransparency: false,
    reducedSensory: false,
    highContrast: false,
    largeTargets: false,
    screenReaderOptimized: false,
    announceDecorativeEffects: false,
  });

export const DEFAULT_VISUAL_EFFECT_PREFERENCES: VisualEffectPreferences =
  Object.freeze({
    quality: 'balanced',
    stormEnabled: true,
    lightningEnabled: true,
    particlesEnabled: true,
    reflectionsEnabled: true,
    glowIntensity: 0.85,
  });

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = Object.freeze({
  enabled: false,
  musicVolume: 0.5,
  effectsVolume: 0.65,
  concentrationMode: false,
});

export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = Object.freeze({
  analytics: 'unset',
  aiPersonalization: 'unset',
  cloudSynchronization: 'unset',
  organizationReporting: 'unset',
});

export const ISO_DATE_ERROR = 'Value must be an ISO-compatible date-time.';
export const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/u;

export function profileStorageKey(profileId: string): string {
  return `${PLAYER_PROFILE_KEY_PREFIX}${encodeURIComponent(profileId)}`;
}

export function saveGameStorageKey(saveId: string): string {
  return `${SAVE_GAME_KEY_PREFIX}${encodeURIComponent(saveId)}`;
}

export function backupIndexStorageKey(sourceKey: string): string {
  return `${BACKUP_INDEX_KEY_PREFIX}${encodeURIComponent(sourceKey)}`;
}

export function backupStorageKey(
  sourceKey: string,
  backupId: string,
): string {
  return `${BACKUP_KEY_PREFIX}${encodeURIComponent(sourceKey)}:${encodeURIComponent(backupId)}`;
}

export function stagingStorageKey(targetKey: string): string {
  return `${STAGING_KEY_PREFIX}${encodeURIComponent(targetKey)}`;
}
