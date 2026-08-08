/**
 * Artifact ID: QCQ-PER-016
 * Artifact Name: SessionLifecycleEngine
 * Repository Path: QCQ/frontend/src/persistence/SessionLifecycleEngine.ts
 */

export type PersistenceLifecycleState =
  | 'uninitialized'
  | 'bootstrapping'
  | 'ready'
  | 'active'
  | 'saving'
  | 'suspended'
  | 'restoring'
  | 'validating'
  | 'completed'
  | 'shutting-down'
  | 'faulted';

export type PersistenceLifecycleEvent =
  | 'bootstrap'
  | 'ready'
  | 'start-session'
  | 'begin-save'
  | 'save-complete'
  | 'suspend'
  | 'resume'
  | 'begin-restore'
  | 'restore-complete'
  | 'begin-validation'
  | 'validation-complete'
  | 'complete-session'
  | 'shutdown'
  | 'fault'
  | 'reset';

export interface PersistenceLifecycleTransition {
  readonly from: PersistenceLifecycleState;
  readonly event: PersistenceLifecycleEvent;
  readonly to: PersistenceLifecycleState;
  readonly at: string;
}

const TRANSITIONS: Readonly<
  Partial<Record<PersistenceLifecycleState, Partial<Record<PersistenceLifecycleEvent, PersistenceLifecycleState>>>>
> = Object.freeze({
  uninitialized: Object.freeze({ bootstrap: 'bootstrapping', reset: 'uninitialized' }),
  bootstrapping: Object.freeze({ ready: 'ready', fault: 'faulted' }),
  ready: Object.freeze({
    'start-session': 'active',
    'begin-restore': 'restoring',
    shutdown: 'shutting-down',
    fault: 'faulted',
  }),
  active: Object.freeze({
    'begin-save': 'saving',
    suspend: 'suspended',
    'begin-validation': 'validating',
    'complete-session': 'completed',
    shutdown: 'shutting-down',
    fault: 'faulted',
  }),
  saving: Object.freeze({
    'save-complete': 'active',
    suspend: 'suspended',
    fault: 'faulted',
  }),
  suspended: Object.freeze({
    resume: 'active',
    'begin-restore': 'restoring',
    shutdown: 'shutting-down',
    fault: 'faulted',
  }),
  restoring: Object.freeze({
    'restore-complete': 'active',
    fault: 'faulted',
  }),
  validating: Object.freeze({
    'validation-complete': 'active',
    fault: 'faulted',
  }),
  completed: Object.freeze({ shutdown: 'shutting-down', reset: 'uninitialized' }),
  'shutting-down': Object.freeze({ reset: 'uninitialized', fault: 'faulted' }),
  faulted: Object.freeze({ reset: 'uninitialized' }),
});

export class SessionLifecycleEngine {
  private state: PersistenceLifecycleState = 'uninitialized';
  private readonly history: PersistenceLifecycleTransition[] = [];
  private readonly listeners = new Set<(transition: PersistenceLifecycleTransition) => void>();

  public getState(): PersistenceLifecycleState {
    return this.state;
  }

  public can(event: PersistenceLifecycleEvent): boolean {
    return TRANSITIONS[this.state]?.[event] !== undefined;
  }

  public transition(
    event: PersistenceLifecycleEvent,
    at = new Date().toISOString(),
  ): PersistenceLifecycleTransition {
    const next = TRANSITIONS[this.state]?.[event];
    if (!next) {
      throw new Error(`Invalid persistence lifecycle transition: ${this.state} -> ${event}`);
    }
    const transition = Object.freeze({ from: this.state, event, to: next, at });
    this.state = next;
    this.history.push(transition);
    for (const listener of this.listeners) listener(transition);
    return transition;
  }

  public subscribe(listener: (transition: PersistenceLifecycleTransition) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public snapshot(): readonly PersistenceLifecycleTransition[] {
    return Object.freeze([...this.history]);
  }
}
