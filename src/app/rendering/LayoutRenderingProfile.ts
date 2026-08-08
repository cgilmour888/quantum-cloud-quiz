/**
 * Artifact ID: QCQ-APP-002-015
 * Artifact Name: LayoutRenderingProfile
 * Artifact Purpose: Resolution- and hardware-aware rendering budgets for fidelity, WebGL, particles, glow, reflections, and DPR.
 * Artifact Layer: QCQ-APP-002 — REN (Rendering Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> LayoutRenderingProfile -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/rendering
 * Source File: LayoutRenderingProfile.ts
 */
import type {
  LayoutCapabilities,
  ResolvedLayoutPolicy,
  ViewportLayoutContract,
} from '../types/LayoutEngine.types';

export type LayoutResolutionProfile =
  | 'hd'
  | 'qhd'
  | '4k'
  | '8k'
  | '12k';

export interface LayoutRenderingProfile {
  readonly id: string;
  readonly resolution: LayoutResolutionProfile;
  readonly quality: 'minimal' | 'balanced' | 'ultra';
  readonly motion:
    | 'full'
    | 'balanced'
    | 'reduced'
    | 'none';
  readonly particleBudget: number;
  readonly glowLayers: number;
  readonly blurRadiusScale: number;
  readonly reflectionScale: number;
  readonly atmosphereScale: number;
  readonly useWebGL: boolean;
  readonly useBackdropFilter: boolean;
  readonly useContentVisibility: boolean;
  readonly maximumDevicePixelRatio: number;
  readonly suspendWhenHidden: boolean;
}

export function resolveLayoutResolutionProfile(
  width: number,
): LayoutResolutionProfile {
  if (width >= 11_520) return '12k';
  if (width >= 7_680) return '8k';
  if (width >= 3_840) return '4k';
  if (width >= 2_560) return 'qhd';
  return 'hd';
}

export function resolveLayoutRenderingProfile(
  capabilities: LayoutCapabilities,
  policy: ResolvedLayoutPolicy,
  viewport: ViewportLayoutContract,
): LayoutRenderingProfile {
  const resolution =
    resolveLayoutResolutionProfile(
      viewport.visualWidth,
    );
  const pixelCount =
    viewport.visualWidth *
    viewport.visualHeight *
    Math.min(
      viewport.devicePixelRatio,
      3,
    ) ** 2;

  const constrainedHardware =
    capabilities.graphics.hardwareConcurrency <= 4 ||
    (
      capabilities.graphics
        .deviceMemoryGigabytes !== null &&
      capabilities.graphics
        .deviceMemoryGigabytes <= 4
    );

  const extremePixelCost =
    pixelCount >= 65_000_000;
  const elevatedPixelCost =
    pixelCount >= 24_000_000;

  let quality = policy.quality;
  if (
    quality === 'ultra' &&
    (
      constrainedHardware ||
      extremePixelCost
    )
  ) {
    quality = 'balanced';
  }
  if (
    quality === 'balanced' &&
    constrainedHardware &&
    elevatedPixelCost
  ) {
    quality = 'minimal';
  }

  const useWebGL =
    quality !== 'minimal' &&
    capabilities.graphics.webgl2 &&
    policy.allowEnvironmentEffects &&
    !capabilities.preferences.forcedColors;

  const resolutionCost =
    resolution === '12k'
      ? 0.62
      : resolution === '8k'
        ? 0.74
        : resolution === '4k'
          ? 0.9
          : 1;

  const particleBudget = Math.round(
    (
      quality === 'ultra'
        ? 1_600
        : quality === 'balanced'
          ? 640
          : 0
    ) * resolutionCost,
  );

  const maximumDevicePixelRatio =
    resolution === '12k' || resolution === '8k'
      ? 1.25
      : resolution === '4k'
        ? 1.75
        : quality === 'ultra'
          ? 2.5
          : quality === 'balanced'
            ? 2
            : 1.5;

  return Object.freeze({
    id:
      `qcq.rendering.${resolution}.${quality}.${policy.motion}`,
    resolution,
    quality,
    motion: policy.motion,
    particleBudget,
    glowLayers:
      quality === 'ultra'
        ? 4
        : quality === 'balanced'
          ? 2
          : 1,
    blurRadiusScale:
      (
        quality === 'ultra'
          ? 1
          : quality === 'balanced'
            ? 0.72
            : 0.35
      ) * resolutionCost,
    reflectionScale:
      policy.allowEnvironmentEffects
        ? (
            quality === 'ultra'
              ? 1
              : quality === 'balanced'
                ? 0.7
                : 0.25
          )
        : 0,
    atmosphereScale:
      policy.allowEnvironmentEffects
        ? (
            quality === 'ultra'
              ? 1
              : quality === 'balanced'
                ? 0.72
                : 0
          )
        : 0,
    useWebGL,
    useBackdropFilter:
      policy.allowBackdropFilter &&
      capabilities.browser.backdropFilter,
    useContentVisibility:
      capabilities.browser.contentVisibility,
    maximumDevicePixelRatio,
    suspendWhenHidden: true,
  });
}
