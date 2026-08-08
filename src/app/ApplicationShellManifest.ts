/**
 * Artifact ID: QCQ-APP-001-008
 * Artifact Name: ApplicationShellManifest
 * Artifact Purpose: Permanent Phase 1 artifact, dependency, capability, compatibility, and ownership governance.
 * Artifact Layer: Phase 1 — Application Shell / GOV
 * Artifact Dependencies: QCQ-APP-001-005, QCQ-APP-001-006
 * Artifact Dependents: QCQ-APP-001-009, QCQ-APP-001-010, QCQ-APP-001-017
 * Dependency Graph: constants/contracts -> ApplicationShellManifest -> registry/policies/integration validation
 * Repository Path: QCQ/frontend/src/app
 * Source File: ApplicationShellManifest.ts
 */

import {
  APPLICATION_SHELL_ARTIFACT_IDS,
  APPLICATION_SHELL_EXTERNAL_AUTHORITIES,
  APPLICATION_SHELL_VERSION,
} from './ApplicationShell.constants';
import type {
  ApplicationShellRegistryDescriptor,
} from './ApplicationShell.types';

export interface ApplicationShellManifestModel {
  readonly familyId: 'QCQ-APP-001';
  readonly version: typeof APPLICATION_SHELL_VERSION;
  readonly artifactCount: 17;
  readonly artifacts:
    readonly ApplicationShellRegistryDescriptor[];
  readonly requiredExternalAuthorities:
    typeof APPLICATION_SHELL_EXTERNAL_AUTHORITIES;
  readonly ownership: Readonly<{
    macroLayout: 'QCQ-APP-002';
    tabletComposition: 'QCQ-TBL-040';
    visualTokens: 'QCQ-TBL-036';
    theme: 'QCQ-THM-001';
    shellRuntime: 'QCQ-APP-001-001';
  }>;
}

const descriptor = (
  artifactId:
    (typeof APPLICATION_SHELL_ARTIFACT_IDS)[keyof typeof APPLICATION_SHELL_ARTIFACT_IDS],
  name: string,
  kind: ApplicationShellRegistryDescriptor['kind'],
  dependencies: readonly string[],
  capabilities: readonly string[],
): ApplicationShellRegistryDescriptor =>
  Object.freeze({
    artifactId,
    name,
    kind,
    version: APPLICATION_SHELL_VERSION,
    required: true,
    dependencies: Object.freeze([...dependencies]),
    capabilities: Object.freeze([...capabilities]),
    owner: 'QCQ-APP-001',
  });

export const APPLICATION_SHELL_ARTIFACTS =
  Object.freeze([
    descriptor(
      APPLICATION_SHELL_ARTIFACT_IDS.shell,
      'ApplicationShell',
      'shell',
      [
        APPLICATION_SHELL_ARTIFACT_IDS.runtime,
        APPLICATION_SHELL_ARTIFACT_IDS.configuration,
        APPLICATION_SHELL_ARTIFACT_IDS.contracts,
        APPLICATION_SHELL_ARTIFACT_IDS.styles,
        APPLICATION_SHELL_ARTIFACT_IDS.providers,
        APPLICATION_SHELL_ARTIFACT_IDS.router,
        APPLICATION_SHELL_ARTIFACT_IDS.boundary,
        'QCQ-APP-002',
        'QCQ-TBL-040',
      ],
      [
        'runtime-composition',
        'fault-isolation',
        'provider-coordination',
        'navigation-adaptation',
        'outer-chrome',
      ],
    ),
    descriptor(
      APPLICATION_SHELL_ARTIFACT_IDS.runtime,
      'ApplicationShellRuntime',
      'runtime',
      [
        APPLICATION_SHELL_ARTIFACT_IDS.configuration,
        APPLICATION_SHELL_ARTIFACT_IDS.contracts,
        APPLICATION_SHELL_ARTIFACT_IDS.registry,
        APPLICATION_SHELL_ARTIFACT_IDS.policies,
        APPLICATION_SHELL_ARTIFACT_IDS.telemetry,
        APPLICATION_SHELL_ARTIFACT_IDS.health,
        APPLICATION_SHELL_ARTIFACT_IDS.accessibility,
      ],
      ['lifecycle', 'runtime-snapshot'],
    ),
    descriptor(
      APPLICATION_SHELL_ARTIFACT_IDS.validation,
      'ApplicationShellValidation',
      'validation',
      [APPLICATION_SHELL_ARTIFACT_IDS.shell],
      ['unit-validation'],
    ),
    descriptor(
      APPLICATION_SHELL_ARTIFACT_IDS.configuration,
      'ApplicationShellConfiguration',
      'configuration',
      [
        APPLICATION_SHELL_ARTIFACT_IDS.constants,
        APPLICATION_SHELL_ARTIFACT_IDS.contracts,
      ],
      ['configuration-validation'],
    ),
    descriptor(
      APPLICATION_SHELL_ARTIFACT_IDS.constants,
      'ApplicationShellConstants',
      'constants',
      [],
      ['permanent-identifiers', 'runtime-constants'],
    ),
    descriptor(
      APPLICATION_SHELL_ARTIFACT_IDS.contracts,
      'ApplicationShellContracts',
      'contracts',
      [APPLICATION_SHELL_ARTIFACT_IDS.constants],
      ['strict-types', 'immutable-contracts'],
    ),
    descriptor(
      APPLICATION_SHELL_ARTIFACT_IDS.styles,
      'ApplicationShellStyles',
      'styles',
      ['QCQ-TBL-036', 'QCQ-THM-001'],
      ['token-consumer', 'responsive-shell-chrome'],
    ),
    descriptor(
      APPLICATION_SHELL_ARTIFACT_IDS.manifest,
      'ApplicationShellManifest',
      'manifest',
      [
        APPLICATION_SHELL_ARTIFACT_IDS.constants,
        APPLICATION_SHELL_ARTIFACT_IDS.contracts,
      ],
      ['artifact-governance'],
    ),
    descriptor(
      APPLICATION_SHELL_ARTIFACT_IDS.registry,
      'ApplicationShellRegistry',
      'registry',
      [APPLICATION_SHELL_ARTIFACT_IDS.manifest],
      ['module-registration', 'authority-discovery'],
    ),
    descriptor(
      APPLICATION_SHELL_ARTIFACT_IDS.policies,
      'ApplicationShellPolicies',
      'policy',
      [
        APPLICATION_SHELL_ARTIFACT_IDS.configuration,
        APPLICATION_SHELL_ARTIFACT_IDS.registry,
      ],
      ['policy-evaluation'],
    ),
    descriptor(
      APPLICATION_SHELL_ARTIFACT_IDS.providers,
      'ApplicationShellProviders',
      'provider',
      [APPLICATION_SHELL_ARTIFACT_IDS.contracts],
      ['provider-composition'],
    ),
    descriptor(
      APPLICATION_SHELL_ARTIFACT_IDS.router,
      'ApplicationShellRouter',
      'router',
      [APPLICATION_SHELL_ARTIFACT_IDS.contracts],
      ['history-adapter', 'route-resolution'],
    ),
    descriptor(
      APPLICATION_SHELL_ARTIFACT_IDS.boundary,
      'ApplicationShellBoundary',
      'boundary',
      [
        APPLICATION_SHELL_ARTIFACT_IDS.contracts,
        APPLICATION_SHELL_ARTIFACT_IDS.telemetry,
        APPLICATION_SHELL_ARTIFACT_IDS.health,
      ],
      ['fault-isolation', 'accessible-recovery-state'],
    ),
    descriptor(
      APPLICATION_SHELL_ARTIFACT_IDS.telemetry,
      'ApplicationShellTelemetry',
      'telemetry',
      [APPLICATION_SHELL_ARTIFACT_IDS.contracts],
      ['consent', 'bounded-queue', 'injected-sink'],
    ),
    descriptor(
      APPLICATION_SHELL_ARTIFACT_IDS.health,
      'ApplicationShellHealthMonitor',
      'health',
      [
        APPLICATION_SHELL_ARTIFACT_IDS.configuration,
        APPLICATION_SHELL_ARTIFACT_IDS.contracts,
      ],
      ['health-monitoring', 'heartbeat'],
    ),
    descriptor(
      APPLICATION_SHELL_ARTIFACT_IDS.accessibility,
      'ApplicationShellAccessibility',
      'accessibility',
      [
        APPLICATION_SHELL_ARTIFACT_IDS.configuration,
        APPLICATION_SHELL_ARTIFACT_IDS.contracts,
      ],
      [
        'reduced-motion',
        'forced-colors',
        'input-modality',
      ],
    ),
    descriptor(
      APPLICATION_SHELL_ARTIFACT_IDS.integrationValidation,
      'ApplicationShellIntegrationValidation',
      'integration',
      [
        APPLICATION_SHELL_ARTIFACT_IDS.shell,
        APPLICATION_SHELL_ARTIFACT_IDS.registry,
        'QCQ-APP-002',
        'QCQ-TBL-040',
      ],
      ['integration-validation'],
    ),
  ] as const);

export const APPLICATION_SHELL_MANIFEST:
  ApplicationShellManifestModel = Object.freeze({
    familyId: 'QCQ-APP-001',
    version: APPLICATION_SHELL_VERSION,
    artifactCount: 17,
    artifacts: APPLICATION_SHELL_ARTIFACTS,
    requiredExternalAuthorities:
      APPLICATION_SHELL_EXTERNAL_AUTHORITIES,
    ownership: Object.freeze({
      macroLayout: 'QCQ-APP-002',
      tabletComposition: 'QCQ-TBL-040',
      visualTokens: 'QCQ-TBL-036',
      theme: 'QCQ-THM-001',
      shellRuntime: 'QCQ-APP-001-001',
    }),
  });

export function getApplicationShellArtifact(
  artifactId: string,
): ApplicationShellRegistryDescriptor | null {
  return (
    APPLICATION_SHELL_ARTIFACTS.find(
      (entry) => entry.artifactId === artifactId,
    ) ?? null
  );
}
