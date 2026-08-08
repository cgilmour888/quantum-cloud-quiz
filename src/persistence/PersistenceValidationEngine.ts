/**
 * Artifact ID: QCQ-PER-003
 * Artifact Name: PersistenceValidationEngine
 * Repository Path: QCQ/frontend/src/persistence/PersistenceValidationEngine.ts
 */

import {
  IDENTIFIER_PATTERN,
  MAX_COLLECTION_ITEMS,
  MAX_METADATA_KEYS,
  MAX_STRING_LENGTH,
  PERSISTENCE_SCHEMA_VERSION,
} from './PersistenceConstants';
import type {
  AccessibilityPreferences,
  AudioPreferences,
  PersistedAnswerRecord,
  PlayerProfile,
  PrivacyPreferences,
  SaveGamePayload,
  VisualEffectPreferences,
  PersistenceValidationIssue,
  PersistenceValidationReport,
} from './PersistenceTypes';
import { PersistenceValidationError } from './PersistenceTypes';

type MutableIssues = PersistenceValidationIssue[];

function issue(
  issues: MutableIssues,
  path: string,
  code: string,
  message: string,
  severity: 'error' | 'warning' = 'error',
): void {
  issues.push(Object.freeze({ severity, code, path, message }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(
  value: unknown,
  path: string,
  issues: MutableIssues,
  options: { readonly identifier?: boolean; readonly allowEmpty?: boolean } = {},
): value is string {
  if (typeof value !== 'string') {
    issue(issues, path, 'TYPE_STRING', 'Expected a string.');
    return false;
  }
  if (!options.allowEmpty && value.trim().length === 0) {
    issue(issues, path, 'STRING_EMPTY', 'Value cannot be empty.');
    return false;
  }
  if (value.length > MAX_STRING_LENGTH) {
    issue(issues, path, 'STRING_TOO_LONG', 'Value exceeds the persistence length limit.');
    return false;
  }
  if (options.identifier && !IDENTIFIER_PATTERN.test(value)) {
    issue(issues, path, 'IDENTIFIER_INVALID', 'Value is not a valid QCQ identifier.');
    return false;
  }
  return true;
}

function requireInteger(
  value: unknown,
  path: string,
  issues: MutableIssues,
  minimum = 0,
): value is number {
  if (!Number.isInteger(value) || (value as number) < minimum) {
    issue(issues, path, 'INTEGER_INVALID', `Expected an integer greater than or equal to ${minimum}.`);
    return false;
  }
  return true;
}

function requireFiniteNumber(
  value: unknown,
  path: string,
  issues: MutableIssues,
  minimum?: number,
  maximum?: number,
): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issue(issues, path, 'NUMBER_INVALID', 'Expected a finite number.');
    return false;
  }
  if (minimum !== undefined && value < minimum) {
    issue(issues, path, 'NUMBER_TOO_SMALL', `Expected a value greater than or equal to ${minimum}.`);
    return false;
  }
  if (maximum !== undefined && value > maximum) {
    issue(issues, path, 'NUMBER_TOO_LARGE', `Expected a value less than or equal to ${maximum}.`);
    return false;
  }
  return true;
}

function requireIsoDate(
  value: unknown,
  path: string,
  issues: MutableIssues,
): value is string {
  if (!requireString(value, path, issues)) return false;
  if (!Number.isFinite(Date.parse(value))) {
    issue(issues, path, 'DATE_INVALID', 'Expected an ISO-compatible date-time.');
    return false;
  }
  return true;
}

function requireStringArray(
  value: unknown,
  path: string,
  issues: MutableIssues,
  identifiers = false,
): value is readonly string[] {
  if (!Array.isArray(value)) {
    issue(issues, path, 'ARRAY_REQUIRED', 'Expected an array.');
    return false;
  }
  if (value.length > MAX_COLLECTION_ITEMS) {
    issue(issues, path, 'ARRAY_TOO_LARGE', 'Collection exceeds the persistence item limit.');
  }
  const seen = new Set<string>();
  value.forEach((entry, index) => {
    if (requireString(entry, `${path}[${index}]`, issues, { identifier: identifiers })) {
      if (seen.has(entry)) {
        issue(issues, `${path}[${index}]`, 'ARRAY_DUPLICATE', 'Duplicate values are not permitted.');
      }
      seen.add(entry);
    }
  });
  return true;
}

function validateAccessibility(
  value: unknown,
  path: string,
  issues: MutableIssues,
): value is AccessibilityPreferences {
  if (!isRecord(value)) {
    issue(issues, path, 'OBJECT_REQUIRED', 'Expected accessibility preferences.');
    return false;
  }
  const motions = new Set(['system', 'reduced', 'full', 'static']);
  if (!motions.has(String(value.motion))) {
    issue(issues, `${path}.motion`, 'ENUM_INVALID', 'Unsupported motion preference.');
  }
  for (const field of [
    'reducedTransparency',
    'reducedSensory',
    'highContrast',
    'largeTargets',
    'screenReaderOptimized',
    'announceDecorativeEffects',
  ] as const) {
    if (typeof value[field] !== 'boolean') {
      issue(issues, `${path}.${field}`, 'BOOLEAN_REQUIRED', 'Expected a boolean.');
    }
  }
  if (value.announceDecorativeEffects !== false) {
    issue(
      issues,
      `${path}.announceDecorativeEffects`,
      'DECORATIVE_AT_EXPOSURE',
      'Decorative effects must remain hidden from assistive technology.',
    );
  }
  return true;
}

function validateVisualEffects(
  value: unknown,
  path: string,
  issues: MutableIssues,
): value is VisualEffectPreferences {
  if (!isRecord(value)) {
    issue(issues, path, 'OBJECT_REQUIRED', 'Expected visual-effect preferences.');
    return false;
  }
  if (!new Set(['performance', 'balanced', 'cinematic']).has(String(value.quality))) {
    issue(issues, `${path}.quality`, 'ENUM_INVALID', 'Unsupported quality preference.');
  }
  for (const field of [
    'stormEnabled',
    'lightningEnabled',
    'particlesEnabled',
    'reflectionsEnabled',
  ] as const) {
    if (typeof value[field] !== 'boolean') {
      issue(issues, `${path}.${field}`, 'BOOLEAN_REQUIRED', 'Expected a boolean.');
    }
  }
  requireFiniteNumber(value.glowIntensity, `${path}.glowIntensity`, issues, 0, 1);
  return true;
}

function validateAudio(
  value: unknown,
  path: string,
  issues: MutableIssues,
): value is AudioPreferences {
  if (!isRecord(value)) {
    issue(issues, path, 'OBJECT_REQUIRED', 'Expected audio preferences.');
    return false;
  }
  if (typeof value.enabled !== 'boolean') {
    issue(issues, `${path}.enabled`, 'BOOLEAN_REQUIRED', 'Expected a boolean.');
  }
  if (typeof value.concentrationMode !== 'boolean') {
    issue(issues, `${path}.concentrationMode`, 'BOOLEAN_REQUIRED', 'Expected a boolean.');
  }
  requireFiniteNumber(value.musicVolume, `${path}.musicVolume`, issues, 0, 1);
  requireFiniteNumber(value.effectsVolume, `${path}.effectsVolume`, issues, 0, 1);
  return true;
}

function validatePrivacy(
  value: unknown,
  path: string,
  issues: MutableIssues,
): value is PrivacyPreferences {
  if (!isRecord(value)) {
    issue(issues, path, 'OBJECT_REQUIRED', 'Expected privacy preferences.');
    return false;
  }
  const values = new Set(['unset', 'granted', 'denied']);
  for (const field of [
    'analytics',
    'aiPersonalization',
    'cloudSynchronization',
    'organizationReporting',
  ] as const) {
    if (!values.has(String(value[field]))) {
      issue(issues, `${path}.${field}`, 'ENUM_INVALID', 'Unsupported consent state.');
    }
  }
  return true;
}

function validateAnswer(
  value: unknown,
  index: number,
  issues: MutableIssues,
): value is PersistedAnswerRecord {
  const path = `save.answers[${index}]`;
  if (!isRecord(value)) {
    issue(issues, path, 'OBJECT_REQUIRED', 'Expected an answer record.');
    return false;
  }
  requireString(value.questionId, `${path}.questionId`, issues, { identifier: true });
  requireStringArray(value.selectedOptionIds, `${path}.selectedOptionIds`, issues, true);
  requireStringArray(value.correctOptionIds, `${path}.correctOptionIds`, issues, true);
  requireIsoDate(value.submittedAt, `${path}.submittedAt`, issues);
  if (value.responseTimeMilliseconds !== null) {
    requireFiniteNumber(
      value.responseTimeMilliseconds,
      `${path}.responseTimeMilliseconds`,
      issues,
      0,
    );
  }
  if (typeof value.isCorrect !== 'boolean') {
    issue(issues, `${path}.isCorrect`, 'BOOLEAN_REQUIRED', 'Expected a boolean.');
  }
  requireFiniteNumber(value.scoreAwarded, `${path}.scoreAwarded`, issues, 0);
  requireInteger(value.attemptNumber, `${path}.attemptNumber`, issues, 1);
  return true;
}

function report(issues: MutableIssues): PersistenceValidationReport {
  const frozen = Object.freeze([...issues]);
  return Object.freeze({
    valid: !frozen.some((entry) => entry.severity === 'error'),
    issues: frozen,
  });
}

export class PersistenceValidationEngine {
  public validatePlayerProfile(value: unknown): PersistenceValidationReport {
    const issues: MutableIssues = [];
    if (!isRecord(value)) {
      issue(issues, 'profile', 'OBJECT_REQUIRED', 'Expected a player profile object.');
      return report(issues);
    }

    if (value.schemaVersion !== PERSISTENCE_SCHEMA_VERSION) {
      issue(issues, 'profile.schemaVersion', 'SCHEMA_UNSUPPORTED', 'Unsupported profile schema version.');
    }
    requireString(value.profileId, 'profile.profileId', issues, { identifier: true });
    requireInteger(value.revision, 'profile.revision', issues);
    requireString(value.displayName, 'profile.displayName', issues);
    requireString(value.locale, 'profile.locale', issues);
    requireString(value.timeZone, 'profile.timeZone', issues);
    requireIsoDate(value.createdAt, 'profile.createdAt', issues);
    requireIsoDate(value.updatedAt, 'profile.updatedAt', issues);

    if (!Array.isArray(value.certificationTracks)) {
      issue(issues, 'profile.certificationTracks', 'ARRAY_REQUIRED', 'Expected certification tracks.');
    } else {
      value.certificationTracks.forEach((track, index) => {
        const path = `profile.certificationTracks[${index}]`;
        if (!isRecord(track)) {
          issue(issues, path, 'OBJECT_REQUIRED', 'Expected a certification track.');
          return;
        }
        requireString(track.certificationId, `${path}.certificationId`, issues, { identifier: true });
        requireString(track.displayName, `${path}.displayName`, issues);
        if (!new Set(['planned', 'active', 'completed', 'archived']).has(String(track.status))) {
          issue(issues, `${path}.status`, 'ENUM_INVALID', 'Unsupported certification-track status.');
        }
        requireIsoDate(track.enrolledAt, `${path}.enrolledAt`, issues);
        if (track.completedAt !== null) {
          requireIsoDate(track.completedAt, `${path}.completedAt`, issues);
        }
        if (track.latestDatasetId !== null) {
          requireString(track.latestDatasetId, `${path}.latestDatasetId`, issues, { identifier: true });
        }
      });
    }

    if (!Array.isArray(value.organizationMemberships)) {
      issue(issues, 'profile.organizationMemberships', 'ARRAY_REQUIRED', 'Expected organization memberships.');
    } else {
      value.organizationMemberships.forEach((membership, index) => {
        const path = `profile.organizationMemberships[${index}]`;
        if (!isRecord(membership)) {
          issue(issues, path, 'OBJECT_REQUIRED', 'Expected an organization membership.');
          return;
        }
        requireString(membership.organizationId, `${path}.organizationId`, issues, { identifier: true });
        requireString(membership.displayName, `${path}.displayName`, issues);
        requireString(membership.role, `${path}.role`, issues);
        requireIsoDate(membership.joinedAt, `${path}.joinedAt`, issues);
      });
    }

    validateAccessibility(value.accessibility, 'profile.accessibility', issues);
    validateVisualEffects(value.visualEffects, 'profile.visualEffects', issues);
    validateAudio(value.audio, 'profile.audio', issues);
    validatePrivacy(value.privacy, 'profile.privacy', issues);

    if (!isRecord(value.metadata)) {
      issue(issues, 'profile.metadata', 'OBJECT_REQUIRED', 'Expected metadata record.');
    } else if (Object.keys(value.metadata).length > MAX_METADATA_KEYS) {
      issue(issues, 'profile.metadata', 'METADATA_TOO_LARGE', 'Metadata exceeds the key limit.');
    }

    return report(issues);
  }

  public validateSaveGame(value: unknown): PersistenceValidationReport {
    const issues: MutableIssues = [];
    if (!isRecord(value)) {
      issue(issues, 'save', 'OBJECT_REQUIRED', 'Expected a save-game object.');
      return report(issues);
    }

    if (value.schemaVersion !== PERSISTENCE_SCHEMA_VERSION) {
      issue(issues, 'save.schemaVersion', 'SCHEMA_UNSUPPORTED', 'Unsupported save-game schema version.');
    }
    requireString(value.saveId, 'save.saveId', issues, { identifier: true });
    requireInteger(value.revision, 'save.revision', issues);
    requireInteger(value.sequence, 'save.sequence', issues);
    requireString(value.profileId, 'save.profileId', issues, { identifier: true });
    requireIsoDate(value.createdAt, 'save.createdAt', issues);
    requireIsoDate(value.updatedAt, 'save.updatedAt', issues);

    if (!isRecord(value.dataset)) {
      issue(issues, 'save.dataset', 'OBJECT_REQUIRED', 'Expected dataset identity.');
    } else {
      requireString(value.dataset.datasetId, 'save.dataset.datasetId', issues, { identifier: true });
      requireString(value.dataset.datasetVersion, 'save.dataset.datasetVersion', issues);
      requireString(value.dataset.certificationId, 'save.dataset.certificationId', issues, { identifier: true });
      if (value.dataset.checksum !== null) {
        requireString(value.dataset.checksum, 'save.dataset.checksum', issues);
      }
    }

    if (!isRecord(value.session)) {
      issue(issues, 'save.session', 'OBJECT_REQUIRED', 'Expected session state.');
    } else {
      requireString(value.session.sessionId, 'save.session.sessionId', issues, { identifier: true });
      if (!new Set(['active', 'paused', 'completed', 'abandoned']).has(String(value.session.status))) {
        issue(issues, 'save.session.status', 'ENUM_INVALID', 'Unsupported session status.');
      }
      requireString(value.session.mode, 'save.session.mode', issues);
      requireString(value.session.seed, 'save.session.seed', issues);
      requireStringArray(value.session.questionIds, 'save.session.questionIds', issues, true);
      requireInteger(value.session.currentQuestionIndex, 'save.session.currentQuestionIndex', issues);
      requireIsoDate(value.session.startedAt, 'save.session.startedAt', issues);
      requireIsoDate(value.session.updatedAt, 'save.session.updatedAt', issues);
      if (value.session.completedAt !== null) {
        requireIsoDate(value.session.completedAt, 'save.session.completedAt', issues);
      }
      if (
        Array.isArray(value.session.questionIds) &&
        typeof value.session.currentQuestionIndex === 'number' &&
        value.session.questionIds.length > 0 &&
        value.session.currentQuestionIndex >= value.session.questionIds.length
      ) {
        issue(
          issues,
          'save.session.currentQuestionIndex',
          'QUESTION_INDEX_OUT_OF_RANGE',
          'Current question index exceeds the question sequence.',
        );
      }
    }

    if (!Array.isArray(value.answers)) {
      issue(issues, 'save.answers', 'ARRAY_REQUIRED', 'Expected answer history.');
    } else {
      value.answers.forEach((answer, index) => validateAnswer(answer, index, issues));
    }

    if (!isRecord(value.timer)) {
      issue(issues, 'save.timer', 'OBJECT_REQUIRED', 'Expected timer state.');
    } else {
      if (!new Set(['count-up', 'count-down', 'untimed']).has(String(value.timer.mode))) {
        issue(issues, 'save.timer.mode', 'ENUM_INVALID', 'Unsupported timer mode.');
      }
      requireFiniteNumber(value.timer.elapsedMilliseconds, 'save.timer.elapsedMilliseconds', issues, 0);
      if (value.timer.remainingMilliseconds !== null) {
        requireFiniteNumber(value.timer.remainingMilliseconds, 'save.timer.remainingMilliseconds', issues, 0);
      }
      if (typeof value.timer.running !== 'boolean') {
        issue(issues, 'save.timer.running', 'BOOLEAN_REQUIRED', 'Expected a boolean.');
      }
      requireIsoDate(value.timer.capturedAt, 'save.timer.capturedAt', issues);
    }

    if (!isRecord(value.metrics)) {
      issue(issues, 'save.metrics', 'OBJECT_REQUIRED', 'Expected metrics state.');
    } else {
      for (const field of [
        'score',
        'maximumScore',
        'questionsAnswered',
        'questionsRemaining',
        'currentStreak',
        'bestStreak',
      ] as const) {
        requireFiniteNumber(value.metrics[field], `save.metrics.${field}`, issues, 0);
      }
      requireIsoDate(value.metrics.updatedAt, 'save.metrics.updatedAt', issues);
    }

    if (!isRecord(value.player)) {
      issue(issues, 'save.player', 'OBJECT_REQUIRED', 'Expected player state.');
    } else {
      requireFiniteNumber(value.player.totalXP, 'save.player.totalXP', issues, 0);
      requireFiniteNumber(value.player.sessionXP, 'save.player.sessionXP', issues, 0);
      requireInteger(value.player.level, 'save.player.level', issues, 1);
      requireString(value.player.levelTitle, 'save.player.levelTitle', issues);
      if (value.player.rankId !== null) {
        requireString(value.player.rankId, 'save.player.rankId', issues, { identifier: true });
      }
      requireIsoDate(value.player.updatedAt, 'save.player.updatedAt', issues);
    }

    if (!isRecord(value.achievements)) {
      issue(issues, 'save.achievements', 'OBJECT_REQUIRED', 'Expected achievement state.');
    } else {
      requireStringArray(
        value.achievements.unlockedAchievementIds,
        'save.achievements.unlockedAchievementIds',
        issues,
        true,
      );
      requireStringArray(
        value.achievements.newlyUnlockedAchievementIds,
        'save.achievements.newlyUnlockedAchievementIds',
        issues,
        true,
      );
      requireIsoDate(value.achievements.updatedAt, 'save.achievements.updatedAt', issues);
    }

    if (!isRecord(value.preferencesSnapshot)) {
      issue(issues, 'save.preferencesSnapshot', 'OBJECT_REQUIRED', 'Expected preferences snapshot.');
    } else {
      validateAccessibility(
        value.preferencesSnapshot.accessibility,
        'save.preferencesSnapshot.accessibility',
        issues,
      );
      validateVisualEffects(
        value.preferencesSnapshot.visualEffects,
        'save.preferencesSnapshot.visualEffects',
        issues,
      );
      validateAudio(
        value.preferencesSnapshot.audio,
        'save.preferencesSnapshot.audio',
        issues,
      );
    }

    requireStringArray(value.bookmarks, 'save.bookmarks', issues, true);
    requireStringArray(value.flags, 'save.flags', issues, true);

    if (!isRecord(value.extensionData)) {
      issue(issues, 'save.extensionData', 'OBJECT_REQUIRED', 'Expected extension-data record.');
    } else if (Object.keys(value.extensionData).length > MAX_METADATA_KEYS) {
      issue(issues, 'save.extensionData', 'METADATA_TOO_LARGE', 'Extension data exceeds the key limit.');
    }

    return report(issues);
  }

  public assertPlayerProfile(value: unknown): asserts value is PlayerProfile {
    const validation = this.validatePlayerProfile(value);
    if (!validation.valid) {
      throw new PersistenceValidationError('Player profile validation failed.', validation);
    }
  }

  public assertSaveGame(value: unknown): asserts value is SaveGamePayload {
    const validation = this.validateSaveGame(value);
    if (!validation.valid) {
      throw new PersistenceValidationError('Save-game validation failed.', validation);
    }
  }
}
