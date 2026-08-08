/**
 * Artifact ID: QCQ-CMP-013
 * Artifact Name: ComposerOwnershipRegistry
 * Artifact Purpose: Single-owner constitutional responsibility registry protecting APP-002 layout, TBL-040 composition, grading, theme, persistence, effects, and composer governance boundaries.
 * Artifact Layer: Phase 10 — Master Composer / REG (Ownership Authority)
 * Artifact Dependencies: None
 * Artifact Dependents: QCQ-CMP-014, QCQ-CMP-015, QCQ-CMP-018
 * Dependency Graph: None -> ComposerOwnershipRegistry -> QCQ-CMP-014, QCQ-CMP-015, QCQ-CMP-018
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerOwnershipRegistry.ts
 */

export interface ComposerOwnershipRecord {
  readonly responsibility: string;
  readonly ownerArtifactId: string;
  readonly ownerArtifactName: string;
  readonly protected: boolean;
  readonly scope: 'external-constitutional' | 'composer';
  readonly notes: string;
}

export interface ComposerOwnershipSnapshot {
  readonly version: number;
  readonly records: readonly ComposerOwnershipRecord[];
}

const SEED: readonly ComposerOwnershipRecord[] = Object.freeze([
  { responsibility: 'macro-layout', ownerArtifactId: 'QCQ-APP-002', ownerArtifactName: 'LayoutEngine', protected: true, scope: 'external-constitutional', notes: 'Sole macro spatial authority.' },
  { responsibility: 'tablet-scroll', ownerArtifactId: 'QCQ-TBL-003', ownerArtifactName: 'TabletViewport', protected: true, scope: 'external-constitutional', notes: 'Sole governed tablet scroll owner.' },
  { responsibility: 'answer-grading', ownerArtifactId: 'QCQ-TBL-019', ownerArtifactName: 'AnswerValidationEngine', protected: true, scope: 'external-constitutional', notes: 'Presentation state may never mutate grade.' },
  { responsibility: 'visual-theme', ownerArtifactId: 'QCQ-THM-010', ownerArtifactName: 'ThemeManifest', protected: true, scope: 'external-constitutional', notes: 'Phase 9 retains visual authority.' },
  { responsibility: 'master-composition', ownerArtifactId: 'QCQ-TBL-040', ownerArtifactName: 'MasterTabletComposer', protected: true, scope: 'composer', notes: 'Sole root tablet composition authority.' },
  { responsibility: 'composer-registry', ownerArtifactId: 'QCQ-CMP-006', ownerArtifactName: 'ComposerRegistry', protected: true, scope: 'composer', notes: 'Module registration authority.' },
  { responsibility: 'composer-accessibility', ownerArtifactId: 'QCQ-CMP-008', ownerArtifactName: 'ComposerAccessibilityEngine', protected: true, scope: 'composer', notes: 'Accessibility orchestration authority.' },
  { responsibility: 'composer-theme-bridge', ownerArtifactId: 'QCQ-CMP-009', ownerArtifactName: 'ComposerThemeBridge', protected: true, scope: 'composer', notes: 'Bridge only; does not own theme definitions.' },
  { responsibility: 'composer-persistence-bridge', ownerArtifactId: 'QCQ-CMP-010', ownerArtifactName: 'ComposerPersistenceBridge', protected: true, scope: 'composer', notes: 'Bridge only; does not own persistence internals.' },
  { responsibility: 'composer-lifecycle', ownerArtifactId: 'QCQ-CMP-011', ownerArtifactName: 'ComposerLifecycleEngine', protected: true, scope: 'composer', notes: 'Composition lifecycle authority.' },
  { responsibility: 'composer-capabilities', ownerArtifactId: 'QCQ-CMP-012', ownerArtifactName: 'ComposerCapabilityMatrix', protected: true, scope: 'composer', notes: 'Capability evidence authority.' },
  { responsibility: 'composer-ownership', ownerArtifactId: 'QCQ-CMP-013', ownerArtifactName: 'ComposerOwnershipRegistry', protected: true, scope: 'composer', notes: 'Single-owner authority.' },
  { responsibility: 'composer-policy', ownerArtifactId: 'QCQ-CMP-014', ownerArtifactName: 'ComposerPolicyEngine', protected: true, scope: 'composer', notes: 'Composition policy authority.' },
  { responsibility: 'composer-conflict-resolution', ownerArtifactId: 'QCQ-CMP-015', ownerArtifactName: 'ComposerConflictResolver', protected: true, scope: 'composer', notes: 'Resolution authority without ownership transfer.' },
  { responsibility: 'composer-readiness', ownerArtifactId: 'QCQ-CMP-016', ownerArtifactName: 'ComposerReadinessEvaluator', protected: true, scope: 'composer', notes: 'Evidence-based readiness authority.' },
  { responsibility: 'composer-certification', ownerArtifactId: 'QCQ-CMP-017', ownerArtifactName: 'ComposerCertificationEngine', protected: true, scope: 'composer', notes: 'Composition certification authority.' },
  { responsibility: 'composer-integration', ownerArtifactId: 'QCQ-CMP-018', ownerArtifactName: 'ComposerIntegrationEngine', protected: true, scope: 'composer', notes: 'Cross-system integration orchestration.' },
  { responsibility: 'composer-performance', ownerArtifactId: 'QCQ-CMP-019', ownerArtifactName: 'ComposerPerformanceProfile', protected: true, scope: 'composer', notes: 'Composition performance budgets.' },
  { responsibility: 'composer-quality-scaling', ownerArtifactId: 'QCQ-CMP-020', ownerArtifactName: 'ComposerQualityScaler', protected: true, scope: 'composer', notes: 'Rendering-cost scaling without geometry changes.' },
  { responsibility: 'composer-monitoring-bridge', ownerArtifactId: 'QCQ-CMP-021', ownerArtifactName: 'ComposerMonitoringBridge', protected: true, scope: 'composer', notes: 'Monitoring bridge only.' },
  { responsibility: 'composer-telemetry-bridge', ownerArtifactId: 'QCQ-CMP-022', ownerArtifactName: 'ComposerTelemetryBridge', protected: true, scope: 'composer', notes: 'Telemetry bridge only.' },
  { responsibility: 'composer-effects-bridge', ownerArtifactId: 'QCQ-CMP-023', ownerArtifactName: 'ComposerEffectsBridge', protected: true, scope: 'composer', notes: 'Effects bridge; premium effects retain rendering ownership.' },
  { responsibility: 'composer-analytics-bridge', ownerArtifactId: 'QCQ-CMP-024', ownerArtifactName: 'ComposerAnalyticsBridge', protected: true, scope: 'composer', notes: 'Analytics bridge only.' },
  { responsibility: 'composer-ai-bridge', ownerArtifactId: 'QCQ-CMP-025', ownerArtifactName: 'ComposerAIBridge', protected: true, scope: 'composer', notes: 'AI bridge only.' },
  { responsibility: 'composer-gamification-bridge', ownerArtifactId: 'QCQ-CMP-026', ownerArtifactName: 'ComposerGamificationBridge', protected: true, scope: 'composer', notes: 'Gamification bridge only.' },
  { responsibility: 'composer-leaderboard-bridge', ownerArtifactId: 'QCQ-CMP-027', ownerArtifactName: 'ComposerLeaderboardBridge', protected: true, scope: 'composer', notes: 'Leaderboard bridge only.' },
  { responsibility: 'composer-organization-bridge', ownerArtifactId: 'QCQ-CMP-028', ownerArtifactName: 'ComposerOrganizationBridge', protected: true, scope: 'composer', notes: 'Organization bridge only.' },
  { responsibility: 'composer-saas-bridge', ownerArtifactId: 'QCQ-CMP-029', ownerArtifactName: 'ComposerSaaSBridge', protected: true, scope: 'composer', notes: 'SaaS bridge only.' },
  { responsibility: 'composer-security-bridge', ownerArtifactId: 'QCQ-CMP-030', ownerArtifactName: 'ComposerSecurityBridge', protected: true, scope: 'composer', notes: 'Security bridge only.' },
]);

export class ComposerOwnershipConflictError extends Error {
  public constructor(public readonly responsibility: string, public readonly existingOwner: string, public readonly attemptedOwner: string) {
    super(`Responsibility ${responsibility} is already owned by ${existingOwner}; ${attemptedOwner} may not claim it.`);
    this.name = 'ComposerOwnershipConflictError';
  }
}

export class ComposerOwnershipRegistry {
  private readonly records = new Map<string, ComposerOwnershipRecord>();
  private version = 0;

  public constructor(seed: readonly ComposerOwnershipRecord[] = SEED) {
    for (const record of seed) this.register(record);
    this.version = 0;
  }

  public register(record: ComposerOwnershipRecord): ComposerOwnershipSnapshot {
    if (!record.responsibility.trim() || !record.ownerArtifactId.trim()) throw new Error('Responsibility and ownerArtifactId are required.');
    const existing = this.records.get(record.responsibility);
    if (existing && existing.ownerArtifactId !== record.ownerArtifactId) {
      throw new ComposerOwnershipConflictError(record.responsibility, existing.ownerArtifactId, record.ownerArtifactId);
    }
    this.records.set(record.responsibility, Object.freeze({ ...record }));
    this.version += 1;
    return this.getSnapshot();
  }

  public getOwner(responsibility: string): ComposerOwnershipRecord | null {
    return this.records.get(responsibility) ?? null;
  }

  public assertOwner(responsibility: string, artifactId: string): void {
    const record = this.records.get(responsibility);
    if (!record) throw new Error(`Unregistered responsibility: ${responsibility}.`);
    if (record.ownerArtifactId !== artifactId) throw new ComposerOwnershipConflictError(responsibility, record.ownerArtifactId, artifactId);
  }

  public getSnapshot(): ComposerOwnershipSnapshot {
    return Object.freeze({ version: this.version, records: Object.freeze([...this.records.values()].sort((a,b)=>a.responsibility.localeCompare(b.responsibility))) });
  }
}

export const COMPOSER_CONSTITUTIONAL_OWNERSHIP = SEED;
