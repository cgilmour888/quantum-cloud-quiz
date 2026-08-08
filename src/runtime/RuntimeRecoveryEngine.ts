export interface RuntimeRecoveryCheckpoint {
  readonly schemaVersion: '1.0.0';
  readonly startedAt: number;
  readonly updatedAt: number;
  readonly phase:
    | 'bootstrapping'
    | 'ready'
    | 'recovering'
    | 'failed';
  readonly recoveryAttempts: number;
  readonly lastIncidentId: string | null;
}

export interface RuntimeRecoveryResult {
  readonly recovered: boolean;
  readonly checkpoint:
    RuntimeRecoveryCheckpoint | null;
  readonly reason: string;
}

const STORAGE_KEY =
  'qcq.runtime.recovery.v1';

function createInitialCheckpoint():
  RuntimeRecoveryCheckpoint {
  const now = Date.now();
  return Object.freeze({
    schemaVersion: '1.0.0',
    startedAt: now,
    updatedAt: now,
    phase: 'bootstrapping',
    recoveryAttempts: 0,
    lastIncidentId: null,
  });
}

function parseCheckpoint(
  value: string | null,
): RuntimeRecoveryCheckpoint | null {
  if (value === null) return null;

  try {
    const parsed: unknown =
      JSON.parse(value);

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('schemaVersion' in parsed) ||
      !('phase' in parsed) ||
      !('recoveryAttempts' in parsed)
    ) {
      return null;
    }

    const candidate =
      parsed as Partial<RuntimeRecoveryCheckpoint>;

    if (
      candidate.schemaVersion !== '1.0.0' ||
      (
        candidate.phase !== 'bootstrapping' &&
        candidate.phase !== 'ready' &&
        candidate.phase !== 'recovering' &&
        candidate.phase !== 'failed'
      ) ||
      typeof candidate.startedAt !== 'number' ||
      typeof candidate.updatedAt !== 'number' ||
      typeof candidate.recoveryAttempts !==
        'number'
    ) {
      return null;
    }

    return Object.freeze({
      schemaVersion: '1.0.0',
      startedAt: candidate.startedAt,
      updatedAt: candidate.updatedAt,
      phase: candidate.phase,
      recoveryAttempts:
        Math.max(
          0,
          Math.trunc(
            candidate.recoveryAttempts,
          ),
        ),
      lastIncidentId:
        typeof candidate.lastIncidentId ===
        'string'
          ? candidate.lastIncidentId
          : null,
    });
  } catch {
    return null;
  }
}

function getSessionStorage():
  Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export class RuntimeRecoveryEngine {
  readonly #storage: Storage | null;

  public constructor(
    storage:
      Storage | null =
      getSessionStorage(),
  ) {
    this.#storage = storage;
  }

  public load():
    RuntimeRecoveryCheckpoint | null {
    if (this.#storage === null) {
      return null;
    }
    return parseCheckpoint(
      this.#storage.getItem(STORAGE_KEY),
    );
  }

  public begin():
    RuntimeRecoveryCheckpoint {
    const checkpoint =
      createInitialCheckpoint();
    this.#write(checkpoint);
    return checkpoint;
  }

  public markReady():
    RuntimeRecoveryCheckpoint {
    const current =
      this.load() ??
      createInitialCheckpoint();
    const checkpoint =
      Object.freeze({
        ...current,
        updatedAt: Date.now(),
        phase: 'ready' as const,
      });
    this.#write(checkpoint);
    return checkpoint;
  }

  public recordFailure(
    incidentId: string,
  ): RuntimeRecoveryCheckpoint {
    const current =
      this.load() ??
      createInitialCheckpoint();
    const checkpoint =
      Object.freeze({
        ...current,
        updatedAt: Date.now(),
        phase: 'failed' as const,
        lastIncidentId: incidentId,
      });
    this.#write(checkpoint);
    return checkpoint;
  }

  public attemptRecovery(
    maximumAttempts: number,
  ): RuntimeRecoveryResult {
    const current = this.load();

    if (current === null) {
      return Object.freeze({
        recovered: false,
        checkpoint: null,
        reason:
          'No runtime recovery checkpoint exists.',
      });
    }

    if (
      current.recoveryAttempts >=
      maximumAttempts
    ) {
      return Object.freeze({
        recovered: false,
        checkpoint: current,
        reason:
          'Maximum runtime recovery attempts reached.',
      });
    }

    const checkpoint =
      Object.freeze({
        ...current,
        updatedAt: Date.now(),
        phase: 'recovering' as const,
        recoveryAttempts:
          current.recoveryAttempts + 1,
      });

    this.#write(checkpoint);

    return Object.freeze({
      recovered: true,
      checkpoint,
      reason:
        'Runtime recovery checkpoint advanced safely.',
    });
  }

  public clear(): void {
    this.#storage?.removeItem(STORAGE_KEY);
  }

  #write(
    checkpoint: RuntimeRecoveryCheckpoint,
  ): void {
    if (this.#storage === null) return;

    try {
      this.#storage.setItem(
        STORAGE_KEY,
        JSON.stringify(checkpoint),
      );
    } catch {
      // Foundation recovery is best-effort and never replaces Phase 8 persistence.
    }
  }
}
