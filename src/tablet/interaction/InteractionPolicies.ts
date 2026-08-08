/**
 * Artifact ID: QCQ-TBL-055
 * Artifact Name: InteractionPolicies
 * Artifact Purpose: Keyboard, pointer, stylus, focus, hover-expansion, and submission policy authority.
 * Artifact Layer: QCQ-TBL — POL
 * Artifact Dependencies: QCQ-TBL-053, QCQ-TBL-056
 * Artifact Dependents: QCQ-TBL-010, QCQ-TBL-057
 * Dependency Graph: interaction manifest + capabilities -> InteractionPolicies -> QuestionTablet/validation
 * Repository Path: QCQ/frontend/src/tablet/interaction
 * Source File: InteractionPolicies.ts
 */

import type {
  InteractionCapabilitiesSnapshot,
} from './InteractionCapabilities';

export interface InteractionPolicy {
  readonly minimumTargetCssPixels: number;
  readonly allowQuestionHoverExpansion: boolean;
  readonly allowAnswerHoverExpansion: boolean;
  readonly focusExpansion: boolean;
  readonly submitOnAnswerSelection: boolean;
  readonly preserveSelectionUntilSubmission: boolean;
  readonly announceValidationResult: boolean;
}

export function resolveInteractionPolicy(
  capabilities: InteractionCapabilitiesSnapshot,
): InteractionPolicy {
  return Object.freeze({
    minimumTargetCssPixels:
      capabilities.coarsePointer ? 48 : 44,
    allowQuestionHoverExpansion:
      capabilities.hover &&
      capabilities.stylusHoverPossible,
    allowAnswerHoverExpansion:
      capabilities.hover &&
      capabilities.stylusHoverPossible,
    focusExpansion: true,
    submitOnAnswerSelection: false,
    preserveSelectionUntilSubmission: true,
    announceValidationResult: true,
  });
}
