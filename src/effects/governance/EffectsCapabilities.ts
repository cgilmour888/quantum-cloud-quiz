/**
 * Artifact ID: QCQ-TBL-068
 * Artifact Name: EffectsCapabilities
 * Artifact Purpose: Browser, device, rendering, accessibility, and power-capability detection for safe effect selection.
 * Artifact Layer: Premium Effects / CAP
 * Artifact Dependencies: None
 * Artifact Dependents: QCQ-TBL-067, QCQ-TBL-069, QCQ-TBL-072, QCQ-TBL-073, QCQ-TBL-077
 * Dependency Graph: browser/device signals -> EffectsCapabilities -> policy/performance/quality/readiness
 * Repository Path: QCQ/frontend/src/effects/governance
 * Source File: EffectsCapabilities.ts
 */

export interface EffectsCapabilitySnapshot {
  readonly timestamp: number;
  readonly browser: boolean;
  readonly canvas2D: boolean;
  readonly svg: boolean;
  readonly cssFilters: boolean;
  readonly cssBackdropFilter: boolean;
  readonly cssMixBlendMode: boolean;
  readonly webgl: boolean;
  readonly webgl2: boolean;
  readonly offscreenCanvas: boolean;
  readonly requestAnimationFrame: boolean;
  readonly resizeObserver: boolean;
  readonly intersectionObserver: boolean;
  readonly prefersReducedMotion: boolean;
  readonly forcedColors: boolean;
  readonly saveData: boolean;
  readonly hardwareConcurrency: number;
  readonly deviceMemoryGB: number | null;
  readonly devicePixelRatio: number;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly documentVisible: boolean;
  readonly coarsePointer: boolean;
  readonly hoverCapable: boolean;
}

function media(query: string): boolean {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(query).matches;
}

function supportsCss(property: string, value: string): boolean {
  return typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports(property, value);
}

function detectCanvasContext(kind: '2d' | 'webgl' | 'webgl2'): boolean {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  try {
    return canvas.getContext(kind) !== null;
  } catch {
    return false;
  }
}

function numericNavigatorProperty(name: string): number | null {
  if (typeof navigator === 'undefined') return null;
  const raw = (navigator as unknown as Record<string, unknown>)[name];
  return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : null;
}

function booleanNavigatorProperty(name: string): boolean {
  if (typeof navigator === 'undefined') return false;
  const connection = (navigator as unknown as {
    readonly connection?: { readonly saveData?: boolean };
  }).connection;
  return name === 'saveData' ? connection?.saveData === true : false;
}

export function detectEffectsCapabilities(): EffectsCapabilitySnapshot {
  const browser = typeof window !== 'undefined' && typeof document !== 'undefined';
  const width = browser ? Math.max(0, window.innerWidth) : 0;
  const height = browser ? Math.max(0, window.innerHeight) : 0;
  const concurrency = numericNavigatorProperty('hardwareConcurrency') ??
    (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 1) ??
    1;

  return Object.freeze({
    timestamp: Date.now(),
    browser,
    canvas2D: detectCanvasContext('2d'),
    svg: typeof SVGElement !== 'undefined',
    cssFilters: supportsCss('filter', 'blur(2px)'),
    cssBackdropFilter: supportsCss('backdrop-filter', 'blur(2px)') ||
      supportsCss('-webkit-backdrop-filter', 'blur(2px)'),
    cssMixBlendMode: supportsCss('mix-blend-mode', 'screen'),
    webgl: detectCanvasContext('webgl'),
    webgl2: detectCanvasContext('webgl2'),
    offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
    requestAnimationFrame: typeof requestAnimationFrame === 'function',
    resizeObserver: typeof ResizeObserver !== 'undefined',
    intersectionObserver: typeof IntersectionObserver !== 'undefined',
    prefersReducedMotion: media('(prefers-reduced-motion: reduce)'),
    forcedColors: media('(forced-colors: active)'),
    saveData: booleanNavigatorProperty('saveData'),
    hardwareConcurrency: Math.max(1, Math.floor(concurrency)),
    deviceMemoryGB: numericNavigatorProperty('deviceMemory'),
    devicePixelRatio: browser ? Math.max(1, window.devicePixelRatio || 1) : 1,
    viewportWidth: width,
    viewportHeight: height,
    documentVisible: typeof document === 'undefined' ? true : document.visibilityState !== 'hidden',
    coarsePointer: media('(pointer: coarse)'),
    hoverCapable: media('(hover: hover)'),
  });
}

export function capabilitySignature(
  snapshot: EffectsCapabilitySnapshot,
): string {
  return [
    snapshot.canvas2D ? 'c2d' : 'noc2d',
    snapshot.svg ? 'svg' : 'nosvg',
    snapshot.webgl2 ? 'gl2' : snapshot.webgl ? 'gl1' : 'nogl',
    snapshot.prefersReducedMotion ? 'rm' : 'fm',
    snapshot.forcedColors ? 'fc' : 'std',
    snapshot.saveData ? 'sd' : 'nsd',
    `cpu${snapshot.hardwareConcurrency}`,
    `dpr${snapshot.devicePixelRatio.toFixed(2)}`,
    `${snapshot.viewportWidth}x${snapshot.viewportHeight}`,
  ].join(':');
}
