export type RenderingColorGamut =
  | 'srgb'
  | 'p3'
  | 'rec2020'
  | 'unknown';

export interface RenderingCapabilities {
  readonly webgl2: boolean;
  readonly offscreenCanvas: boolean;
  readonly cssBackdropFilter: boolean;
  readonly cssContainerQueries: boolean;
  readonly cssColorMix: boolean;
  readonly colorGamut: RenderingColorGamut;
  readonly devicePixelRatio: number;
  readonly hardwareConcurrency: number;
  readonly deviceMemoryGigabytes: number | null;
  readonly reducedMotion: boolean;
  readonly reducedTransparency: boolean;
  readonly forcedColors: boolean;
}

function media(query: string): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(query).matches
  );
}

function supportsCss(
  declaration: string,
): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports(declaration)
  );
}

function detectWebGL2(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  try {
    const canvas =
      document.createElement('canvas');
    return canvas.getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

function detectColorGamut():
  RenderingColorGamut {
  if (media('(color-gamut: rec2020)')) {
    return 'rec2020';
  }
  if (media('(color-gamut: p3)')) {
    return 'p3';
  }
  if (media('(color-gamut: srgb)')) {
    return 'srgb';
  }
  return 'unknown';
}

export function detectRenderingCapabilities():
  RenderingCapabilities {
  if (
    typeof window === 'undefined' ||
    typeof navigator === 'undefined'
  ) {
    return Object.freeze({
      webgl2: false,
      offscreenCanvas: false,
      cssBackdropFilter: false,
      cssContainerQueries: false,
      cssColorMix: false,
      colorGamut: 'unknown',
      devicePixelRatio: 1,
      hardwareConcurrency: 1,
      deviceMemoryGigabytes: null,
      reducedMotion: false,
      reducedTransparency: false,
      forcedColors: false,
    });
  }

  const memoryNavigator =
    navigator as Navigator & {
      readonly deviceMemory?: number;
    };

  return Object.freeze({
    webgl2: detectWebGL2(),
    offscreenCanvas:
      typeof OffscreenCanvas !== 'undefined',
    cssBackdropFilter:
      supportsCss(
        'backdrop-filter: blur(1px)',
      ),
    cssContainerQueries:
      supportsCss(
        'container-type: inline-size',
      ),
    cssColorMix:
      supportsCss(
        'color: color-mix(in srgb, red, blue)',
      ),
    colorGamut: detectColorGamut(),
    devicePixelRatio:
      Math.max(
        1,
        window.devicePixelRatio || 1,
      ),
    hardwareConcurrency:
      Math.max(
        1,
        navigator.hardwareConcurrency || 1,
      ),
    deviceMemoryGigabytes:
      typeof memoryNavigator.deviceMemory ===
      'number'
        ? memoryNavigator.deviceMemory
        : null,
    reducedMotion:
      media('(prefers-reduced-motion: reduce)'),
    reducedTransparency:
      media(
        '(prefers-reduced-transparency: reduce)',
      ),
    forcedColors:
      media('(forced-colors: active)'),
  });
}
