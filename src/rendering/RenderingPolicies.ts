import {
  type RuntimeConfig,
} from '../config/runtimeConfig';
import {
  type RenderingCapabilities,
} from './RenderingCapabilities';
import {
  RENDERING_MANIFEST,
  type RenderingTier,
} from './RenderingManifest';
import {
  classifyRenderingResolution,
  createRenderingProfile,
  type RenderingProfile,
} from './RenderingProfiles';

export interface RenderingPolicyInput {
  readonly width: number;
  readonly height: number;
  readonly requestedTier?:
    RenderingTier | undefined;
}

export interface ResolvedRenderingPolicy {
  readonly profile: RenderingProfile;
  readonly effectsEnabled: boolean;
  readonly motionEnabled: boolean;
  readonly forcedColors: boolean;
}

export function resolveRenderingPolicy(
  input: RenderingPolicyInput,
  capabilities: RenderingCapabilities,
  config: RuntimeConfig,
): ResolvedRenderingPolicy {
  const resolution =
    classifyRenderingResolution(
      input.width,
    );

  let tier =
    input.requestedTier ??
    RENDERING_MANIFEST.defaultTier;

  const constrainedHardware =
    capabilities.hardwareConcurrency <= 4 ||
    (
      capabilities.deviceMemoryGigabytes !==
        null &&
      capabilities.deviceMemoryGigabytes <= 4
    );

  if (
    tier === 'cinematic' &&
    constrainedHardware
  ) {
    tier = 'balanced';
  }

  if (
    capabilities.forcedColors ||
    !config.features.cinematicEffects
  ) {
    tier = 'foundation';
  }

  const baseProfile =
    createRenderingProfile(
      tier,
      resolution,
    );

  const profile =
    Object.freeze({
      ...baseProfile,
      allowWebGL:
        baseProfile.allowWebGL &&
        capabilities.webgl2,
      allowBackdropFilter:
        baseProfile.allowBackdropFilter &&
        capabilities.cssBackdropFilter &&
        !capabilities.reducedTransparency,
      animationScale:
        capabilities.reducedMotion
          ? 0
          : baseProfile.animationScale,
    });

  return Object.freeze({
    profile,
    effectsEnabled:
      profile.tier !== 'foundation',
    motionEnabled:
      profile.animationScale > 0,
    forcedColors:
      capabilities.forcedColors,
  });
}
