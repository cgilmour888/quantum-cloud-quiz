/**
 * Artifact ID: QCQ-PER-039
 * Artifact Name: PersistenceForensicsEngine
 * Repository Path: QCQ/frontend/src/persistence/PersistenceForensicsEngine.ts
 */

export interface PersistenceForensicsEvidence {
  readonly evidenceId: string;
  readonly category: 'save' | 'migration' | 'recovery' | 'storage' | 'integrity';
  readonly code: string;
  readonly message: string;
  readonly occurredAt: string;
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface PersistenceForensicsFinding {
  readonly findingId: string;
  readonly severity: 'warning' | 'error' | 'critical';
  readonly probableCause: string;
  readonly evidenceIds: readonly string[];
  readonly recommendedAction: string;
}

export interface PersistenceForensicsReport {
  readonly generatedAt: string;
  readonly findings: readonly PersistenceForensicsFinding[];
  readonly unresolvedCriticalCount: number;
}

export class PersistenceForensicsEngine {
  public analyze(
    evidence: readonly PersistenceForensicsEvidence[],
    generatedAt = new Date().toISOString(),
  ): PersistenceForensicsReport {
    const findings: PersistenceForensicsFinding[] = [];
    const byCategory = new Map<PersistenceForensicsEvidence['category'], PersistenceForensicsEvidence[]>();
    for (const item of evidence) {
      const bucket = byCategory.get(item.category) ?? [];
      bucket.push(item);
      byCategory.set(item.category, bucket);
    }
    for (const [category, items] of byCategory) {
      const severe = items.filter((item) => item.severity === 'error' || item.severity === 'critical');
      if (severe.length === 0) continue;
      const critical = severe.some((item) => item.severity === 'critical');
      findings.push(Object.freeze({
        findingId: `forensics:${category}:${findings.length + 1}`,
        severity: critical ? 'critical' : 'error',
        probableCause: this.causeFor(category),
        evidenceIds: Object.freeze(severe.map((item) => item.evidenceId)),
        recommendedAction: this.actionFor(category),
      }));
    }
    return Object.freeze({
      generatedAt,
      findings: Object.freeze(findings),
      unresolvedCriticalCount: findings.filter((finding) => finding.severity === 'critical').length,
    });
  }

  private causeFor(category: PersistenceForensicsEvidence['category']): string {
    switch (category) {
      case 'save': return 'Save transaction or write ordering failure.';
      case 'migration': return 'Schema transformation or compatibility failure.';
      case 'recovery': return 'Recovery checkpoint unavailable, invalid, or incomplete.';
      case 'storage': return 'Storage provider capacity, availability, or I/O failure.';
      case 'integrity': return 'Checksum, chain, or canonicalization integrity failure.';
    }
  }

  private actionFor(category: PersistenceForensicsEvidence['category']): string {
    switch (category) {
      case 'save': return 'Freeze destructive writes and restore the last verified checkpoint.';
      case 'migration': return 'Re-run the registered migration against an immutable verified source.';
      case 'recovery': return 'Escalate to the next verified backup or archive source.';
      case 'storage': return 'Re-evaluate provider capability and quota before retrying.';
      case 'integrity': return 'Quarantine the affected record and run deep integrity verification.';
    }
  }
}
