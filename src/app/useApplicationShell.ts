/**
 * Artifact ID: QCQ-APP-001-002
 * Artifact Name: ApplicationShellRuntime
 * Artifact Purpose: Application Shell lifecycle hook coordinating health, accessibility, registry, policy, telemetry, viewport state, and immutable runtime snapshots.
 * Artifact Layer: Phase 1 — Application Shell / RUN
 * Artifact Dependencies: QCQ-APP-001-004, QCQ-APP-001-006, QCQ-APP-001-009, QCQ-APP-001-010, QCQ-APP-001-014, QCQ-APP-001-015, QCQ-APP-001-016
 * Artifact Dependents: QCQ-APP-001-001, QCQ-APP-001-003, QCQ-APP-001-017
 * Dependency Graph: registry + health + accessibility + policy + telemetry -> useApplicationShell -> ApplicationShell
 * Repository Path: QCQ/frontend/src/app
 * Source File: useApplicationShell.ts
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  createApplicationShellTelemetryEvent,
} from './ApplicationShellTelemetry';
import {
  ApplicationShellPolicies,
} from './ApplicationShellPolicies';
import type {
  ApplicationShellRuntimeSnapshot,
  ApplicationShellViewportClass,
  ApplicationShellViewportSnapshot,
  UseApplicationShellOptions,
  UseApplicationShellResult,
} from './ApplicationShell.types';

function classifyViewport(
  width: number,
): ApplicationShellViewportClass {
  if (width >= 7680) return '8k';
  if (width >= 3840) return '4k';
  if (width >= 1920) return 'wide';
  if (width >= 1200) return 'desktop';
  if (width >= 768) return 'tablet';
  return 'compact';
}

function currentViewport():
  ApplicationShellViewportSnapshot {
  if (typeof window === 'undefined') {
    return Object.freeze({
      width: 1920,
      height: 1080,
      devicePixelRatio: 1,
      className: 'desktop',
    });
  }

  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  return Object.freeze({
    width,
    height,
    devicePixelRatio: Math.max(
      1,
      window.devicePixelRatio || 1,
    ),
    className: classifyViewport(width),
  });
}

function subscribeRegistry(
  registry: UseApplicationShellOptions['registry'],
  listener: () => void,
): () => void {
  return registry.subscribe(() => {
    listener();
  });
}

function subscribeHealth(
  monitor: UseApplicationShellOptions['healthMonitor'],
  listener: () => void,
): () => void {
  return monitor.subscribe(() => {
    listener();
  });
}

function subscribeAccessibility(
  accessibility:
    UseApplicationShellOptions['accessibility'],
  listener: () => void,
): () => void {
  return accessibility.subscribe(() => {
    listener();
  });
}

export function useApplicationShell({
  config,
  registry,
  telemetry,
  healthMonitor,
  accessibility,
  rootRef,
  onRuntimeChange,
}: UseApplicationShellOptions): UseApplicationShellResult {
  const [startedAt] = useState(
    () => new Date().toISOString(),
  );
  const previousStatusRef =
    useRef<ApplicationShellRuntimeSnapshot['status']>(
      'booting',
    );
  const policies = useMemo(
    () => new ApplicationShellPolicies(),
    [],
  );

  const registrySnapshot = useSyncExternalStore(
    (listener) =>
      subscribeRegistry(registry, listener),
    () => registry.getSnapshot(),
    () => registry.getSnapshot(),
  );

  const health = useSyncExternalStore(
    (listener) =>
      subscribeHealth(healthMonitor, listener),
    () => healthMonitor.getSnapshot(),
    () => healthMonitor.getSnapshot(),
  );

  const accessibilitySnapshot =
    useSyncExternalStore(
      (listener) =>
        subscribeAccessibility(
          accessibility,
          listener,
        ),
      () => accessibility.getSnapshot(),
      () => accessibility.getSnapshot(),
    );

  const policy = useMemo(
    () =>
      policies.evaluate({
        config,
        registry: registrySnapshot,
        health,
        accessibility:
          accessibilitySnapshot,
      }),
    [
      accessibilitySnapshot,
      config,
      health,
      policies,
      registrySnapshot,
    ],
  );

  const runtime = useMemo<ApplicationShellRuntimeSnapshot>(
    () => {
      const viewport = currentViewport();
      const lastHeartbeatAt =
        health.heartbeatAgeMs === null
          ? null
          : new Date(
              Math.max(
                0,
                Date.parse(health.updatedAt) -
                  health.heartbeatAgeMs,
              ),
            ).toISOString();

      return Object.freeze({
        revision:
          registrySnapshot.revision +
          health.revision +
          accessibilitySnapshot.revision,
        status:
          health.status === 'critical'
            ? 'faulted'
            : policy.status,
        startedAt,
        lastHeartbeatAt,
        online: health.online,
        visibility:
          health.documentVisible
            ? 'visible'
            : 'hidden',
        focused: health.windowFocused,
        viewport,
        motion: accessibilitySnapshot.motion,
        contrast:
          accessibilitySnapshot.contrast,
        input: accessibilitySnapshot.input,
        faultCount: health.faultCount,
        warnings: Object.freeze([
          ...health.warnings,
          ...policy.issues.map(
            (issue) =>
              `${issue.code}:${issue.message}`,
          ),
        ]),
      });
    },
    [
      accessibilitySnapshot,
      health,
      policy,
      registrySnapshot.revision,
      startedAt,
    ],
  );

  useEffect(() => {
    telemetry.setConsent(
      config.enableTelemetry &&
        config.telemetryConsentDefault,
    );
    healthMonitor.start();

    const root = rootRef.current;
    if (root !== null) {
      accessibility.start(root);
    }

    telemetry.record(
      createApplicationShellTelemetryEvent(
        'shell-started',
        {
          metadata: Object.freeze({
            version: config.version,
          }),
        },
      ),
    );

    let flushTimer:
      | ReturnType<typeof setInterval>
      | null = null;
    if (config.enableTelemetry) {
      flushTimer = setInterval(() => {
        void telemetry.flush();
      }, config.telemetryFlushIntervalMs);
    }

    return () => {
      if (flushTimer !== null) {
        clearInterval(flushTimer);
      }
      accessibility.stop();
      healthMonitor.stop();
      void telemetry.flush();
    };
  }, [
    accessibility,
    config.enableTelemetry,
    config.telemetryConsentDefault,
    config.telemetryFlushIntervalMs,
    config.version,
    healthMonitor,
    rootRef,
    telemetry,
  ]);

  useEffect(() => {
    if (
      previousStatusRef.current !==
      runtime.status
    ) {
      telemetry.record(
        createApplicationShellTelemetryEvent(
          runtime.status === 'ready'
            ? 'shell-ready'
            : runtime.status === 'faulted'
              ? 'shell-faulted'
              : 'shell-degraded',
          {
            severity:
              runtime.status === 'faulted'
                ? 'critical'
                : runtime.status === 'degraded'
                  ? 'warning'
                  : 'information',
            metadata: Object.freeze({
              score: policy.score,
              warnings: runtime.warnings.length,
            }),
          },
        ),
      );
      previousStatusRef.current =
        runtime.status;
    }
    onRuntimeChange?.(runtime);
  }, [
    onRuntimeChange,
    policy.score,
    runtime,
    telemetry,
  ]);

  return Object.freeze({
    runtime,
    health,
    accessibility: accessibilitySnapshot,
    policy,
  });
}

export default useApplicationShell;
