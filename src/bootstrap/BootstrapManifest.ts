export type BootstrapPhase =
  | 'preflight'
  | 'runtime'
  | 'providers'
  | 'accessibility'
  | 'rendering'
  | 'application';

export type BootstrapCriticality =
  | 'required'
  | 'important'
  | 'optional';

export interface BootstrapStepDescriptor {
  readonly id: string;
  readonly phase: BootstrapPhase;
  readonly criticality: BootstrapCriticality;
  readonly dependencies: readonly string[];
  readonly timeoutMilliseconds: number;
}

export interface BootstrapManifestContract {
  readonly artifactId: 'QCQ-STEP2-020';
  readonly schemaVersion: '1.0.0';
  readonly phases: readonly BootstrapPhase[];
  readonly maximumSteps: 500_000;
  readonly defaultStepTimeoutMilliseconds: 4_000;
  readonly invariants: readonly string[];
}

export const BOOTSTRAP_MANIFEST:
  BootstrapManifestContract = Object.freeze({
    artifactId: 'QCQ-STEP2-020',
    schemaVersion: '1.0.0',
    phases: Object.freeze([
      'preflight',
      'runtime',
      'providers',
      'accessibility',
      'rendering',
      'application',
    ] satisfies readonly BootstrapPhase[]),
    maximumSteps: 500_000,
    defaultStepTimeoutMilliseconds: 4_000,
    invariants: Object.freeze([
      'Required bootstrap steps cannot be skipped.',
      'Duplicate bootstrap identifiers are rejected.',
      'Required step failure prevents ready state.',
      'Bootstrap telemetry remains local unless an explicit governed sink is injected.',
      'Bootstrap cannot mutate feature-domain data.',
    ]),
  });
