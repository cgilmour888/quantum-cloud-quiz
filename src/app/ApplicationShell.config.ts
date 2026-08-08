/**
 * Artifact ID: QCQ-APP-001-004
 * Artifact Name: ApplicationShellConfiguration
 * Artifact Purpose: Runtime configuration authority for boot, routing, telemetry, accessibility, dependency enforcement, and shell scaling.
 * Artifact Layer: Phase 1 — Application Shell / CFG
 * Artifact Dependencies: QCQ-APP-001-005, QCQ-APP-001-006
 * Artifact Dependents: QCQ-APP-001-001, QCQ-APP-001-002, QCQ-APP-001-010, QCQ-APP-001-014, QCQ-APP-001-015, QCQ-APP-001-016
 * Dependency Graph: constants + contracts -> ApplicationShellConfiguration -> runtime/policies/services
 * Repository Path: QCQ/frontend/src/app
 * Source File: ApplicationShell.config.ts
 */

import {
  APPLICATION_SHELL_DEFAULTS,
  APPLICATION_SHELL_REFERENCE,
} from './ApplicationShell.constants';
import type {
  ApplicationShellConfig,
} from './ApplicationShell.types';

export const DEFAULT_APPLICATION_SHELL_CONFIG:
  ApplicationShellConfig = Object.freeze({
    version: '1.0.0',
    ariaLabel: APPLICATION_SHELL_DEFAULTS.ariaLabel,
    documentTitle:
      APPLICATION_SHELL_DEFAULTS.documentTitle,
    defaultRoute:
      APPLICATION_SHELL_DEFAULTS.defaultRoute,
    routeBasePath:
      APPLICATION_SHELL_DEFAULTS.routeBasePath,
    heartbeatIntervalMs:
      APPLICATION_SHELL_DEFAULTS.heartbeatIntervalMs,
    heartbeatStaleAfterMs:
      APPLICATION_SHELL_DEFAULTS.heartbeatStaleAfterMs,
    telemetryFlushIntervalMs:
      APPLICATION_SHELL_DEFAULTS.telemetryFlushIntervalMs,
    registryCapacity:
      APPLICATION_SHELL_DEFAULTS.registryCapacity,
    requireLayoutAuthority: true,
    requireMasterComposer: true,
    requireVisualAuthorities: true,
    requireOnlineForBoot: false,
    allowDegradedOffline: true,
    requireReducedMotionCompliance: true,
    requireForcedColorsCompliance: true,
    enableDecorativeChrome: true,
    enableTelemetry: false,
    telemetryConsentDefault: false,
    maximumProviderDepth:
      APPLICATION_SHELL_REFERENCE.maximumProviderDepth,
    minimumTouchTargetPx:
      APPLICATION_SHELL_REFERENCE.minimumInteractiveTargetPx,
    referenceAspectRatio:
      APPLICATION_SHELL_REFERENCE.aspectRatio,
  });

function finitePositive(
  value: number,
  name: string,
): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(
      `${name} must be a positive finite number.`,
    );
  }
}

export function createApplicationShellConfig(
  overrides: Partial<ApplicationShellConfig> = {},
): ApplicationShellConfig {
  const config: ApplicationShellConfig = Object.freeze({
    ...DEFAULT_APPLICATION_SHELL_CONFIG,
    ...overrides,
    version: '1.0.0',
  });

  finitePositive(
    config.heartbeatIntervalMs,
    'heartbeatIntervalMs',
  );
  finitePositive(
    config.heartbeatStaleAfterMs,
    'heartbeatStaleAfterMs',
  );
  finitePositive(
    config.telemetryFlushIntervalMs,
    'telemetryFlushIntervalMs',
  );
  finitePositive(
    config.registryCapacity,
    'registryCapacity',
  );
  finitePositive(
    config.maximumProviderDepth,
    'maximumProviderDepth',
  );
  finitePositive(
    config.minimumTouchTargetPx,
    'minimumTouchTargetPx',
  );
  finitePositive(
    config.referenceAspectRatio,
    'referenceAspectRatio',
  );

  if (
    config.heartbeatStaleAfterMs <=
    config.heartbeatIntervalMs
  ) {
    throw new Error(
      'heartbeatStaleAfterMs must exceed heartbeatIntervalMs.',
    );
  }

  if (
    config.registryCapacity >
    APPLICATION_SHELL_REFERENCE.maximumRegistryEntries
  ) {
    throw new Error(
      `registryCapacity cannot exceed ${APPLICATION_SHELL_REFERENCE.maximumRegistryEntries}.`,
    );
  }

  if (
    config.maximumProviderDepth >
    APPLICATION_SHELL_REFERENCE.maximumProviderDepth
  ) {
    throw new Error(
      `maximumProviderDepth cannot exceed ${APPLICATION_SHELL_REFERENCE.maximumProviderDepth}.`,
    );
  }

  if (!config.defaultRoute.startsWith('/')) {
    throw new Error(
      'defaultRoute must be an absolute application path.',
    );
  }

  if (!config.routeBasePath.startsWith('/')) {
    throw new Error(
      'routeBasePath must start with "/".',
    );
  }

  if (config.ariaLabel.trim().length === 0) {
    throw new Error(
      'ariaLabel cannot be empty.',
    );
  }

  return config;
}
