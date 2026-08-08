/**
 * Artifact ID: QCQ-CMP-002
 * Artifact Name: ComposerConstants
 * Repository Path: QCQ/frontend/src/composer/ComposerConstants.ts
 */

import type {
  ComposerZoneId,
} from './ComposerTypes';

export const COMPOSER_SCHEMA_VERSION = '1.0.0' as const;
export const COMPOSER_VERSION = '1.0.0' as const;
export const COMPOSER_COMPATIBILITY_MINIMUM = '0.1.0-foundation.1';

export const COMPOSER_ARTIFACT_IDS = Object.freeze({
  master: 'QCQ-TBL-040',
  types: 'QCQ-CMP-001',
  constants: 'QCQ-CMP-002',
  config: 'QCQ-CMP-003',
  manifest: 'QCQ-CMP-004',
  dependencyGraph: 'QCQ-CMP-005',
  registry: 'QCQ-CMP-006',
  validation: 'QCQ-CMP-007',
  accessibility: 'QCQ-CMP-008',
  themeBridge: 'QCQ-CMP-009',
  persistenceBridge: 'QCQ-CMP-010',
  lifecycle: 'QCQ-CMP-011',
  capabilityMatrix: 'QCQ-CMP-012',
  ownershipRegistry: 'QCQ-CMP-013',
  policyEngine: 'QCQ-CMP-014',
  conflictResolver: 'QCQ-CMP-015',
  readinessEvaluator: 'QCQ-CMP-016',
  certificationEngine: 'QCQ-CMP-017',
  integrationEngine: 'QCQ-CMP-018',
  performanceProfile: 'QCQ-CMP-019',
  qualityScaler: 'QCQ-CMP-020',
  monitoringBridge: 'QCQ-CMP-021',
  telemetryBridge: 'QCQ-CMP-022',
  effectsBridge: 'QCQ-CMP-023',
  analyticsBridge: 'QCQ-CMP-024',
  aiBridge: 'QCQ-CMP-025',
  gamificationBridge: 'QCQ-CMP-026',
  leaderboardBridge: 'QCQ-CMP-027',
  organizationBridge: 'QCQ-CMP-028',
  saasBridge: 'QCQ-CMP-029',
  securityBridge: 'QCQ-CMP-030',
});

export const COMPOSER_ZONE_IDS = Object.freeze({
  environment: 'environment',
  performance: 'performance',
  tablet: 'tablet',
  metrics: 'metrics',
  playerBanner: 'player-banner',
} satisfies Readonly<Record<string, ComposerZoneId>>);

export const COMPOSER_ZONE_ORDER: readonly ComposerZoneId[] =
  Object.freeze([
    COMPOSER_ZONE_IDS.environment,
    COMPOSER_ZONE_IDS.performance,
    COMPOSER_ZONE_IDS.tablet,
    COMPOSER_ZONE_IDS.metrics,
    COMPOSER_ZONE_IDS.playerBanner,
  ]);

export const COMPOSER_REQUIRED_ZONES: readonly ComposerZoneId[] =
  Object.freeze([
    COMPOSER_ZONE_IDS.tablet,
  ]);

export const COMPOSER_DATA_ATTRIBUTES = Object.freeze({
  root: 'data-qcq-master-composer',
  version: 'data-qcq-composer-version',
  lifecycle: 'data-qcq-composer-lifecycle',
  ready: 'data-qcq-composer-ready',
  degraded: 'data-qcq-composer-degraded',
  validation: 'data-qcq-composer-validation',
  zone: 'data-qcq-composer-zone',
  module: 'data-qcq-composer-module',
  inputModality: 'data-qcq-input-modality',
  contrast: 'data-qcq-contrast',
  motion: 'data-qcq-motion',
});

export const COMPOSER_EVENT_NAMES = Object.freeze({
  ready: 'qcq:composer:ready',
  validation: 'qcq:composer:validation',
  failure: 'qcq:composer:failure',
  registryChange: 'qcq:composer:registry-change',
  accessibilityChange: 'qcq:composer:accessibility-change',
  themeChange: 'qcq:composer:theme-change',
  persistenceChange: 'qcq:composer:persistence-change',
  lifecycleChange: 'qcq:composer:lifecycle-change',
  capabilityChange: 'qcq:composer:capability-change',
  policyDecision: 'qcq:composer:policy-decision',
  integrationChange: 'qcq:composer:integration-change',
  qualityChange: 'qcq:composer:quality-change',
  monitoringChange: 'qcq:composer:monitoring-change',
});

export const COMPOSER_DEFAULT_TEXT = Object.freeze({
  applicationTitle: 'Quantum Certification Quest',
  applicationSubtitle: 'Certification command tablet',
  ariaLabel: 'Quantum Certification Quest master composition',
  loadingStatus: 'Certification environment initializing.',
  readyStatus: 'Certification environment ready.',
  noQuestionStatus: 'No certification question is currently available.',
  validationFailure: 'The certification environment could not be composed safely.',
});

export const COMPOSER_LIMITS = Object.freeze({
  maximumRegistryModules: 500_000,
  maximumDependencyDepth: 2_048,
  maximumManifestEntries: 500_000,
  maximumValidationIssues: 10_000,
  minimumTextScale: 1,
  maximumTextScale: 2,
  minimumTargetSizePx: 44,
  maximumAutoSaveDelayMs: 60_000,
  minimumAutoSaveDelayMs: 250,
});

export const COMPOSER_BUILTIN_MODULE_IDS = Object.freeze({
  applicationLayout: 'QCQ-APP-002',
  tabletShell: 'QCQ-TBL-001',
  borderFrame: 'QCQ-TBL-004',
  questionTablet: 'QCQ-TBL-010',
  metricsPanel: 'QCQ-TBL-027',
  stormLayer: 'QCQ-TBL-030',
  glowEngine: 'QCQ-TBL-033',
  playerProfileStore: 'QCQ-TBL-034',
  saveGameEngine: 'QCQ-TBL-035',
  designTokens: 'QCQ-TBL-036',
  platinumFrameTheme: 'QCQ-TBL-037',
  cyberEffects: 'QCQ-TBL-038',
  energyAnimations: 'QCQ-TBL-039',
  masterComposer: 'QCQ-TBL-040',
  reflectionEngine: 'QCQ-TBL-041',
});

export function isComposerZoneId(
  value: string,
): value is ComposerZoneId {
  return (COMPOSER_ZONE_ORDER as readonly string[]).includes(value);
}
