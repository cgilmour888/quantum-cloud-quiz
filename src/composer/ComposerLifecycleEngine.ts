/**
 * Artifact ID: QCQ-CMP-011
 * Artifact Name: ComposerLifecycleEngine
 * Artifact Purpose: Deterministic master-composition lifecycle state machine with legal transition enforcement, evidence history, failure/degradation handling, and disposal safety.
 * Artifact Layer: Phase 10 — Master Composer / LFC (Lifecycle Authority)
 * Artifact Dependencies: None
 * Artifact Dependents: QCQ-CMP-014, QCQ-CMP-016, QCQ-CMP-018, QCQ-CMP-021 through QCQ-CMP-030
 * Dependency Graph: None -> ComposerLifecycleEngine -> QCQ-CMP-014, QCQ-CMP-016, QCQ-CMP-018, QCQ-CMP-021 through QCQ-CMP-030
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerLifecycleEngine.ts
 */

export type ComposerLifecyclePhase =
  | 'created'
  | 'validating'
  | 'initializing'
  | 'ready'
  | 'degraded'
  | 'failed'
  | 'disposed';

export interface ComposerLifecycleEvent {
  readonly sequence: number;
  readonly from: ComposerLifecyclePhase;
  readonly to: ComposerLifecyclePhase;
  readonly reason: string;
  readonly occurredAt: string;
}

export interface ComposerLifecycleSnapshot {
  readonly version: number;
  readonly phase: ComposerLifecyclePhase;
  readonly ready: boolean;
  readonly degraded: boolean;
  readonly terminal: boolean;
  readonly lastReason: string | null;
  readonly lastChangedAt: string;
  readonly history: readonly ComposerLifecycleEvent[];
}

type Listener = (snapshot: ComposerLifecycleSnapshot) => void;

const ALLOWED: Readonly<Record<ComposerLifecyclePhase, readonly ComposerLifecyclePhase[]>> = Object.freeze({
  created: Object.freeze(['validating', 'failed', 'disposed'] as ComposerLifecyclePhase[]),
  validating: Object.freeze(['initializing', 'degraded', 'failed', 'disposed'] as ComposerLifecyclePhase[]),
  initializing: Object.freeze(['ready', 'degraded', 'failed', 'disposed'] as ComposerLifecyclePhase[]),
  ready: Object.freeze(['validating', 'degraded', 'failed', 'disposed'] as ComposerLifecyclePhase[]),
  degraded: Object.freeze(['validating', 'initializing', 'ready', 'failed', 'disposed'] as ComposerLifecyclePhase[]),
  failed: Object.freeze(['validating', 'disposed'] as ComposerLifecyclePhase[]),
  disposed: Object.freeze([] as ComposerLifecyclePhase[]),
});

export class ComposerLifecycleTransitionError extends Error {
  public constructor(
    public readonly from: ComposerLifecyclePhase,
    public readonly to: ComposerLifecyclePhase,
  ) {
    super(`Illegal composer lifecycle transition: ${from} -> ${to}.`);
    this.name = 'ComposerLifecycleTransitionError';
  }
}

export class ComposerLifecycleEngine {
  private readonly listeners = new Set<Listener>();
  private readonly history: ComposerLifecycleEvent[] = [];
  private phase: ComposerLifecyclePhase = 'created';
  private version = 0;
  private sequence = 0;
  private lastReason: string | null = null;
  private lastChangedAt: string;

  public constructor(
    private readonly now: () => Date = () => new Date(),
    private readonly maximumHistory = 256,
  ) {
    this.lastChangedAt = this.now().toISOString();
  }

  public readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public readonly getSnapshot = (): ComposerLifecycleSnapshot => Object.freeze({
    version: this.version,
    phase: this.phase,
    ready: this.phase === 'ready',
    degraded: this.phase === 'degraded',
    terminal: this.phase === 'disposed',
    lastReason: this.lastReason,
    lastChangedAt: this.lastChangedAt,
    history: Object.freeze([...this.history]),
  });

  public canTransition(to: ComposerLifecyclePhase): boolean {
    return ALLOWED[this.phase].includes(to);
  }

  public transition(to: ComposerLifecyclePhase, reason: string): ComposerLifecycleSnapshot {
    if (!reason.trim()) throw new Error('Lifecycle transition reason must be non-empty.');
    if (to === this.phase) return this.getSnapshot();
    if (!this.canTransition(to)) throw new ComposerLifecycleTransitionError(this.phase, to);

    const from = this.phase;
    const occurredAt = this.now().toISOString();
    this.phase = to;
    this.version += 1;
    this.sequence += 1;
    this.lastReason = reason;
    this.lastChangedAt = occurredAt;
    this.history.push(Object.freeze({ sequence: this.sequence, from, to, reason, occurredAt }));
    if (this.history.length > this.maximumHistory) {
      this.history.splice(0, this.history.length - this.maximumHistory);
    }
    const snapshot = this.getSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
    return snapshot;
  }

  public beginValidation(reason = 'Composition validation started.'): ComposerLifecycleSnapshot {
    return this.transition('validating', reason);
  }

  public beginInitialization(reason = 'Composition initialization started.'): ComposerLifecycleSnapshot {
    return this.transition('initializing', reason);
  }

  public markReady(reason = 'Composition is ready.'): ComposerLifecycleSnapshot {
    return this.transition('ready', reason);
  }

  public markDegraded(reason: string): ComposerLifecycleSnapshot {
    return this.transition('degraded', reason);
  }

  public fail(reason: string): ComposerLifecycleSnapshot {
    return this.transition('failed', reason);
  }

  public dispose(reason = 'Composition disposed.'): ComposerLifecycleSnapshot {
    if (this.phase === 'disposed') return this.getSnapshot();
    const result = this.transition('disposed', reason);
    this.listeners.clear();
    return result;
  }
}

export const composerLifecycleEngine = new ComposerLifecycleEngine();
