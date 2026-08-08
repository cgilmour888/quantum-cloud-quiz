/**
 * Artifact ID: QCQ-PER-018
 * Artifact Name: SaveQueueManager
 * Repository Path: QCQ/frontend/src/persistence/SaveQueueManager.ts
 */

export interface SaveQueueSnapshot {
  readonly queued: number;
  readonly activeScopes: readonly string[];
  readonly completed: number;
  readonly failed: number;
}

export class SaveQueueManager {
  private readonly tails = new Map<string, Promise<void>>();
  private queued = 0;
  private completed = 0;
  private failed = 0;

  public enqueue<T>(scope: string, operation: () => Promise<T>): Promise<T> {
    if (scope.trim().length === 0) throw new Error('Save queue scope is required.');
    const previous = this.tails.get(scope) ?? Promise.resolve();
    this.queued += 1;

    let release: () => void = () => undefined;
    const marker = new Promise<void>((resolve) => {
      release = resolve;
    });
    const tail = previous.then(() => marker);
    this.tails.set(scope, tail);

    return previous
      .then(operation)
      .then(
        (value) => {
          this.completed += 1;
          return value;
        },
        (error: unknown) => {
          this.failed += 1;
          throw error;
        },
      )
      .finally(() => {
        this.queued -= 1;
        release();
        if (this.tails.get(scope) === tail) this.tails.delete(scope);
      });
  }

  public async drain(): Promise<void> {
    await Promise.all([...this.tails.values()]);
  }

  public snapshot(): SaveQueueSnapshot {
    return Object.freeze({
      queued: this.queued,
      activeScopes: Object.freeze([...this.tails.keys()].sort()),
      completed: this.completed,
      failed: this.failed,
    });
  }
}
