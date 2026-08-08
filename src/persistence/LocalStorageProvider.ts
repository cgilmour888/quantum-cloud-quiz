/**
 * Artifact ID: QCQ-PER-009
 * Artifact Name: LocalStorageProvider
 * Repository Path: QCQ/frontend/src/persistence/LocalStorageProvider.ts
 */

import {
  MAX_STORAGE_UTILIZATION_RATIO,
  STAGING_KEY_PREFIX,
  stagingStorageKey,
} from './PersistenceConstants';
import type { PersistenceStorageProvider } from './PersistenceTypes';
import { PersistenceError } from './PersistenceTypes';

interface StorageEstimate {
  readonly quota?: number;
  readonly usage?: number;
}

interface StorageManagerLike {
  estimate(): Promise<StorageEstimate>;
}

function storageManager(): StorageManagerLike | null {
  const candidate = globalThis.navigator?.storage as StorageManagerLike | undefined;
  return candidate ?? null;
}

function rejectionError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(
    'A local storage operation failed with a non-Error value.',
    { cause: error },
  );
}

export class LocalStorageProvider implements PersistenceStorageProvider {
  public readonly providerId = 'qcq-local-storage-v1';
  private readonly locks = new Map<string, Promise<void>>();

  public constructor(private readonly storage: Storage) {}

  public getItem(key: string): Promise<string | null> {
    try {
      const stagingKey = stagingStorageKey(key);
      const staged = this.storage.getItem(stagingKey);
      const primary = this.storage.getItem(key);

      if (staged !== null && primary === null) {
        this.storage.setItem(key, staged);
        this.storage.removeItem(stagingKey);

        return Promise.resolve(staged);
      }

      if (staged !== null && primary !== null) {
        this.storage.removeItem(stagingKey);
      }

      return Promise.resolve(primary);
    } catch (error) {
      return Promise.reject(
        rejectionError(error),
      );
    }
  }

  public async setItem(key: string, value: string): Promise<void> {
    await this.assertCapacity(value);
    const stagingKey = stagingStorageKey(key);
    try {
      this.storage.setItem(stagingKey, value);
      this.storage.setItem(key, value);
      this.storage.removeItem(stagingKey);
    } catch (error) {
      throw new PersistenceError(
        `Unable to write persistence key ${key}.`,
        'PERSISTENCE_STORAGE_WRITE_FAILED',
        error,
      );
    }
  }

  public removeItem(key: string): Promise<void> {
    try {
      this.storage.removeItem(key);
      this.storage.removeItem(stagingStorageKey(key));

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(
        new PersistenceError(
          `Unable to remove persistence key ${key}.`,
          'PERSISTENCE_STORAGE_REMOVE_FAILED',
          error,
        ),
      );
    }
  }

  public listKeys(prefix: string): Promise<readonly string[]> {
    try {
      const keys: string[] = [];

      for (
        let index = 0;
        index < this.storage.length;
        index += 1
      ) {
        const key = this.storage.key(index);

        if (
          key !== null &&
          key.startsWith(prefix) &&
          !key.startsWith(STAGING_KEY_PREFIX)
        ) {
          keys.push(key);
        }
      }

      return Promise.resolve(
        Object.freeze(keys.sort()),
      );
    } catch (error) {
      return Promise.reject(
        rejectionError(error),
      );
    }
  }

  public async runExclusive<T>(
    scope: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const previous = this.locks.get(scope) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const queued = previous.then(() => current);
    this.locks.set(scope, queued);

    await previous;
    try {
      return await operation();
    } finally {
      release();
      if (this.locks.get(scope) === queued) {
        this.locks.delete(scope);
      }
    }
  }

  private async assertCapacity(value: string): Promise<void> {
    const manager = storageManager();
    if (!manager) return;
    const estimate = await manager.estimate();
    if (
      estimate.quota === undefined ||
      estimate.usage === undefined ||
      estimate.quota <= 0
    ) {
      return;
    }

    const nextUsage = estimate.usage + new TextEncoder().encode(value).byteLength;
    if (nextUsage / estimate.quota > MAX_STORAGE_UTILIZATION_RATIO) {
      throw new PersistenceError(
        'The persistence write would exceed the configured storage-utilization ceiling.',
        'PERSISTENCE_STORAGE_CAPACITY_LIMIT',
      );
    }
  }
}

export function createBrowserLocalStorageProvider(): LocalStorageProvider {
  if (typeof globalThis.localStorage === 'undefined') {
    throw new PersistenceError(
      'Browser localStorage is unavailable.',
      'PERSISTENCE_STORAGE_UNAVAILABLE',
    );
  }
  return new LocalStorageProvider(globalThis.localStorage);
}
