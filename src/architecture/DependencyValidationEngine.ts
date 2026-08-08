/**
 * Artifact ID: QCQ-ARC-005
 * Artifact Name: DependencyValidationEngine
 * Artifact Purpose: Dependency integrity authority validating existence, direction, cycles, layer restrictions, optionality, and dependency ownership boundaries.
 * Artifact Layer: Architecture / DPN
 * Artifact Dependencies: QCQ-ARC-001, QCQ-ARC-002, QCQ-ARC-003
 * Artifact Dependents: QCQ-ARC-006, QCQ-ARC-009, QCQ-ARC-010
 * Dependency Graph: OwnershipRegistry + Manifest + Policy -> DependencyValidationEngine -> compliance/conflict/readiness
 * Repository Path: QCQ/frontend/src/architecture
 * Source File: DependencyValidationEngine.ts
 */

import type {
  ArtifactRegistration,
  OwnershipRegistrySnapshot,
} from './OwnershipRegistry';
import {
  LAYER_DEPENDENCY_RULES,
  type ArchitecturalDependency,
} from './OwnershipManifest';
import { ArchitecturalPolicyEngine } from './ArchitecturalPolicyEngine';

export type DependencyIssueSeverity =
  | 'constitutional'
  | 'error'
  | 'warning'
  | 'info';

export interface DependencyIssue {
  readonly code: string;
  readonly severity: DependencyIssueSeverity;
  readonly fromArtifactId: string;
  readonly toArtifactId: string;
  readonly message: string;
}

export interface DependencyValidationReport {
  readonly valid: boolean;
  readonly generatedAt: number;
  readonly issues: readonly DependencyIssue[];
  readonly artifactCount: number;
  readonly edgeCount: number;
  readonly cycleCount: number;
  readonly topologicalOrder: readonly string[];
}

interface VisitState {
  readonly visiting: Set<string>;
  readonly visited: Set<string>;
  readonly order: string[];
  readonly cycles: string[][];
}

function issue(
  code: string,
  severity: DependencyIssueSeverity,
  fromArtifactId: string,
  toArtifactId: string,
  message: string,
): DependencyIssue {
  return Object.freeze({
    code,
    severity,
    fromArtifactId,
    toArtifactId,
    message,
  });
}

export class DependencyValidationEngine {
  public constructor(
    private readonly policyEngine: ArchitecturalPolicyEngine,
  ) {}

  public validate(
    snapshot: OwnershipRegistrySnapshot,
  ): DependencyValidationReport {
    const issues: DependencyIssue[] = [];
    const artifacts = new Map(
      snapshot.artifacts.map(
        (registration) => [
          registration.descriptor.artifactId,
          registration,
        ] as const,
      ),
    );

    let edgeCount = 0;
    for (const registration of snapshot.artifacts) {
      for (const dependency of registration.descriptor.dependencies) {
        edgeCount += 1;
        this.validateEdge(
          registration,
          dependency,
          artifacts,
          issues,
        );
      }
    }

    const { cycles, order } = this.topologicalAnalysis(
      snapshot.artifacts,
    );
    for (const cycle of cycles) {
      issues.push(
        issue(
          'ARC-DPN-020',
          'error',
          cycle[0] ?? 'unknown',
          cycle[cycle.length - 1] ?? 'unknown',
          `Runtime dependency cycle detected: ${cycle.join(' -> ')}.`,
        ),
      );
    }

    return Object.freeze({
      valid: !issues.some(
        (entry) =>
          entry.severity === 'constitutional' ||
          entry.severity === 'error',
      ),
      generatedAt: Date.now(),
      issues: Object.freeze(issues),
      artifactCount: snapshot.artifacts.length,
      edgeCount,
      cycleCount: cycles.length,
      topologicalOrder: Object.freeze(order),
    });
  }

  private validateEdge(
    fromRegistration: ArtifactRegistration,
    dependency: ArchitecturalDependency,
    artifacts: ReadonlyMap<string, ArtifactRegistration>,
    issues: DependencyIssue[],
  ): void {
    const from = fromRegistration.descriptor;
    const toRegistration = artifacts.get(dependency.toArtifactId);

    if (dependency.fromArtifactId !== from.artifactId) {
      issues.push(
        issue(
          'ARC-DPN-001',
          'error',
          dependency.fromArtifactId,
          dependency.toArtifactId,
          `Dependency origin does not match containing artifact ${from.artifactId}.`,
        ),
      );
      return;
    }

    if (dependency.toArtifactId === from.artifactId) {
      issues.push(
        issue(
          'ARC-DPN-002',
          'error',
          from.artifactId,
          from.artifactId,
          'Self dependencies are prohibited.',
        ),
      );
      return;
    }

    if (!toRegistration) {
      issues.push(
        issue(
          dependency.required ? 'ARC-DPN-003' : 'ARC-DPN-004',
          dependency.required ? 'error' : 'warning',
          from.artifactId,
          dependency.toArtifactId,
          `${dependency.required ? 'Required' : 'Optional'} dependency is not registered.`,
        ),
      );
      return;
    }

    const to = toRegistration.descriptor;
    const explicitLayerRule = LAYER_DEPENDENCY_RULES.find(
      (rule) =>
        rule.from === from.layer &&
        rule.to === to.layer,
    );
    if (explicitLayerRule && !explicitLayerRule.allowed) {
      issues.push(
        issue(
          'ARC-DPN-005',
          'constitutional',
          from.artifactId,
          to.artifactId,
          explicitLayerRule.rationale,
        ),
      );
    }

    const policy = this.policyEngine.evaluate({
      type: 'dependency',
      dependency,
      from,
      to,
    });
    for (const finding of policy.findings) {
      if (finding.decision === 'deny') {
        issues.push(
          issue(
            `ARC-DPN-POL-${finding.code}`,
            finding.severity === 'constitutional'
              ? 'constitutional'
              : 'error',
            from.artifactId,
            to.artifactId,
            finding.message,
          ),
        );
      }
    }
  }

  private topologicalAnalysis(
    registrations: readonly ArtifactRegistration[],
  ): {
    readonly cycles: readonly (readonly string[])[];
    readonly order: readonly string[];
  } {
    const graph = new Map<string, readonly string[]>();
    for (const registration of registrations) {
      graph.set(
        registration.descriptor.artifactId,
        registration.descriptor.dependencies
          .filter(
            (dependency) =>
              dependency.kind === 'runtime' ||
              dependency.kind === 'configuration' ||
              dependency.kind === 'integration',
          )
          .map((dependency) => dependency.toArtifactId),
      );
    }

    const state: VisitState = {
      visiting: new Set(),
      visited: new Set(),
      order: [],
      cycles: [],
    };
    const stack: string[] = [];

    const visit = (node: string): void => {
      if (state.visited.has(node)) return;
      if (state.visiting.has(node)) {
        const index = stack.indexOf(node);
        state.cycles.push(
          index >= 0
            ? [...stack.slice(index), node]
            : [node, node],
        );
        return;
      }

      state.visiting.add(node);
      stack.push(node);
      for (const dependency of graph.get(node) ?? []) {
        if (graph.has(dependency)) visit(dependency);
      }
      stack.pop();
      state.visiting.delete(node);
      state.visited.add(node);
      state.order.push(node);
    };

    for (const node of graph.keys()) visit(node);

    return {
      cycles: Object.freeze(
        state.cycles.map((cycle) => Object.freeze(cycle)),
      ),
      order: Object.freeze(state.order),
    };
  }
}
