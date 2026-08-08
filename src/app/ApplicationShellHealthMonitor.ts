/**
 * Artifact ID: QCQ-APP-001-015
 * Artifact Name: ApplicationShellHealthMonitor
 * Artifact Purpose: Browser/runtime health, heartbeat, connectivity, focus, visibility, and fault-state monitoring through an immutable external-store contract.
 * Artifact Layer: Phase 1 — Application Shell / MON
 * Artifact Dependencies: QCQ-APP-001-004, QCQ-APP-001-006
 * Artifact Dependents: QCQ-APP-001-001, QCQ-APP-001-002, QCQ-APP-001-013, QCQ-APP-001-017
 * Dependency Graph: browser signals + faults -> ApplicationShellHealthMonitor -> runtime/policy/boundary
 * Repository Path: QCQ/frontend/src/app
 * Source File: ApplicationShellHealthMonitor.ts
 */

import type {
  ApplicationShellConfig,
  ApplicationShellHealthFault,
  ApplicationShellHealthSnapshot,
} from './ApplicationShell.types';

type HealthListener = (
  snapshot: ApplicationShellHealthSnapshot,
) => void;

function browserOnline(): boolean {
  return (
    typeof navigator === 'undefined' ||
    typeof navigator.onLine !== 'boolean'
  )
    ? true
    : navigator.onLine;
}

function documentVisible(): boolean {
  return typeof document === 'undefined'
    ? true
    : document.visibilityState !== 'hidden';
}

function windowFocused(): boolean {
  return typeof document === 'undefined'
    ? true
    : document.hasFocus();
}

export class ApplicationShellHealthMonitor {
  readonly #listeners = new Set<HealthListener>();

  readonly #faults = new Map<
    string,
    ApplicationShellHealthFault
  >();

  #started = false;

  #revision = 0;

  #lastHeartbeatAt: number | null = null;

  #timer: ReturnType<typeof setInterval> | null =
    null;

  #snapshot: ApplicationShellHealthSnapshot;

  public constructor(
    private readonly config: ApplicationShellConfig,
  ) {
    this.#snapshot = this.#computeSnapshot();
  }

  public start(): void {
    if (this.#started) return;
    this.#started = true;
    this.#lastHeartbeatAt = Date.now();

    if (typeof window !== 'undefined') {
      window.addEventListener(
        'online',
        this.#handleBrowserSignal,
      );
      window.addEventListener(
        'offline',
        this.#handleBrowserSignal,
      );
      window.addEventListener(
        'focus',
        this.#handleBrowserSignal,
      );
      window.addEventListener(
        'blur',
        this.#handleBrowserSignal,
      );
    }
    if (typeof document !== 'undefined') {
      document.addEventListener(
        'visibilitychange',
        this.#handleBrowserSignal,
      );
    }

    this.#timer = setInterval(
      this.heartbeat,
      this.config.heartbeatIntervalMs,
    );
    this.#publish();
  }

  public stop(): void {
    if (!this.#started) return;
    this.#started = false;

    if (typeof window !== 'undefined') {
      window.removeEventListener(
        'online',
        this.#handleBrowserSignal,
      );
      window.removeEventListener(
        'offline',
        this.#handleBrowserSignal,
      );
      window.removeEventListener(
        'focus',
        this.#handleBrowserSignal,
      );
      window.removeEventListener(
        'blur',
        this.#handleBrowserSignal,
      );
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener(
        'visibilitychange',
        this.#handleBrowserSignal,
      );
    }
    if (this.#timer !== null) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
    this.#publish();
  }

  public heartbeat = (): void => {
    this.#lastHeartbeatAt = Date.now();
    this.#publish();
  };

  public reportFault(
    fault: ApplicationShellHealthFault,
  ): void {
    this.#faults.set(fault.code, Object.freeze({
      ...fault,
    }));
    this.#publish();
  }

  public clearFault(code: string): void {
    if (this.#faults.delete(code)) {
      this.#publish();
    }
  }

  public getSnapshot =
    (): ApplicationShellHealthSnapshot =>
      this.#snapshot;

  public subscribe = (
    listener: HealthListener,
  ): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  readonly #handleBrowserSignal = (): void => {
    this.#publish();
  };

  #computeSnapshot():
    ApplicationShellHealthSnapshot {
    const now = Date.now();
    const online = browserOnline();
    const visible = documentVisible();
    const focused = windowFocused();
    const heartbeatAgeMs =
      this.#lastHeartbeatAt === null
        ? null
        : Math.max(
            0,
            now - this.#lastHeartbeatAt,
          );

    const faults = [...this.#faults.values()];
    const criticalFaults = faults.filter(
      (fault) => fault.severity === 'critical',
    );
    const errorFaults = faults.filter(
      (fault) => fault.severity === 'error',
    );

    const heartbeatStale =
      heartbeatAgeMs !== null &&
      heartbeatAgeMs >
        this.config.heartbeatStaleAfterMs;

    const warnings: string[] = [];
    if (!online) warnings.push('offline');
    if (!visible) warnings.push('document-hidden');
    if (!focused) warnings.push('window-unfocused');
    if (heartbeatStale)
      warnings.push('heartbeat-stale');
    for (const fault of faults) {
      warnings.push(`${fault.code}:${fault.message}`);
    }

    const status =
      criticalFaults.length > 0
        ? 'critical'
        : errorFaults.length > 0 ||
            heartbeatStale
          ? 'degraded'
          : 'healthy';

    return Object.freeze({
      revision: this.#revision,
      status,
      online,
      documentVisible: visible,
      windowFocused: focused,
      heartbeatAgeMs,
      faultCount: faults.length,
      warnings: Object.freeze(warnings),
      updatedAt: new Date(now).toISOString(),
    });
  }

  #publish(): void {
    this.#revision += 1;
    this.#snapshot = this.#computeSnapshot();
    for (const listener of this.#listeners) {
      listener(this.#snapshot);
    }
  }
}
