import {
  PROVIDER_MANIFEST,
  type ProviderDescriptor,
} from './ProviderManifest';
import {
  type ProviderRegistry,
} from './ProviderRegistry';
import {
  evaluateProviderCompatibility,
  type ProviderCompatibilityResult,
} from './ProviderCompatibilityEngine';

export interface ProviderValidationIssue {
  readonly providerId: string;
  readonly severity: 'error' | 'warning';
  readonly message: string;
}

export interface ProviderValidationResult {
  readonly valid: boolean;
  readonly compatibility:
    readonly ProviderCompatibilityResult[];
  readonly issues:
    readonly ProviderValidationIssue[];
}

function validateDescriptor(
  descriptor: ProviderDescriptor,
): readonly ProviderValidationIssue[] {
  const issues:
    ProviderValidationIssue[] = [];

  if (descriptor.id.trim() === '') {
    issues.push({
      providerId: descriptor.id,
      severity: 'error',
      message:
        'Provider id cannot be empty.',
    });
  }

  if (
    !PROVIDER_MANIFEST.domains.includes(
      descriptor.domain,
    )
  ) {
    issues.push({
      providerId: descriptor.id,
      severity: 'error',
      message:
        `Unsupported provider domain "${descriptor.domain}".`,
    });
  }

  if (
    new Set(
      descriptor.dependencies,
    ).size !==
    descriptor.dependencies.length
  ) {
    issues.push({
      providerId: descriptor.id,
      severity: 'error',
      message:
        'Provider dependencies contain duplicates.',
    });
  }

  return Object.freeze(
    issues.map(
      (issue) => Object.freeze(issue),
    ),
  );
}

export function validateProviders(
  registry: ProviderRegistry,
  runtimeVersion =
    PROVIDER_MANIFEST.runtimeVersion,
): ProviderValidationResult {
  const providers = registry.list();
  const ids =
    new Set(
      providers.map(
        (provider) =>
          provider.descriptor.id,
      ),
    );
  const compatibility:
    ProviderCompatibilityResult[] = [];
  const issues:
    ProviderValidationIssue[] = [];

  for (const provider of providers) {
    const { descriptor } = provider;

    issues.push(
      ...validateDescriptor(descriptor),
    );

    const compatibilityResult =
      evaluateProviderCompatibility(
        descriptor,
        runtimeVersion,
      );
    compatibility.push(
      compatibilityResult,
    );

    if (!compatibilityResult.compatible) {
      issues.push({
        providerId: descriptor.id,
        severity:
          descriptor.criticality ===
          'required'
            ? 'error'
            : 'warning',
        message:
          compatibilityResult.reason,
      });
    }

    for (
      const dependency of descriptor.dependencies
    ) {
      if (!ids.has(dependency)) {
        issues.push({
          providerId: descriptor.id,
          severity:
            descriptor.criticality ===
            'required'
              ? 'error'
              : 'warning',
          message:
            `Provider dependency "${dependency}" is not registered.`,
        });
      }
    }

    if (
      provider.health() === 'unhealthy'
    ) {
      issues.push({
        providerId: descriptor.id,
        severity:
          descriptor.criticality ===
          'required'
            ? 'error'
            : 'warning',
        message:
          'Provider reports unhealthy state.',
      });
    }
  }

  return Object.freeze({
    valid:
      !issues.some(
        (issue) =>
          issue.severity === 'error',
      ),
    compatibility:
      Object.freeze(compatibility),
    issues: Object.freeze(
      issues.map(
        (issue) => Object.freeze(issue),
      ),
    ),
  });
}
