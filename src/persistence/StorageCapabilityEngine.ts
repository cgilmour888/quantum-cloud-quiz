/**
 * Artifact ID: QCQ-PER-025
 * Artifact Name: StorageCapabilityEngine
 * Repository Path: QCQ/frontend/src/persistence/StorageCapabilityEngine.ts
 */

export interface StorageCapabilitySnapshot {
  readonly localStorageAvailable: boolean;
  readonly storageEstimateAvailable: boolean;
  readonly persistentStorageApiAvailable: boolean;
  readonly cryptoAvailable: boolean;
  readonly visibilityApiAvailable: boolean;
  readonly quotaBytes: number | null;
  readonly usageBytes: number | null;
  readonly persistenceGranted: boolean | null;
}

interface StorageManagerLike {
  estimate?(): Promise<{ readonly quota?: number; readonly usage?: number }>;
  persisted?(): Promise<boolean>;
}

export class StorageCapabilityEngine {
  public async discover(): Promise<StorageCapabilitySnapshot> {
    const navigatorValue = globalThis.navigator;
    const storage = navigatorValue?.storage as StorageManagerLike | undefined;
    let quotaBytes: number | null = null;
    let usageBytes: number | null = null;
    let persistenceGranted: boolean | null = null;

    if (storage?.estimate) {
      try {
        const estimate = await storage.estimate();
        quotaBytes = typeof estimate.quota === 'number' ? estimate.quota : null;
        usageBytes = typeof estimate.usage === 'number' ? estimate.usage : null;
      } catch {
        quotaBytes = null;
        usageBytes = null;
      }
    }
    if (storage?.persisted) {
      try {
        persistenceGranted = await storage.persisted();
      } catch {
        persistenceGranted = null;
      }
    }

    let localStorageAvailable = false;
    try {
      localStorageAvailable = typeof globalThis.localStorage !== 'undefined';
    } catch {
      localStorageAvailable = false;
    }

    return Object.freeze({
      localStorageAvailable,
      storageEstimateAvailable: typeof storage?.estimate === 'function',
      persistentStorageApiAvailable: typeof storage?.persisted === 'function',
      cryptoAvailable: typeof globalThis.crypto?.subtle !== 'undefined',
      visibilityApiAvailable: typeof globalThis.document?.hidden === 'boolean',
      quotaBytes,
      usageBytes,
      persistenceGranted,
    });
  }
}
