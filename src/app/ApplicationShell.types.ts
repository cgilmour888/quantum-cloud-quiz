/**
 * Artifact ID: QCQ-APP-001-006
 * Artifact Name: ApplicationShellContracts
 * Artifact Purpose: Immutable shell, runtime, provider, routing, telemetry, health, registry, policy, and accessibility contracts.
 * Artifact Layer: Phase 1 — Application Shell / CTR
 * Artifact Dependencies: QCQ-APP-001-005
 * Artifact Dependents: QCQ-APP-001-001 through QCQ-APP-001-017
 * Dependency Graph: ApplicationShellConstants -> ApplicationShellContracts -> every Application Shell authority
 * Repository Path: QCQ/frontend/src/app
 * Source File: ApplicationShell.types.ts
 */

import type {
  ComponentType,
  ErrorInfo,
  ReactNode,
  RefObject,
} from 'react';

import type {
  ApplicationShellRuntimeEventType,
} from './ApplicationShell.constants';

export type ApplicationShellStatus =
  | 'booting'
  | 'ready'
  | 'degraded'
  | 'faulted';

export type ApplicationShellMotionMode =
  | 'full'
  | 'reduced'
  | 'static';

export type ApplicationShellContrastMode =
  | 'standard'
  | 'high'
  | 'forced-colors';

export type ApplicationShellInputModality =
  | 'keyboard'
  | 'pointer'
  | 'touch'
  | 'pen'
  | 'unknown';

export type ApplicationShellViewportClass =
  | 'compact'
  | 'tablet'
  | 'desktop'
  | 'wide'
  | '4k'
  | '8k';

export type ApplicationShellRegistryKind =
  | 'shell'
  | 'runtime'
  | 'validation'
  | 'configuration'
  | 'constants'
  | 'contracts'
  | 'styles'
  | 'manifest'
  | 'registry'
  | 'policy'
  | 'provider'
  | 'router'
  | 'boundary'
  | 'telemetry'
  | 'health'
  | 'accessibility'
  | 'integration'
  | 'external-authority';

export type ApplicationShellSeverity =
  | 'information'
  | 'warning'
  | 'error'
  | 'critical';

export interface ApplicationShellViewportSnapshot {
  readonly width: number;
  readonly height: number;
  readonly devicePixelRatio: number;
  readonly className: ApplicationShellViewportClass;
}

export interface ApplicationShellRuntimeSnapshot {
  readonly revision: number;
  readonly status: ApplicationShellStatus;
  readonly startedAt: string | null;
  readonly lastHeartbeatAt: string | null;
  readonly online: boolean;
  readonly visibility:
    | 'visible'
    | 'hidden'
    | 'prerender'
    | 'unknown';
  readonly focused: boolean;
  readonly viewport: ApplicationShellViewportSnapshot;
  readonly motion: ApplicationShellMotionMode;
  readonly contrast: ApplicationShellContrastMode;
  readonly input: ApplicationShellInputModality;
  readonly faultCount: number;
  readonly warnings: readonly string[];
}

export interface ApplicationShellHealthSnapshot {
  readonly revision: number;
  readonly status: 'healthy' | 'degraded' | 'critical';
  readonly online: boolean;
  readonly documentVisible: boolean;
  readonly windowFocused: boolean;
  readonly heartbeatAgeMs: number | null;
  readonly faultCount: number;
  readonly warnings: readonly string[];
  readonly updatedAt: string;
}

export interface ApplicationShellHealthFault {
  readonly code: string;
  readonly severity: ApplicationShellSeverity;
  readonly message: string;
  readonly source: string;
  readonly occurredAt: string;
}

export interface ApplicationShellTelemetryEvent {
  readonly eventId: string;
  readonly type: ApplicationShellRuntimeEventType;
  readonly occurredAt: string;
  readonly severity: ApplicationShellSeverity;
  readonly correlationId: string;
  readonly route: string | null;
  readonly metadata: Readonly<
    Record<string, string | number | boolean | null>
  >;
}

export interface ApplicationShellTelemetrySink {
  deliver(
    events: readonly ApplicationShellTelemetryEvent[],
  ): Promise<readonly string[]>;
}

export interface ApplicationShellTelemetrySnapshot {
  readonly consentGranted: boolean;
  readonly queueLength: number;
  readonly droppedCount: number;
  readonly deliveredCount: number;
  readonly lastFlushedAt: string | null;
}

export interface ApplicationShellRegistryDescriptor {
  readonly artifactId: string;
  readonly name: string;
  readonly kind: ApplicationShellRegistryKind;
  readonly version: string;
  readonly required: boolean;
  readonly dependencies: readonly string[];
  readonly capabilities: readonly string[];
  readonly owner: string;
}

export interface ApplicationShellRegistryEntry<TValue = unknown> {
  readonly descriptor: ApplicationShellRegistryDescriptor;
  readonly value: TValue;
  readonly enabled: boolean;
  readonly registeredAt: string;
  readonly metadata: Readonly<Record<string, string>>;
}

export interface ApplicationShellRegistrySnapshot {
  readonly revision: number;
  readonly total: number;
  readonly enabled: number;
  readonly artifactIds: readonly string[];
  readonly enabledArtifactIds: readonly string[];
  readonly externalAuthorityIds: readonly string[];
  readonly registeredAt: string | null;
}

export interface ApplicationShellPolicyIssue {
  readonly severity: ApplicationShellSeverity;
  readonly code: string;
  readonly message: string;
  readonly remediation: string;
  readonly artifactId: string | null;
}

export interface ApplicationShellPolicyReport {
  readonly valid: boolean;
  readonly status: ApplicationShellStatus;
  readonly score: number;
  readonly issues: readonly ApplicationShellPolicyIssue[];
  readonly verifiedAuthorities: readonly string[];
  readonly missingAuthorities: readonly string[];
  readonly evaluatedAt: string;
}

export interface ApplicationShellRoute {
  readonly path: string;
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
  readonly state: unknown;
}

export interface ApplicationShellRouteResult {
  readonly node: ReactNode;
  readonly routeId: string;
  readonly title: string | null;
  readonly requiresAuthentication: boolean;
  readonly requiresOrganization: boolean;
}

export type ApplicationShellRouteResolver = (
  route: ApplicationShellRoute,
) => ApplicationShellRouteResult | null;

export interface ApplicationShellProviderProps {
  readonly children: ReactNode;
}

export interface ApplicationShellProviderDescriptor {
  readonly id: string;
  readonly name: string;
  readonly priority: number;
  readonly component: ComponentType<ApplicationShellProviderProps>;
  readonly enabled: boolean;
  readonly required: boolean;
  readonly dependencies: readonly string[];
}

export interface ApplicationShellAccessibilitySnapshot {
  readonly revision: number;
  readonly motion: ApplicationShellMotionMode;
  readonly contrast: ApplicationShellContrastMode;
  readonly input: ApplicationShellInputModality;
  readonly textScale: number;
  readonly coarsePointer: boolean;
  readonly updatedAt: string;
}

export interface ApplicationShellErrorRecord {
  readonly message: string;
  readonly stack: string | null;
  readonly componentStack: string | null;
  readonly occurredAt: string;
}

export interface ApplicationShellBoundaryFallbackProps {
  readonly error: Error;
  readonly errorInfo: ErrorInfo | null;
  readonly reset: () => void;
}

export interface ApplicationShellConfig {
  readonly version: '1.0.0';
  readonly ariaLabel: string;
  readonly documentTitle: string;
  readonly defaultRoute: string;
  readonly routeBasePath: string;
  readonly heartbeatIntervalMs: number;
  readonly heartbeatStaleAfterMs: number;
  readonly telemetryFlushIntervalMs: number;
  readonly registryCapacity: number;
  readonly requireLayoutAuthority: boolean;
  readonly requireMasterComposer: boolean;
  readonly requireVisualAuthorities: boolean;
  readonly requireOnlineForBoot: boolean;
  readonly allowDegradedOffline: boolean;
  readonly requireReducedMotionCompliance: boolean;
  readonly requireForcedColorsCompliance: boolean;
  readonly enableDecorativeChrome: boolean;
  readonly enableTelemetry: boolean;
  readonly telemetryConsentDefault: boolean;
  readonly maximumProviderDepth: number;
  readonly minimumTouchTargetPx: number;
  readonly referenceAspectRatio: number;
}

export interface ApplicationShellRuntimeServices {
  readonly registry?: ApplicationShellRegistryLike | undefined;
  readonly telemetry?: ApplicationShellTelemetryLike | undefined;
  readonly healthMonitor?: ApplicationShellHealthMonitorLike | undefined;
  readonly accessibility?:
    | ApplicationShellAccessibilityLike
    | undefined;
}

export interface ApplicationShellRegistryLike {
  getSnapshot(): ApplicationShellRegistrySnapshot;
  has(artifactId: string): boolean;
  subscribe(
    listener: (
      snapshot: ApplicationShellRegistrySnapshot,
    ) => void,
  ): () => void;
}

export interface ApplicationShellTelemetryLike {
  setConsent(granted: boolean): void;
  record(event: ApplicationShellTelemetryEvent): boolean;
  flush(): Promise<number>;
  getSnapshot(): ApplicationShellTelemetrySnapshot;
}

export interface ApplicationShellHealthMonitorLike {
  start(): void;
  stop(): void;
  heartbeat(): void;
  reportFault(fault: ApplicationShellHealthFault): void;
  clearFault(code: string): void;
  getSnapshot(): ApplicationShellHealthSnapshot;
  subscribe(
    listener: (
      snapshot: ApplicationShellHealthSnapshot,
    ) => void,
  ): () => void;
}

export interface ApplicationShellAccessibilityLike {
  start(root: HTMLElement): void;
  stop(): void;
  getSnapshot(): ApplicationShellAccessibilitySnapshot;
  subscribe(
    listener: (
      snapshot: ApplicationShellAccessibilitySnapshot,
    ) => void,
  ): () => void;
}

export interface ApplicationShellProps {
  readonly id?: string | undefined;
  readonly className?: string | undefined;
  readonly ariaLabel?: string | undefined;
  readonly children?: ReactNode | undefined;
  readonly composition?: ReactNode | undefined;
  readonly providers?:
    | readonly ApplicationShellProviderDescriptor[]
    | undefined;
  readonly routeResolver?:
    | ApplicationShellRouteResolver
    | undefined;
  readonly routeFallback?: ReactNode | undefined;
  readonly config?:
    | Partial<ApplicationShellConfig>
    | undefined;
  readonly services?:
    | ApplicationShellRuntimeServices
    | undefined;
  readonly onRuntimeChange?: (
    snapshot: ApplicationShellRuntimeSnapshot,
  ) => void;
  readonly onPolicyReport?: (
    report: ApplicationShellPolicyReport,
  ) => void;
}

export interface UseApplicationShellOptions {
  readonly config: ApplicationShellConfig;
  readonly registry: ApplicationShellRegistryLike;
  readonly telemetry: ApplicationShellTelemetryLike;
  readonly healthMonitor: ApplicationShellHealthMonitorLike;
  readonly accessibility: ApplicationShellAccessibilityLike;
  readonly onRuntimeChange?: (
    snapshot: ApplicationShellRuntimeSnapshot,
  ) => void;
  readonly rootRef: RefObject<HTMLDivElement | null>;
}

export interface UseApplicationShellResult {
  readonly runtime: ApplicationShellRuntimeSnapshot;
  readonly health: ApplicationShellHealthSnapshot;
  readonly accessibility: ApplicationShellAccessibilitySnapshot;
  readonly policy: ApplicationShellPolicyReport;
}
