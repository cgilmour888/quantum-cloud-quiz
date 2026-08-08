/**
 * Artifact ID: QCQ-APP-001-013
 * Artifact Name: ApplicationShellBoundary
 * Artifact Purpose: Root runtime fault isolation, health escalation, operational telemetry, accessible failure presentation, and explicit local reset.
 * Artifact Layer: Phase 1 — Application Shell / FLT
 * Artifact Dependencies: QCQ-APP-001-006, QCQ-APP-001-014, QCQ-APP-001-015
 * Artifact Dependents: QCQ-APP-001-001, QCQ-APP-001-017
 * Dependency Graph: child runtime fault -> ApplicationShellBoundary -> health/telemetry + accessible recovery state
 * Repository Path: QCQ/frontend/src/app
 * Source File: ApplicationShellBoundary.tsx
 */

import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from 'react';

import {
  createApplicationShellTelemetryEvent,
} from './ApplicationShellTelemetry';
import type {
  ApplicationShellBoundaryFallbackProps,
  ApplicationShellHealthMonitorLike,
  ApplicationShellTelemetryLike,
} from './ApplicationShell.types';

export interface ApplicationShellBoundaryProps {
  readonly children: ReactNode;
  readonly telemetry:
    ApplicationShellTelemetryLike;
  readonly healthMonitor:
    ApplicationShellHealthMonitorLike;
  readonly fallback?:
    | ((
        props: ApplicationShellBoundaryFallbackProps,
      ) => ReactNode)
    | undefined;
}

interface ApplicationShellBoundaryState {
  readonly error: Error | null;
  readonly errorInfo: ErrorInfo | null;
  readonly revision: number;
}

export class ApplicationShellBoundary extends Component<
  ApplicationShellBoundaryProps,
  ApplicationShellBoundaryState
> {
  public override state: ApplicationShellBoundaryState = {
    error: null,
    errorInfo: null,
    revision: 0,
  };

  public static getDerivedStateFromError(
    error: Error,
  ): Partial<ApplicationShellBoundaryState> {
    return { error };
  }

  public override componentDidCatch(
    error: Error,
    errorInfo: ErrorInfo,
  ): void {
    const occurredAt = new Date().toISOString();
    this.setState((current) => ({
      ...current,
      error,
      errorInfo,
      revision: current.revision + 1,
    }));

    this.props.healthMonitor.reportFault({
      code: 'application-shell-boundary',
      severity: 'critical',
      message: error.message,
      source: 'QCQ-APP-001-013',
      occurredAt,
    });

    this.props.telemetry.record(
      createApplicationShellTelemetryEvent(
        'shell-faulted',
        {
          severity: 'critical',
          occurredAt,
          metadata: Object.freeze({
            message: error.message,
            componentStack:
              errorInfo.componentStack ?? '',
          }),
        },
      ),
    );
  }

  public override componentWillUnmount(): void {
    this.props.healthMonitor.clearFault(
      'application-shell-boundary',
    );
  }

  readonly #reset = (): void => {
    this.props.healthMonitor.clearFault(
      'application-shell-boundary',
    );
    this.setState((current) => ({
      error: null,
      errorInfo: null,
      revision: current.revision + 1,
    }));
  };

  public override render(): ReactNode {
    const { error, errorInfo } = this.state;
    if (error === null) {
      return this.props.children;
    }

    if (this.props.fallback !== undefined) {
      return this.props.fallback({
        error,
        errorInfo,
        reset: this.#reset,
      });
    }

    return (
      <section
        role="alert"
        aria-labelledby="qcq-application-shell-fault-title"
        data-qcq-artifact="QCQ-APP-001-013"
      >
        <h2 id="qcq-application-shell-fault-title">
          Quantum Certification Quest encountered a
          runtime fault
        </h2>
        <p>
          Your active learning state should remain under
          its persistence authority. Restore the shell
          after the failing module is reviewed.
        </p>
        <details>
          <summary>Fault details</summary>
          <pre>{error.message}</pre>
        </details>
        <button
          type="button"
          onClick={this.#reset}
        >
          Retry application shell
        </button>
      </section>
    );
  }
}

export default ApplicationShellBoundary;
