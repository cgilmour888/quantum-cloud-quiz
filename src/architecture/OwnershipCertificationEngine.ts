/**
 * Artifact ID: QCQ-ARC-007
 * Artifact Name: OwnershipCertificationEngine
 * Artifact Purpose: Authority-certification engine issuing deterministic ownership certificates only when single-owner, dependency, policy, and compliance gates pass.
 * Artifact Layer: Architecture / CRT
 * Artifact Dependencies: QCQ-ARC-001, QCQ-ARC-002, QCQ-ARC-006
 * Artifact Dependents: QCQ-ARC-010
 * Dependency Graph: registry + manifest + compliance -> OwnershipCertificationEngine -> architectural readiness
 * Repository Path: QCQ/frontend/src/architecture
 * Source File: OwnershipCertificationEngine.ts
 */

import type { OwnershipRegistry } from './OwnershipRegistry';
import {
  OWNERSHIP_MANIFEST,
} from './OwnershipManifest';
import type {
  ArchitecturalComplianceReport,
} from './ArchitecturalComplianceEngine';

export type OwnershipCertificateStatus =
  | 'certified'
  | 'blocked'
  | 'expired';

export interface OwnershipCertificate {
  readonly certificateId: string;
  readonly responsibilityId: string;
  readonly ownerArtifactId: string;
  readonly ownerArtifactName: string;
  readonly status: OwnershipCertificateStatus;
  readonly issuedAt: number;
  readonly validUntil: number | null;
  readonly manifestVersion: string;
  readonly constitutionalAmendment: string;
  readonly registryRevision: number;
  readonly evidenceDigest: string;
}

export interface OwnershipCertificationReport {
  readonly certified: boolean;
  readonly generatedAt: number;
  readonly certificates: readonly OwnershipCertificate[];
  readonly failures: readonly string[];
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export class OwnershipCertificationEngine {
  public constructor(
    private readonly registry: OwnershipRegistry,
  ) {}

  public certify(
    compliance: ArchitecturalComplianceReport,
    validForMs: number | null = null,
  ): OwnershipCertificationReport {
    const snapshot = this.registry.getSnapshot();
    const failures: string[] = [];
    const certificates: OwnershipCertificate[] = [];

    if (!compliance.compliant) {
      failures.push(
        'Architectural compliance must pass before ownership certification.',
      );
    }

    for (const responsibility of snapshot.responsibilities) {
      if (!responsibility.exclusive) continue;
      const owner = this.registry.getOwner(responsibility.id);
      if (!owner || owner.status !== 'active') {
        failures.push(
          `Exclusive responsibility "${responsibility.id}" has no active owner.`,
        );
        continue;
      }

      const assignment = owner.assignment;
      const issuedAt = Date.now();
      const evidenceDigest = fnv1a(
        [
          responsibility.id,
          assignment.ownerArtifactId,
          assignment.effectiveVersion,
          snapshot.revision.toString(),
          compliance.generatedAt.toString(),
          OWNERSHIP_MANIFEST.manifestVersion,
        ].join('|'),
      );

      certificates.push(
        Object.freeze({
          certificateId: `QCQ-OWN-CERT-${evidenceDigest.toUpperCase()}`,
          responsibilityId: responsibility.id,
          ownerArtifactId: assignment.ownerArtifactId,
          ownerArtifactName: assignment.ownerArtifactName,
          status: compliance.compliant ? 'certified' : 'blocked',
          issuedAt,
          validUntil:
            validForMs === null
              ? null
              : issuedAt + Math.max(0, validForMs),
          manifestVersion: OWNERSHIP_MANIFEST.manifestVersion,
          constitutionalAmendment:
            OWNERSHIP_MANIFEST.constitutionalAmendment,
          registryRevision: snapshot.revision,
          evidenceDigest,
        }),
      );
    }

    return Object.freeze({
      certified:
        compliance.compliant &&
        failures.length === 0 &&
        certificates.every(
          (certificate) =>
            certificate.status === 'certified',
        ),
      generatedAt: Date.now(),
      certificates: Object.freeze(certificates),
      failures: Object.freeze(failures),
    });
  }

  public verifyCertificate(
    certificate: OwnershipCertificate,
    now = Date.now(),
  ): boolean {
    const owner =
      this.registry.getOwner(certificate.responsibilityId);
    if (!owner || owner.status !== 'active') return false;
    if (
      owner.assignment.ownerArtifactId !==
      certificate.ownerArtifactId
    ) {
      return false;
    }
    if (
      certificate.manifestVersion !==
      OWNERSHIP_MANIFEST.manifestVersion
    ) {
      return false;
    }
    if (
      certificate.validUntil !== null &&
      now > certificate.validUntil
    ) {
      return false;
    }
    return certificate.status === 'certified';
  }
}
