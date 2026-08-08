/**
 * Artifact ID: QCQ-THM-012
 * Artifact Name: VisualComplianceValidator
 * Artifact Purpose: Deterministic validation of Phase 9 manifest integrity, CSS-variable governance, accessibility safeguards, ownership policy, and web-native visual requirements.
 * Artifact Layer: Phase 9 — Visual Authority / CMP
 * Artifact Dependencies: QCQ-THM-010, QCQ-THM-011
 * Artifact Dependents: QCQ-THM-014, QCQ-THM-015, release/integration quality gates
 * Dependency Graph: ThemeManifest + VisualPolicyReport -> VisualComplianceValidator -> ThemeCertificationEngine/ThemeReadinessEvaluator
 * Repository Path: QCQ/frontend/src/styles
 * Source File: VisualComplianceValidator.ts
 */

import type { ThemeManifest } from './ThemeManifest';
import type { VisualPolicyReport } from './VisualPolicyEngine';

export type VisualComplianceSeverity =
  | 'constitutional'
  | 'error'
  | 'warning';

export interface VisualComplianceFinding {
  readonly code: string;
  readonly severity: VisualComplianceSeverity;
  readonly passed: boolean;
  readonly message: string;
}

export interface VisualComplianceOptions {
  readonly minimumCssVariableCount?: number;
  readonly requiredArtifactIds?: readonly string[];
  readonly requireAccessibilityMediaRules?: boolean;
  readonly require4K?: boolean;
  readonly require8K?: boolean;
}

export interface VisualComplianceReport {
  readonly schemaVersion: '1.0.0';
  readonly status: 'pass' | 'conditional' | 'fail';
  readonly compliant: boolean;
  readonly themeId: string;
  readonly themeVersion: string;
  readonly cssVariableCount: number;
  readonly constitutionalViolationCount: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly findings: readonly VisualComplianceFinding[];
}

export const PHASE9_REQUIRED_ARTIFACT_IDS = Object.freeze([
  'QCQ-TBL-036',
  'QCQ-TBL-037',
  'QCQ-TBL-038',
  'QCQ-TBL-039',
  'QCQ-THM-001',
  'QCQ-THM-002',
  'QCQ-THM-003',
  'QCQ-THM-004',
  'QCQ-THM-005',
  'QCQ-THM-006',
  'QCQ-THM-007',
  'QCQ-THM-008',
  'QCQ-THM-009',
  'QCQ-THM-010',
] as const);

function finding(
  code: string,
  severity: VisualComplianceSeverity,
  passed: boolean,
  message: string,
): VisualComplianceFinding {
  return Object.freeze({ code, severity, passed, message });
}

export function validateVisualCompliance(
  manifest: ThemeManifest,
  policyReport: VisualPolicyReport,
  options: VisualComplianceOptions = {},
): VisualComplianceReport {
  const findings: VisualComplianceFinding[] = [];
  const cssVariables = Object.entries(manifest.cssVariables);
  const minimumCssVariableCount = options.minimumCssVariableCount ?? 100;
  const requiredArtifactIds = options.requiredArtifactIds ?? PHASE9_REQUIRED_ARTIFACT_IDS;
  const requireAccessibilityMediaRules = options.requireAccessibilityMediaRules ?? true;
  const require4K = options.require4K ?? true;
  const require8K = options.require8K ?? true;

  findings.push(finding(
    'theme-schema',
    'constitutional',
    manifest.schemaVersion === '1.0.0' && manifest.version === '1.0.0',
    `Theme schema ${manifest.schemaVersion}; theme version ${manifest.version}.`,
  ));
  findings.push(finding(
    'theme-css-variable-count',
    'error',
    cssVariables.length >= minimumCssVariableCount,
    `Theme exposes ${cssVariables.length} CSS variables; required >= ${minimumCssVariableCount}.`,
  ));

  const invalidVariables = cssVariables.filter(
    ([name, value]) => !name.startsWith('--qcq-') || value.trim().length === 0,
  );
  findings.push(finding(
    'theme-css-variable-shape',
    'error',
    invalidVariables.length === 0,
    invalidVariables.length === 0
      ? 'All theme variables use the --qcq- namespace and non-empty values.'
      : `${invalidVariables.length} theme variables violate namespace/value rules.`,
  ));

  const missingArtifactIds = requiredArtifactIds.filter(
    (artifactId) => !manifest.registryLoadOrder.includes(artifactId),
  );
  findings.push(finding(
    'theme-required-artifacts',
    'constitutional',
    missingArtifactIds.length === 0,
    missingArtifactIds.length === 0
      ? 'All required Phase 9 artifacts appear in the manifest dependency order.'
      : `Missing manifest artifacts: ${missingArtifactIds.join(', ')}.`,
  ));

  findings.push(finding(
    'theme-raster-independence',
    'constitutional',
    manifest.compatibility.requiresRasterAssets === false,
    `Theme raster requirement: ${String(manifest.compatibility.requiresRasterAssets)}.`,
  ));
  findings.push(finding(
    'theme-forced-colors',
    'constitutional',
    manifest.compatibility.supportsForcedColors === true,
    `Forced-colors declared support: ${String(manifest.compatibility.supportsForcedColors)}.`,
  ));
  findings.push(finding(
    'theme-reduced-motion',
    'constitutional',
    manifest.compatibility.supportsReducedMotion === true,
    `Reduced-motion declared support: ${String(manifest.compatibility.supportsReducedMotion)}.`,
  ));
  findings.push(finding(
    'theme-4k-declaration',
    'error',
    !require4K || manifest.compatibility.supports4K,
    `4K declared support: ${String(manifest.compatibility.supports4K)}.`,
  ));
  findings.push(finding(
    'theme-8k-declaration',
    'error',
    !require8K || manifest.compatibility.supports8K,
    `8K declared support: ${String(manifest.compatibility.supports8K)}.`,
  ));

  const accessibilitySheet = manifest.accessibilityStyleSheet.toLowerCase();
  const hasReducedMotionRule = accessibilitySheet.includes('prefers-reduced-motion');
  const hasForcedColorsRule = accessibilitySheet.includes('forced-colors');
  findings.push(finding(
    'theme-accessibility-media-rules',
    'constitutional',
    !requireAccessibilityMediaRules || (hasReducedMotionRule && hasForcedColorsRule),
    `Accessibility stylesheet reduced-motion=${String(hasReducedMotionRule)}, forced-colors=${String(hasForcedColorsRule)}.`,
  ));

  findings.push(finding(
    'visual-policy-report',
    'constitutional',
    policyReport.passed,
    policyReport.passed
      ? 'Visual constitutional policy report passed.'
      : `Policy failures: constitutional=${policyReport.constitutionalViolationCount}, errors=${policyReport.errorCount}, incompleteEvidence=${policyReport.incompleteEvidenceCount}.`,
  ));

  const constitutionalViolationCount = findings.filter(
    (entry) => !entry.passed && entry.severity === 'constitutional',
  ).length;
  const errorCount = findings.filter(
    (entry) => !entry.passed && entry.severity === 'error',
  ).length;
  const warningCount = findings.filter(
    (entry) => !entry.passed && entry.severity === 'warning',
  ).length;
  const compliant = constitutionalViolationCount === 0 && errorCount === 0;

  return Object.freeze({
    schemaVersion: '1.0.0',
    status: compliant ? (warningCount === 0 ? 'pass' : 'conditional') : 'fail',
    compliant,
    themeId: manifest.id,
    themeVersion: manifest.version,
    cssVariableCount: cssVariables.length,
    constitutionalViolationCount,
    errorCount,
    warningCount,
    findings: Object.freeze(findings),
  });
}
