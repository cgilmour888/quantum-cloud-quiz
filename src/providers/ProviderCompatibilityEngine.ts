import {
  parseRuntimeVersion,
} from '../runtime/RuntimeManifest';
import {
  type ProviderDescriptor,
} from './ProviderManifest';

export interface ProviderCompatibilityResult {
  readonly providerId: string;
  readonly compatible: boolean;
  readonly runtimeVersion: string;
  readonly minimumRuntimeVersion: string;
  readonly reason: string;
}

function compareVersions(
  left: string,
  right: string,
): number {
  const a = parseRuntimeVersion(left);
  const b = parseRuntimeVersion(right);

  if (a.major !== b.major) {
    return a.major - b.major;
  }
  if (a.minor !== b.minor) {
    return a.minor - b.minor;
  }
  return a.patch - b.patch;
}

export function evaluateProviderCompatibility(
  provider: ProviderDescriptor,
  runtimeVersion: string,
): ProviderCompatibilityResult {
  const compatible =
    compareVersions(
      runtimeVersion,
      provider.minimumRuntimeVersion,
    ) >= 0;

  return Object.freeze({
    providerId: provider.id,
    compatible,
    runtimeVersion,
    minimumRuntimeVersion:
      provider.minimumRuntimeVersion,
    reason: compatible
      ? 'Provider runtime requirement is satisfied.'
      : `Provider requires runtime ${provider.minimumRuntimeVersion} or newer.`,
  });
}
