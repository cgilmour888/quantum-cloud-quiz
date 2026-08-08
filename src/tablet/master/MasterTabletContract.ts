/**
 * Artifact ID: QCQ-TBL-063
 * Artifact Name: MasterTabletContract
 * Artifact Purpose: Complete MASTER_4K/8K/12K tablet fidelity contract binding geometry, composition, interaction, frame, and accessibility invariants.
 * Artifact Layer: QCQ-TBL — CTR
 * Artifact Dependencies: QCQ-TBL-046, QCQ-TBL-047, QCQ-TBL-061, QCQ-TBL-062
 * Artifact Dependents: QCQ-TBL-064, QCQ-TBL-001
 * Dependency Graph: composition + MASTER manifest/registry -> MasterTabletContract -> capability/shell
 * Repository Path: QCQ/frontend/src/tablet/master
 * Source File: MasterTabletContract.ts
 */

import type {
  TabletCompositionResult,
} from '../composition/TabletComposition.types';
import {
  MASTER_TABLET_MANIFEST,
} from './MasterTabletManifest';
import {
  createMasterTabletRegistry,
} from './MasterTabletRegistry';

export interface MasterTabletContract {
  readonly version: '1.0.0';
  readonly referenceAspectRatio: number;
  readonly anchors: ReturnType<
    ReturnType<typeof createMasterTabletRegistry>['list']
  >;
  readonly minimumInteractiveTarget: 44;
  readonly supportedCanonicalWidths: readonly [3840, 7680, 11520];
  readonly invariants: readonly string[];
}

export const MASTER_TABLET_CONTRACT: MasterTabletContract =
  Object.freeze({
    version: '1.0.0',
    referenceAspectRatio:
      MASTER_TABLET_MANIFEST.referenceAspectRatio,
    anchors:
      createMasterTabletRegistry().list(),
    minimumInteractiveTarget: 44,
    supportedCanonicalWidths:
      Object.freeze([3840, 7680, 11_520] as const),
    invariants: Object.freeze([
      'MASTER references are calibration authority only.',
      'Tablet remains a real semantic component tree.',
      'Frame layers are pointer-transparent.',
      'Question and answer content remain selectable, focusable, and readable.',
      'Question overflow supports focus and stylus-hover expansion without bleeding outside tablet ownership.',
      'Answer overflow supports focus and stylus-hover expansion without changing answer semantics.',
      '4K, 8K, and 12K scale proportionally while rendering cost adapts independently.',
      'No raster implementation, hotspot overlay, or image-map interaction is permitted.',
    ]),
  });

export function certifyCompositionAgainstMaster(
  composition: TabletCompositionResult,
): readonly string[] {
  const failures: string[] = [];

  if (
    composition.answerRowMinimumHeight <
    MASTER_TABLET_CONTRACT.minimumInteractiveTarget
  ) {
    failures.push(
      'Answer target size falls below MASTER tablet accessibility contract.',
    );
  }

  if (
    composition.contentRect.width <= 0 ||
    composition.contentRect.height <= 0
  ) {
    failures.push(
      'Tablet content rectangle is invalid.',
    );
  }

  if (!composition.slots.question.visible) {
    failures.push(
      'Question region must remain visible.',
    );
  }

  if (!composition.slots.answers.visible) {
    failures.push(
      'Answers region must remain visible.',
    );
  }

  return Object.freeze(failures);
}
