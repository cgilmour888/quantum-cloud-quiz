/**
 * Artifact ID: QCQ-TBL-057
 * Artifact Name: TabletValidationEngine
 * Artifact Purpose: Structural and runtime tablet validation authority covering registrations, dependency integrity, composition, interaction, and minimum target sizing.
 * Artifact Layer: QCQ-TBL — VAL
 * Artifact Dependencies: QCQ-TBL-042, QCQ-TBL-043, QCQ-TBL-046, QCQ-TBL-050, QCQ-TBL-054
 * Artifact Dependents: QCQ-TBL-058, QCQ-TBL-060, QCQ-TBL-064
 * Dependency Graph: tablet/frame/interaction registries + composition -> TabletValidationEngine -> readiness/compliance/master
 * Repository Path: QCQ/frontend/src/tablet/validation
 * Source File: TabletValidationEngine.ts
 */

import {
  TABLET_MANIFEST,
} from '../governance/TabletManifest';
import type {
  TabletRegistry,
} from '../governance/TabletRegistry';
import type {
  TabletCompositionResult,
} from '../composition/TabletComposition.types';
import type {
  FrameRegistry,
} from '../frame/FrameRegistry';
import type {
  InteractionRegistry,
} from '../interaction/InteractionRegistry';

export interface TabletValidationIssue {
  readonly code:
    | 'registry-unsealed'
    | 'missing-required-module'
    | 'missing-frame-layer'
    | 'missing-interaction'
    | 'target-size'
    | 'composition-overflow';
  readonly severity: 'error' | 'warning';
  readonly message: string;
}

export interface TabletValidationResult {
  readonly valid: boolean;
  readonly checkedAt: number;
  readonly issues: readonly TabletValidationIssue[];
}

export function validateTablet(
  tabletRegistry: TabletRegistry,
  frameRegistry: FrameRegistry,
  interactionRegistry: InteractionRegistry,
  composition: TabletCompositionResult,
): TabletValidationResult {
  const issues: TabletValidationIssue[] = [];

  if (!tabletRegistry.sealed) {
    issues.push({
      code: 'registry-unsealed',
      severity: 'error',
      message: 'TabletRegistry must be sealed before validation.',
    });
  }

  for (const descriptor of tabletRegistry.list()) {
    if (!descriptor.required) continue;
    for (const dependency of descriptor.dependencies) {
      if (!tabletRegistry.has(dependency)) {
        issues.push({
          code: 'missing-required-module',
          severity: 'error',
          message:
            `Required tablet dependency "${dependency}" for "${descriptor.id}" is not registered.`,
        });
      }
    }
  }

  const requiredFrameLayers = frameRegistry
    .list()
    .filter((layer) => layer.required);
  if (requiredFrameLayers.length < 3) {
    issues.push({
      code: 'missing-frame-layer',
      severity: 'error',
      message: 'Required structural frame layers are incomplete.',
    });
  }

  if (
    interactionRegistry.size <
    4
  ) {
    issues.push({
      code: 'missing-interaction',
      severity: 'error',
      message: 'Core interaction actions are incomplete.',
    });
  }

  if (
    composition.answerRowMinimumHeight <
    TABLET_MANIFEST.minimumInteractiveTargetCssPixels
  ) {
    issues.push({
      code: 'target-size',
      severity: 'error',
      message:
        'Composed answer rows fall below the constitutional minimum target size.',
    });
  }

  if (
    composition.contentRect.width <= 0 ||
    composition.contentRect.height <= 0
  ) {
    issues.push({
      code: 'composition-overflow',
      severity: 'error',
      message: 'Tablet composition has no usable content area.',
    });
  }

  return Object.freeze({
    valid:
      !issues.some(
        (issue) => issue.severity === 'error',
      ),
    checkedAt: Date.now(),
    issues: Object.freeze(
      issues.map((issue) => Object.freeze(issue)),
    ),
  });
}
