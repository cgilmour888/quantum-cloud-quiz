import {
  type RenderingResolutionClass,
  type RenderingTier,
} from './RenderingManifest';

export interface RenderingProfile {
  readonly id: string;
  readonly tier: RenderingTier;
  readonly resolution:
    RenderingResolutionClass;
  readonly maximumDevicePixelRatio: number;
  readonly particleBudget: number;
  readonly glowLayers: number;
  readonly reflectionScale: number;
  readonly atmosphereScale: number;
  readonly animationScale: number;
  readonly allowWebGL: boolean;
  readonly allowBackdropFilter: boolean;
}

export function classifyRenderingResolution(
  width: number,
): RenderingResolutionClass {
  if (width >= 11_520) return '12k';
  if (width >= 7_680) return '8k';
  if (width >= 3_840) return '4k';
  if (width >= 2_560) return 'qhd';
  return 'hd';
}

export function createRenderingProfile(
  tier: RenderingTier,
  resolution: RenderingResolutionClass,
): RenderingProfile {
  const pixelCost =
    resolution === '12k'
      ? 0.55
      : resolution === '8k'
        ? 0.68
        : resolution === '4k'
          ? 0.84
          : 1;

  const particleBase =
    tier === 'cinematic'
      ? 1_800
      : tier === 'balanced'
        ? 720
        : 0;

  const maximumDevicePixelRatio =
    resolution === '12k'
      ? 1
      : resolution === '8k'
        ? 1.25
        : resolution === '4k'
          ? 1.75
          : tier === 'cinematic'
            ? 2.5
            : 2;

  return Object.freeze({
    id:
      `qcq.render.${tier}.${resolution}`,
    tier,
    resolution,
    maximumDevicePixelRatio,
    particleBudget:
      Math.round(
        particleBase * pixelCost,
      ),
    glowLayers:
      tier === 'cinematic'
        ? 4
        : tier === 'balanced'
          ? 2
          : 1,
    reflectionScale:
      (
        tier === 'cinematic'
          ? 1
          : tier === 'balanced'
            ? 0.65
            : 0
      ) * pixelCost,
    atmosphereScale:
      (
        tier === 'cinematic'
          ? 1
          : tier === 'balanced'
            ? 0.7
            : 0
      ) * pixelCost,
    animationScale:
      tier === 'foundation'
        ? 0
        : tier === 'balanced'
          ? 0.7
          : 1,
    allowWebGL:
      tier !== 'foundation',
    allowBackdropFilter:
      tier !== 'foundation',
  });
}
