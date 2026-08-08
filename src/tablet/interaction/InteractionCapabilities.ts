/**
 * Artifact ID: QCQ-TBL-056
 * Artifact Name: InteractionCapabilities
 * Artifact Purpose: Input modality capability detection for keyboard, pointer, touch, hover, and stylus-oriented interaction policy.
 * Artifact Layer: QCQ-TBL — CAP
 * Artifact Dependencies: QCQ-TBL-053
 * Artifact Dependents: QCQ-TBL-055, QCQ-TBL-010
 * Dependency Graph: InteractionManifest -> InteractionCapabilities -> InteractionPolicies -> QuestionTablet
 * Repository Path: QCQ/frontend/src/tablet/interaction
 * Source File: InteractionCapabilities.ts
 */

export interface InteractionCapabilitiesSnapshot {
  readonly keyboard: boolean;
  readonly finePointer: boolean;
  readonly coarsePointer: boolean;
  readonly hover: boolean;
  readonly touchPoints: number;
  readonly stylusHoverPossible: boolean;
  readonly reducedMotion: boolean;
}

function media(query: string): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(query).matches
  );
}

export function detectInteractionCapabilities():
  InteractionCapabilitiesSnapshot {
  const finePointer = media('(pointer: fine)');
  const coarsePointer = media('(pointer: coarse)');

  return Object.freeze({
    keyboard: true,
    finePointer,
    coarsePointer,
    hover: media('(hover: hover)'),
    touchPoints:
      typeof navigator === 'undefined'
        ? 0
        : Math.max(0, navigator.maxTouchPoints || 0),
    stylusHoverPossible:
      finePointer && media('(hover: hover)'),
    reducedMotion:
      media('(prefers-reduced-motion: reduce)'),
  });
}
