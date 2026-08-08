/**
 * Artifact ID: QCQ-ARC-008
 * Artifact Name: IntegrationGovernanceRegistry
 * Artifact Purpose: Cross-module integration registration authority recording intentional producer-consumer contracts without transferring subsystem ownership.
 * Artifact Layer: Architecture / REG
 * Artifact Dependencies: QCQ-ARC-001, QCQ-ARC-002, QCQ-ARC-003
 * Artifact Dependents: QCQ-ARC-009, QCQ-ARC-010
 * Dependency Graph: ownership/policy -> IntegrationGovernanceRegistry -> conflict resolver/readiness
 * Repository Path: QCQ/frontend/src/architecture
 * Source File: IntegrationGovernanceRegistry.ts
 */

import type { OwnershipRegistry } from './OwnershipRegistry';
import {
  ArchitecturalPolicyEngine,
} from './ArchitecturalPolicyEngine';

export type IntegrationContractStatus =
  | 'proposed'
  | 'active'
  | 'suspended'
  | 'deprecated';

export type IntegrationDirection =
  | 'source-to-target'
  | 'bidirectional';

export interface IntegrationContract {
  readonly integrationId: string;
  readonly sourceArtifactId: string;
  readonly targetArtifactId: string;
  readonly responsibilityId: string;
  readonly direction: IntegrationDirection;
  readonly contractVersion: string;
  readonly status: IntegrationContractStatus;
  readonly required: boolean;
  readonly transfersOwnership: false;
  readonly dataFlow: readonly string[];
  readonly allowedActions: readonly string[];
  readonly rationale: string;
  readonly registeredAt: number;
  readonly updatedAt: number;
}

export interface RegisterIntegrationInput {
  readonly integrationId: string;
  readonly sourceArtifactId: string;
  readonly targetArtifactId: string;
  readonly responsibilityId: string;
  readonly direction?: IntegrationDirection;
  readonly contractVersion: string;
  readonly status?: IntegrationContractStatus;
  readonly required?: boolean;
  readonly transfersOwnership?: boolean;
  readonly dataFlow?: readonly string[];
  readonly allowedActions?: readonly string[];
  readonly rationale: string;
}

export interface IntegrationRegistrySnapshot {
  readonly revision: number;
  readonly contracts: readonly IntegrationContract[];
}

type IntegrationListener = (
  snapshot: IntegrationRegistrySnapshot,
) => void;

export class IntegrationGovernanceRegistry {
  private readonly contracts = new Map<string, IntegrationContract>();
  private readonly listeners = new Set<IntegrationListener>();
  private readonly policyEngine: ArchitecturalPolicyEngine;
  private revision = 0;

  public constructor(
    private readonly ownershipRegistry: OwnershipRegistry,
  ) {
    this.policyEngine =
      new ArchitecturalPolicyEngine(ownershipRegistry);
  }

  public register(
    input: RegisterIntegrationInput,
    replace = false,
  ): IntegrationContract {
    if (!input.integrationId.trim()) {
      throw new Error('Integration ID must be non-empty.');
    }
    if (input.sourceArtifactId === input.targetArtifactId) {
      throw new Error('Self-integration contracts are prohibited.');
    }
    if (input.transfersOwnership === true) {
      throw new Error(
        'Integration contracts may not transfer architectural ownership.',
      );
    }
    if (!this.ownershipRegistry.getOwner(input.responsibilityId)) {
      throw new Error(
        `Integration responsibility "${input.responsibilityId}" has no registered owner.`,
      );
    }

    const policy = this.policyEngine.evaluate({
      type: 'integration',
      sourceArtifactId: input.sourceArtifactId,
      targetArtifactId: input.targetArtifactId,
      responsibilityId: input.responsibilityId,
      transfersOwnership: false,
      rationale: input.rationale,
    });
    if (!policy.allowed) {
      throw new Error(
        policy.findings
          .filter((finding) => finding.decision === 'deny')
          .map((finding) => finding.message)
          .join(' '),
      );
    }

    const existing = this.contracts.get(input.integrationId);
    if (existing && !replace) {
      if (
        existing.sourceArtifactId !== input.sourceArtifactId ||
        existing.targetArtifactId !== input.targetArtifactId
      ) {
        throw new Error(
          `Integration ID "${input.integrationId}" is already registered to different endpoints.`,
        );
      }
      return existing;
    }

    const now = Date.now();
    const contract: IntegrationContract = Object.freeze({
      integrationId: input.integrationId,
      sourceArtifactId: input.sourceArtifactId,
      targetArtifactId: input.targetArtifactId,
      responsibilityId: input.responsibilityId,
      direction: input.direction ?? 'source-to-target',
      contractVersion: input.contractVersion,
      status: input.status ?? 'proposed',
      required: input.required ?? false,
      transfersOwnership: false,
      dataFlow: Object.freeze([...(input.dataFlow ?? [])]),
      allowedActions: Object.freeze([
        ...(input.allowedActions ?? []),
      ]),
      rationale: input.rationale,
      registeredAt: existing?.registeredAt ?? now,
      updatedAt: now,
    });

    this.contracts.set(input.integrationId, contract);
    this.bump();
    return contract;
  }

  public setStatus(
    integrationId: string,
    status: IntegrationContractStatus,
  ): IntegrationContract {
    const existing = this.require(integrationId);
    const next = Object.freeze({
      ...existing,
      status,
      updatedAt: Date.now(),
    });
    this.contracts.set(integrationId, next);
    this.bump();
    return next;
  }

  public get(
    integrationId: string,
  ): IntegrationContract | null {
    return this.contracts.get(integrationId) ?? null;
  }

  public require(
    integrationId: string,
  ): IntegrationContract {
    const contract = this.get(integrationId);
    if (!contract) {
      throw new Error(
        `Unknown integration contract "${integrationId}".`,
      );
    }
    return contract;
  }

  public list(
    status?: IntegrationContractStatus,
  ): readonly IntegrationContract[] {
    return Object.freeze(
      [...this.contracts.values()]
        .filter(
          (contract) =>
            status === undefined ||
            contract.status === status,
        )
        .sort((left, right) =>
          left.integrationId.localeCompare(
            right.integrationId,
          ),
        ),
    );
  }

  public getSnapshot = (): IntegrationRegistrySnapshot =>
    Object.freeze({
      revision: this.revision,
      contracts: this.list(),
    });

  public subscribe = (
    listener: IntegrationListener,
  ): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private bump(): void {
    this.revision += 1;
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
