/**
 * Artifact ID: QCQ-CMP-012
 * Artifact Name: ComposerCapabilityMatrix
 * Artifact Purpose: Evidence-driven capability discovery for required and optional composition domains without assuming subsystem availability.
 * Artifact Layer: Phase 10 — Master Composer / CAP (Capability Authority)
 * Artifact Dependencies: None
 * Artifact Dependents: QCQ-CMP-014, QCQ-CMP-015, QCQ-CMP-016, QCQ-CMP-018, QCQ-CMP-020
 * Dependency Graph: None -> ComposerCapabilityMatrix -> QCQ-CMP-014, QCQ-CMP-015, QCQ-CMP-016, QCQ-CMP-018, QCQ-CMP-020
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerCapabilityMatrix.ts
 */

export type ComposerCapabilityId =
  | 'application-runtime'
  | 'macro-layout'
  | 'tablet-composition'
  | 'theme'
  | 'accessibility'
  | 'persistence'
  | 'effects'
  | 'security'
  | 'monitoring'
  | 'telemetry'
  | 'analytics'
  | 'ai'
  | 'gamification'
  | 'leaderboards'
  | 'organization'
  | 'saas';

export type ComposerCapabilityStatus =
  | 'unavailable'
  | 'declared'
  | 'available'
  | 'degraded'
  | 'blocked';

export interface ComposerCapabilityDefinition {
  readonly id: ComposerCapabilityId;
  readonly requiredForCore: boolean;
  readonly requiredForEnterprise: boolean;
  readonly requiredForGovernment: boolean;
  readonly description: string;
}

export interface ComposerCapabilityEvidence {
  readonly capabilityId: ComposerCapabilityId;
  readonly providerArtifactId: string;
  readonly status: Exclude<ComposerCapabilityStatus, 'unavailable'>;
  readonly version: string | null;
  readonly observedAt: string;
  readonly notes: readonly string[];
}

export interface ComposerCapabilityRecord extends ComposerCapabilityDefinition {
  readonly status: ComposerCapabilityStatus;
  readonly evidence: readonly ComposerCapabilityEvidence[];
}

export interface ComposerCapabilitySnapshot {
  readonly version: number;
  readonly records: Readonly<Record<ComposerCapabilityId, ComposerCapabilityRecord>>;
  readonly missingCore: readonly ComposerCapabilityId[];
  readonly missingEnterprise: readonly ComposerCapabilityId[];
  readonly missingGovernment: readonly ComposerCapabilityId[];
}

const DEFINITIONS: readonly ComposerCapabilityDefinition[] = Object.freeze([
  { id: 'application-runtime', requiredForCore: true, requiredForEnterprise: true, requiredForGovernment: true, description: 'Persistent application runtime authority.' },
  { id: 'macro-layout', requiredForCore: true, requiredForEnterprise: true, requiredForGovernment: true, description: 'APP-002 macro spatial authority.' },
  { id: 'tablet-composition', requiredForCore: true, requiredForEnterprise: true, requiredForGovernment: true, description: 'TBL-040 root tablet composition.' },
  { id: 'theme', requiredForCore: true, requiredForEnterprise: true, requiredForGovernment: true, description: 'Phase 9 visual authority.' },
  { id: 'accessibility', requiredForCore: true, requiredForEnterprise: true, requiredForGovernment: true, description: 'Accessible interaction and rendering.' },
  { id: 'persistence', requiredForCore: true, requiredForEnterprise: true, requiredForGovernment: true, description: 'Session/profile persistence bridge.' },
  { id: 'effects', requiredForCore: false, requiredForEnterprise: true, requiredForGovernment: true, description: 'Optional premium visual effects bridge.' },
  { id: 'security', requiredForCore: true, requiredForEnterprise: true, requiredForGovernment: true, description: 'Security posture and authorization bridge.' },
  { id: 'monitoring', requiredForCore: false, requiredForEnterprise: true, requiredForGovernment: true, description: 'Runtime health monitoring.' },
  { id: 'telemetry', requiredForCore: false, requiredForEnterprise: true, requiredForGovernment: true, description: 'Privacy-bounded telemetry integration.' },
  { id: 'analytics', requiredForCore: false, requiredForEnterprise: true, requiredForGovernment: false, description: 'Learning analytics bridge.' },
  { id: 'ai', requiredForCore: false, requiredForEnterprise: false, requiredForGovernment: false, description: 'Optional assistive AI bridge.' },
  { id: 'gamification', requiredForCore: false, requiredForEnterprise: false, requiredForGovernment: false, description: 'Optional gamification bridge.' },
  { id: 'leaderboards', requiredForCore: false, requiredForEnterprise: false, requiredForGovernment: false, description: 'Optional leaderboard bridge.' },
  { id: 'organization', requiredForCore: false, requiredForEnterprise: true, requiredForGovernment: true, description: 'Organization/tenant context bridge.' },
  { id: 'saas', requiredForCore: false, requiredForEnterprise: true, requiredForGovernment: false, description: 'Entitlement bridge.' },
]);

function satisfies(status: ComposerCapabilityStatus): boolean {
  return status === 'available';
}

export class ComposerCapabilityMatrix {
  private readonly evidence = new Map<ComposerCapabilityId, ComposerCapabilityEvidence[]>();
  private version = 0;

  public registerEvidence(input: ComposerCapabilityEvidence): ComposerCapabilitySnapshot {
    if (!input.providerArtifactId.trim()) throw new Error('Capability providerArtifactId is required.');
    const list = this.evidence.get(input.capabilityId) ?? [];
    const next = list.filter((item) => item.providerArtifactId !== input.providerArtifactId);
    next.push(Object.freeze({ ...input, notes: Object.freeze([...input.notes]) }));
    this.evidence.set(input.capabilityId, next);
    this.version += 1;
    return this.getSnapshot();
  }

  public removeEvidence(capabilityId: ComposerCapabilityId, providerArtifactId: string): ComposerCapabilitySnapshot {
    const current = this.evidence.get(capabilityId) ?? [];
    const next = current.filter((item) => item.providerArtifactId !== providerArtifactId);
    if (next.length === current.length) return this.getSnapshot();
    if (next.length === 0) this.evidence.delete(capabilityId); else this.evidence.set(capabilityId, next);
    this.version += 1;
    return this.getSnapshot();
  }

  public getSnapshot(): ComposerCapabilitySnapshot {
    const records = {} as Record<ComposerCapabilityId, ComposerCapabilityRecord>;
    const missingCore: ComposerCapabilityId[] = [];
    const missingEnterprise: ComposerCapabilityId[] = [];
    const missingGovernment: ComposerCapabilityId[] = [];

    for (const definition of DEFINITIONS) {
      const evidence = Object.freeze([...(this.evidence.get(definition.id) ?? [])]);
      const status = this.resolveStatus(evidence);
      records[definition.id] = Object.freeze({ ...definition, status, evidence });
      if (definition.requiredForCore && !satisfies(status)) missingCore.push(definition.id);
      if (definition.requiredForEnterprise && !satisfies(status)) missingEnterprise.push(definition.id);
      if (definition.requiredForGovernment && !satisfies(status)) missingGovernment.push(definition.id);
    }

    return Object.freeze({
      version: this.version,
      records: Object.freeze(records),
      missingCore: Object.freeze(missingCore),
      missingEnterprise: Object.freeze(missingEnterprise),
      missingGovernment: Object.freeze(missingGovernment),
    });
  }

  private resolveStatus(evidence: readonly ComposerCapabilityEvidence[]): ComposerCapabilityStatus {
    if (evidence.length === 0) return 'unavailable';
    if (evidence.some((item) => item.status === 'blocked')) return 'blocked';
    if (evidence.some((item) => item.status === 'degraded')) return 'degraded';
    if (evidence.some((item) => item.status === 'available')) return 'available';
    return 'declared';
  }
}

export const COMPOSER_CAPABILITY_DEFINITIONS = DEFINITIONS;
