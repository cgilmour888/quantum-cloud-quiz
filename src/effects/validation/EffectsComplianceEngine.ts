/**
 * Artifact ID: QCQ-TBL-076
 * Artifact Name: EffectsComplianceEngine
 * Artifact Purpose: Constitutional and accessibility compliance authority enforcing no-raster runtime implementation, pointer transparency, reduced motion, forced-colors safety, and non-semantic effects.
 * Artifact Layer: Premium Effects / CMP
 * Artifact Dependencies: QCQ-TBL-065, QCQ-TBL-067, QCQ-TBL-075
 * Artifact Dependents: QCQ-TBL-077, QCQ-TBL-080
 * Dependency Graph: manifest + policy + validation -> EffectsComplianceEngine -> readiness/master contract
 * Repository Path: QCQ/frontend/src/effects/validation
 * Source File: EffectsComplianceEngine.ts
 */

import { EFFECTS_MANIFEST } from '../governance/EffectsManifest';
import type { EffectsPolicy } from '../governance/EffectsPolicies';
import type { EffectsValidationReport } from './EffectsValidator';

export type EffectsComplianceStatus = 'pass' | 'fail';

export interface EffectsComplianceCheck {
  readonly id: string;
  readonly status: EffectsComplianceStatus;
  readonly requirement: string;
  readonly evidence: string;
}

export interface EffectsComplianceReport {
  readonly compliant: boolean;
  readonly generatedAt: number;
  readonly checks: readonly EffectsComplianceCheck[];
}

export interface EffectsComplianceEvidence {
  readonly validation: EffectsValidationReport;
  readonly policy: EffectsPolicy;
  readonly runtimeUsesMasterArtwork: boolean;
  readonly runtimeUsesImageOverlays: boolean;
  readonly runtimeUsesHotspotOverlays: boolean;
  readonly pointerEventsBlockedByEffects: boolean;
  readonly effectsExposedToAssistiveTechnology: boolean;
  readonly essentialInformationDependsOnEffects: boolean;
}

function check(
  id: string,
  requirement: string,
  passed: boolean,
  evidence: string,
): EffectsComplianceCheck {
  return Object.freeze({
    id,
    status: passed ? 'pass' : 'fail',
    requirement,
    evidence,
  });
}

export function evaluateEffectsCompliance(
  evidence: EffectsComplianceEvidence,
): EffectsComplianceReport {
  const checks = [
    check('FX-C001', 'Effects validation must pass.', evidence.validation.valid, `validation.valid=${String(evidence.validation.valid)}`),
    check('FX-C002', 'MASTER artwork must not be used at runtime.', !evidence.runtimeUsesMasterArtwork, `runtimeUsesMasterArtwork=${String(evidence.runtimeUsesMasterArtwork)}`),
    check('FX-C003', 'Image overlays are prohibited.', !evidence.runtimeUsesImageOverlays, `runtimeUsesImageOverlays=${String(evidence.runtimeUsesImageOverlays)}`),
    check('FX-C004', 'Hotspot overlays are prohibited.', !evidence.runtimeUsesHotspotOverlays, `runtimeUsesHotspotOverlays=${String(evidence.runtimeUsesHotspotOverlays)}`),
    check('FX-C005', 'Effects must remain pointer-transparent.', !evidence.pointerEventsBlockedByEffects && evidence.policy.pointerEvents === 'none', `policy.pointerEvents=${evidence.policy.pointerEvents}`),
    check('FX-C006', 'Decorative effects must remain hidden from assistive technology.', !evidence.effectsExposedToAssistiveTechnology && evidence.policy.assistiveTechnologyExposure === 'hidden', `policy.assistiveTechnologyExposure=${evidence.policy.assistiveTechnologyExposure}`),
    check('FX-C007', 'Essential information must not depend on effects.', !evidence.essentialInformationDependsOnEffects, `essentialInformationDependsOnEffects=${String(evidence.essentialInformationDependsOnEffects)}`),
    check('FX-C008', 'Forced colors must be able to remove decorative effects.', evidence.policy.forcedColorsPolicy === 'remove-decorative-effects', evidence.policy.forcedColorsPolicy),
    check('FX-C009', 'Reduced motion must have a safe substitute.', evidence.policy.reducedMotionPolicy === 'static-or-reduced', evidence.policy.reducedMotionPolicy),
    check('FX-C010', 'Effects may not own semantic behavior.', evidence.policy.semanticOwnershipProhibited === true, `semanticOwnershipProhibited=${String(evidence.policy.semanticOwnershipProhibited)}`),
    check('FX-C011', 'Effects manifest must remain web-native only.', EFFECTS_MANIFEST.webNativeOnly && !EFFECTS_MANIFEST.runtimeMasterArtworkUsage, `webNativeOnly=${String(EFFECTS_MANIFEST.webNativeOnly)}`),
  ];

  return Object.freeze({
    compliant: checks.every((entry) => entry.status === 'pass'),
    generatedAt: Date.now(),
    checks: Object.freeze(checks),
  });
}
