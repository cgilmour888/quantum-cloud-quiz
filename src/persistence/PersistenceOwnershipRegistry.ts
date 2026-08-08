/**
 * Artifact ID: QCQ-PER-014
 * Artifact Name: PersistenceOwnershipRegistry
 * Repository Path: QCQ/frontend/src/persistence/PersistenceOwnershipRegistry.ts
 */

export interface PersistenceOwnershipClaim {
  readonly responsibility: string;
  readonly artifactId: string;
  readonly authority: 'primary' | 'bridge' | 'consumer';
  readonly notes: string;
}

export interface PersistenceOwnershipAudit {
  readonly valid: boolean;
  readonly primaryAuthorities: Readonly<Record<string, string>>;
  readonly violations: readonly string[];
}

export class PersistenceOwnershipRegistry {
  private readonly claims = new Map<string, PersistenceOwnershipClaim[]>();

  public register(claim: PersistenceOwnershipClaim): void {
    const bucket = this.claims.get(claim.responsibility) ?? [];
    if (
      bucket.some(
        (existing) =>
          existing.artifactId === claim.artifactId &&
          existing.authority === claim.authority,
      )
    ) {
      throw new Error(
        `Ownership claim already registered: ${claim.responsibility}/${claim.artifactId}`,
      );
    }
    bucket.push(Object.freeze({ ...claim }));
    this.claims.set(claim.responsibility, bucket);
  }

  public ownerOf(responsibility: string): string | null {
    const primaries = (this.claims.get(responsibility) ?? []).filter(
      (claim) => claim.authority === 'primary',
    );
    return primaries.length === 1 ? primaries[0]?.artifactId ?? null : null;
  }

  public claimsFor(responsibility: string): readonly PersistenceOwnershipClaim[] {
    return Object.freeze([...(this.claims.get(responsibility) ?? [])]);
  }

  public audit(): PersistenceOwnershipAudit {
    const violations: string[] = [];
    const primaryAuthorities: Record<string, string> = {};
    for (const [responsibility, claims] of this.claims) {
      const primaries = claims.filter((claim) => claim.authority === 'primary');
      if (primaries.length !== 1) {
        violations.push(
          `${responsibility} requires exactly one primary authority; observed ${primaries.length}.`,
        );
      } else if (primaries[0]) {
        primaryAuthorities[responsibility] = primaries[0].artifactId;
      }
    }
    return Object.freeze({
      valid: violations.length === 0,
      primaryAuthorities: Object.freeze(primaryAuthorities),
      violations: Object.freeze(violations),
    });
  }
}
