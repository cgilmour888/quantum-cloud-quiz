/**
 * Artifact ID: QCQ-PER-008
 * Artifact Name: PersistenceManifest
 * Repository Path: QCQ/frontend/src/persistence/PersistenceManifest.ts
 */

import {
  PERSISTENCE_SCHEMA_VERSION,
  PERSISTENCE_NAMESPACE,
} from './PersistenceConstants';

export interface PersistenceArtifactManifestEntry {
  readonly artifactId: string;
  readonly artifactName: string;
  readonly repositoryPath: string;
  readonly dependencies: readonly string[];
  readonly purpose: string;
}

export interface PersistenceSubsystemManifest {
  readonly subsystemId: 'QCQ-PERSISTENCE-V1';
  readonly schemaVersion: typeof PERSISTENCE_SCHEMA_VERSION;
  readonly namespace: typeof PERSISTENCE_NAMESPACE;
  readonly artifacts: readonly PersistenceArtifactManifestEntry[];
  readonly guarantees: readonly string[];
}

export const PERSISTENCE_MANIFEST: PersistenceSubsystemManifest = Object.freeze({
  subsystemId: 'QCQ-PERSISTENCE-V1',
  schemaVersion: PERSISTENCE_SCHEMA_VERSION,
  namespace: PERSISTENCE_NAMESPACE,
  artifacts: Object.freeze([
    {
      artifactId: 'QCQ-TBL-034',
      artifactName: 'PlayerProfileStore',
      repositoryPath: 'QCQ/frontend/src/persistence/PlayerProfileStore.ts',
      dependencies: Object.freeze([
        'QCQ-PER-001',
        'QCQ-PER-002',
        'QCQ-PER-003',
        'QCQ-PER-004',
        'QCQ-PER-006',
        'QCQ-PER-007',
        'QCQ-PER-009',
      ]),
      purpose: 'Authoritative local player profile and preference store.',
    },
    {
      artifactId: 'QCQ-TBL-035',
      artifactName: 'SaveGameEngine',
      repositoryPath: 'QCQ/frontend/src/persistence/SaveGameEngine.ts',
      dependencies: Object.freeze([
        'QCQ-PER-001',
        'QCQ-PER-002',
        'QCQ-PER-003',
        'QCQ-PER-004',
        'QCQ-PER-005',
        'QCQ-PER-007',
        'QCQ-PER-009',
      ]),
      purpose: 'Atomic save, verification, backup, load, and deletion authority.',
    },
    {
      artifactId: 'QCQ-PER-001',
      artifactName: 'PersistenceTypes',
      repositoryPath: 'QCQ/frontend/src/persistence/PersistenceTypes.ts',
      dependencies: Object.freeze([]),
      purpose: 'Immutable persistence contracts.',
    },
    {
      artifactId: 'QCQ-PER-002',
      artifactName: 'PersistenceConstants',
      repositoryPath: 'QCQ/frontend/src/persistence/PersistenceConstants.ts',
      dependencies: Object.freeze(['QCQ-PER-001']),
      purpose: 'Storage keys, versions, limits, and defaults.',
    },
    {
      artifactId: 'QCQ-PER-003',
      artifactName: 'PersistenceValidationEngine',
      repositoryPath: 'QCQ/frontend/src/persistence/PersistenceValidationEngine.ts',
      dependencies: Object.freeze(['QCQ-PER-001', 'QCQ-PER-002']),
      purpose: 'Validation before every save and after every load.',
    },
    {
      artifactId: 'QCQ-PER-004',
      artifactName: 'SerializationEngine',
      repositoryPath: 'QCQ/frontend/src/persistence/SerializationEngine.ts',
      dependencies: Object.freeze(['QCQ-PER-001', 'QCQ-PER-002']),
      purpose: 'Canonical serialization and SHA-256 envelope integrity.',
    },
    {
      artifactId: 'QCQ-PER-005',
      artifactName: 'SessionRestoreEngine',
      repositoryPath: 'QCQ/frontend/src/persistence/SessionRestoreEngine.ts',
      dependencies: Object.freeze([
        'QCQ-PER-003',
        'QCQ-PER-004',
        'QCQ-PER-006',
        'QCQ-PER-007',
      ]),
      purpose: 'Primary-save restoration with validated backup fallback.',
    },
    {
      artifactId: 'QCQ-PER-006',
      artifactName: 'VersionMigrationEngine',
      repositoryPath: 'QCQ/frontend/src/persistence/VersionMigrationEngine.ts',
      dependencies: Object.freeze(['QCQ-PER-001', 'QCQ-PER-004']),
      purpose: 'Registered forward-only migration graph.',
    },
    {
      artifactId: 'QCQ-PER-007',
      artifactName: 'BackupRecoveryEngine',
      repositoryPath: 'QCQ/frontend/src/persistence/BackupRecoveryEngine.ts',
      dependencies: Object.freeze(['QCQ-PER-001', 'QCQ-PER-002', 'QCQ-PER-004']),
      purpose: 'Rotating checksummed backups and recovery.',
    },
    {
      artifactId: 'QCQ-PER-008',
      artifactName: 'PersistenceManifest',
      repositoryPath: 'QCQ/frontend/src/persistence/PersistenceManifest.ts',
      dependencies: Object.freeze(['QCQ-PER-002']),
      purpose: 'Machine-readable subsystem ownership and dependency declaration.',
    },
    {
      artifactId: 'QCQ-PER-009',
      artifactName: 'LocalStorageProvider',
      repositoryPath: 'QCQ/frontend/src/persistence/LocalStorageProvider.ts',
      dependencies: Object.freeze(['QCQ-PER-001', 'QCQ-PER-002']),
      purpose: 'Staged, serialized browser localStorage adapter.',
    },
    {
      artifactId: 'QCQ-PER-010',
      artifactName: 'PlayerProgressSnapshot',
      repositoryPath: 'QCQ/frontend/src/persistence/PlayerProgressSnapshot.ts',
      dependencies: Object.freeze(['QCQ-TBL-034', 'QCQ-TBL-035']),
      purpose: 'Immutable progress projection for analytics and presentation.',
    },
  ]),
  guarantees: Object.freeze([
    'Strict TypeScript without unsafe type escapes.',
    'Canonical SHA-256 integrity envelope.',
    'Validation before save and after load.',
    'Staged local writes and serialized mutation scopes.',
    'Rotating backups and recovery fallback.',
    'Forward-only registered schema migrations.',
    'No implicit cloud synchronization or telemetry.',
    'Accessibility, visual-effect, audio, AI, analytics, and organization preferences remain explicit.',
  ]),
});
