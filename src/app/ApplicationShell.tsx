/**
 * Artifact ID: QCQ-APP-001-001
 * Artifact Name: ApplicationShell
 * Artifact Purpose: Root runtime shell coordinating platform providers, routing adaptation, runtime health, accessibility, fault isolation, and token-driven outer visual chrome while preserving APP-002 as sole macro-layout authority.
 * Artifact Layer: Phase 1 — Application Shell / APP
 * Artifact Dependencies: QCQ-APP-001-002, QCQ-APP-001-004 through QCQ-APP-001-016, QCQ-APP-002, QCQ-TBL-040, QCQ-TBL-036, QCQ-THM-001
 * Artifact Dependents: QCQ-APP-001-003, QCQ-APP-001-017, application bootstrap, future platform providers
 * Dependency Graph: platform providers + canonical router/composer/layout authorities -> ApplicationShell -> QCQ runtime root
 * Repository Path: QCQ/frontend/src/app
 * Source File: ApplicationShell.tsx
 */

import {
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

import {
  createApplicationShellConfig,
} from './ApplicationShell.config';
import {
  APPLICATION_SHELL_ARTIFACT_IDS,
  APPLICATION_SHELL_DATA_ATTRIBUTES,
  APPLICATION_SHELL_VERSION,
} from './ApplicationShell.constants';
import {
  ApplicationShellAccessibility,
} from './ApplicationShellAccessibility';
import {
  ApplicationShellBoundary,
} from './ApplicationShellBoundary';
import {
  ApplicationShellHealthMonitor,
} from './ApplicationShellHealthMonitor';
import {
  ApplicationShellProviders,
} from './ApplicationShellProviders';
import {
  ApplicationShellRouter,
} from './ApplicationShellRouter';
import {
  ApplicationShellTelemetry,
} from './ApplicationShellTelemetry';
import {
  createApplicationShellRegistry,
} from './ApplicationShellRegistry';
import {
  useApplicationShell,
} from './useApplicationShell';
import type {
  ApplicationShellProps,
} from './ApplicationShell.types';

import styles from './ApplicationShell.module.css';

function ShellChrome({
  enabled,
}: {
  readonly enabled: boolean;
}) {
  if (!enabled) return null;

  return (
    <div
      className={styles.chrome}
      aria-hidden="true"
      data-qcq-shell-chrome="web-native"
    >
      <span className={styles.depthField} />
      <span className={styles.circuitField} />
      <span
        className={`${styles.rail} ${styles.railTop}`}
      />
      <span
        className={`${styles.rail} ${styles.railRight}`}
      />
      <span
        className={`${styles.rail} ${styles.railBottom}`}
      />
      <span
        className={`${styles.rail} ${styles.railLeft}`}
      />
      <span
        className={`${styles.cornerNode} ${styles.cornerTopLeft}`}
      />
      <span
        className={`${styles.cornerNode} ${styles.cornerTopRight}`}
      />
      <span
        className={`${styles.cornerNode} ${styles.cornerBottomLeft}`}
      />
      <span
        className={`${styles.cornerNode} ${styles.cornerBottomRight}`}
      />
      <span className={styles.statusBeacon} />
    </div>
  );
}

export function ApplicationShell({
  id,
  className,
  ariaLabel,
  children,
  composition,
  providers = [],
  routeResolver,
  routeFallback,
  config: configOverrides,
  services,
  onRuntimeChange,
  onPolicyReport,
}: ApplicationShellProps) {
  const config = useMemo(
    () =>
      createApplicationShellConfig(
        configOverrides,
      ),
    [configOverrides],
  );

  const registry = useMemo(
    () =>
      services?.registry ??
      createApplicationShellRegistry({
        capacity: config.registryCapacity,
      }),
    [
      config.registryCapacity,
      services?.registry,
    ],
  );

  const telemetry = useMemo(
    () =>
      services?.telemetry ??
      new ApplicationShellTelemetry(null, {
        consentGranted:
          config.enableTelemetry &&
          config.telemetryConsentDefault,
      }),
    [
      config.enableTelemetry,
      config.telemetryConsentDefault,
      services?.telemetry,
    ],
  );

  const healthMonitor = useMemo(
    () =>
      services?.healthMonitor ??
      new ApplicationShellHealthMonitor(config),
    [config, services?.healthMonitor],
  );

  const accessibility = useMemo(
    () =>
      services?.accessibility ??
      new ApplicationShellAccessibility(config),
    [config, services?.accessibility],
  );

  const rootRef = useRef<HTMLDivElement | null>(null);

  const shell = useApplicationShell({
    config,
    registry,
    telemetry,
    healthMonitor,
    accessibility,
    rootRef,
    ...(onRuntimeChange === undefined
      ? {}
      : { onRuntimeChange }),
  });

  useEffect(() => {
    onPolicyReport?.(shell.policy);
  }, [onPolicyReport, shell.policy]);

  const canonicalComposition =
    composition ?? children ?? null;

  const routedComposition: ReactNode =
    routeResolver === undefined ? (
      canonicalComposition
    ) : (
      <ApplicationShellRouter
        resolve={routeResolver}
        basePath={config.routeBasePath}
        fallback={
          routeFallback ??
          canonicalComposition
        }
      />
    );

  const classes = [
    styles.shell,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ApplicationShellProviders
      providers={providers}
      maximumDepth={config.maximumProviderDepth}
    >
      <ApplicationShellBoundary
        telemetry={telemetry}
        healthMonitor={healthMonitor}
      >
        <div
          ref={rootRef}
          id={id}
          className={classes}
          role="group"
          aria-label={
            ariaLabel ?? config.ariaLabel
          }
          {...{
            [APPLICATION_SHELL_DATA_ATTRIBUTES.artifact]:
              APPLICATION_SHELL_ARTIFACT_IDS.shell,
            [APPLICATION_SHELL_DATA_ATTRIBUTES.family]:
              'QCQ-APP-001',
            [APPLICATION_SHELL_DATA_ATTRIBUTES.version]:
              APPLICATION_SHELL_VERSION,
            [APPLICATION_SHELL_DATA_ATTRIBUTES.status]:
              shell.runtime.status,
            [APPLICATION_SHELL_DATA_ATTRIBUTES.online]:
              String(shell.runtime.online),
            [APPLICATION_SHELL_DATA_ATTRIBUTES.visibility]:
              shell.runtime.visibility,
            [APPLICATION_SHELL_DATA_ATTRIBUTES.focus]:
              String(shell.runtime.focused),
            [APPLICATION_SHELL_DATA_ATTRIBUTES.motion]:
              shell.runtime.motion,
            [APPLICATION_SHELL_DATA_ATTRIBUTES.contrast]:
              shell.runtime.contrast,
            [APPLICATION_SHELL_DATA_ATTRIBUTES.input]:
              shell.runtime.input,
            [APPLICATION_SHELL_DATA_ATTRIBUTES.viewport]:
              shell.runtime.viewport.className,
          }}
        >
          <ShellChrome
            enabled={
              config.enableDecorativeChrome
            }
          />
          <div className={styles.composition}>
            {routedComposition}
          </div>
        </div>
      </ApplicationShellBoundary>
    </ApplicationShellProviders>
  );
}

export default ApplicationShell;
