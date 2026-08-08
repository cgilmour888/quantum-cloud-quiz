import {
  type AccessibilityValidationResult,
} from '../accessibility/AccessibilityValidator';
import {
  type BootstrapHealthSnapshot,
} from '../bootstrap/BootstrapHealthMonitor';
import {
  type ProviderValidationResult,
} from '../providers/ProviderValidationEngine';
import {
  type ResolvedRenderingPolicy,
} from '../rendering/RenderingPolicies';
import {
  type RuntimeValidationResult,
} from './RuntimeValidationEngine';

export type RuntimeReadinessState =
  | 'ready'
  | 'degraded'
  | 'blocked';

export interface RuntimeReadinessResult {
  readonly state: RuntimeReadinessState;
  readonly score: number;
  readonly evaluatedAt: number;
  readonly blockers: readonly string[];
  readonly warnings: readonly string[];
}

export interface RuntimeReadinessInput {
  readonly runtime:
    RuntimeValidationResult;
  readonly accessibility:
    AccessibilityValidationResult;
  readonly providers:
    ProviderValidationResult;
  readonly health:
    BootstrapHealthSnapshot;
  readonly rendering:
    ResolvedRenderingPolicy;
}

export function evaluateRuntimeReadiness(
  input: RuntimeReadinessInput,
): RuntimeReadinessResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  if (!input.runtime.valid) {
    blockers.push(
      'Runtime validation failed.',
    );
    score -= 40;
  }

  if (!input.accessibility.valid) {
    blockers.push(
      'Accessibility validation failed.',
    );
    score -= 30;
  }

  if (!input.providers.valid) {
    blockers.push(
      'Provider validation failed.',
    );
    score -= 20;
  }

  if (
    input.health.state === 'unhealthy'
  ) {
    blockers.push(
      'Bootstrap health is unhealthy.',
    );
    score -= 30;
  } else if (
    input.health.state === 'degraded'
  ) {
    warnings.push(
      'Bootstrap health is degraded.',
    );
    score -= 10;
  } else if (
    input.health.state === 'unknown'
  ) {
    warnings.push(
      'Bootstrap health has not completed.',
    );
    score -= 5;
  }

  if (
    input.rendering.profile.tier ===
    'foundation'
  ) {
    warnings.push(
      'Rendering is operating in foundation tier.',
    );
    score -= 5;
  }

  score =
    Math.max(0, Math.min(100, score));

  return Object.freeze({
    state:
      blockers.length > 0
        ? 'blocked'
        : warnings.length > 0
          ? 'degraded'
          : 'ready',
    score,
    evaluatedAt: Date.now(),
    blockers: Object.freeze(blockers),
    warnings: Object.freeze(warnings),
  });
}
