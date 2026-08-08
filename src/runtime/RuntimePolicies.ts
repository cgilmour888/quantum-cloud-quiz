import {
  type RuntimeChannel,
  type RuntimeConfig,
} from '../config/runtimeConfig';
import {
  type RuntimeCapabilities,
} from './RuntimeCapabilities';

export type RuntimeDiagnosticLevel =
  | 'minimal'
  | 'standard'
  | 'verbose';

export interface ResolvedRuntimePolicy {
  readonly channel: RuntimeChannel;
  readonly failClosedOnCriticalValidation: boolean;
  readonly allowRecoveryCheckpoint: boolean;
  readonly allowRemoteTelemetry: boolean;
  readonly allowServiceWorker: boolean;
  readonly requireSecureContext: boolean;
  readonly diagnosticLevel: RuntimeDiagnosticLevel;
  readonly maximumBootstrapMilliseconds: number;
  readonly maximumRecoveryAttempts: number;
}

export function resolveRuntimePolicies(
  config: RuntimeConfig,
  capabilities: RuntimeCapabilities,
): ResolvedRuntimePolicy {
  const production =
    config.channel === 'production';
  const preview =
    config.channel === 'preview';

  return Object.freeze({
    channel: config.channel,
    failClosedOnCriticalValidation:
      production || preview,
    allowRecoveryCheckpoint:
      capabilities.storage.sessionStorage,
    allowRemoteTelemetry:
      config.features.remoteTelemetry,
    allowServiceWorker:
      capabilities.connectivity.serviceWorker &&
      (
        production ||
        preview
      ),
    requireSecureContext:
      production || preview,
    diagnosticLevel:
      config.channel === 'development'
        ? 'verbose'
        : config.channel === 'test'
          ? 'standard'
          : 'minimal',
    maximumBootstrapMilliseconds:
      production ? 8_000 : 15_000,
    maximumRecoveryAttempts: 2,
  });
}
