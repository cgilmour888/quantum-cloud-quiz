/**
 * Artifact ID: QCQ-TBL-075
 * Artifact Name: EffectsValidator
 * Artifact Purpose: Structural and runtime validation authority for registrations, dependency integrity, budgets, configuration safety, and ownership invariants.
 * Artifact Layer: Premium Effects / VAL
 * Artifact Dependencies: QCQ-TBL-065, QCQ-TBL-066, QCQ-TBL-074
 * Artifact Dependents: QCQ-TBL-076, QCQ-TBL-077
 * Dependency Graph: manifest + registry + budget -> EffectsValidator -> compliance/readiness
 * Repository Path: QCQ/frontend/src/effects/validation
 * Source File: EffectsValidator.ts
 */

import { EFFECTS_MANIFEST, type EffectKey } from '../governance/EffectsManifest';
import type { EffectsRegistry } from '../governance/EffectsRegistry';
import type { EffectsBudgetSnapshot } from '../performance/EffectsBudgetManager';

export type EffectsValidationSeverity = 'error' | 'warning' | 'info';

export interface EffectsValidationIssue {
  readonly code: string;
  readonly severity: EffectsValidationSeverity;
  readonly message: string;
  readonly effect?: EffectKey;
}

export interface EffectsValidationReport {
  readonly valid: boolean;
  readonly generatedAt: number;
  readonly issues: readonly EffectsValidationIssue[];
  readonly registeredEffects: number;
  readonly requiredEffectsSatisfied: boolean;
  readonly dependencyClosureSatisfied: boolean;
  readonly budgetSatisfied: boolean;
}

export interface EffectsValidationInput {
  readonly registry: EffectsRegistry;
  readonly budget?: EffectsBudgetSnapshot;
}

export function validateEffects(
  input: EffectsValidationInput,
): EffectsValidationReport {
  const issues: EffectsValidationIssue[] = [];
  const entries = input.registry.list();
  const knownIds = new Set<string>();

  for (const entry of entries) {
    const descriptor = entry.descriptor;
    if (knownIds.has(descriptor.artifactId)) {
      issues.push({
        code: 'FX-ID-DUPLICATE',
        severity: 'error',
        message: `Duplicate effect artifact ID ${descriptor.artifactId}.`,
        effect: descriptor.key,
      });
    }
    knownIds.add(descriptor.artifactId);

    if (!descriptor.decorative || !descriptor.pointerTransparent || !descriptor.assistiveTechnologyHidden) {
      issues.push({
        code: 'FX-DECORATIVE-CONTRACT',
        severity: 'error',
        message: `${descriptor.key} violates the decorative-effects contract.`,
        effect: descriptor.key,
      });
    }
    if (entry.status === 'unavailable' && descriptor.required) {
      issues.push({
        code: 'FX-REQUIRED-UNAVAILABLE',
        severity: 'error',
        message: `Required effect ${descriptor.key} is unavailable.`,
        effect: descriptor.key,
      });
    }
  }

  const dependencyIssues = input.registry.validateDependencyClosure();
  for (const message of dependencyIssues) {
    issues.push({ code: 'FX-DEPENDENCY', severity: 'error', message });
  }

  const registeredKeys = new Set(entries.map((entry) => entry.descriptor.key));
  for (const descriptor of EFFECTS_MANIFEST.effects) {
    if (descriptor.required && !registeredKeys.has(descriptor.key)) {
      issues.push({
        code: 'FX-REQUIRED-MISSING',
        severity: 'error',
        message: `Required built-in effect ${descriptor.key} is not registered.`,
        effect: descriptor.key,
      });
    }
  }

  if (input.budget && !input.budget.withinBudget) {
    for (const message of input.budget.violations) {
      issues.push({ code: 'FX-BUDGET', severity: 'error', message });
    }
  }

  const requiredEffectsSatisfied = !issues.some((issue) =>
    issue.code === 'FX-REQUIRED-UNAVAILABLE' || issue.code === 'FX-REQUIRED-MISSING');
  const dependencyClosureSatisfied = dependencyIssues.length === 0;
  const budgetSatisfied = input.budget?.withinBudget ?? true;

  return Object.freeze({
    valid: !issues.some((issue) => issue.severity === 'error'),
    generatedAt: Date.now(),
    issues: Object.freeze(issues),
    registeredEffects: entries.length,
    requiredEffectsSatisfied,
    dependencyClosureSatisfied,
    budgetSatisfied,
  });
}
