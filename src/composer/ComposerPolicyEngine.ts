/**
 * Artifact ID: QCQ-CMP-014
 * Artifact Name: ComposerPolicyEngine
 * Artifact Purpose: Constitutional decision engine preventing ownership theft, forbidden dependency direction, bridge bypass, unsafe lifecycle transitions, and quality changes that damage accessibility or tablet primacy.
 * Artifact Layer: Phase 10 — Master Composer / POL (Policy Authority)
 * Artifact Dependencies: QCQ-CMP-011, QCQ-CMP-012, QCQ-CMP-013
 * Artifact Dependents: QCQ-CMP-015, QCQ-CMP-018
 * Dependency Graph: QCQ-CMP-011, QCQ-CMP-012, QCQ-CMP-013 -> ComposerPolicyEngine -> QCQ-CMP-015, QCQ-CMP-018
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerPolicyEngine.ts
 */

import type { ComposerLifecyclePhase } from './ComposerLifecycleEngine';
import type { ComposerCapabilityId } from './ComposerCapabilityMatrix';
import type { ComposerOwnershipRegistry } from './ComposerOwnershipRegistry';

export type ComposerPolicyDecision = 'allow' | 'deny' | 'allow-with-conditions';
export type ComposerArchitectureLayer = 'app' | 'layout' | 'tablet' | 'gameplay' | 'persistence' | 'effects' | 'theme' | 'analytics' | 'ai' | 'gamification' | 'leaderboard' | 'organization' | 'saas' | 'security' | 'composer';

export interface ComposerPolicyResult {
  readonly decision: ComposerPolicyDecision;
  readonly code: string;
  readonly reason: string;
  readonly conditions: readonly string[];
}

export interface ComposerDependencyProposal {
  readonly fromArtifactId: string;
  readonly fromLayer: ComposerArchitectureLayer;
  readonly toArtifactId: string;
  readonly toLayer: ComposerArchitectureLayer;
  readonly viaBridge: boolean;
}

export interface ComposerQualityProposal {
  readonly tabletGeometryPreserved: boolean;
  readonly minimumTargetPx: number;
  readonly textScale: number;
  readonly reducedMotionHonored: boolean;
  readonly essentialContentHidden: boolean;
}

const BRIDGE_REQUIRED = new Set<ComposerArchitectureLayer>(['analytics','ai','gamification','leaderboard','organization','saas','security','effects','persistence']);

export class ComposerPolicyEngine {
  public constructor(private readonly ownership?: ComposerOwnershipRegistry) {}

  public evaluateOwnership(responsibility: string, attemptedOwner: string): ComposerPolicyResult {
    const record = this.ownership?.getOwner(responsibility) ?? null;
    if (!record || record.ownerArtifactId === attemptedOwner) return this.allow('OWNERSHIP_AVAILABLE', 'Ownership proposal preserves the registered owner.');
    return this.deny('OWNERSHIP_TRANSFER_FORBIDDEN', `${responsibility} belongs to ${record.ownerArtifactId}; integration may not transfer ownership.`);
  }

  public evaluateDependency(proposal: ComposerDependencyProposal): ComposerPolicyResult {
    if (proposal.fromArtifactId === proposal.toArtifactId) return this.deny('SELF_DEPENDENCY', 'An artifact may not depend on itself.');
    if (proposal.fromLayer === 'tablet' && proposal.toLayer === 'app') return this.deny('TABLET_TO_APP_FORBIDDEN', 'Tablet internals may not depend upward on application authority.');
    if (proposal.fromLayer === 'gameplay' && ['effects','theme','layout'].includes(proposal.toLayer)) return this.deny('GAMEPLAY_PRESENTATION_COUPLING', 'Gameplay may not depend on presentation authority.');
    if (proposal.fromLayer === 'layout' && ['analytics','ai','persistence','gamification'].includes(proposal.toLayer)) return this.deny('LAYOUT_DOMAIN_COUPLING', 'Layout may not depend on feature-domain internals.');
    if (BRIDGE_REQUIRED.has(proposal.toLayer) && proposal.fromLayer === 'composer' && !proposal.viaBridge) {
      return this.deny('COMPOSER_BRIDGE_REQUIRED', `Composer integration with ${proposal.toLayer} must pass through its governed bridge.`);
    }
    return this.allow('DEPENDENCY_ALLOWED', 'Dependency preserves the constitutional direction.');
  }

  public evaluateLifecycle(from: ComposerLifecyclePhase, to: ComposerLifecyclePhase): ComposerPolicyResult {
    if (from === 'disposed') return this.deny('DISPOSED_IS_TERMINAL', 'Disposed composition cannot re-enter runtime lifecycle.');
    if (to === 'ready' && from === 'created') return this.deny('READY_REQUIRES_VALIDATION', 'Composition must validate and initialize before readiness.');
    return this.allow('LIFECYCLE_POLICY_ALLOWED', 'Lifecycle proposal does not bypass mandatory stages.');
  }

  public evaluateCapabilityRequirement(capability: ComposerCapabilityId, available: boolean, required: boolean): ComposerPolicyResult {
    if (required && !available) return this.deny('REQUIRED_CAPABILITY_MISSING', `Required capability ${capability} is unavailable.`);
    if (!available) return this.conditional('OPTIONAL_CAPABILITY_UNAVAILABLE', `${capability} is unavailable; core composition may continue without it.`, ['Do not block primary gameplay.', 'Do not fabricate subsystem output.']);
    return this.allow('CAPABILITY_AVAILABLE', `${capability} is available.`);
  }

  public evaluateQuality(proposal: ComposerQualityProposal): ComposerPolicyResult {
    if (!proposal.tabletGeometryPreserved) return this.deny('TABLET_GEOMETRY_MUST_PERSIST', 'Quality scaling may not alter constitutional tablet geometry.');
    if (proposal.minimumTargetPx < 44) return this.deny('TARGET_TOO_SMALL', 'Quality scaling may not reduce interactive targets below 44 CSS pixels.');
    if (proposal.textScale < 1) return this.deny('TEXT_SCALE_TOO_SMALL', 'Quality scaling may not shrink essential text below its governed baseline.');
    if (!proposal.reducedMotionHonored) return this.deny('REDUCED_MOTION_VIOLATION', 'Reduced-motion preference must override decorative fidelity.');
    if (proposal.essentialContentHidden) return this.deny('ESSENTIAL_CONTENT_HIDDEN', 'Quality scaling may never hide essential content.');
    return this.allow('QUALITY_POLICY_ALLOWED', 'Quality proposal changes cost, not structure or semantics.');
  }

  private allow(code: string, reason: string): ComposerPolicyResult { return Object.freeze({ decision: 'allow', code, reason, conditions: Object.freeze([]) }); }
  private deny(code: string, reason: string): ComposerPolicyResult { return Object.freeze({ decision: 'deny', code, reason, conditions: Object.freeze([]) }); }
  private conditional(code: string, reason: string, conditions: readonly string[]): ComposerPolicyResult { return Object.freeze({ decision: 'allow-with-conditions', code, reason, conditions: Object.freeze([...conditions]) }); }
}
