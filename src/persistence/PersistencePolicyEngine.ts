/**
 * Artifact ID: QCQ-PER-012
 * Artifact Name: PersistencePolicyEngine
 * Repository Path: QCQ/frontend/src/persistence/PersistencePolicyEngine.ts
 */

export type PersistenceOperation =
  | 'create-profile'
  | 'update-profile'
  | 'save-session'
  | 'restore-session'
  | 'delete-save'
  | 'create-backup'
  | 'recover-backup'
  | 'migrate'
  | 'archive'
  | 'export';

export interface PersistencePolicy {
  readonly policyId: string;
  readonly enabled: boolean;
  readonly minimumSaveIntervalMilliseconds: number;
  readonly maximumBackupsPerRecord: number;
  readonly requireBackupBeforeOverwrite: boolean;
  readonly allowDestructiveDelete: boolean;
  readonly allowRecoveryFromOlderSchema: boolean;
  readonly requireIntegrityVerification: boolean;
  readonly retentionMilliseconds: number | null;
}

export interface PersistencePolicyContext {
  readonly operation: PersistenceOperation;
  readonly now: number;
  readonly lastSaveAt: number | null;
  readonly existingRecord: boolean;
  readonly backupAvailable: boolean;
  readonly integrityVerified: boolean;
  readonly sourceSchemaSupported: boolean;
}

export interface PersistencePolicyDecision {
  readonly allowed: boolean;
  readonly reasons: readonly string[];
  readonly requiredActions: readonly string[];
}

export const DEFAULT_PERSISTENCE_POLICY: PersistencePolicy = Object.freeze({
  policyId: 'qcq.persistence.default.v1',
  enabled: true,
  minimumSaveIntervalMilliseconds: 2_000,
  maximumBackupsPerRecord: 5,
  requireBackupBeforeOverwrite: true,
  allowDestructiveDelete: true,
  allowRecoveryFromOlderSchema: true,
  requireIntegrityVerification: true,
  retentionMilliseconds: null,
});

export class PersistencePolicyEngine {
  public constructor(
    private readonly policy: PersistencePolicy = DEFAULT_PERSISTENCE_POLICY,
  ) {
    if (policy.minimumSaveIntervalMilliseconds < 0) {
      throw new Error('Persistence minimum save interval cannot be negative.');
    }
    if (!Number.isInteger(policy.maximumBackupsPerRecord) || policy.maximumBackupsPerRecord < 1) {
      throw new Error('Persistence backup count must be a positive integer.');
    }
  }

  public getPolicy(): PersistencePolicy {
    return this.policy;
  }

  public evaluate(context: PersistencePolicyContext): PersistencePolicyDecision {
    const reasons: string[] = [];
    const requiredActions: string[] = [];

    if (!this.policy.enabled) reasons.push('Persistence is disabled by policy.');

    if (
      context.operation === 'save-session' &&
      context.lastSaveAt !== null &&
      context.now - context.lastSaveAt < this.policy.minimumSaveIntervalMilliseconds
    ) {
      reasons.push('Save request violates the minimum save interval.');
    }

    if (
      context.operation === 'delete-save' &&
      !this.policy.allowDestructiveDelete
    ) {
      reasons.push('Destructive save deletion is disabled.');
    }

    if (
      context.operation === 'migrate' &&
      !context.sourceSchemaSupported &&
      !this.policy.allowRecoveryFromOlderSchema
    ) {
      reasons.push('Source schema is unsupported and migration recovery is disabled.');
    }

    if (
      this.policy.requireIntegrityVerification &&
      ['restore-session', 'recover-backup', 'migrate', 'archive', 'export'].includes(
        context.operation,
      ) &&
      !context.integrityVerified
    ) {
      requiredActions.push('verify-integrity');
    }

    if (
      context.operation === 'save-session' &&
      context.existingRecord &&
      this.policy.requireBackupBeforeOverwrite &&
      !context.backupAvailable
    ) {
      requiredActions.push('create-backup');
    }

    return Object.freeze({
      allowed: reasons.length === 0,
      reasons: Object.freeze(reasons),
      requiredActions: Object.freeze(requiredActions),
    });
  }
}
