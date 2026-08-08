import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

function createMediaQueryList(
  query: string,
): MediaQueryList {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => true,
  };
}

if (
  typeof window !== 'undefined' &&
  typeof window.matchMedia !== 'function'
) {
  Object.defineProperty(
    window,
    'matchMedia',
    {
      configurable: true,
      writable: true,
      value: (
        query: string,
      ): MediaQueryList =>
        createMediaQueryList(query),
    },
  );
}
