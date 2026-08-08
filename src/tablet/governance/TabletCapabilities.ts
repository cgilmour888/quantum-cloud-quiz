/**
 * Artifact ID: QCQ-TBL-045
 * Artifact Name: TabletCapabilities
 * Artifact Purpose: Tablet browser and device capability detection.
 * Artifact Layer: QCQ-TBL — CAP
 * Artifact Dependencies: QCQ-TBL-042
 * Artifact Dependents: QCQ-TBL-044, QCQ-TBL-051, QCQ-TBL-057, QCQ-TBL-059
 * Dependency Graph: TabletManifest -> TabletCapabilities -> policies/frame/validation/matrix
 * Repository Path: QCQ/frontend/src/tablet/governance
 * Source File: TabletCapabilities.ts
 */

import {
  type TabletResolutionClass,
} from './TabletManifest';

export interface TabletCapabilitiesSnapshot {
  readonly width: number;
  readonly height: number;
  readonly devicePixelRatio: number;
  readonly resolutionClass: TabletResolutionClass;
  readonly pointerFine: boolean;
  readonly pointerCoarse: boolean;
  readonly hover: boolean;
  readonly reducedMotion: boolean;
  readonly forcedColors: boolean;
  readonly highContrast: boolean;
  readonly webgl2: boolean;
  readonly svg: boolean;
  readonly resizeObserver: boolean;
  readonly visualViewport: boolean;
}

function media(query: string): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(query).matches
  );
}

function classify(width: number): TabletResolutionClass {
  if (width >= 11_520) return '12k';
  if (width >= 7_680) return '8k';
  if (width >= 3_840) return '4k';
  if (width >= 1_024) return 'desktop';
  return 'compact';
}

function hasWebGL2(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    return document.createElement('canvas').getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

export function detectTabletCapabilities(
  width =
    typeof window === 'undefined'
      ? 1280
      : window.innerWidth,
  height =
    typeof window === 'undefined'
      ? 720
      : window.innerHeight,
): TabletCapabilitiesSnapshot {
  return Object.freeze({
    width,
    height,
    devicePixelRatio:
      typeof window === 'undefined'
        ? 1
        : Math.max(1, window.devicePixelRatio || 1),
    resolutionClass: classify(width),
    pointerFine: media('(pointer: fine)'),
    pointerCoarse: media('(pointer: coarse)'),
    hover: media('(hover: hover)'),
    reducedMotion: media('(prefers-reduced-motion: reduce)'),
    forcedColors: media('(forced-colors: active)'),
    highContrast: media('(prefers-contrast: more)'),
    webgl2: hasWebGL2(),
    svg:
      typeof SVGElement !== 'undefined',
    resizeObserver:
      typeof ResizeObserver !== 'undefined',
    visualViewport:
      typeof window !== 'undefined' &&
      window.visualViewport !== null,
  });
}
