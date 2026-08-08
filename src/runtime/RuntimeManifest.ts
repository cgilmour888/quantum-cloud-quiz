export type RuntimeModuleKind =
  | 'bootstrap'
  | 'runtime'
  | 'rendering'
  | 'accessibility'
  | 'provider'
  | 'application';

export type RuntimeModuleCriticality =
  | 'required'
  | 'important'
  | 'optional';

export interface RuntimeVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

export interface RuntimeModuleDescriptor {
  readonly id: string;
  readonly artifactId: string;
  readonly name: string;
  readonly kind: RuntimeModuleKind;
  readonly version: string;
  readonly criticality: RuntimeModuleCriticality;
  readonly dependencies: readonly string[];
  readonly capabilities: readonly string[];
}

export interface RuntimeManifestContract {
  readonly artifactId: 'QCQ-STEP2-016';
  readonly schemaVersion: '1.0.0';
  readonly packageVersion: '1.0.0';
  readonly applicationPackage: 'quantum-cloud-quiz-native';
  readonly executionModel: 'browser-spa';
  readonly minimumNodeVersion: '20.19.0';
  readonly maximumRegistryCapacity: 500_000;
  readonly requiredModuleKinds: readonly RuntimeModuleKind[];
  readonly invariants: readonly string[];
}

export const RUNTIME_MANIFEST: RuntimeManifestContract =
  Object.freeze({
    artifactId: 'QCQ-STEP2-016',
    schemaVersion: '1.0.0',
    packageVersion: '1.0.0',
    applicationPackage: 'quantum-cloud-quiz-native',
    executionModel: 'browser-spa',
    minimumNodeVersion: '20.19.0',
    maximumRegistryCapacity: 500_000,
    requiredModuleKinds: Object.freeze([
      'bootstrap',
      'runtime',
      'rendering',
      'accessibility',
      'provider',
      'application',
    ] satisfies readonly RuntimeModuleKind[]),
    invariants: Object.freeze([
      'Step 2 owns execution infrastructure and must not duplicate feature-domain authorities.',
      'Runtime registries reject duplicate identifiers.',
      'Critical runtime validation must complete before readiness is declared.',
      'Remote telemetry is disabled unless a later governed integration explicitly injects a sink.',
      'MASTER artwork is never a runtime implementation asset.',
      'Rendering policy may adapt quality without changing feature-domain state.',
      'Accessibility preferences override decorative rendering behavior.',
      'Provider registration cannot bypass compatibility and validation engines.',
    ]),
  });

export function parseRuntimeVersion(
  value: string,
): RuntimeVersion {
  const match =
    /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(value.trim());

  if (match === null) {
    throw new Error(
      `Invalid semantic version: "${value}".`,
    );
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  if (
    !Number.isSafeInteger(major) ||
    !Number.isSafeInteger(minor) ||
    !Number.isSafeInteger(patch)
  ) {
    throw new Error(
      `Semantic version is outside the supported integer range: "${value}".`,
    );
  }

  return Object.freeze({
    major,
    minor,
    patch,
  });
}
