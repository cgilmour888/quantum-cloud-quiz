/**
 * Artifact ID: QCQ-CMP-005
 * Artifact Name: ComposerDependencyGraph
 * Repository Path: QCQ/frontend/src/composer/ComposerDependencyGraph.ts
 */

import {
  COMPOSER_LIMITS,
} from './ComposerConstants';
import type {
  ComposerManifest,
  ComposerManifestEntry,
} from './ComposerTypes';

export interface ComposerDependencyCycle {
  readonly path: readonly string[];
}

export interface ComposerDependencyAnalysis {
  readonly valid: boolean;
  readonly orderedArtifactIds: readonly string[];
  readonly missingDependencies: readonly {
    readonly artifactId: string;
    readonly dependencyId: string;
  }[];
  readonly cycles: readonly ComposerDependencyCycle[];
  readonly maximumDepth: number;
}

export class ComposerDependencyError extends Error {
  public constructor(
    message: string,
    public readonly code: string,
    public readonly details: readonly string[] = [],
  ) {
    super(message);
    this.name = 'ComposerDependencyError';
  }
}

function parseVersion(version: string): readonly number[] {
  const normalized = version
    .trim()
    .replace(/^v/u, '')
    .split(/[+-]/u, 1)[0] ?? '';
  return Object.freeze(
    normalized
      .split('.')
      .map((part) => Number.parseInt(part, 10))
      .map((part) => (Number.isFinite(part) ? part : 0)),
  );
}

export function compareComposerVersions(
  left: string,
  right: string,
): number {
  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;
    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }
  return 0;
}

export function isVersionCompatible(
  version: string,
  minimumVersion: string,
  maximumVersion: string | null,
): boolean {
  if (compareComposerVersions(version, minimumVersion) < 0) {
    return false;
  }
  return maximumVersion === null ||
    compareComposerVersions(version, maximumVersion) <= 0;
}

export class ComposerDependencyGraph {
  private readonly entries = new Map<string, ComposerManifestEntry>();
  private readonly dependents = new Map<string, Set<string>>();

  public constructor(manifest: ComposerManifest) {
    if (manifest.entries.length > COMPOSER_LIMITS.maximumManifestEntries) {
      throw new ComposerDependencyError(
        'Composer manifest exceeds the configured artifact ceiling.',
        'COMPOSER_MANIFEST_CAPACITY_EXCEEDED',
      );
    }

    for (const manifestEntry of manifest.entries) {
      if (this.entries.has(manifestEntry.artifactId)) {
        throw new ComposerDependencyError(
          `Duplicate artifact identifier ${manifestEntry.artifactId}.`,
          'COMPOSER_DUPLICATE_ARTIFACT',
          [manifestEntry.artifactId],
        );
      }
      this.entries.set(manifestEntry.artifactId, manifestEntry);
      this.dependents.set(manifestEntry.artifactId, new Set());
    }

    for (const manifestEntry of manifest.entries) {
      for (const dependencyId of manifestEntry.dependencies) {
        this.dependents.get(dependencyId)?.add(
          manifestEntry.artifactId,
        );
      }
    }
  }

  public has(artifactId: string): boolean {
    return this.entries.has(artifactId);
  }

  public get(artifactId: string): ComposerManifestEntry {
    const manifestEntry = this.entries.get(artifactId);
    if (!manifestEntry) {
      throw new ComposerDependencyError(
        `Unknown artifact ${artifactId}.`,
        'COMPOSER_UNKNOWN_ARTIFACT',
        [artifactId],
      );
    }
    return manifestEntry;
  }

  public dependenciesOf(
    artifactId: string,
    transitive = false,
  ): readonly string[] {
    const direct = this.get(artifactId).dependencies;
    if (!transitive) return direct;

    const result = new Set<string>();
    const visit = (currentId: string, depth: number): void => {
      if (depth > COMPOSER_LIMITS.maximumDependencyDepth) {
        throw new ComposerDependencyError(
          'Dependency traversal exceeded the configured maximum depth.',
          'COMPOSER_DEPENDENCY_DEPTH_EXCEEDED',
          [artifactId],
        );
      }
      const current = this.entries.get(currentId);
      if (!current) return;
      for (const dependencyId of current.dependencies) {
        if (result.has(dependencyId)) continue;
        result.add(dependencyId);
        visit(dependencyId, depth + 1);
      }
    };
    visit(artifactId, 0);
    return Object.freeze([...result]);
  }

  public dependentsOf(
    artifactId: string,
    transitive = false,
  ): readonly string[] {
    this.get(artifactId);
    const direct = this.dependents.get(artifactId) ?? new Set<string>();
    if (!transitive) return Object.freeze([...direct].sort());

    const result = new Set<string>();
    const visit = (currentId: string, depth: number): void => {
      if (depth > COMPOSER_LIMITS.maximumDependencyDepth) {
        throw new ComposerDependencyError(
          'Dependent traversal exceeded the configured maximum depth.',
          'COMPOSER_DEPENDENT_DEPTH_EXCEEDED',
          [artifactId],
        );
      }
      for (const dependentId of this.dependents.get(currentId) ?? []) {
        if (result.has(dependentId)) continue;
        result.add(dependentId);
        visit(dependentId, depth + 1);
      }
    };
    visit(artifactId, 0);
    return Object.freeze([...result].sort());
  }

  public analyze(
    options: {
      readonly allowMissingExternalDependencies?: boolean;
    } = {},
  ): ComposerDependencyAnalysis {
    const missingDependencies: Array<{
      readonly artifactId: string;
      readonly dependencyId: string;
    }> = [];

    for (const manifestEntry of this.entries.values()) {
      for (const dependencyId of manifestEntry.dependencies) {
        if (!this.entries.has(dependencyId)) {
          if (
            options.allowMissingExternalDependencies === true &&
            manifestEntry.registration === 'external'
          ) {
            continue;
          }
          missingDependencies.push(
            Object.freeze({
              artifactId: manifestEntry.artifactId,
              dependencyId,
            }),
          );
        }
      }
    }

    const cycles: ComposerDependencyCycle[] = [];
    const state = new Map<string, 'visiting' | 'visited'>();
    const stack: string[] = [];
    const ordered: string[] = [];
    let maximumDepth = 0;

    const visit = (artifactId: string, depth: number): void => {
      maximumDepth = Math.max(maximumDepth, depth);
      if (depth > COMPOSER_LIMITS.maximumDependencyDepth) {
        throw new ComposerDependencyError(
          'Dependency graph exceeded the configured maximum depth.',
          'COMPOSER_DEPENDENCY_DEPTH_EXCEEDED',
          [artifactId],
        );
      }

      const currentState = state.get(artifactId);
      if (currentState === 'visited') return;
      if (currentState === 'visiting') {
        const cycleStart = stack.lastIndexOf(artifactId);
        const cyclePath = [
          ...stack.slice(Math.max(0, cycleStart)),
          artifactId,
        ];
        const signature = cyclePath.join('>');
        if (
          !cycles.some(
            (candidate) => candidate.path.join('>') === signature,
          )
        ) {
          cycles.push(
            Object.freeze({
              path: Object.freeze(cyclePath),
            }),
          );
        }
        return;
      }

      state.set(artifactId, 'visiting');
      stack.push(artifactId);
      const manifestEntry = this.entries.get(artifactId);
      if (manifestEntry) {
        for (const dependencyId of manifestEntry.dependencies) {
          if (this.entries.has(dependencyId)) {
            visit(dependencyId, depth + 1);
          }
        }
      }
      stack.pop();
      state.set(artifactId, 'visited');
      ordered.push(artifactId);
    };

    [...this.entries.keys()].sort().forEach((artifactId) => {
      visit(artifactId, 0);
    });

    return Object.freeze({
      valid:
        missingDependencies.length === 0 &&
        cycles.length === 0,
      orderedArtifactIds: Object.freeze(ordered),
      missingDependencies: Object.freeze(missingDependencies),
      cycles: Object.freeze(cycles),
      maximumDepth,
    });
  }

  public resolveLoadOrder(): readonly string[] {
    const analysis = this.analyze();
    if (analysis.missingDependencies.length > 0) {
      throw new ComposerDependencyError(
        'Composer dependency graph contains missing dependencies.',
        'COMPOSER_DEPENDENCY_MISSING',
        analysis.missingDependencies.map(
          (item) => `${item.artifactId}->${item.dependencyId}`,
        ),
      );
    }
    if (analysis.cycles.length > 0) {
      throw new ComposerDependencyError(
        'Composer dependency graph contains a cycle.',
        'COMPOSER_DEPENDENCY_CYCLE',
        analysis.cycles.map((cycle) => cycle.path.join('->')),
      );
    }
    return analysis.orderedArtifactIds;
  }
}

export function createComposerDependencyGraph(
  manifest: ComposerManifest,
): ComposerDependencyGraph {
  return new ComposerDependencyGraph(manifest);
}
