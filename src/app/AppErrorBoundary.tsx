import {
  Component,
  type ErrorInfo,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

import {
  RuntimeRecoveryEngine,
} from '../runtime/RuntimeRecoveryEngine';

interface AppErrorBoundaryState {
  readonly error: Error | null;
  readonly incidentId: string | null;
}

function createIncidentId(): string {
  if (
    typeof globalThis.crypto?.randomUUID ===
    'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `qcq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export class AppErrorBoundary extends Component<
  PropsWithChildren,
  AppErrorBoundaryState
> {
  readonly #recovery =
    new RuntimeRecoveryEngine();

  public override state:
    AppErrorBoundaryState = {
    error: null,
    incidentId: null,
  };

  public static getDerivedStateFromError(
    error: Error,
  ): AppErrorBoundaryState {
    return {
      error,
      incidentId: createIncidentId(),
    };
  }

  public override componentDidCatch(
    error: Error,
    errorInfo: ErrorInfo,
  ): void {
    const incidentId =
      this.state.incidentId ??
      createIncidentId();

    this.#recovery.recordFailure(
      incidentId,
    );

    console.error(
      '[QCQ] fatal rendering boundary',
      {
        name: error.name,
        message: error.message,
        componentStack:
          errorInfo.componentStack,
        incidentId,
      },
    );
  }

  private readonly handleReload =
    (): void => {
      this.#recovery.attemptRecovery(2);
      window.location.reload();
    };

  private readonly handleReturnHome =
    (): void => {
      this.#recovery.attemptRecovery(2);
      window.location.assign('/');
    };

  public override render():
    ReactNode {
    const { children } = this.props;
    const { error, incidentId } =
      this.state;

    if (error === null) {
      return children;
    }

    return (
      <main
        className="qcq-fatal"
        role="alert"
        aria-labelledby="qcq-fatal-title"
      >
        <div className="qcq-fatal__panel">
          <p className="qcq-kicker">
            Runtime containment active
          </p>
          <h1 id="qcq-fatal-title">
            Quantum Certification Quest
            encountered a rendering failure.
          </h1>
          <p>
            The rendering branch was isolated
            before it could leave an unstable
            interface. Reload the application
            or return to the foundation route.
          </p>
          {incidentId !== null ? (
            <p className="qcq-fatal__incident">
              Incident reference:{' '}
              <code>{incidentId}</code>
            </p>
          ) : null}
          <div className="qcq-fatal__actions">
            <button
              type="button"
              onClick={this.handleReload}
            >
              Reload application
            </button>
            <button
              type="button"
              onClick={
                this.handleReturnHome
              }
            >
              Return home
            </button>
          </div>
        </div>
      </main>
    );
  }
}
