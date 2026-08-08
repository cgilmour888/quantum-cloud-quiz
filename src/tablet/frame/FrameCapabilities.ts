/**
 * Artifact ID: QCQ-TBL-052
 * Artifact Name: FrameCapabilities
 * Artifact Purpose: Frame rendering capability detection for CSS effects, SVG, WebGL, transparency, and motion.
 * Artifact Layer: QCQ-TBL — CAP
 * Artifact Dependencies: QCQ-TBL-049
 * Artifact Dependents: QCQ-TBL-051, QCQ-TBL-004
 * Dependency Graph: FrameManifest -> FrameCapabilities -> FramePolicyEngine -> BorderFrameEngine
 * Repository Path: QCQ/frontend/src/tablet/frame
 * Source File: FrameCapabilities.ts
 */

export interface FrameCapabilitiesSnapshot {
  readonly svg: boolean;
  readonly webgl2: boolean;
  readonly backdropFilter: boolean;
  readonly maskComposite: boolean;
  readonly colorMix: boolean;
  readonly reducedMotion: boolean;
  readonly forcedColors: boolean;
  readonly reducedTransparency: boolean;
}

function media(query: string): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(query).matches
  );
}

function supports(value: string): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports(value)
  );
}

function webgl2(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    return document.createElement('canvas').getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

export function detectFrameCapabilities(): FrameCapabilitiesSnapshot {
  return Object.freeze({
    svg: typeof SVGElement !== 'undefined',
    webgl2: webgl2(),
    backdropFilter: supports('backdrop-filter: blur(1px)'),
    maskComposite: supports('mask-composite: intersect'),
    colorMix: supports('color: color-mix(in srgb, red, blue)'),
    reducedMotion: media('(prefers-reduced-motion: reduce)'),
    forcedColors: media('(forced-colors: active)'),
    reducedTransparency: media('(prefers-reduced-transparency: reduce)'),
  });
}
