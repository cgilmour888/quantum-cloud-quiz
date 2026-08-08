export type ProviderDomain =
  | 'runtime'
  | 'persistence'
  | 'leaderboard'
  | 'gamification'
  | 'ai'
  | 'analytics'
  | 'organization'
  | 'saas';

export type ProviderCriticality =
  | 'required'
  | 'optional';

export interface ProviderDescriptor {
  readonly id: string;
  readonly domain: ProviderDomain;
  readonly version: string;
  readonly minimumRuntimeVersion: string;
  readonly criticality: ProviderCriticality;
  readonly capabilities: readonly string[];
  readonly dependencies: readonly string[];
}

export interface ProviderManifestContract {
  readonly artifactId: 'QCQ-STEP2-036';
  readonly schemaVersion: '1.0.0';
  readonly runtimeVersion: '1.0.0';
  readonly maximumProviders: 500_000;
  readonly domains: readonly ProviderDomain[];
  readonly principles: readonly string[];
}

export const PROVIDER_MANIFEST:
  ProviderManifestContract = Object.freeze({
    artifactId: 'QCQ-STEP2-036',
    schemaVersion: '1.0.0',
    runtimeVersion: '1.0.0',
    maximumProviders: 500_000,
    domains: Object.freeze([
      'runtime',
      'persistence',
      'leaderboard',
      'gamification',
      'ai',
      'analytics',
      'organization',
      'saas',
    ] satisfies readonly ProviderDomain[]),
    principles: Object.freeze([
      'Step 2 composes providers but does not duplicate provider-domain ownership.',
      'Providers require explicit registration.',
      'Provider identifiers are unique.',
      'Provider compatibility is validated before readiness.',
      'Optional future domains may remain unregistered without blocking the executable foundation.',
    ]),
  });
