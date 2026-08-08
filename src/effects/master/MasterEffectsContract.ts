/**
 * Artifact ID: QCQ-TBL-080
 * Artifact Name: MasterEffectsContract
 * Artifact Purpose: Master visual-fidelity contract binding web-native implementation, effects governance, performance, accessibility, and MASTER-derived phenomena without runtime image dependency.
 * Artifact Layer: Premium Effects / CTR
 * Artifact Dependencies: QCQ-TBL-065, QCQ-TBL-076, QCQ-TBL-077, QCQ-TBL-078, QCQ-TBL-079
 * Artifact Dependents: QCQ-APP-002 EnvironmentZone, QCQ-TBL-030, QCQ-TBL-031, QCQ-TBL-032, QCQ-TBL-033, QCQ-TBL-041
 * Dependency Graph: effects governance + compliance/readiness + MASTER manifest/registry -> MasterEffectsContract -> runtime integration/release acceptance
 * Repository Path: QCQ/frontend/src/effects/master
 * Source File: MasterEffectsContract.ts
 */

import { EFFECTS_MANIFEST } from '../governance/EffectsManifest';
import type { EffectsComplianceReport } from '../validation/EffectsComplianceEngine';
import type { EffectsReadinessReport } from '../validation/EffectsReadinessEvaluator';
import { MASTER_EFFECTS_MANIFEST } from './MasterEffectsManifest';
import type { MasterEffectsRegistry } from './MasterEffectsRegistry';

export interface MasterEffectsAcceptanceInput {
  readonly registry: MasterEffectsRegistry;
  readonly compliance: EffectsComplianceReport;
  readonly readiness: EffectsReadinessReport;
  readonly phenomenonScores: Readonly<Record<string, number>>;
  readonly targetQuality: 'balanced' | 'cinematic';
  readonly runtimeUsesRasterArtwork: boolean;
  readonly runtimeUsesHotspotOverlay: boolean;
  readonly environmentZoneOwnedByApp002: boolean;
  readonly frameOwnershipPreserved: boolean;
}

export interface MasterEffectsAcceptanceReport {
  readonly accepted: boolean;
  readonly fidelityScore: number;
  readonly requiredThreshold: number;
  readonly generatedAt: number;
  readonly failures: readonly string[];
  readonly advisories: readonly string[];
}

export const MASTER_EFFECTS_CONTRACT = Object.freeze({
  version: '1.0.0',
  artifactFamily: 'QCQ Premium Effects',
  referenceAspectRatio: '16:9',
  visualSpecifications: MASTER_EFFECTS_MANIFEST.visualSpecification,
  runtimeMasterArtworkUsage: false,
  imageOverlayUsage: false,
  hotspotOverlayUsage: false,
  minimumBalancedFidelity: 0.82,
  minimumCinematicFidelity: 0.9,
  ownership: Object.freeze({
    environmentZone: 'QCQ-APP-002',
    storm: 'QCQ-TBL-030',
    lightning: 'QCQ-TBL-031',
    particles: 'QCQ-TBL-032',
    glow: 'QCQ-TBL-033',
    reflection: 'QCQ-TBL-041',
    effectsManifest: 'QCQ-TBL-065',
    masterManifest: 'QCQ-TBL-078',
  }),
  prohibitions: Object.freeze([
    'runtime MASTER raster surface',
    'image overlay implementation',
    'hotspot overlay implementation',
    'effect-owned gameplay state',
    'effect-owned layout',
    'effect-owned scoring',
    'effect-owned accessibility semantics',
    'unbounded strobing',
    'pointer-intercepting decorative effects',
  ]),
});

export function evaluateMasterEffectsAcceptance(
  input: MasterEffectsAcceptanceInput,
): MasterEffectsAcceptanceReport {
  const failures: string[] = [];
  const advisories: string[] = [];
  const fidelityScore = input.registry.calculateWeightedFidelity(input.phenomenonScores);
  const requiredThreshold = input.targetQuality === 'cinematic'
    ? MASTER_EFFECTS_CONTRACT.minimumCinematicFidelity
    : MASTER_EFFECTS_CONTRACT.minimumBalancedFidelity;

  if (!input.compliance.compliant) failures.push('Effects compliance report is not passing.');
  if (!input.readiness.productionReady) failures.push('Effects readiness report is not production-ready.');
  if (input.runtimeUsesRasterArtwork) failures.push('Runtime raster MASTER usage is prohibited.');
  if (input.runtimeUsesHotspotOverlay) failures.push('Runtime hotspot overlays are prohibited.');
  if (!input.environmentZoneOwnedByApp002) failures.push('APP-002 environment-zone ownership is not preserved.');
  if (!input.frameOwnershipPreserved) failures.push('Frame authorities must retain frame ownership.');
  if (!EFFECTS_MANIFEST.webNativeOnly) failures.push('Effects manifest is not web-native-only.');
  if (fidelityScore < requiredThreshold) {
    failures.push(
      `Weighted MASTER effect fidelity ${fidelityScore.toFixed(3)} is below required ${requiredThreshold.toFixed(3)}.`,
    );
  }

  for (const phenomenon of MASTER_EFFECTS_MANIFEST.phenomena) {
    const required = input.targetQuality === 'cinematic'
      ? phenomenon.requiredAtCinematic
      : phenomenon.requiredAtBalanced;
    const score = input.phenomenonScores[phenomenon.id] ?? 0;
    if (required && score < 0.7) {
      failures.push(`Required phenomenon "${phenomenon.name}" scored ${score.toFixed(2)}.`);
    } else if (!required && score < 0.5) {
      advisories.push(`Optional phenomenon "${phenomenon.name}" is below 0.50 fidelity.`);
    }
  }

  return Object.freeze({
    accepted: failures.length === 0,
    fidelityScore,
    requiredThreshold,
    generatedAt: Date.now(),
    failures: Object.freeze(failures),
    advisories: Object.freeze(advisories),
  });
}
