/**
 * Artifact ID: QCQ-ARC-001
 * Artifact Name: OwnershipRegistry
 * Artifact Purpose: Single-owner registration authority for architectural responsibilities, artifact authorities, and immutable ownership assignments.
 * Artifact Layer: Architecture / REG
 * Artifact Dependencies: QCQ-ARC-002
 * Artifact Dependents: QCQ-ARC-003, QCQ-ARC-004, QCQ-ARC-005, QCQ-ARC-006, QCQ-ARC-007, QCQ-ARC-008, QCQ-ARC-009, QCQ-ARC-010
 * Dependency Graph: OwnershipManifest -> OwnershipRegistry -> policy/validation/compliance/certification/integration/readiness
 * Repository Path: QCQ/frontend/src/architecture
 * Source File: OwnershipRegistry.ts
 */

import {
  OWNERSHIP_MANIFEST,
  getProtectedOwnership,
  getResponsibilityDefinition,
  type ArchitecturalLayer,
  type ArtifactArchitectureDescriptor,
  type OwnershipAssignment,
  type ResponsibilityDefinition,
} from './OwnershipManifest';

export type OwnershipRegistrationStatus =
  | 'active'
  | 'deprecated'
  | 'superseded'
  | 'proposed';

export interface OwnershipRegistryEntry {
  readonly assignment: OwnershipAssignment;
  readonly status: OwnershipRegistrationStatus;
  readonly registeredAt: number;
  readonly revision: number;
  readonly evidence: readonly string[];
}

export interface ArtifactRegistration {
  readonly descriptor: ArtifactArchitectureDescriptor;
  readonly registeredAt: number;
  readonly revision: number;
}

export interface OwnershipRegistrySnapshot {
  readonly revision: number;
  readonly responsibilities: readonly ResponsibilityDefinition[];
  readonly ownership: readonly OwnershipRegistryEntry[];
  readonly artifacts: readonly ArtifactRegistration[];
}

export interface RegisterOwnershipOptions {
  readonly status?: OwnershipRegistrationStatus;
  readonly evidence?: readonly string[];
}

type RegistryListener = (snapshot: OwnershipRegistrySnapshot) => void;

function freezeOwnershipEntry(
  entry: OwnershipRegistryEntry,
): OwnershipRegistryEntry {
  return Object.freeze({
    ...entry,
    assignment: Object.freeze({ ...entry.assignment }),
    evidence: Object.freeze([...entry.evidence]),
  });
}

function freezeArtifactRegistration(
  registration: ArtifactRegistration,
): ArtifactRegistration {
  return Object.freeze({
    ...registration,
    descriptor: Object.freeze({
      ...registration.descriptor,
      responsibilities: Object.freeze([...registration.descriptor.responsibilities]),
      dependencies: Object.freeze(
        registration.descriptor.dependencies.map((dependency) =>
          Object.freeze({ ...dependency }),
        ),
      ),
      tags: Object.freeze([...registration.descriptor.tags]),
    }),
  });
}

export class OwnershipRegistry {
  private readonly responsibilityDefinitions = new Map<string, ResponsibilityDefinition>();
  private readonly ownership = new Map<string, OwnershipRegistryEntry>();
  private readonly artifacts = new Map<string, ArtifactRegistration>();
  private readonly listeners = new Set<RegistryListener>();
  private revision = 0;

  public constructor(seedConstitution = true) {
    if (seedConstitution) {
      for (const responsibility of OWNERSHIP_MANIFEST.responsibilities) {
        this.responsibilityDefinitions.set(responsibility.id, responsibility);
      }
      for (const assignment of OWNERSHIP_MANIFEST.protectedAssignments) {
        this.registerOwnership(assignment, {
          status: 'active',
          evidence: [`Protected by ${OWNERSHIP_MANIFEST.constitutionalAmendment}`],
        });
      }
    }
  }

  public registerResponsibility(
    definition: ResponsibilityDefinition,
    replace = false,
  ): ResponsibilityDefinition {
    this.assertResponsibility(definition);
    const existing = this.responsibilityDefinitions.get(definition.id);
    if (existing && !replace) {
      if (
        existing.authority !== definition.authority ||
        existing.layer !== definition.layer ||
        existing.exclusive !== definition.exclusive
      ) {
        throw new Error(
          `Responsibility "${definition.id}" already exists with a different constitutional shape.`,
        );
      }
      return existing;
    }
    const frozen = Object.freeze({
      ...definition,
      tags: Object.freeze([...definition.tags]),
    });
    this.responsibilityDefinitions.set(definition.id, frozen);
    this.bump();
    return frozen;
  }

  public registerArtifact(
    descriptor: ArtifactArchitectureDescriptor,
    replace = false,
  ): ArtifactRegistration {
    this.assertArtifact(descriptor);
    const existing = this.artifacts.get(descriptor.artifactId);
    if (existing && !replace) {
      if (
        existing.descriptor.artifactName !== descriptor.artifactName ||
        existing.descriptor.repositoryPath !== descriptor.repositoryPath
      ) {
        throw new Error(
          `Permanent artifact ID "${descriptor.artifactId}" is already registered to ${existing.descriptor.artifactName}.`,
        );
      }
      return existing;
    }

    for (const responsibilityId of descriptor.responsibilities) {
      if (!this.responsibilityDefinitions.has(responsibilityId)) {
        throw new Error(
          `Artifact "${descriptor.artifactId}" references unknown responsibility "${responsibilityId}".`,
        );
      }
    }

    this.revision += 1;
    const registration = freezeArtifactRegistration({
      descriptor,
      registeredAt: Date.now(),
      revision: this.revision,
    });
    this.artifacts.set(descriptor.artifactId, registration);
    this.emit();
    return registration;
  }

  public registerOwnership(
    assignment: OwnershipAssignment,
    options: RegisterOwnershipOptions = {},
  ): OwnershipRegistryEntry {
    const definition =
      this.responsibilityDefinitions.get(assignment.responsibilityId) ??
      getResponsibilityDefinition(assignment.responsibilityId);
    if (!definition) {
      throw new Error(
        `Cannot assign unknown responsibility "${assignment.responsibilityId}".`,
      );
    }

    const protectedAssignment = getProtectedOwnership(assignment.responsibilityId);
    if (
      protectedAssignment &&
      protectedAssignment.ownerArtifactId !== assignment.ownerArtifactId
    ) {
      throw new Error(
        `Responsibility "${assignment.responsibilityId}" is constitutionally protected by ${protectedAssignment.ownerArtifactId}.`,
      );
    }

    const existing = this.ownership.get(assignment.responsibilityId);
    if (
      existing &&
      existing.status === 'active' &&
      existing.assignment.ownerArtifactId !== assignment.ownerArtifactId &&
      definition.exclusive
    ) {
      throw new Error(
        `Exclusive responsibility "${assignment.responsibilityId}" is already owned by ${existing.assignment.ownerArtifactId}.`,
      );
    }

    if (
      assignment.ownerLayer !== definition.layer &&
      definition.criticality === 'constitutional'
    ) {
      throw new Error(
        `Constitutional responsibility "${assignment.responsibilityId}" requires layer "${definition.layer}", not "${assignment.ownerLayer}".`,
      );
    }

    this.revision += 1;
    const entry = freezeOwnershipEntry({
      assignment,
      status: options.status ?? 'active',
      registeredAt: Date.now(),
      revision: this.revision,
      evidence: options.evidence ?? [],
    });
    this.ownership.set(assignment.responsibilityId, entry);
    this.emit();
    return entry;
  }

  public getOwner(
    responsibilityId: string,
  ): OwnershipRegistryEntry | null {
    return this.ownership.get(responsibilityId) ?? null;
  }

  public requireOwner(
    responsibilityId: string,
  ): OwnershipRegistryEntry {
    const owner = this.getOwner(responsibilityId);
    if (!owner) {
      throw new Error(`No owner is registered for "${responsibilityId}".`);
    }
    return owner;
  }

  public getArtifact(
    artifactId: string,
  ): ArtifactRegistration | null {
    return this.artifacts.get(artifactId) ?? null;
  }

  public listOwners(): readonly OwnershipRegistryEntry[] {
    return Object.freeze(
      [...this.ownership.values()].sort((left, right) =>
        left.assignment.responsibilityId.localeCompare(
          right.assignment.responsibilityId,
        ),
      ),
    );
  }

  public listArtifacts(
    layer?: ArchitecturalLayer,
  ): readonly ArtifactRegistration[] {
    return Object.freeze(
      [...this.artifacts.values()]
        .filter(
          (registration) =>
            layer === undefined || registration.descriptor.layer === layer,
        )
        .sort((left, right) =>
          left.descriptor.artifactId.localeCompare(
            right.descriptor.artifactId,
          ),
        ),
    );
  }

  public getSnapshot = (): OwnershipRegistrySnapshot =>
    Object.freeze({
      revision: this.revision,
      responsibilities: Object.freeze(
        [...this.responsibilityDefinitions.values()].sort((left, right) =>
          left.id.localeCompare(right.id),
        ),
      ),
      ownership: this.listOwners(),
      artifacts: this.listArtifacts(),
    });

  public subscribe = (listener: RegistryListener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private assertResponsibility(
    definition: ResponsibilityDefinition,
  ): void {
    if (!definition.id.trim()) {
      throw new Error('Responsibility ID must be non-empty.');
    }
    if (!definition.name.trim()) {
      throw new Error('Responsibility name must be non-empty.');
    }
  }

  private assertArtifact(
    descriptor: ArtifactArchitectureDescriptor,
  ): void {
    if (!/^QCQ-[A-Z0-9]+-\d{3,}$/u.test(descriptor.artifactId)) {
      throw new Error(
        `Artifact ID "${descriptor.artifactId}" does not satisfy the QCQ permanent-ID contract.`,
      );
    }
    if (!descriptor.artifactName.trim()) {
      throw new Error('Artifact name must be non-empty.');
    }
    if (!descriptor.repositoryPath.trim()) {
      throw new Error('Repository path must be non-empty.');
    }
    for (const dependency of descriptor.dependencies) {
      if (dependency.fromArtifactId !== descriptor.artifactId) {
        throw new Error(
          `Dependency origin "${dependency.fromArtifactId}" must match artifact "${descriptor.artifactId}".`,
        );
      }
      if (dependency.toArtifactId === descriptor.artifactId) {
        throw new Error(
          `Artifact "${descriptor.artifactId}" cannot depend on itself.`,
        );
      }
    }
  }

  private bump(): void {
    this.revision += 1;
    this.emit();
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export const qcqOwnershipRegistry = new OwnershipRegistry(true);
