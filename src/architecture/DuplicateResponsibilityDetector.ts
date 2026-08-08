/**
 * Artifact ID: QCQ-ARC-004
 * Artifact Name: DuplicateResponsibilityDetector
 * Artifact Purpose: Deterministic ownership-collision detector identifying duplicate, overlapping, shadow, and ambiguous responsibility assignments.
 * Artifact Layer: Architecture / DPL
 * Artifact Dependencies: QCQ-ARC-001, QCQ-ARC-002
 * Artifact Dependents: QCQ-ARC-006, QCQ-ARC-009, QCQ-ARC-010
 * Dependency Graph: OwnershipRegistry + OwnershipManifest -> DuplicateResponsibilityDetector -> compliance/conflict/readiness
 * Repository Path: QCQ/frontend/src/architecture
 * Source File: DuplicateResponsibilityDetector.ts
 */

import type {
  ArtifactRegistration,
  OwnershipRegistrySnapshot,
} from './OwnershipRegistry';
import type {
  ResponsibilityDefinition,
} from './OwnershipManifest';

export type DuplicateResponsibilityKind =
  | 'multiple-active-owners'
  | 'artifact-shadow-owner'
  | 'cross-layer-overlap'
  | 'unowned-exclusive-responsibility'
  | 'ambiguous-name-overlap';

export type DuplicateResponsibilitySeverity =
  | 'constitutional'
  | 'error'
  | 'warning';

export interface DuplicateResponsibilityConflict {
  readonly id: string;
  readonly kind: DuplicateResponsibilityKind;
  readonly severity: DuplicateResponsibilitySeverity;
  readonly responsibilityId: string;
  readonly artifactIds: readonly string[];
  readonly message: string;
  readonly recommendation: string;
}

export interface DuplicateResponsibilityReport {
  readonly clean: boolean;
  readonly generatedAt: number;
  readonly conflicts: readonly DuplicateResponsibilityConflict[];
  readonly evaluatedResponsibilities: number;
  readonly evaluatedArtifacts: number;
}

function normalizedWords(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, ' ')
      .split(/\s+/u)
      .filter((word) => word.length >= 4),
  );
}

function overlapRatio(left: string, right: string): number {
  const a = normalizedWords(left);
  const b = normalizedWords(right);
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection += 1;
  }
  return intersection / Math.min(a.size, b.size);
}

function conflict(
  kind: DuplicateResponsibilityKind,
  severity: DuplicateResponsibilitySeverity,
  responsibilityId: string,
  artifactIds: readonly string[],
  message: string,
  recommendation: string,
): DuplicateResponsibilityConflict {
  return Object.freeze({
    id: `ARC-DUP-${kind}-${responsibilityId}`,
    kind,
    severity,
    responsibilityId,
    artifactIds: Object.freeze([...artifactIds]),
    message,
    recommendation,
  });
}

export class DuplicateResponsibilityDetector {
  public analyze(
    snapshot: OwnershipRegistrySnapshot,
  ): DuplicateResponsibilityReport {
    const conflicts: DuplicateResponsibilityConflict[] = [];
    const activeOwnersByResponsibility = new Map<string, string[]>();

    for (const entry of snapshot.ownership) {
      if (entry.status !== 'active') continue;
      const owners =
        activeOwnersByResponsibility.get(
          entry.assignment.responsibilityId,
        ) ?? [];
      owners.push(entry.assignment.ownerArtifactId);
      activeOwnersByResponsibility.set(
        entry.assignment.responsibilityId,
        owners,
      );
    }

    for (const responsibility of snapshot.responsibilities) {
      const owners =
        activeOwnersByResponsibility.get(responsibility.id) ?? [];

      if (responsibility.exclusive && owners.length === 0) {
        conflicts.push(
          conflict(
            'unowned-exclusive-responsibility',
            responsibility.criticality === 'constitutional'
              ? 'constitutional'
              : 'error',
            responsibility.id,
            [],
            `Exclusive responsibility "${responsibility.name}" has no active owner.`,
            'Assign exactly one explicit owner before integration or release.',
          ),
        );
      }

      if (responsibility.exclusive && owners.length > 1) {
        conflicts.push(
          conflict(
            'multiple-active-owners',
            'constitutional',
            responsibility.id,
            owners,
            `Exclusive responsibility "${responsibility.name}" has ${owners.length} active owners.`,
            'Preserve the canonical owner and remove or reclassify all shadow ownership claims.',
          ),
        );
      }
    }

    this.detectArtifactShadowClaims(
      snapshot.artifacts,
      snapshot.responsibilities,
      conflicts,
    );
    this.detectAmbiguousNames(
      snapshot.responsibilities,
      conflicts,
    );

    return Object.freeze({
      clean: conflicts.length === 0,
      generatedAt: Date.now(),
      conflicts: Object.freeze(conflicts),
      evaluatedResponsibilities: snapshot.responsibilities.length,
      evaluatedArtifacts: snapshot.artifacts.length,
    });
  }

  private detectArtifactShadowClaims(
    artifacts: readonly ArtifactRegistration[],
    responsibilities: readonly ResponsibilityDefinition[],
    conflicts: DuplicateResponsibilityConflict[],
  ): void {
    const responsibilityById = new Map(
      responsibilities.map((entry) => [entry.id, entry] as const),
    );
    const artifactsByResponsibility = new Map<string, ArtifactRegistration[]>();

    for (const artifact of artifacts) {
      for (const responsibilityId of artifact.descriptor.responsibilities) {
        const list =
          artifactsByResponsibility.get(responsibilityId) ?? [];
        list.push(artifact);
        artifactsByResponsibility.set(
          responsibilityId,
          list,
        );
      }
    }

    for (const [responsibilityId, registrations] of artifactsByResponsibility) {
      const definition = responsibilityById.get(responsibilityId);
      if (!definition || !definition.exclusive || registrations.length <= 1) {
        continue;
      }
      const layers = new Set(
        registrations.map(
          (registration) => registration.descriptor.layer,
        ),
      );
      conflicts.push(
        conflict(
          layers.size > 1
            ? 'cross-layer-overlap'
            : 'artifact-shadow-owner',
          definition.criticality === 'constitutional'
            ? 'constitutional'
            : 'error',
          responsibilityId,
          registrations.map(
            (registration) => registration.descriptor.artifactId,
          ),
          `Multiple artifacts declare the exclusive responsibility "${definition.name}".`,
          'Only the authoritative owner should declare ownership; consumers must declare integrations or dependencies instead.',
        ),
      );
    }
  }

  private detectAmbiguousNames(
    responsibilities: readonly ResponsibilityDefinition[],
    conflicts: DuplicateResponsibilityConflict[],
  ): void {
    for (let leftIndex = 0; leftIndex < responsibilities.length; leftIndex += 1) {
      const left = responsibilities[leftIndex];
      if (!left) continue;
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < responsibilities.length;
        rightIndex += 1
      ) {
        const right = responsibilities[rightIndex];
        if (!right) continue;
        if (left.authority === right.authority && left.layer === right.layer) {
          const similarity = overlapRatio(
            `${left.name} ${left.description}`,
            `${right.name} ${right.description}`,
          );
          if (similarity >= 0.78) {
            conflicts.push(
              conflict(
                'ambiguous-name-overlap',
                'warning',
                left.id,
                [],
                `Responsibilities "${left.name}" and "${right.name}" are semantically similar (${similarity.toFixed(2)} overlap).`,
                'Review whether the responsibilities are intentionally distinct; merge only through an explicit governance amendment.',
              ),
            );
          }
        }
      }
    }
  }
}
