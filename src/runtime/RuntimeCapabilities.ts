export interface RuntimeCapabilities {
  readonly browser: {
    readonly secureContext: boolean;
    readonly visibilityApi: boolean;
    readonly historyApi: boolean;
    readonly resizeObserver: boolean;
    readonly intersectionObserver: boolean;
    readonly performanceObserver: boolean;
    readonly broadcastChannel: boolean;
  };
  readonly storage: {
    readonly localStorage: boolean;
    readonly sessionStorage: boolean;
    readonly indexedDb: boolean;
    readonly cacheStorage: boolean;
  };
  readonly connectivity: {
    readonly online: boolean;
    readonly serviceWorker: boolean;
  };
  readonly preferences: {
    readonly reducedMotion: boolean;
    readonly forcedColors: boolean;
    readonly highContrast: boolean;
    readonly darkMode: boolean;
  };
}

function media(query: string): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(query).matches
  );
}

function storageAvailable(
  storage: Storage | undefined,
): boolean {
  if (storage === undefined) return false;

  const key = '__qcq_runtime_probe__';

  try {
    storage.setItem(key, key);
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function detectRuntimeCapabilities():
  RuntimeCapabilities {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof navigator === 'undefined'
  ) {
    return Object.freeze({
      browser: Object.freeze({
        secureContext: false,
        visibilityApi: false,
        historyApi: false,
        resizeObserver: false,
        intersectionObserver: false,
        performanceObserver: false,
        broadcastChannel: false,
      }),
      storage: Object.freeze({
        localStorage: false,
        sessionStorage: false,
        indexedDb: false,
        cacheStorage: false,
      }),
      connectivity: Object.freeze({
        online: true,
        serviceWorker: false,
      }),
      preferences: Object.freeze({
        reducedMotion: false,
        forcedColors: false,
        highContrast: false,
        darkMode: true,
      }),
    });
  }

  return Object.freeze({
    browser: Object.freeze({
      secureContext: window.isSecureContext,
      visibilityApi:
        'visibilityState' in document,
      historyApi:
        typeof history.pushState === 'function',
      resizeObserver:
        typeof ResizeObserver !== 'undefined',
      intersectionObserver:
        typeof IntersectionObserver !== 'undefined',
      performanceObserver:
        typeof PerformanceObserver !== 'undefined',
      broadcastChannel:
        typeof BroadcastChannel !== 'undefined',
    }),
    storage: Object.freeze({
      localStorage: (() => {
        try {
          return storageAvailable(window.localStorage);
        } catch {
          return false;
        }
      })(),
      sessionStorage: (() => {
        try {
          return storageAvailable(window.sessionStorage);
        } catch {
          return false;
        }
      })(),
      indexedDb:
        typeof indexedDB !== 'undefined',
      cacheStorage:
        'caches' in globalThis,
    }),
    connectivity: Object.freeze({
      online: navigator.onLine,
      serviceWorker:
        'serviceWorker' in navigator,
    }),
    preferences: Object.freeze({
      reducedMotion:
        media('(prefers-reduced-motion: reduce)'),
      forcedColors:
        media('(forced-colors: active)'),
      highContrast:
        media('(prefers-contrast: more)'),
      darkMode:
        media('(prefers-color-scheme: dark)'),
    }),
  });
}
