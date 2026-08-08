/**
 * Artifact ID: QCQ-TBL-072
 * Artifact Name: EffectsPerformanceProfile
 * Artifact Purpose: Performance authority defining device classes, frame budgets, effect ceilings, density ceilings, DPR limits, and adaptive sampling targets.
 * Artifact Layer: Premium Effects / PRF
 * Artifact Dependencies: QCQ-TBL-068
 * Artifact Dependents: QCQ-TBL-073, QCQ-TBL-074, QCQ-TBL-077
 * Dependency Graph: EffectsCapabilities -> EffectsPerformanceProfile -> scaler/budget/readiness
 * Repository Path: QCQ/frontend/src/effects/performance
 * Source File: EffectsPerformanceProfile.ts
 */

import type { EffectsCapabilitySnapshot } from '../governance/EffectsCapabilities';
import type { EffectsQuality } from '../governance/EffectsManifest';

export type EffectsDeviceClass =
  | 'baseline'
  | 'constrained'
  | 'standard'
  | 'high'
  | 'ultra';

export interface EffectsPerformanceProfile {
  readonly deviceClass: EffectsDeviceClass;
  readonly defaultQuality: EffectsQuality;
  readonly targetFps: 30 | 60;
  readonly frameBudgetMs: number;
  readonly effectsBudgetMs: number;
  readonly canvasDprCeiling: number;
  readonly particleCeiling: number;
  readonly lightningBranchCeiling: number;
  readonly blurRadiusCeilingPx: number;
  readonly reflectionLayerCeiling: number;
  readonly drawCallCeiling: number;
  readonly adaptiveSampleWindow: number;
  readonly hiddenFrameRate: 0;
}

function profile(
  value: EffectsPerformanceProfile,
): EffectsPerformanceProfile {
  return Object.freeze({ ...value });
}

export function resolveEffectsDeviceClass(
  capabilities: EffectsCapabilitySnapshot,
): EffectsDeviceClass {
  if (!capabilities.browser || !capabilities.canvas2D || !capabilities.svg) return 'baseline';
  const memory = capabilities.deviceMemoryGB ?? 4;
  const cpu = capabilities.hardwareConcurrency;
  if (capabilities.saveData || cpu <= 2 || memory <= 2) return 'constrained';
  if (cpu <= 4 || memory <= 4) return 'standard';
  if (cpu >= 12 && memory >= 8 && capabilities.webgl2) return 'ultra';
  return 'high';
}

export function createEffectsPerformanceProfile(
  capabilities: EffectsCapabilitySnapshot,
): EffectsPerformanceProfile {
  switch (resolveEffectsDeviceClass(capabilities)) {
    case 'baseline':
      return profile({
        deviceClass: 'baseline',
        defaultQuality: 'off',
        targetFps: 30,
        frameBudgetMs: 33.33,
        effectsBudgetMs: 0,
        canvasDprCeiling: 1,
        particleCeiling: 0,
        lightningBranchCeiling: 0,
        blurRadiusCeilingPx: 0,
        reflectionLayerCeiling: 0,
        drawCallCeiling: 0,
        adaptiveSampleWindow: 30,
        hiddenFrameRate: 0,
      });
    case 'constrained':
      return profile({
        deviceClass: 'constrained',
        defaultQuality: 'performance',
        targetFps: 30,
        frameBudgetMs: 33.33,
        effectsBudgetMs: 6,
        canvasDprCeiling: 1,
        particleCeiling: 18,
        lightningBranchCeiling: 2,
        blurRadiusCeilingPx: 8,
        reflectionLayerCeiling: 1,
        drawCallCeiling: 40,
        adaptiveSampleWindow: 45,
        hiddenFrameRate: 0,
      });
    case 'standard':
      return profile({
        deviceClass: 'standard',
        defaultQuality: 'balanced',
        targetFps: 60,
        frameBudgetMs: 16.67,
        effectsBudgetMs: 4.5,
        canvasDprCeiling: 1.5,
        particleCeiling: 42,
        lightningBranchCeiling: 4,
        blurRadiusCeilingPx: 16,
        reflectionLayerCeiling: 2,
        drawCallCeiling: 80,
        adaptiveSampleWindow: 60,
        hiddenFrameRate: 0,
      });
    case 'high':
      return profile({
        deviceClass: 'high',
        defaultQuality: 'balanced',
        targetFps: 60,
        frameBudgetMs: 16.67,
        effectsBudgetMs: 5.5,
        canvasDprCeiling: 2,
        particleCeiling: 76,
        lightningBranchCeiling: 6,
        blurRadiusCeilingPx: 24,
        reflectionLayerCeiling: 3,
        drawCallCeiling: 120,
        adaptiveSampleWindow: 75,
        hiddenFrameRate: 0,
      });
    case 'ultra':
      return profile({
        deviceClass: 'ultra',
        defaultQuality: 'cinematic',
        targetFps: 60,
        frameBudgetMs: 16.67,
        effectsBudgetMs: 6.5,
        canvasDprCeiling: 2.5,
        particleCeiling: 120,
        lightningBranchCeiling: 8,
        blurRadiusCeilingPx: 32,
        reflectionLayerCeiling: 4,
        drawCallCeiling: 180,
        adaptiveSampleWindow: 90,
        hiddenFrameRate: 0,
      });
  }
}
