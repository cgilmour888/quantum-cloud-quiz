/**
 * Artifact ID: QCQ-PER-015
 * Artifact Name: PersistenceCapabilityMatrix
 * Repository Path: QCQ/frontend/src/persistence/PersistenceCapabilityMatrix.ts
 */

export type PersistenceCapability =
  | 'read'
  | 'write'
  | 'delete'
  | 'list'
  | 'exclusive-write'
  | 'quota-estimate'
  | 'checksums'
  | 'backups'
  | 'migration'
  | 'offline'
  | 'archive';

export interface PersistenceProviderCapabilityProfile {
  readonly providerId: string;
  readonly platform: 'browser' | 'server' | 'edge' | 'native' | 'test';
  readonly capabilities: Readonly<Record<PersistenceCapability, boolean>>;
  readonly maximumRecordBytes: number | null;
  readonly durable: boolean;
  readonly synchronousPrimitive: boolean;
}

export interface PersistenceCapabilityAssessment {
  readonly providerId: string;
  readonly supported: boolean;
  readonly missingCapabilities: readonly PersistenceCapability[];
}

const CAPABILITIES: readonly PersistenceCapability[] = Object.freeze([
  'read',
  'write',
  'delete',
  'list',
  'exclusive-write',
  'quota-estimate',
  'checksums',
  'backups',
  'migration',
  'offline',
  'archive',
]);

export class PersistenceCapabilityMatrix {
  private readonly providers = new Map<string, PersistenceProviderCapabilityProfile>();

  public register(profile: PersistenceProviderCapabilityProfile): void {
    if (this.providers.has(profile.providerId)) {
      throw new Error(`Persistence capability profile already exists: ${profile.providerId}`);
    }
    const capabilities = Object.freeze(
      Object.fromEntries(
        CAPABILITIES.map((capability) => [capability, profile.capabilities[capability] === true]),
      ) as Record<PersistenceCapability, boolean>,
    );
    this.providers.set(
      profile.providerId,
      Object.freeze({ ...profile, capabilities }),
    );
  }

  public get(providerId: string): PersistenceProviderCapabilityProfile | null {
    return this.providers.get(providerId) ?? null;
  }

  public assess(
    providerId: string,
    required: readonly PersistenceCapability[],
  ): PersistenceCapabilityAssessment {
    const profile = this.providers.get(providerId);
    if (!profile) {
      return Object.freeze({
        providerId,
        supported: false,
        missingCapabilities: Object.freeze([...new Set(required)]),
      });
    }
    const missing = [...new Set(required)].filter(
      (capability) => profile.capabilities[capability] !== true,
    );
    return Object.freeze({
      providerId,
      supported: missing.length === 0,
      missingCapabilities: Object.freeze(missing),
    });
  }

  public compatibleProviders(
    required: readonly PersistenceCapability[],
  ): readonly PersistenceProviderCapabilityProfile[] {
    return Object.freeze(
      [...this.providers.values()].filter(
        (profile) => this.assess(profile.providerId, required).supported,
      ),
    );
  }

  public snapshot(): readonly PersistenceProviderCapabilityProfile[] {
    return Object.freeze(
      [...this.providers.values()].sort((a, b) => a.providerId.localeCompare(b.providerId)),
    );
  }
}
