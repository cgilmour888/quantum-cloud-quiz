/**
 * Artifact ID: QCQ-THM-011
 * Artifact Name: VisualPolicyEngine
 * Artifact Purpose: Constitutional policy authority preventing visual ownership drift, raster shortcuts, inaccessible effects, and local style reinvention.
 * Artifact Layer: Phase 9 — Visual Authority / POL
 * Artifact Dependencies: QCQ-THM-010 ThemeManifest
 * Artifact Dependents: QCQ-THM-012, QCQ-THM-014, QCQ-THM-015, downstream visual integration gates
 * Dependency Graph: ThemeManifest + structured repository evidence -> VisualPolicyEngine -> VisualComplianceValidator/ThemeCertificationEngine/ThemeReadinessEvaluator
 * Repository Path: QCQ/frontend/src/styles
 * Source File: VisualPolicyEngine.ts
 */

import type { ThemeManifest } from './ThemeManifest';

export type VisualPolicySeverity =
  | 'constitutional'
  | 'error'
  | 'warning';

export type VisualPolicyScope =
  | 'ownership'
  | 'runtime'
  | 'accessibility'
  | 'fidelity'
  | 'interaction'
  | 'performance';

export type VisualPolicyId =
  | 'master-reference-specification-only'
  | 'theme-manifest-authority'
  | 'app002-macro-layout-authority'
  | 'no-raster-ui-runtime'
  | 'no-image-map-or-hotspot'
  | 'no-unapproved-local-colors'
  | 'glow-engine-single-authority'
  | 'reflection-engine-single-authority'
  | 'motion-profile-single-authority'
  | 'no-arbitrary-z-index'
  | 'essential-text-web-native'
  | 'decorative-layers-pointer-transparent'
  | 'no-hover-only-required-interaction'
  | 'forced-colors-supported'
  | 'reduced-motion-supported'
  | 'tablet-primary-zone-preserved'
  | 'minimum-interactive-target'
  | 'quality-tier-geometry-invariant'
  | 'semantic-visible-objects'
  | 'effects-never-own-gameplay';

export interface VisualPolicyEvidence {
  readonly masterRasterRuntimeImportCount: number | null;
  readonly imageMapOrHotspotCount: number | null;
  readonly unapprovedLocalColorLiteralCount: number | null;
  readonly unapprovedGlowAlgorithmCount: number | null;
  readonly unapprovedReflectionAlgorithmCount: number | null;
  readonly unapprovedMotionTimingCount: number | null;
  readonly arbitraryZIndexCount: number | null;
  readonly essentialRasterTextCount: number | null;
  readonly pointerCapturingDecorativeLayerCount: number | null;
  readonly requiredHoverOnlyInteractionCount: number | null;
  readonly minimumInteractiveTargetPx: number | null;
  readonly semanticVisibleObjectCoverage: number | null;
  readonly qualityTierGeometryInvariant: boolean | null;
  readonly tabletPrimaryZonePreserved: boolean | null;
  readonly effectsMutateGameplayState: boolean | null;
}

export interface VisualPolicyContext {
  readonly manifest: ThemeManifest;
  readonly evidence: VisualPolicyEvidence;
  readonly activeThemeAuthority: string;
  readonly macroLayoutAuthority: string;
  readonly glowAuthority: string;
  readonly reflectionAuthority: string;
  readonly motionAuthority: string;
}

export interface VisualPolicyDefinition {
  readonly id: VisualPolicyId;
  readonly scope: VisualPolicyScope;
  readonly severity: VisualPolicySeverity;
  readonly description: string;
}

export interface VisualPolicyFinding {
  readonly policyId: VisualPolicyId;
  readonly scope: VisualPolicyScope;
  readonly severity: VisualPolicySeverity;
  readonly passed: boolean;
  readonly message: string;
  readonly evidenceComplete: boolean;
}

export interface VisualPolicyReport {
  readonly schemaVersion: '1.0.0';
  readonly passed: boolean;
  readonly constitutionalViolationCount: number;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly incompleteEvidenceCount: number;
  readonly findings: readonly VisualPolicyFinding[];
}

export const VISUAL_POLICY_DEFINITIONS: readonly VisualPolicyDefinition[] =
  Object.freeze([
    Object.freeze({ id: 'master-reference-specification-only', scope: 'ownership', severity: 'constitutional', description: 'MASTER artwork remains specification-only and is never a runtime UI implementation.' }),
    Object.freeze({ id: 'theme-manifest-authority', scope: 'ownership', severity: 'constitutional', description: 'QCQ-THM-010 remains the active theme-manifest authority.' }),
    Object.freeze({ id: 'app002-macro-layout-authority', scope: 'ownership', severity: 'constitutional', description: 'QCQ-APP-002 remains the sole macro-layout authority.' }),
    Object.freeze({ id: 'no-raster-ui-runtime', scope: 'runtime', severity: 'constitutional', description: 'No MASTER raster or screenshot may implement live UI.' }),
    Object.freeze({ id: 'no-image-map-or-hotspot', scope: 'interaction', severity: 'constitutional', description: 'Image maps, hotspots, and invisible raster hit regions are prohibited.' }),
    Object.freeze({ id: 'no-unapproved-local-colors', scope: 'ownership', severity: 'error', description: 'Components consume ColorSystem variables instead of inventing local palette literals.' }),
    Object.freeze({ id: 'glow-engine-single-authority', scope: 'ownership', severity: 'constitutional', description: 'Glow behavior remains delegated to QCQ-TBL-033 via QCQ-THM-005 presets.' }),
    Object.freeze({ id: 'reflection-engine-single-authority', scope: 'ownership', severity: 'constitutional', description: 'Reflection behavior remains delegated to QCQ-TBL-041 via QCQ-THM-006 presets.' }),
    Object.freeze({ id: 'motion-profile-single-authority', scope: 'ownership', severity: 'error', description: 'Motion timings and easing are consumed from QCQ-THM-007/QCQ-TBL-039.' }),
    Object.freeze({ id: 'no-arbitrary-z-index', scope: 'ownership', severity: 'error', description: 'Depth is consumed from governed elevation/layer authorities instead of local arbitrary z-index values.' }),
    Object.freeze({ id: 'essential-text-web-native', scope: 'accessibility', severity: 'constitutional', description: 'Question, answer, metric, navigation, and status text remains real web text.' }),
    Object.freeze({ id: 'decorative-layers-pointer-transparent', scope: 'interaction', severity: 'constitutional', description: 'Decorative effects remain pointer-transparent and cannot obstruct semantic controls.' }),
    Object.freeze({ id: 'no-hover-only-required-interaction', scope: 'accessibility', severity: 'constitutional', description: 'Hover may enhance but never gate required content or actions.' }),
    Object.freeze({ id: 'forced-colors-supported', scope: 'accessibility', severity: 'constitutional', description: 'Forced-colors mode remains structurally usable.' }),
    Object.freeze({ id: 'reduced-motion-supported', scope: 'accessibility', severity: 'constitutional', description: 'Reduced-motion/static modes remain fully functional.' }),
    Object.freeze({ id: 'tablet-primary-zone-preserved', scope: 'fidelity', severity: 'constitutional', description: 'The Question Tablet remains the primary cognitive and interaction zone.' }),
    Object.freeze({ id: 'minimum-interactive-target', scope: 'accessibility', severity: 'error', description: 'Interactive targets are at least 44 CSS pixels in their compact state.' }),
    Object.freeze({ id: 'quality-tier-geometry-invariant', scope: 'performance', severity: 'error', description: 'Performance quality tiers change rendering expense, not constitutional geometry.' }),
    Object.freeze({ id: 'semantic-visible-objects', scope: 'interaction', severity: 'constitutional', description: 'Visible interactive objects are semantic application components.' }),
    Object.freeze({ id: 'effects-never-own-gameplay', scope: 'ownership', severity: 'constitutional', description: 'Visual effects react to gameplay events but never grade, score, navigate, or mutate gameplay state.' }),
  ]);

export function createUnknownVisualPolicyEvidence(): VisualPolicyEvidence {
  return Object.freeze({
    masterRasterRuntimeImportCount: null,
    imageMapOrHotspotCount: null,
    unapprovedLocalColorLiteralCount: null,
    unapprovedGlowAlgorithmCount: null,
    unapprovedReflectionAlgorithmCount: null,
    unapprovedMotionTimingCount: null,
    arbitraryZIndexCount: null,
    essentialRasterTextCount: null,
    pointerCapturingDecorativeLayerCount: null,
    requiredHoverOnlyInteractionCount: null,
    minimumInteractiveTargetPx: null,
    semanticVisibleObjectCoverage: null,
    qualityTierGeometryInvariant: null,
    tabletPrimaryZonePreserved: null,
    effectsMutateGameplayState: null,
  });
}

function numericZero(
  policy: VisualPolicyDefinition,
  value: number | null,
  label: string,
): VisualPolicyFinding {
  const complete = value !== null;
  const passed = complete && value === 0;
  return Object.freeze({
    policyId: policy.id,
    scope: policy.scope,
    severity: policy.severity,
    passed,
    evidenceComplete: complete,
    message: complete
      ? passed
        ? `${label}: 0.`
        : `${label}: ${value}.`
      : `${label}: evidence missing.`,
  });
}

function booleanExpected(
  policy: VisualPolicyDefinition,
  value: boolean | null,
  expected: boolean,
  label: string,
): VisualPolicyFinding {
  const complete = value !== null;
  const passed = complete && value === expected;
  return Object.freeze({
    policyId: policy.id,
    scope: policy.scope,
    severity: policy.severity,
    passed,
    evidenceComplete: complete,
    message: complete
      ? `${label}: ${String(value)}; expected ${String(expected)}.`
      : `${label}: evidence missing.`,
  });
}

function direct(
  policy: VisualPolicyDefinition,
  passed: boolean,
  message: string,
): VisualPolicyFinding {
  return Object.freeze({
    policyId: policy.id,
    scope: policy.scope,
    severity: policy.severity,
    passed,
    evidenceComplete: true,
    message,
  });
}

export function evaluateVisualPolicies(
  context: VisualPolicyContext,
): VisualPolicyReport {
  const byId = new Map(
    VISUAL_POLICY_DEFINITIONS.map((policy) => [policy.id, policy] as const),
  );
  const policy = (id: VisualPolicyId): VisualPolicyDefinition => {
    const value = byId.get(id);
    if (!value) throw new Error(`Visual policy ${id} is not registered.`);
    return value;
  };
  const e = context.evidence;
  const findings: VisualPolicyFinding[] = [];

  findings.push(direct(
    policy('master-reference-specification-only'),
    context.manifest.compatibility.requiresRasterAssets === false,
    `Theme requires raster assets: ${String(context.manifest.compatibility.requiresRasterAssets)}.`,
  ));
  findings.push(direct(
    policy('theme-manifest-authority'),
    context.activeThemeAuthority === 'QCQ-THM-010',
    `Active theme authority: ${context.activeThemeAuthority}.`,
  ));
  findings.push(direct(
    policy('app002-macro-layout-authority'),
    context.macroLayoutAuthority === 'QCQ-APP-002',
    `Macro-layout authority: ${context.macroLayoutAuthority}.`,
  ));
  findings.push(numericZero(policy('no-raster-ui-runtime'), e.masterRasterRuntimeImportCount, 'Runtime MASTER/raster UI imports'));
  findings.push(numericZero(policy('no-image-map-or-hotspot'), e.imageMapOrHotspotCount, 'Image maps/hotspots'));
  findings.push(numericZero(policy('no-unapproved-local-colors'), e.unapprovedLocalColorLiteralCount, 'Unapproved local color literals'));
  findings.push(direct(
    policy('glow-engine-single-authority'),
    context.glowAuthority === 'QCQ-TBL-033',
    `Glow authority: ${context.glowAuthority}.`,
  ));
  findings.push(numericZero(policy('glow-engine-single-authority'), e.unapprovedGlowAlgorithmCount, 'Unapproved local glow algorithms'));
  findings.push(direct(
    policy('reflection-engine-single-authority'),
    context.reflectionAuthority === 'QCQ-TBL-041',
    `Reflection authority: ${context.reflectionAuthority}.`,
  ));
  findings.push(numericZero(policy('reflection-engine-single-authority'), e.unapprovedReflectionAlgorithmCount, 'Unapproved local reflection algorithms'));
  findings.push(direct(
    policy('motion-profile-single-authority'),
    context.motionAuthority === 'QCQ-THM-007',
    `Motion authority: ${context.motionAuthority}.`,
  ));
  findings.push(numericZero(policy('motion-profile-single-authority'), e.unapprovedMotionTimingCount, 'Unapproved local motion timings'));
  findings.push(numericZero(policy('no-arbitrary-z-index'), e.arbitraryZIndexCount, 'Unapproved arbitrary z-index values'));
  findings.push(numericZero(policy('essential-text-web-native'), e.essentialRasterTextCount, 'Essential rasterized text nodes'));
  findings.push(numericZero(policy('decorative-layers-pointer-transparent'), e.pointerCapturingDecorativeLayerCount, 'Pointer-capturing decorative layers'));
  findings.push(numericZero(policy('no-hover-only-required-interaction'), e.requiredHoverOnlyInteractionCount, 'Required hover-only interactions'));
  findings.push(direct(
    policy('forced-colors-supported'),
    context.manifest.compatibility.supportsForcedColors,
    `Manifest forced-colors support: ${String(context.manifest.compatibility.supportsForcedColors)}.`,
  ));
  findings.push(direct(
    policy('reduced-motion-supported'),
    context.manifest.compatibility.supportsReducedMotion,
    `Manifest reduced-motion support: ${String(context.manifest.compatibility.supportsReducedMotion)}.`,
  ));
  findings.push(booleanExpected(policy('tablet-primary-zone-preserved'), e.tabletPrimaryZonePreserved, true, 'Tablet primary-zone preservation'));
  findings.push(Object.freeze({
    policyId: 'minimum-interactive-target',
    scope: 'accessibility',
    severity: 'error',
    passed: e.minimumInteractiveTargetPx !== null && e.minimumInteractiveTargetPx >= 44,
    evidenceComplete: e.minimumInteractiveTargetPx !== null,
    message: e.minimumInteractiveTargetPx === null
      ? 'Minimum interactive target: evidence missing.'
      : `Minimum interactive target: ${e.minimumInteractiveTargetPx}px; required >= 44px.`,
  }));
  findings.push(booleanExpected(policy('quality-tier-geometry-invariant'), e.qualityTierGeometryInvariant, true, 'Quality-tier geometry invariance'));
  findings.push(Object.freeze({
    policyId: 'semantic-visible-objects',
    scope: 'interaction',
    severity: 'constitutional',
    passed: e.semanticVisibleObjectCoverage !== null && e.semanticVisibleObjectCoverage >= 1,
    evidenceComplete: e.semanticVisibleObjectCoverage !== null,
    message: e.semanticVisibleObjectCoverage === null
      ? 'Semantic visible-object coverage: evidence missing.'
      : `Semantic visible-object coverage: ${(e.semanticVisibleObjectCoverage * 100).toFixed(1)}%.`,
  }));
  findings.push(booleanExpected(policy('effects-never-own-gameplay'), e.effectsMutateGameplayState, false, 'Effects mutate gameplay state'));

  const constitutionalViolationCount = findings.filter(
    (finding) => !finding.passed && finding.severity === 'constitutional',
  ).length;
  const errorCount = findings.filter(
    (finding) => !finding.passed && finding.severity === 'error',
  ).length;
  const warningCount = findings.filter(
    (finding) => !finding.passed && finding.severity === 'warning',
  ).length;
  const incompleteEvidenceCount = findings.filter(
    (finding) => !finding.evidenceComplete,
  ).length;

  return Object.freeze({
    schemaVersion: '1.0.0',
    passed: constitutionalViolationCount === 0 && errorCount === 0 && incompleteEvidenceCount === 0,
    constitutionalViolationCount,
    errorCount,
    warningCount,
    incompleteEvidenceCount,
    findings: Object.freeze(findings),
  });
}

export function createVisualPolicyContext(
  manifest: ThemeManifest,
  evidence: VisualPolicyEvidence = createUnknownVisualPolicyEvidence(),
): VisualPolicyContext {
  return Object.freeze({
    manifest,
    evidence,
    activeThemeAuthority: 'QCQ-THM-010',
    macroLayoutAuthority: 'QCQ-APP-002',
    glowAuthority: 'QCQ-TBL-033',
    reflectionAuthority: 'QCQ-TBL-041',
    motionAuthority: 'QCQ-THM-007',
  });
}
