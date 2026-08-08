/**
 * Artifact ID: QCQ-CMP-015
 * Artifact Name: ComposerConflictResolver
 * Artifact Purpose: Deterministic conflict normalization and ownership-preserving remedies for capability, dependency, policy, registration, performance, and integration conflicts.
 * Artifact Layer: Phase 10 — Master Composer / RES (Resolution Authority)
 * Artifact Dependencies: QCQ-CMP-012, QCQ-CMP-013, QCQ-CMP-014
 * Artifact Dependents: QCQ-CMP-016, QCQ-CMP-018
 * Dependency Graph: QCQ-CMP-012, QCQ-CMP-013, QCQ-CMP-014 -> ComposerConflictResolver -> QCQ-CMP-016, QCQ-CMP-018
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerConflictResolver.ts
 */

export type ComposerConflictKind = 'ownership' | 'dependency' | 'policy' | 'registration' | 'capability' | 'performance' | 'integration';
export type ComposerConflictSeverity = 'information' | 'warning' | 'error' | 'critical';
export type ComposerConflictRemedy = 'preserve-owner' | 'remove-shadow' | 'insert-bridge' | 'disable-optional-module' | 'reduce-rendering-cost' | 'revalidate' | 'block-composition';

export interface ComposerConflict {
  readonly id: string;
  readonly kind: ComposerConflictKind;
  readonly severity: ComposerConflictSeverity;
  readonly artifactIds: readonly string[];
  readonly message: string;
  readonly optional: boolean;
}

export interface ComposerConflictResolution {
  readonly conflictId: string;
  readonly remedy: ComposerConflictRemedy;
  readonly blocking: boolean;
  readonly rationale: string;
  readonly preservesOwnership: true;
}

export interface ComposerConflictResolutionReport {
  readonly conflicts: readonly ComposerConflict[];
  readonly resolutions: readonly ComposerConflictResolution[];
  readonly blockingConflictIds: readonly string[];
  readonly canContinue: boolean;
}

export class ComposerConflictResolver {
  public resolve(conflicts: readonly ComposerConflict[]): ComposerConflictResolutionReport {
    const seen = new Set<string>();
    const normalized: ComposerConflict[] = [];
    for (const conflict of conflicts) {
      if (!conflict.id.trim()) throw new Error('Conflict id must be non-empty.');
      if (seen.has(conflict.id)) continue;
      seen.add(conflict.id);
      normalized.push(Object.freeze({ ...conflict, artifactIds: Object.freeze([...conflict.artifactIds]) }));
    }
    normalized.sort((a,b)=>a.id.localeCompare(b.id));
    const resolutions = normalized.map((conflict)=>this.resolveOne(conflict));
    const blockingConflictIds = resolutions.filter((item)=>item.blocking).map((item)=>item.conflictId);
    return Object.freeze({
      conflicts: Object.freeze(normalized),
      resolutions: Object.freeze(resolutions),
      blockingConflictIds: Object.freeze(blockingConflictIds),
      canContinue: blockingConflictIds.length === 0,
    });
  }

  private resolveOne(conflict: ComposerConflict): ComposerConflictResolution {
    if (conflict.kind === 'ownership') return this.result(conflict, 'preserve-owner', true, 'Registered constitutional ownership must be preserved; shadow claims must be removed.');
    if (conflict.kind === 'dependency' || conflict.kind === 'policy') return this.result(conflict, 'insert-bridge', conflict.severity === 'critical' || conflict.severity === 'error', 'Use the governed bridge or dependency direction; never create direct cross-domain coupling.');
    if (conflict.kind === 'performance') return this.result(conflict, 'reduce-rendering-cost', false, 'Reduce optional rendering cost without changing layout, semantics, or gameplay.');
    if (conflict.optional) return this.result(conflict, 'disable-optional-module', false, 'Optional subsystem may be suspended while core tablet remains operational.');
    if (conflict.kind === 'registration') return this.result(conflict, 'remove-shadow', true, 'Duplicate or invalid registration must be removed before composition.');
    if (conflict.kind === 'capability') return this.result(conflict, 'revalidate', conflict.severity === 'critical' || conflict.severity === 'error', 'Capability evidence must be corrected and readiness re-evaluated.');
    return this.result(conflict, 'block-composition', true, 'Unresolved required integration conflict blocks certification.');
  }

  private result(conflict: ComposerConflict, remedy: ComposerConflictRemedy, blocking: boolean, rationale: string): ComposerConflictResolution {
    return Object.freeze({ conflictId: conflict.id, remedy, blocking, rationale, preservesOwnership: true });
  }
}
