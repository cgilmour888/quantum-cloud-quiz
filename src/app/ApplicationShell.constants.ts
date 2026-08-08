/**
 * Artifact ID: QCQ-APP-001-005
 * Artifact Name: ApplicationShellConstants
 * Artifact Purpose: Permanent shell identifiers, external authority requirements, data attributes, runtime limits, and visual contract constants.
 * Artifact Layer: Phase 1 — Application Shell / CNT
 * Artifact Dependencies: None
 * Artifact Dependents: QCQ-APP-001-001, QCQ-APP-001-002, QCQ-APP-001-004, QCQ-APP-001-008 through QCQ-APP-001-017
 * Dependency Graph: ApplicationShellConstants -> Phase 1 configuration/contracts/runtime/governance/experience
 * Repository Path: QCQ/frontend/src/app
 * Source File: ApplicationShell.constants.ts
 */

export const APPLICATION_SHELL_VERSION = '1.0.0' as const;
export const APPLICATION_SHELL_ARTIFACT_FAMILY =
  'QCQ-APP-001' as const;

export const APPLICATION_SHELL_ARTIFACT_IDS = Object.freeze({
  shell: 'QCQ-APP-001-001',
  runtime: 'QCQ-APP-001-002',
  validation: 'QCQ-APP-001-003',
  configuration: 'QCQ-APP-001-004',
  constants: 'QCQ-APP-001-005',
  contracts: 'QCQ-APP-001-006',
  styles: 'QCQ-APP-001-007',
  manifest: 'QCQ-APP-001-008',
  registry: 'QCQ-APP-001-009',
  policies: 'QCQ-APP-001-010',
  providers: 'QCQ-APP-001-011',
  router: 'QCQ-APP-001-012',
  boundary: 'QCQ-APP-001-013',
  telemetry: 'QCQ-APP-001-014',
  health: 'QCQ-APP-001-015',
  accessibility: 'QCQ-APP-001-016',
  integrationValidation: 'QCQ-APP-001-017',
} as const);

export const APPLICATION_SHELL_EXTERNAL_AUTHORITIES =
  Object.freeze([
    'QCQ-APP-002',
    'QCQ-TBL-040',
    'QCQ-TBL-036',
    'QCQ-THM-001',
  ] as const);

export const APPLICATION_SHELL_VISUAL_AUTHORITIES =
  Object.freeze([
    'QCQ-TBL-036',
    'QCQ-TBL-037',
    'QCQ-TBL-038',
    'QCQ-TBL-039',
    'QCQ-THM-001',
    'QCQ-THM-002',
    'QCQ-THM-003',
    'QCQ-THM-004',
    'QCQ-THM-005',
    'QCQ-THM-006',
    'QCQ-THM-007',
    'QCQ-THM-008',
  ] as const);

export const APPLICATION_SHELL_ZONE_CONTRACTS =
  Object.freeze([
    'environment',
    'performance',
    'tablet',
    'metrics',
    'player-banner',
  ] as const);

export const APPLICATION_SHELL_REFERENCE = Object.freeze({
  aspectRatio: 16 / 9,
  aspectRatioLabel: '16:9',
  referenceWidth: 3840,
  referenceHeight: 2160,
  minimumInteractiveTargetPx: 44,
  maximumRegistryEntries: 500_000,
  maximumProviderDepth: 64,
  maximumTelemetryQueue: 5_000,
  maximumTelemetryBatch: 200,
} as const);

export const APPLICATION_SHELL_DATA_ATTRIBUTES =
  Object.freeze({
    artifact: 'data-qcq-artifact',
    family: 'data-qcq-shell-family',
    version: 'data-qcq-shell-version',
    status: 'data-qcq-shell-status',
    online: 'data-qcq-shell-online',
    visibility: 'data-qcq-shell-visibility',
    focus: 'data-qcq-shell-focus',
    motion: 'data-qcq-shell-motion',
    contrast: 'data-qcq-shell-contrast',
    input: 'data-qcq-shell-input',
    viewport: 'data-qcq-shell-viewport',
    route: 'data-qcq-shell-route',
    chrome: 'data-qcq-shell-chrome',
  } as const);

export const APPLICATION_SHELL_DEFAULTS = Object.freeze({
  ariaLabel: 'Quantum Certification Quest',
  documentTitle: 'Quantum Certification Quest',
  defaultRoute: '/quiz',
  heartbeatIntervalMs: 30_000,
  heartbeatStaleAfterMs: 90_000,
  telemetryFlushIntervalMs: 15_000,
  routeBasePath: '/',
  registryCapacity: APPLICATION_SHELL_REFERENCE.maximumRegistryEntries,
} as const);

export const APPLICATION_SHELL_RUNTIME_EVENT_TYPES =
  Object.freeze([
    'shell-started',
    'shell-ready',
    'shell-degraded',
    'shell-faulted',
    'route-changed',
    'connectivity-changed',
    'visibility-changed',
    'focus-changed',
    'accessibility-changed',
    'heartbeat',
  ] as const);

export type ApplicationShellArtifactId =
  (typeof APPLICATION_SHELL_ARTIFACT_IDS)[keyof typeof APPLICATION_SHELL_ARTIFACT_IDS];

export type ApplicationShellExternalAuthorityId =
  (typeof APPLICATION_SHELL_EXTERNAL_AUTHORITIES)[number];

export type ApplicationShellZoneContract =
  (typeof APPLICATION_SHELL_ZONE_CONTRACTS)[number];

export type ApplicationShellRuntimeEventType =
  (typeof APPLICATION_SHELL_RUNTIME_EVENT_TYPES)[number];
