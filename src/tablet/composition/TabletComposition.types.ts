/**
 * Artifact ID: QCQ-TBL-047
 * Artifact Name: TabletCompositionContracts
 * Artifact Purpose: Immutable contracts for tablet-local composition, slot geometry, and responsive assembly.
 * Artifact Layer: QCQ-TBL — CTR
 * Artifact Dependencies: QCQ-TBL-042
 * Artifact Dependents: QCQ-TBL-046, QCQ-TBL-048, QCQ-TBL-057, QCQ-TBL-063
 * Dependency Graph: TabletManifest -> composition contracts -> composition/config/validation/master contract
 * Repository Path: QCQ/frontend/src/tablet/composition
 * Source File: TabletComposition.types.ts
 */

import type { TabletResolutionClass } from '../governance/TabletManifest';

export type TabletSlotId =
  | 'frame'
  | 'header'
  | 'question'
  | 'answers'
  | 'feedback'
  | 'footer';

export interface TabletRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface TabletSafeArea {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export interface TabletCompositionInput {
  readonly width: number;
  readonly height: number;
  readonly resolutionClass: TabletResolutionClass;
  readonly answerCount: number;
  readonly questionLength: number;
  readonly hasFeedback: boolean;
  readonly minimumInteractiveTarget: number;
  readonly safeArea: TabletSafeArea;
}

export interface TabletSlotPlacement {
  readonly slotId: TabletSlotId;
  readonly rect: TabletRect;
  readonly zIndex: number;
  readonly scrollable: boolean;
  readonly visible: boolean;
}

export interface TabletCompositionResult {
  readonly mode: 'compact' | 'standard' | 'cinematic';
  readonly contentRect: TabletRect;
  readonly slots: Readonly<Record<TabletSlotId, TabletSlotPlacement>>;
  readonly answerRowMinimumHeight: number;
  readonly questionMaximumHeight: number;
  readonly internalGap: number;
  readonly cssVariables: Readonly<Record<string, string>>;
  readonly warnings: readonly string[];
}
