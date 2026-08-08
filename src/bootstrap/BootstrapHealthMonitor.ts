export type HealthState =
  | 'healthy'
  | 'degraded'
  | 'unhealthy'
  | 'unknown';

export interface HealthCheckResult {
  readonly id: string;
  readonly state: HealthState;
  readonly checkedAt: number;
  readonly latencyMilliseconds: number;
  readonly message: string;
}

export type HealthCheck = () =>
  HealthCheckResult | Promise<HealthCheckResult>;

export interface BootstrapHealthSnapshot {
  readonly state: HealthState;
  readonly checkedAt: number;
  readonly checks: readonly HealthCheckResult[];
}

type HealthListener = (
  snapshot: BootstrapHealthSnapshot,
) => void;

function aggregateState(
  checks: readonly HealthCheckResult[],
): HealthState {
  if (
    checks.some(
      (check) => check.state === 'unhealthy',
    )
  ) {
    return 'unhealthy';
  }
  if (
    checks.some(
      (check) => check.state === 'degraded',
    )
  ) {
    return 'degraded';
  }
  if (
    checks.length > 0 &&
    checks.every(
      (check) => check.state === 'healthy',
    )
  ) {
    return 'healthy';
  }
  return 'unknown';
}

export class BootstrapHealthMonitor {
  readonly #checks =
    new Map<string, HealthCheck>();
  readonly #listeners =
    new Set<HealthListener>();
  #lastSnapshot:
    BootstrapHealthSnapshot =
    Object.freeze({
      state: 'unknown',
      checkedAt: 0,
      checks: Object.freeze([]),
    });

  public register(
    id: string,
    check: HealthCheck,
  ): this {
    if (id.trim() === '') {
      throw new Error(
        'Health check id cannot be empty.',
      );
    }
    if (this.#checks.has(id)) {
      throw new Error(
        `Health check "${id}" is already registered.`,
      );
    }
    this.#checks.set(id, check);
    return this;
  }

  public subscribe(
    listener: HealthListener,
  ): () => void {
    this.#listeners.add(listener);
    listener(this.#lastSnapshot);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  public snapshot():
    BootstrapHealthSnapshot {
    return this.#lastSnapshot;
  }

  public async run():
    Promise<BootstrapHealthSnapshot> {
    const checks: HealthCheckResult[] = [];

    for (
      const [id, check] of this.#checks
    ) {
      const started = performance.now();
      try {
        const result = await check();
        checks.push(
          Object.freeze({
            ...result,
            id,
            latencyMilliseconds:
              Math.max(
                0,
                result.latencyMilliseconds,
              ),
          }),
        );
      } catch (error) {
        checks.push(
          Object.freeze({
            id,
            state: 'unhealthy',
            checkedAt: Date.now(),
            latencyMilliseconds:
              performance.now() - started,
            message:
              error instanceof Error
                ? error.message
                : 'Unknown health-check failure.',
          }),
        );
      }
    }

    const snapshot =
      Object.freeze({
        state: aggregateState(checks),
        checkedAt: Date.now(),
        checks: Object.freeze(checks),
      });

    this.#lastSnapshot = snapshot;

    for (
      const listener of this.#listeners
    ) {
      listener(snapshot);
    }

    return snapshot;
  }
}
