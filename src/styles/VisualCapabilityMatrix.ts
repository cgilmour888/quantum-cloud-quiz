/**
 * Artifact ID: QCQ-THM-013
 * Artifact Name: VisualCapabilityMatrix
 * Artifact Purpose: Evidence-aware capability authority for resolution fidelity, accessibility, performance, web-native rendering, and integration readiness.
 * Artifact Layer: Phase 9 — Visual Authority / CAP
 * Artifact Dependencies: QCQ-THM-010 ThemeManifest
 * Artifact Dependents: QCQ-THM-014, QCQ-THM-015, visual release gates
 * Dependency Graph: ThemeManifest + observed runtime evidence -> VisualCapabilityMatrix -> ThemeCertificationEngine/ThemeReadinessEvaluator
 * Repository Path: QCQ/frontend/src/styles
 * Source File: VisualCapabilityMatrix.ts
 */

import type { ThemeManifest } from './ThemeManifest';

export type VisualCapabilityId =
  | 'web-native-rendering'
  | 'phase9-integrated'
  | 'phase10-composition-integrated'
  | 'visual-fidelity-foundation-integrated'
  | 'master-4k-runtime'
  | 'master-8k-runtime'
  | 'master-12k-readiness'
  | 'forced-colors-runtime'
  | 'reduced-motion-runtime'
  | 'zoom-200-runtime'
  | 'keyboard-touch-stylus-runtime'
  | 'performance-budget'
  | 'long-duration-stability'
  | 'visual-regression'
  | 'no-raster-shortcuts';

export type VisualCapabilityStatus =
  | 'supported'
  | 'conditional'
  | 'blocked';

export interface VisualCapabilityEvidence {
  readonly phase9Integrated?: boolean;
  readonly phase10CompositionIntegrated?: boolean;
  readonly visualFidelityFoundationIntegrated?: boolean;
  readonly master4KBrowserPass?: boolean;
  readonly master8KBrowserPass?: boolean;
  readonly master12KBrowserPass?: boolean;
  readonly master4KRegressionPass?: boolean;
  readonly master8KRegressionPass?: boolean;
  readonly master12KRegressionPass?: boolean;
  readonly forcedColorsPass?: boolean;
  readonly reducedMotionPass?: boolean;
  readonly zoom200Pass?: boolean;
  readonly keyboardTouchStylusPass?: boolean;
  readonly performanceBudgetPass?: boolean;
  readonly longDurationStabilityPass?: boolean;
  readonly noRasterScanPass?: boolean;
}

export interface VisualCapabilityEntry {
  readonly id: VisualCapabilityId;
  readonly status: VisualCapabilityStatus;
  readonly declared: boolean;
  readonly evidenceRequired: boolean;
  readonly evidencePresent: boolean;
  readonly message: string;
}

export interface VisualCapabilityMatrix {
  readonly schemaVersion: '1.0.0';
  readonly themeId: string;
  readonly supportedCount: number;
  readonly conditionalCount: number;
  readonly blockedCount: number;
  readonly entries: readonly VisualCapabilityEntry[];
}

function observed(
  id: VisualCapabilityId,
  declared: boolean,
  evidence: boolean | undefined,
  message: string,
): VisualCapabilityEntry {
  const status: VisualCapabilityStatus = evidence === true
    ? 'supported'
    : evidence === false
      ? 'blocked'
      : 'conditional';
  return Object.freeze({
    id,
    status: declared ? status : 'blocked',
    declared,
    evidenceRequired: true,
    evidencePresent: evidence !== undefined,
    message: declared
      ? `${message} Runtime evidence=${evidence === undefined ? 'pending' : String(evidence)}.`
      : `${message} Capability is not declared by the theme contract.`,
  });
}

function structural(
  id: VisualCapabilityId,
  supported: boolean,
  message: string,
): VisualCapabilityEntry {
  return Object.freeze({
    id,
    status: supported ? 'supported' : 'blocked',
    declared: supported,
    evidenceRequired: false,
    evidencePresent: true,
    message,
  });
}

function combined(
  id: VisualCapabilityId,
  declared: boolean,
  evidenceValues: readonly (boolean | undefined)[],
  message: string,
): VisualCapabilityEntry {
  const present = evidenceValues.every((value) => value !== undefined);
  const failed = evidenceValues.some((value) => value === false);
  const passed = present && evidenceValues.every((value) => value === true);
  return Object.freeze({
    id,
    status: !declared || failed ? 'blocked' : passed ? 'supported' : 'conditional',
    declared,
    evidenceRequired: true,
    evidencePresent: present,
    message: `${message} Evidence=${present ? (passed ? 'pass' : 'fail') : 'pending'}.`,
  });
}

export function createVisualCapabilityMatrix(
  manifest: ThemeManifest,
  evidence: VisualCapabilityEvidence = {},
): VisualCapabilityMatrix {
  const entries: VisualCapabilityEntry[] = [
    structural(
      'web-native-rendering',
      manifest.compatibility.requiresRasterAssets === false,
      'Theme is declared independent of raster UI assets.',
    ),
    observed('phase9-integrated', true, evidence.phase9Integrated, 'Phase 9 visual authority integration.'),
    observed('phase10-composition-integrated', true, evidence.phase10CompositionIntegrated, 'Phase 10 master-composition integration.'),
    observed('visual-fidelity-foundation-integrated', true, evidence.visualFidelityFoundationIntegrated, 'QCQ-VIS visual-fidelity foundation integration.'),
    combined(
      'master-4k-runtime',
      manifest.compatibility.supports4K,
      [evidence.master4KBrowserPass, evidence.master4KRegressionPass],
      'MASTER 4K browser and regression validation.',
    ),
    combined(
      'master-8k-runtime',
      manifest.compatibility.supports8K,
      [evidence.master8KBrowserPass, evidence.master8KRegressionPass],
      'MASTER 8K browser and regression validation.',
    ),
    combined(
      'master-12k-readiness',
      manifest.compatibility.requiresRasterAssets === false,
      [evidence.master12KBrowserPass, evidence.master12KRegressionPass],
      'MASTER 12K readiness requires actual target-hardware rendering and regression evidence; Phase 9 does not fabricate 12K certification.',
    ),
    observed('forced-colors-runtime', manifest.compatibility.supportsForcedColors, evidence.forcedColorsPass, 'Forced-colors runtime validation.'),
    observed('reduced-motion-runtime', manifest.compatibility.supportsReducedMotion, evidence.reducedMotionPass, 'Reduced-motion runtime validation.'),
    observed('zoom-200-runtime', true, evidence.zoom200Pass, '200% zoom/reflow validation.'),
    observed('keyboard-touch-stylus-runtime', true, evidence.keyboardTouchStylusPass, 'Keyboard, touch, and stylus interaction validation.'),
    observed('performance-budget', true, evidence.performanceBudgetPass, 'Visual performance-budget validation.'),
    observed('long-duration-stability', true, evidence.longDurationStabilityPass, 'Long-duration animation/memory stability validation.'),
    combined(
      'visual-regression',
      true,
      [evidence.master4KRegressionPass, evidence.master8KRegressionPass],
      'Canonical structural visual-regression validation.',
    ),
    observed('no-raster-shortcuts', manifest.compatibility.requiresRasterAssets === false, evidence.noRasterScanPass, 'Repository no-raster/no-hotspot scan.'),
  ];

  const supportedCount = entries.filter((entry) => entry.status === 'supported').length;
  const conditionalCount = entries.filter((entry) => entry.status === 'conditional').length;
  const blockedCount = entries.filter((entry) => entry.status === 'blocked').length;

  return Object.freeze({
    schemaVersion: '1.0.0',
    themeId: manifest.id,
    supportedCount,
    conditionalCount,
    blockedCount,
    entries: Object.freeze(entries),
  });
}

export function getVisualCapability(
  matrix: VisualCapabilityMatrix,
  id: VisualCapabilityId,
): VisualCapabilityEntry {
  const entry = matrix.entries.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Visual capability ${id} is not registered.`);
  return entry;
}
