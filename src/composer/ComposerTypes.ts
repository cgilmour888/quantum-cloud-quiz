/**
 * Artifact ID: QCQ-CMP-001
 * Artifact Name: ComposerTypes
 * Repository Path: QCQ/frontend/src/composer/ComposerTypes.ts
 *
 * Constitutional contracts for the QCQ Phase 10 composition authority.
 * This module defines the stable boundaries through which presentation,
 * gameplay, persistence, accessibility, theming, analytics, AI, security,
 * certification, organization, and SaaS modules participate in the platform.
 */

import type {
  ComponentType,
  ReactNode,
} from 'react';

import type {
  AnswerValidationResult,
} from '../dataset/AnswerValidationEngine';
import type {
  MetricsSnapshot,
} from '../metrics/MetricsStore';
import type {
  PlayerProfile,
  PlayerProfileCreateInput,
  SaveGamePayload,
  SessionRestoreResult,
} from '../persistence/PersistenceTypes';
import type {
  QuestionModel,
  QuestionSubmissionRequest,
  QuestionValidationState,
} from '../tablet/QuestionTablet';
import type {
  TimerDisplayProps,
} from '../tablet/TimerDisplay';
import type {
  QcqDensity,
  QcqMotionMode,
  QcqResolutionProfile,
  QcqVisualQuality,
} from '../styles/DesignTokens';
import type {
  ThemeManifest,
} from '../styles/ThemeManifest';

export type ComposerZoneId =
  | 'environment'
  | 'performance'
  | 'tablet'
  | 'metrics'
  | 'player-banner';

export type ComposerModuleKind =
  | 'application'
  | 'component'
  | 'service'
  | 'store'
  | 'effect'
  | 'theme'
  | 'persistence'
  | 'analytics'
  | 'ai'
  | 'security'
  | 'certification'
  | 'organization'
  | 'saas'
  | 'government'
  | 'education';

export type ComposerRegistrationMode =
  | 'builtin'
  | 'registry'
  | 'external'
  | 'optional';

export type ComposerLifecycleState =
  | 'created'
  | 'validating'
  | 'initializing'
  | 'ready'
  | 'degraded'
  | 'failed'
  | 'disposed';

export type ComposerValidationSeverity =
  | 'information'
  | 'warning'
  | 'error'
  | 'critical';

export type ComposerAccessibilityContrast =
  | 'standard'
  | 'high'
  | 'forced-colors';

export type ComposerInputModality =
  | 'keyboard'
  | 'pointer'
  | 'touch'
  | 'stylus'
  | 'unknown';

export interface ComposerCompatibilityRange {
  readonly minimumVersion: string;
  readonly maximumVersion: string | null;
}

export interface ComposerManifestEntry {
  readonly artifactId: string;
  readonly artifactName: string;
  readonly version: string;
  readonly kind: ComposerModuleKind;
  readonly registration: ComposerRegistrationMode;
  readonly repositoryPath: string;
  readonly zone: ComposerZoneId | null;
  readonly dependencies: readonly string[];
  readonly compatibility: ComposerCompatibilityRange;
  readonly required: boolean;
  readonly description: string;
}

export interface ComposerManifest {
  readonly schemaVersion: '1.0.0';
  readonly composerVersion: string;
  readonly entries: readonly ComposerManifestEntry[];
}

export interface ComposerValidationIssue {
  readonly severity: ComposerValidationSeverity;
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly artifactId: string | null;
}

export interface ComposerValidationReport {
  readonly valid: boolean;
  readonly fatal: boolean;
  readonly issues: readonly ComposerValidationIssue[];
  readonly validatedAt: string;
  readonly manifestEntryCount: number;
  readonly registeredModuleCount: number;
}

export interface ComposerVisualConfig {
  readonly quality: QcqVisualQuality;
  readonly resolution: QcqResolutionProfile;
  readonly density: QcqDensity;
  readonly motion: QcqMotionMode;
  readonly frameIntensity: number;
  readonly stormIntensity: number;
  readonly particlesEnabled: boolean;
  readonly lightningEnabled: boolean;
  readonly reflectionsEnabled: boolean;
  readonly glowIntensity: number;
}

export interface ComposerAccessibilityConfig {
  readonly highContrast: boolean;
  readonly reducedMotion: boolean;
  readonly reducedTransparency: boolean;
  readonly reducedSensory: boolean;
  readonly screenReaderOptimized: boolean;
  readonly textScale: number;
  readonly minimumTargetSizePx: number;
  readonly announceStatusChanges: boolean;
}

export interface ComposerPersistenceConfig {
  readonly enabled: boolean;
  readonly autoRestore: boolean;
  readonly autoSave: boolean;
  readonly autoSaveDelayMs: number;
  readonly createProfileWhenMissing: boolean;
  readonly includeBackups: boolean;
}

export interface ComposerValidationConfig {
  readonly strict: boolean;
  readonly requireRegisteredBuiltins: boolean;
  readonly rejectWarnings: boolean;
  readonly validateOnEveryRegistryChange: boolean;
}

export interface ComposerConfig {
  readonly version: '1.0.0';
  readonly applicationTitle: string;
  readonly applicationSubtitle: string;
  readonly activeZones: readonly ComposerZoneId[];
  readonly visual: ComposerVisualConfig;
  readonly accessibility: ComposerAccessibilityConfig;
  readonly persistence: ComposerPersistenceConfig;
  readonly validation: ComposerValidationConfig;
  readonly debug: boolean;
}


export type ComposerConfigInput = Partial<
  Omit<
    ComposerConfig,
    'version' | 'visual' | 'accessibility' | 'persistence' | 'validation'
  >
> & {
  readonly visual?: Partial<ComposerVisualConfig>;
  readonly accessibility?: Partial<ComposerAccessibilityConfig>;
  readonly persistence?: Partial<ComposerPersistenceConfig>;
  readonly validation?: Partial<ComposerValidationConfig>;
};

export interface ComposerAccessibilitySnapshot {
  readonly version: number;
  readonly contrast: ComposerAccessibilityContrast;
  readonly motion: QcqMotionMode;
  readonly reducedTransparency: boolean;
  readonly reducedSensory: boolean;
  readonly screenReaderOptimized: boolean;
  readonly textScale: number;
  readonly minimumTargetSizePx: number;
  readonly inputModality: ComposerInputModality;
  readonly keyboardNavigationActive: boolean;
  readonly forcedColorsActive: boolean;
  readonly prefersReducedMotion: boolean;
  readonly prefersHighContrast: boolean;
}

export interface ComposerThemeSnapshot {
  readonly version: number;
  readonly manifest: ThemeManifest;
  readonly attached: boolean;
  readonly target: HTMLElement | null;
}

export interface ComposerPersistenceSnapshot {
  readonly version: number;
  readonly status:
    | 'idle'
    | 'initializing'
    | 'ready'
    | 'saving'
    | 'restoring'
    | 'error'
    | 'disposed';
  readonly profile: PlayerProfile | null;
  readonly activeSaveId: string | null;
  readonly lastSavedAt: string | null;
  readonly lastRestoredAt: string | null;
  readonly error: Error | null;
}

export interface ComposerRuntimeSnapshot {
  readonly version: number;
  readonly lifecycle: ComposerLifecycleState;
  readonly question: QuestionModel | null;
  readonly questionIndex: number;
  readonly totalQuestions: number;
  readonly answeredCount: number;
  readonly flaggedCount: number;
  readonly selectedOptionIds: readonly string[];
  readonly correctOptionIds: readonly string[];
  readonly validationResult: AnswerValidationResult | null;
  readonly validationState: QuestionValidationState;
  readonly timerProps: Omit<TimerDisplayProps, 'className'> | null;
  readonly metrics: MetricsSnapshot | null;
  readonly performanceContent: ReactNode;
  readonly playerBannerContent: ReactNode;
  readonly tabletSupportingContent: ReactNode;
  readonly tabletLowerDeck: ReactNode;
  readonly utilityControls: ReactNode;
  readonly emptyState: ReactNode;
  readonly statusMessage: string;
  readonly contentKey: string | number;
  readonly sessionId: string | null;
  readonly saveId: string | null;
}

export interface ComposerRuntimeController {
  subscribe(listener: () => void): () => void;
  getSnapshot(): ComposerRuntimeSnapshot;
  getServerSnapshot(): ComposerRuntimeSnapshot;
  selectAnswers(optionIds: readonly string[]): void;
  submitCurrentQuestion(request: QuestionSubmissionRequest): void | Promise<void>;
  advanceToNextQuestion(): void | Promise<void>;
  restoreFromSave?(
    payload: SaveGamePayload,
    result: SessionRestoreResult,
  ): void | Promise<void>;
  captureSaveGame?(
    profile: PlayerProfile,
    currentSave: SaveGamePayload | null,
  ): SaveGamePayload | Promise<SaveGamePayload>;
}

export interface ComposerModuleContext {
  readonly config: ComposerConfig;
  readonly runtime: ComposerRuntimeSnapshot;
  readonly accessibility: ComposerAccessibilitySnapshot;
  readonly theme: ComposerThemeSnapshot;
  readonly persistence: ComposerPersistenceSnapshot | null;
}

export interface ComposerRenderableModuleProps {
  readonly context: ComposerModuleContext;
  readonly zone: ComposerZoneId;
}

export interface ComposerRenderableModule {
  readonly component: ComponentType<ComposerRenderableModuleProps>;
  readonly order: number;
}

export interface ComposerServiceModule<TService = unknown> {
  readonly service: TService;
}

export type ComposerModuleValue =
  | ComposerRenderableModule
  | ComposerServiceModule
  | Readonly<Record<string, unknown>>
  | string
  | number
  | boolean
  | null;

export interface ComposerModuleDescriptor<
  TValue extends ComposerModuleValue = ComposerModuleValue,
> {
  readonly artifactId: string;
  readonly artifactName: string;
  readonly version: string;
  readonly kind: ComposerModuleKind;
  readonly zone: ComposerZoneId | null;
  readonly dependencies: readonly string[];
  readonly compatibleWith: ComposerCompatibilityRange;
  readonly value: TValue;
  readonly enabled: boolean;
  readonly metadata: Readonly<Record<string, string>>;
}

export interface ComposerRegistrySnapshot {
  readonly version: number;
  readonly artifactIds: readonly string[];
  readonly modulesByZone: Readonly<
    Record<ComposerZoneId, readonly ComposerModuleDescriptor[]>
  >;
}

export interface ComposerRegistryLike {
  subscribe(listener: () => void): () => void;
  getSnapshot(): ComposerRegistrySnapshot;
  getServerSnapshot(): ComposerRegistrySnapshot;
  has(artifactId: string): boolean;
  get<TValue extends ComposerModuleValue = ComposerModuleValue>(
    artifactId: string,
  ): ComposerModuleDescriptor<TValue>;
  list(
    options?: {
      readonly kind?: ComposerModuleKind;
      readonly zone?: ComposerZoneId;
      readonly enabledOnly?: boolean;
    },
  ): readonly ComposerModuleDescriptor[];
}

export interface ComposerAccessibilityEngineLike {
  subscribe(listener: () => void): () => void;
  getSnapshot(): ComposerAccessibilitySnapshot;
  getServerSnapshot(): ComposerAccessibilitySnapshot;
  start(target?: Document): void;
  stop(): void;
  updatePreferences(
    preferences: Partial<ComposerAccessibilityConfig>,
  ): void;
  getRootAttributes(): Readonly<Record<string, string>>;
}

export interface ComposerThemeBridgeLike {
  subscribe(listener: () => void): () => void;
  getSnapshot(): ComposerThemeSnapshot;
  getServerSnapshot(): ComposerThemeSnapshot;
  attach(
    target: HTMLElement,
    config: ComposerConfig,
    accessibility: ComposerAccessibilitySnapshot,
  ): void;
  update(
    config: ComposerConfig,
    accessibility: ComposerAccessibilitySnapshot,
  ): void;
  detach(): void;
}

export interface ComposerPersistenceMapper<
  TRuntime = ComposerRuntimeSnapshot,
> {
  toSaveGame(
    runtime: TRuntime,
    profile: PlayerProfile,
    previous: SaveGamePayload | null,
  ): SaveGamePayload | Promise<SaveGamePayload>;
  applyRestoredSave(
    runtimeController: ComposerRuntimeController,
    payload: SaveGamePayload,
    result: SessionRestoreResult,
  ): void | Promise<void>;
}

export interface ComposerPersistenceBridgeLike {
  subscribe(listener: () => void): () => void;
  getSnapshot(): ComposerPersistenceSnapshot;
  getServerSnapshot(): ComposerPersistenceSnapshot;
  initialize(
    profileInput?: PlayerProfileCreateInput,
  ): Promise<PlayerProfile | null>;
  restore(
    saveId: string,
    runtimeController: ComposerRuntimeController,
    mapper: ComposerPersistenceMapper,
  ): Promise<SessionRestoreResult>;
  save(
    runtime: ComposerRuntimeSnapshot,
    mapper: ComposerPersistenceMapper,
  ): Promise<SaveGamePayload | null>;
  scheduleSave(
    runtime: ComposerRuntimeSnapshot,
    mapper: ComposerPersistenceMapper,
  ): void;
  flush(): Promise<void>;
  dispose(): void;
}

export interface MasterTabletComposerProps {
  readonly runtime: ComposerRuntimeController;
  readonly config?: ComposerConfigInput | undefined;
  readonly registry?: ComposerRegistryLike | undefined;
  readonly themeManifest?: ThemeManifest | undefined;
  readonly accessibilityEngine?: ComposerAccessibilityEngineLike | undefined;
  readonly themeBridge?: ComposerThemeBridgeLike | undefined;
  readonly persistenceBridge?: ComposerPersistenceBridgeLike | undefined;
  readonly persistenceMapper?: ComposerPersistenceMapper | undefined;
  readonly initialProfile?: PlayerProfileCreateInput | undefined;
  readonly className?: string | undefined;
  readonly ariaLabel?: string | undefined;
  readonly debug?: boolean | undefined;
  readonly onReady?:
    | ((report: ComposerValidationReport) => void)
    | undefined;
  readonly onFailure?:
    | ((error: Error, report: ComposerValidationReport | null) => void)
    | undefined;
}

export interface ComposerReadiness {
  readonly lifecycle: ComposerLifecycleState;
  readonly validation: ComposerValidationReport | null;
  readonly ready: boolean;
  readonly degraded: boolean;
  readonly reason: string | null;
}
