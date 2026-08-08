/**
 * Artifact ID: QCQ-THM-014
 * Artifact Name: ThemeCertificationEngine
 * Artifact Purpose: Evidence-bound, deterministic certification authority for Phase 9 visual compliance and MASTER fidelity claims.
 * Artifact Layer: Phase 9 — Visual Authority / CRT
 * Artifact Dependencies: QCQ-THM-012, QCQ-THM-013
 * Artifact Dependents: QCQ-THM-015, release certification evidence
 * Dependency Graph: VisualComplianceReport + VisualCapabilityMatrix + audit evidence -> ThemeCertificationEngine -> ThemeReadinessEvaluator/release evidence
 * Repository Path: QCQ/frontend/src/styles
 * Source File: ThemeCertificationEngine.ts
 */

import type { VisualComplianceReport } from './VisualComplianceValidator';
import {
  getVisualCapability,
  type VisualCapabilityId,
  type VisualCapabilityMatrix,
} from './VisualCapabilityMatrix';

export type ThemeCertificationLevel =
  | 'none'
  | 'platinum'
  | 'platinum-plus'
  | 'master-4k-certified'
  | 'master-8k-certified'
  | 'master-12k-ready'
  | 'enterprise-visual-ready'
  | 'government-visual-ready';

export interface ThemeCertificationEvidence {
  readonly repositoryRevision: string | null;
  readonly sourceHashSetId: string | null;
  readonly buildId: string | null;
  readonly visualRegressionReportId: string | null;
  readonly accessibilityAuditId: string | null;
  readonly performanceAuditId: string | null;
  readonly browserMatrixId: string | null;
  readonly capturedAtIso: string | null;
}

export interface ThemeCertificationResult {
  readonly schemaVersion: '1.0.0';
  readonly certified: boolean;
  readonly level: ThemeCertificationLevel;
  readonly certificateId: string | null;
  readonly evidenceDigest: string;
  readonly missingEvidence: readonly string[];
  readonly blockingReasons: readonly string[];
  readonly assertions: readonly string[];
  readonly scope: 'visual-theme-only';
}

const LEVEL_REQUIREMENTS: Readonly<
  Record<Exclude<ThemeCertificationLevel, 'none'>, readonly VisualCapabilityId[]>
> = Object.freeze({
  platinum: Object.freeze([
    'web-native-rendering',
    'no-raster-shortcuts',
  ] as const),
  'platinum-plus': Object.freeze([
    'web-native-rendering',
    'phase9-integrated',
    'reduced-motion-runtime',
    'forced-colors-runtime',
    'no-raster-shortcuts',
  ] as const),
  'master-4k-certified': Object.freeze([
    'master-4k-runtime',
    'visual-regression',
    'no-raster-shortcuts',
  ] as const),
  'master-8k-certified': Object.freeze([
    'master-4k-runtime',
    'master-8k-runtime',
    'visual-regression',
    'no-raster-shortcuts',
  ] as const),
  'master-12k-ready': Object.freeze([
    'master-4k-runtime',
    'master-8k-runtime',
    'master-12k-readiness',
    'performance-budget',
    'no-raster-shortcuts',
  ] as const),
  'enterprise-visual-ready': Object.freeze([
    'phase9-integrated',
    'phase10-composition-integrated',
    'visual-fidelity-foundation-integrated',
    'master-4k-runtime',
    'forced-colors-runtime',
    'reduced-motion-runtime',
    'zoom-200-runtime',
    'keyboard-touch-stylus-runtime',
    'performance-budget',
    'long-duration-stability',
    'no-raster-shortcuts',
  ] as const),
  'government-visual-ready': Object.freeze([
    'phase9-integrated',
    'phase10-composition-integrated',
    'visual-fidelity-foundation-integrated',
    'master-4k-runtime',
    'master-8k-runtime',
    'forced-colors-runtime',
    'reduced-motion-runtime',
    'zoom-200-runtime',
    'keyboard-touch-stylus-runtime',
    'performance-budget',
    'long-duration-stability',
    'visual-regression',
    'no-raster-shortcuts',
  ] as const),
});

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function normalizedEvidence(
  evidence: ThemeCertificationEvidence,
): readonly [string, string][] {
  const normalized: [string, string][] = [
    ['repositoryRevision', evidence.repositoryRevision ?? ''],
    ['sourceHashSetId', evidence.sourceHashSetId ?? ''],
    ['buildId', evidence.buildId ?? ''],
    [
      'visualRegressionReportId',
      evidence.visualRegressionReportId ?? '',
    ],
    [
      'accessibilityAuditId',
      evidence.accessibilityAuditId ?? '',
    ],
    [
      'performanceAuditId',
      evidence.performanceAuditId ?? '',
    ],
    ['browserMatrixId', evidence.browserMatrixId ?? ''],
    ['capturedAtIso', evidence.capturedAtIso ?? ''],
  ];

  return Object.freeze(
    normalized.sort(
      ([left], [right]) => left.localeCompare(right),
    ),
  );
}

function missingCertificationEvidence(
  evidence: ThemeCertificationEvidence,
): readonly string[] {
  return Object.freeze(
    normalizedEvidence(evidence)
      .filter(([, value]) => value.trim().length === 0)
      .map(([key]) => key)
      .sort(),
  );
}

function requirementsPass(
  matrix: VisualCapabilityMatrix,
  requirements: readonly VisualCapabilityId[],
): boolean {
  return requirements.every(
    (id) => getVisualCapability(matrix, id).status === 'supported',
  );
}

const LEVEL_ORDER: readonly Exclude<ThemeCertificationLevel, 'none'>[] =
  Object.freeze([
    'platinum',
    'platinum-plus',
    'master-4k-certified',
    'master-8k-certified',
    'master-12k-ready',
    'enterprise-visual-ready',
    'government-visual-ready',
  ]);

export function certifyTheme(
  compliance: VisualComplianceReport,
  capabilities: VisualCapabilityMatrix,
  evidence: ThemeCertificationEvidence,
): ThemeCertificationResult {
  const missingEvidence = missingCertificationEvidence(evidence);
  const blockingReasons: string[] = [];

  if (!compliance.compliant) {
    blockingReasons.push('Visual compliance report is not passing.');
  }
  if (capabilities.blockedCount > 0) {
    blockingReasons.push(
      `Visual capability matrix contains ${capabilities.blockedCount} blocked capabilities.`,
    );
  }

  let level: ThemeCertificationLevel = 'none';
  if (compliance.compliant) {
    for (const candidate of LEVEL_ORDER) {
      if (requirementsPass(capabilities, LEVEL_REQUIREMENTS[candidate])) {
        level = candidate;
      }
    }
  }

  const evidenceString = JSON.stringify({
    themeId: capabilities.themeId,
    compliance: compliance.status,
    level,
    evidence: normalizedEvidence(evidence),
    capabilities: capabilities.entries.map((entry) => [entry.id, entry.status]),
  });
  const evidenceDigest = fnv1a(evidenceString);

  const requiresCompleteExternalEvidence =
    level === 'master-4k-certified' ||
    level === 'master-8k-certified' ||
    level === 'master-12k-ready' ||
    level === 'enterprise-visual-ready' ||
    level === 'government-visual-ready';

  if (requiresCompleteExternalEvidence && missingEvidence.length > 0) {
    blockingReasons.push(
      `Certification level ${level} requires complete external evidence; missing ${missingEvidence.join(', ')}.`,
    );
  }

  const certified = level !== 'none' && blockingReasons.length === 0;
  const certificateId = certified
    ? `QCQ-THM-CERT-${level.toUpperCase()}-${evidenceDigest}`
    : null;

  const assertions = Object.freeze([
    `Scope is visual-theme-only; this certificate never certifies deployment, security, content accuracy, or gameplay correctness.`,
    `Theme ${compliance.themeId}@${compliance.themeVersion} compliance=${compliance.status}.`,
    `Capability supported=${capabilities.supportedCount}, conditional=${capabilities.conditionalCount}, blocked=${capabilities.blockedCount}.`,
    `Certification level=${level}.`,
    `Evidence digest=${evidenceDigest}.`,
  ]);

  return Object.freeze({
    schemaVersion: '1.0.0',
    certified,
    level,
    certificateId,
    evidenceDigest,
    missingEvidence,
    blockingReasons: Object.freeze(blockingReasons),
    assertions,
    scope: 'visual-theme-only',
  });
}
