/**
 * Artifact ID: QCQ-PER-001
 * Artifact Name: PersistenceTypes
 * Repository Path: QCQ/frontend/src/persistence/PersistenceTypes.ts
 *
 * Immutable persistence contracts shared by the QCQ local-first persistence
 * subsystem. These contracts intentionally avoid dependencies on UI modules.
 */

export type PersistenceSchemaVersion = '1.0.0';
export type PersistenceEnvelopeFormat = 'qcq-persistence';
export type PersistenceChecksumAlgorithm = 'SHA-256';
export type PersistenceCanonicalization = 'qcq-stable-json-v1';
export type PersistenceRecordKind =
  | 'player-profile'
  | 'save-game'
  | 'backup-index'
  | 'persistence-manifest';

export type ConsentState = 'unset' | 'granted' | 'denied';
export type MotionPreference = 'system' | 'reduced' | 'full' | 'static';
export type QualityPreference = 'performance' | 'balanced' | 'cinematic';
export type ThemePreference = 'system' | 'dark' | 'high-contrast';
export type SessionStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export type RestoreSource = 'primary' | 'backup' | 'none';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export interface AccessibilityPreferences {
  readonly motion: MotionPreference;
  readonly reducedTransparency: boolean;
  readonly reducedSensory: boolean;
  readonly highContrast: boolean;
  readonly largeTargets: boolean;
  readonly screenReaderOptimized: boolean;
  readonly announceDecorativeEffects: false;
}

export interface VisualEffectPreferences {
  readonly quality: QualityPreference;
  readonly stormEnabled: boolean;
  readonly lightningEnabled: boolean;
  readonly particlesEnabled: boolean;
  readonly reflectionsEnabled: boolean;
  readonly glowIntensity: number;
}

export interface AudioPreferences {
  readonly enabled: boolean;
  readonly musicVolume: number;
  readonly effectsVolume: number;
  readonly concentrationMode: boolean;
}

export interface PrivacyPreferences {
  readonly analytics: ConsentState;
  readonly aiPersonalization: ConsentState;
  readonly cloudSynchronization: ConsentState;
  readonly organizationReporting: ConsentState;
}

export interface CertificationTrackMembership {
  readonly certificationId: string;
  readonly displayName: string;
  readonly status: 'planned' | 'active' | 'completed' | 'archived';
  readonly enrolledAt: string;
  readonly completedAt: string | null;
  readonly latestDatasetId: string | null;
}

export interface OrganizationMembership {
  readonly organizationId: string;
  readonly tenantId: string | null;
  readonly displayName: string;
  readonly role: string;
  readonly joinedAt: string;
  readonly governmentAgencyCode: string | null;
  readonly educationInstitutionId: string | null;
}

export interface PlayerProfile {
  readonly schemaVersion: PersistenceSchemaVersion;
  readonly profileId: string;
  readonly revision: number;
  readonly displayName: string;
  readonly locale: string;
  readonly timeZone: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly certificationTracks: readonly CertificationTrackMembership[];
  readonly organizationMemberships: readonly OrganizationMembership[];
  readonly accessibility: AccessibilityPreferences;
  readonly visualEffects: VisualEffectPreferences;
  readonly audio: AudioPreferences;
  readonly privacy: PrivacyPreferences;
  readonly metadata: Readonly<Record<string, JsonValue>>;
}

export interface PlayerProfileCreateInput {
  readonly profileId?: string;
  readonly displayName: string;
  readonly locale?: string;
  readonly timeZone?: string;
  readonly accessibility?: Partial<AccessibilityPreferences>;
  readonly visualEffects?: Partial<VisualEffectPreferences>;
  readonly audio?: Partial<AudioPreferences>;
  readonly privacy?: Partial<PrivacyPreferences>;
  readonly metadata?: Readonly<Record<string, JsonValue>>;
}

export interface DatasetIdentity {
  readonly datasetId: string;
  readonly datasetVersion: string;
  readonly certificationId: string;
  readonly checksum: string | null;
}

export interface PersistedSessionState {
  readonly sessionId: string;
  readonly status: SessionStatus;
  readonly mode: string;
  readonly seed: string;
  readonly questionIds: readonly string[];
  readonly currentQuestionIndex: number;
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
}

export interface PersistedAnswerRecord {
  readonly questionId: string;
  readonly selectedOptionIds: readonly string[];
  readonly correctOptionIds: readonly string[];
  readonly submittedAt: string;
  readonly responseTimeMilliseconds: number | null;
  readonly isCorrect: boolean;
  readonly scoreAwarded: number;
  readonly attemptNumber: number;
}

export interface PersistedTimerState {
  readonly mode: 'count-up' | 'count-down' | 'untimed';
  readonly elapsedMilliseconds: number;
  readonly remainingMilliseconds: number | null;
  readonly running: boolean;
  readonly capturedAt: string;
}

export interface PersistedMetricsState {
  readonly score: number;
  readonly maximumScore: number;
  readonly questionsAnswered: number;
  readonly questionsRemaining: number;
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly topicAccuracy: Readonly<Record<string, number>>;
  readonly updatedAt: string;
}

export interface PersistedPlayerState {
  readonly totalXP: number;
  readonly sessionXP: number;
  readonly level: number;
  readonly levelTitle: string;
  readonly rankId: string | null;
  readonly updatedAt: string;
}

export interface PersistedAchievementState {
  readonly unlockedAchievementIds: readonly string[];
  readonly newlyUnlockedAchievementIds: readonly string[];
  readonly updatedAt: string;
}

export interface SaveGamePayload {
  readonly schemaVersion: PersistenceSchemaVersion;
  readonly saveId: string;
  readonly revision: number;
  readonly sequence: number;
  readonly profileId: string;
  readonly dataset: DatasetIdentity;
  readonly session: PersistedSessionState;
  readonly answers: readonly PersistedAnswerRecord[];
  readonly timer: PersistedTimerState;
  readonly metrics: PersistedMetricsState;
  readonly player: PersistedPlayerState;
  readonly achievements: PersistedAchievementState;
  readonly preferencesSnapshot: {
    readonly accessibility: AccessibilityPreferences;
    readonly visualEffects: VisualEffectPreferences;
    readonly audio: AudioPreferences;
  };
  readonly bookmarks: readonly string[];
  readonly flags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly extensionData: Readonly<Record<string, JsonValue>>;
}

export interface PersistenceChecksum {
  readonly algorithm: PersistenceChecksumAlgorithm;
  readonly canonicalization: PersistenceCanonicalization;
  readonly digest: string;
}

export interface PersistenceEnvelope<TPayload> {
  readonly format: PersistenceEnvelopeFormat;
  readonly schemaVersion: string;
  readonly kind: PersistenceRecordKind;
  readonly recordId: string;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly payload: TPayload;
  readonly checksum: PersistenceChecksum;
}

export type UnsignedPersistenceEnvelope<TPayload> = Omit<
  PersistenceEnvelope<TPayload>,
  'checksum'
>;

export interface PersistenceValidationIssue {
  readonly severity: 'error' | 'warning';
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface PersistenceValidationReport {
  readonly valid: boolean;
  readonly issues: readonly PersistenceValidationIssue[];
}

export interface PersistenceStorageProvider {
  readonly providerId: string;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  listKeys(prefix: string): Promise<readonly string[]>;
  runExclusive<T>(scope: string, operation: () => Promise<T>): Promise<T>;
}

export interface BackupDescriptor {
  readonly backupId: string;
  readonly sourceKey: string;
  readonly backupKey: string;
  readonly recordId: string;
  readonly kind: PersistenceRecordKind;
  readonly revision: number;
  readonly createdAt: string;
  readonly byteLength: number;
  readonly digest: string;
}

export interface BackupIndexPayload {
  readonly schemaVersion: PersistenceSchemaVersion;
  readonly sourceKey: string;
  readonly backups: readonly BackupDescriptor[];
  readonly updatedAt: string;
}

export interface RestoreSuccess {
  readonly status: 'restored';
  readonly source: Exclude<RestoreSource, 'none'>;
  readonly envelope: PersistenceEnvelope<SaveGamePayload>;
  readonly migrated: boolean;
  readonly warnings: readonly string[];
}

export interface RestoreFailure {
  readonly status: 'missing' | 'invalid' | 'unsupported';
  readonly source: RestoreSource;
  readonly message: string;
  readonly warnings: readonly string[];
}

export type SessionRestoreResult = RestoreSuccess | RestoreFailure;

export interface MigrationContext {
  readonly recordKind: PersistenceRecordKind;
  readonly recordId: string;
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly migratedAt: string;
}

export interface PersistenceMigrationStep {
  readonly fromVersion: string;
  readonly toVersion: string;
  migrate(payload: unknown, context: MigrationContext): unknown;
}

export class PersistenceError extends Error {
  public constructor(
    message: string,
    public readonly code: string,
    public readonly causeValue?: unknown,
  ) {
    super(message);
    this.name = 'PersistenceError';
  }
}

export class PersistenceValidationError extends PersistenceError {
  public constructor(
    message: string,
    public readonly report: PersistenceValidationReport,
  ) {
    super(message, 'PERSISTENCE_VALIDATION_FAILED');
    this.name = 'PersistenceValidationError';
  }
}
