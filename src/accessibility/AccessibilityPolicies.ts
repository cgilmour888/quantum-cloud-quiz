import {
  type RuntimeCapabilities,
} from '../runtime/RuntimeCapabilities';

export interface AccessibilityPolicy {
  readonly minimumInteractiveTarget: number;
  readonly forceReducedMotion: boolean;
  readonly forceOpaqueSurfaces: boolean;
  readonly forcedColors: boolean;
  readonly announceRuntimeState: boolean;
  readonly requireSkipLink: boolean;
  readonly requireSinglePrimaryMain: boolean;
}

export function resolveAccessibilityPolicy(
  capabilities: RuntimeCapabilities,
): AccessibilityPolicy {
  return Object.freeze({
    minimumInteractiveTarget:
      capabilities.preferences.highContrast
        ? 48
        : 44,
    forceReducedMotion:
      capabilities.preferences.reducedMotion,
    forceOpaqueSurfaces:
      capabilities.preferences.forcedColors,
    forcedColors:
      capabilities.preferences.forcedColors,
    announceRuntimeState: true,
    requireSkipLink: true,
    requireSinglePrimaryMain: true,
  });
}
