/**
 * Artifact ID: QCQ-PER-034
 * Artifact Name: MasterPersistenceContract
 * Repository Path: QCQ/frontend/src/persistence/MasterPersistenceContract.ts
 */

export const MASTER_PERSISTENCE_CONTRACT_VERSION = '2.0.0' as const;

export interface MasterPersistenceInvariant {
  readonly invariantId: string;
  readonly description: string;
  readonly severity: 'critical' | 'required';
}

export interface MasterPersistenceContract {
  readonly contractId: 'QCQ-PER-034';
  readonly version: typeof MASTER_PERSISTENCE_CONTRACT_VERSION;
  readonly namespace: 'QCQ-PER';
  readonly coreAuthorities: readonly string[];
  readonly invariants: readonly MasterPersistenceInvariant[];
  readonly prohibitedBehaviors: readonly string[];
}

export const MASTER_PERSISTENCE_CONTRACT: MasterPersistenceContract = Object.freeze({
  contractId: 'QCQ-PER-034',
  version: MASTER_PERSISTENCE_CONTRACT_VERSION,
  namespace: 'QCQ-PER',
  coreAuthorities: Object.freeze([
    'QCQ-TBL-034',
    'QCQ-TBL-035',
    ...Array.from({ length: 40 }, (_, index) => `QCQ-PER-${String(index + 1).padStart(3, '0')}`),
  ]),
  invariants: Object.freeze([
    Object.freeze({ invariantId: 'PER-INV-001', description: 'Every permanent persistence identifier is globally unique and never reused.', severity: 'critical' }),
    Object.freeze({ invariantId: 'PER-INV-002', description: 'Save writes are validated, integrity protected, and serialized through a single governed authority.', severity: 'critical' }),
    Object.freeze({ invariantId: 'PER-INV-003', description: 'Every destructive overwrite is recoverable according to active policy.', severity: 'critical' }),
    Object.freeze({ invariantId: 'PER-INV-004', description: 'Schema migration is registered, deterministic, forward-only, and integrity checked.', severity: 'required' }),
    Object.freeze({ invariantId: 'PER-INV-005', description: 'Telemetry, analytics, and composer integration are bridges and never persistence owners.', severity: 'required' }),
    Object.freeze({ invariantId: 'PER-INV-006', description: 'Persistence core performs no direct network I/O and embeds no provider credential.', severity: 'critical' }),
    Object.freeze({ invariantId: 'PER-INV-007', description: 'Recovery, audit, archival, and integrity evidence remain inspectable without gameplay mutation.', severity: 'required' }),
  ]),
  prohibitedBehaviors: Object.freeze([
    'duplicate-persistence-owner',
    'unguarded-destructive-write',
    'silent-schema-downgrade',
    'unchecked-restore',
    'direct-network-call-from-core',
    'telemetry-without-consent',
  ]),
});
