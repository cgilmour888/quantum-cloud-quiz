import {
  RUNTIME_MANIFEST,
  type RuntimeModuleKind,
} from './RuntimeManifest';
import {
  type RuntimeRegistry,
} from './RuntimeRegistry';
import {
  type RuntimeCapabilities,
} from './RuntimeCapabilities';
import {
  type ResolvedRuntimePolicy,
} from './RuntimePolicies';
import {
  validateRuntimeDependencyGraph,
} from './RuntimeDependencyGraph';

export interface RuntimeValidationIssue {
  readonly code:
    | 'registry-unsealed'
    | 'missing-module-kind'
    | 'dependency-graph-invalid'
    | 'insecure-context'
    | 'missing-mount-root';
  readonly severity: 'error' | 'warning';
  readonly message: string;
}

export interface RuntimeValidationResult {
  readonly valid: boolean;
  readonly checkedAt: number;
  readonly issues:
    readonly RuntimeValidationIssue[];
  readonly dependencyOrder:
    readonly string[];
}

export function validateRuntime(
  registry: RuntimeRegistry,
  capabilities: RuntimeCapabilities,
  policy: ResolvedRuntimePolicy,
  documentRoot:
    Document | null =
    typeof document === 'undefined'
      ? null
      : document,
): RuntimeValidationResult {
  const issues:
    RuntimeValidationIssue[] = [];

  if (!registry.sealed) {
    issues.push({
      code: 'registry-unsealed',
      severity: 'error',
      message:
        'Foundation RuntimeRegistry must be sealed before readiness evaluation.',
    });
  }

  const modules = registry.list();
  const kinds = new Set<RuntimeModuleKind>(
    modules.map((module) => module.kind),
  );

  for (
    const requiredKind of
    RUNTIME_MANIFEST.requiredModuleKinds
  ) {
    if (!kinds.has(requiredKind)) {
      issues.push({
        code: 'missing-module-kind',
        severity: 'error',
        message:
          `Required runtime module kind "${requiredKind}" is not registered.`,
      });
    }
  }

  const graph =
    validateRuntimeDependencyGraph(modules);

  if (!graph.valid) {
    issues.push({
      code: 'dependency-graph-invalid',
      severity: 'error',
      message:
        `Runtime dependency graph has ${graph.missingDependencies.length} missing dependencies and ${graph.cycles.length} cycles.`,
    });
  }

  if (
    policy.requireSecureContext &&
    !capabilities.browser.secureContext
  ) {
    issues.push({
      code: 'insecure-context',
      severity: 'error',
      message:
        'Preview and production channels require a secure browser context.',
    });
  }

  if (
    documentRoot !== null &&
    documentRoot.getElementById('root') ===
      null
  ) {
    issues.push({
      code: 'missing-mount-root',
      severity: 'error',
      message:
        'The #root mount element is missing.',
    });
  }

  return Object.freeze({
    valid:
      !issues.some(
        (issue) =>
          issue.severity === 'error',
      ),
    checkedAt: Date.now(),
    issues: Object.freeze(
      issues.map(
        (issue) => Object.freeze(issue),
      ),
    ),
    dependencyOrder: graph.ordered,
  });
}
