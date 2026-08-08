/**
 * Artifact ID: QCQ-ARC-002
 * Artifact Name: OwnershipManifest
 * Artifact Purpose: Constitutional ownership manifest defining QCQ architectural domains, authority categories, dependency direction, ownership invariants, and protected boundaries.
 * Artifact Layer: Architecture / GOV
 * Artifact Dependencies: None
 * Artifact Dependents: QCQ-ARC-001, QCQ-ARC-003, QCQ-ARC-004, QCQ-ARC-005, QCQ-ARC-006, QCQ-ARC-008, QCQ-ARC-009, QCQ-ARC-010
 * Dependency Graph: None -> OwnershipManifest -> all architectural governance authorities
 * Repository Path: QCQ/frontend/src/architecture
 * Source File: OwnershipManifest.ts
 */

export const OWNERSHIP_SCHEMA_VERSION = '1.0.0' as const;
export const OWNERSHIP_MANIFEST_VERSION = '1.0.0' as const;

export type ArchitecturalLayer =
  | 'runtime'
  | 'application'
  | 'routing'
  | 'layout'
  | 'tablet'
  | 'dataset'
  | 'gameplay'
  | 'metrics'
  | 'effects'
  | 'persistence'
  | 'theming'
  | 'composition'
  | 'leaderboards'
  | 'gamification'
  | 'ai'
  | 'analytics'
  | 'organizations'
  | 'saas'
  | 'security'
  | 'accessibility'
  | 'testing'
  | 'deployment'
  | 'architecture';

export type OwnershipAuthority =
  | 'runtime-authority'
  | 'spatial-authority'
  | 'routing-authority'
  | 'interaction-authority'
  | 'gameplay-authority'
  | 'dataset-authority'
  | 'grading-authority'
  | 'metrics-authority'
  | 'effects-authority'
  | 'persistence-authority'
  | 'theme-authority'
  | 'composition-authority'
  | 'leaderboard-authority'
  | 'gamification-authority'
  | 'ai-authority'
  | 'analytics-authority'
  | 'organization-authority'
  | 'saas-authority'
  | 'security-authority'
  | 'accessibility-authority'
  | 'testing-authority'
  | 'deployment-authority'
  | 'architecture-authority';

export type ResponsibilityCriticality =
  | 'constitutional'
  | 'critical'
  | 'high'
  | 'standard';

export interface ResponsibilityDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly authority: OwnershipAuthority;
  readonly layer: ArchitecturalLayer;
  readonly criticality: ResponsibilityCriticality;
  readonly exclusive: boolean;
  readonly transferable: boolean;
  readonly tags: readonly string[];
}

export interface OwnershipAssignment {
  readonly responsibilityId: string;
  readonly ownerArtifactId: string;
  readonly ownerArtifactName: string;
  readonly ownerLayer: ArchitecturalLayer;
  readonly source: 'constitutional' | 'registered';
  readonly effectiveVersion: string;
  readonly rationale: string;
}

export interface ArchitecturalDependency {
  readonly fromArtifactId: string;
  readonly toArtifactId: string;
  readonly kind: 'runtime' | 'type' | 'configuration' | 'integration' | 'test';
  readonly required: boolean;
  readonly rationale: string;
}

export interface ArtifactArchitectureDescriptor {
  readonly artifactId: string;
  readonly artifactName: string;
  readonly layer: ArchitecturalLayer;
  readonly repositoryPath: string;
  readonly responsibilities: readonly string[];
  readonly dependencies: readonly ArchitecturalDependency[];
  readonly tags: readonly string[];
}

export interface LayerDependencyRule {
  readonly from: ArchitecturalLayer;
  readonly to: ArchitecturalLayer;
  readonly allowed: boolean;
  readonly rationale: string;
}

export interface OwnershipManifestContract {
  readonly schemaVersion: typeof OWNERSHIP_SCHEMA_VERSION;
  readonly manifestVersion: typeof OWNERSHIP_MANIFEST_VERSION;
  readonly constitutionalAmendment: 'QCQ-ARCH-A1';
  readonly principle: 'Every Responsibility Has One Owner';
  readonly runtimeMasterArtworkUsage: false;
  readonly imageOverlayUsage: false;
  readonly hotspotOverlayUsage: false;
  readonly responsibilities: readonly ResponsibilityDefinition[];
  readonly protectedAssignments: readonly OwnershipAssignment[];
  readonly layerDependencyRules: readonly LayerDependencyRule[];
  readonly invariants: readonly string[];
}

function responsibility(
  value: ResponsibilityDefinition,
): ResponsibilityDefinition {
  return Object.freeze({
    ...value,
    tags: Object.freeze([...value.tags]),
  });
}

function assignment(
  value: OwnershipAssignment,
): OwnershipAssignment {
  return Object.freeze({ ...value });
}

function rule(
  value: LayerDependencyRule,
): LayerDependencyRule {
  return Object.freeze({ ...value });
}

export const CONSTITUTIONAL_RESPONSIBILITIES: readonly ResponsibilityDefinition[] =
  Object.freeze([
    responsibility({
      id: 'qcq.responsibility.application-runtime',
      name: 'Application runtime orchestration',
      description: 'Provider, runtime lifecycle, health, error containment, and application boot orchestration.',
      authority: 'runtime-authority',
      layer: 'runtime',
      criticality: 'constitutional',
      exclusive: true,
      transferable: false,
      tags: ['APP-001', 'runtime', 'boot'],
    }),
    responsibility({
      id: 'qcq.responsibility.macro-layout',
      name: 'Application macro layout',
      description: 'Application viewport, primary main landmark, skip link, environment, performance, tablet placement, metrics, player banner, breakpoints, and macro constraints.',
      authority: 'spatial-authority',
      layer: 'layout',
      criticality: 'constitutional',
      exclusive: true,
      transferable: false,
      tags: ['APP-002', 'layout', 'landmarks'],
    }),
    responsibility({
      id: 'qcq.responsibility.routing',
      name: 'Application routing',
      description: 'Top-level route resolution and navigation composition.',
      authority: 'routing-authority',
      layer: 'routing',
      criticality: 'critical',
      exclusive: true,
      transferable: false,
      tags: ['router', 'navigation'],
    }),
    responsibility({
      id: 'qcq.responsibility.tablet-experience',
      name: 'Tablet experience',
      description: 'Reusable tablet-local presentation, question presentation, answer interaction, tablet scrolling, and tablet-local composition.',
      authority: 'interaction-authority',
      layer: 'tablet',
      criticality: 'constitutional',
      exclusive: true,
      transferable: false,
      tags: ['TBL', 'tablet', 'interaction'],
    }),
    responsibility({
      id: 'qcq.responsibility.dataset-lifecycle',
      name: 'Dataset lifecycle',
      description: 'Dataset loading, normalization boundary, question registry, dataset validation, dataset governance, and dataset activation.',
      authority: 'dataset-authority',
      layer: 'dataset',
      criticality: 'constitutional',
      exclusive: true,
      transferable: false,
      tags: ['dataset', 'questions'],
    }),
    responsibility({
      id: 'qcq.responsibility.answer-grading',
      name: 'Answer grading',
      description: 'Authoritative correctness evaluation from stable option identities and selection rules.',
      authority: 'grading-authority',
      layer: 'gameplay',
      criticality: 'constitutional',
      exclusive: true,
      transferable: false,
      tags: ['grading', 'validation'],
    }),
    responsibility({
      id: 'qcq.responsibility.gameplay-state',
      name: 'Gameplay state',
      description: 'Authoritative learner gameplay state, scoring, XP, level and achievement evidence flow.',
      authority: 'gameplay-authority',
      layer: 'gameplay',
      criticality: 'constitutional',
      exclusive: true,
      transferable: false,
      tags: ['gameplay', 'score', 'xp'],
    }),
    responsibility({
      id: 'qcq.responsibility.metrics',
      name: 'Derived metrics',
      description: 'Metrics derived from authoritative gameplay evidence without scraping rendered interface text.',
      authority: 'metrics-authority',
      layer: 'metrics',
      criticality: 'critical',
      exclusive: true,
      transferable: false,
      tags: ['metrics', 'evidence'],
    }),
    responsibility({
      id: 'qcq.responsibility.effects',
      name: 'Decorative visual effects',
      description: 'Visual atmosphere, visual energy, particles, lightning, glow, reflections and reactive decorative feedback.',
      authority: 'effects-authority',
      layer: 'effects',
      criticality: 'critical',
      exclusive: true,
      transferable: false,
      tags: ['effects', 'atmosphere', 'web-native'],
    }),
    responsibility({
      id: 'qcq.responsibility.persistence',
      name: 'Local persistence',
      description: 'Versioned profile, active-session save and restore, compatible migration, and durable local progress.',
      authority: 'persistence-authority',
      layer: 'persistence',
      criticality: 'constitutional',
      exclusive: true,
      transferable: false,
      tags: ['persistence', 'offline', 'recovery'],
    }),
    responsibility({
      id: 'qcq.responsibility.theming',
      name: 'Visual token and theme policy',
      description: 'Typed visual tokens, materials, color, typography, spacing, elevation, glow and animation policy values.',
      authority: 'theme-authority',
      layer: 'theming',
      criticality: 'critical',
      exclusive: true,
      transferable: false,
      tags: ['theme', 'tokens', 'visual-system'],
    }),
    responsibility({
      id: 'qcq.responsibility.master-composition',
      name: 'Master composition',
      description: 'Thin composition boundary binding authoritative domain state into established visual systems without taking ownership of their internals.',
      authority: 'composition-authority',
      layer: 'composition',
      criticality: 'critical',
      exclusive: true,
      transferable: false,
      tags: ['composition', 'master'],
    }),
    responsibility({
      id: 'qcq.responsibility.leaderboards',
      name: 'Leaderboards',
      description: 'Leaderboard identity, ranking, privacy and presentation behavior.',
      authority: 'leaderboard-authority',
      layer: 'leaderboards',
      criticality: 'standard',
      exclusive: true,
      transferable: false,
      tags: ['leaderboards'],
    }),
    responsibility({
      id: 'qcq.responsibility.gamification',
      name: 'Gamification expansion',
      description: 'Gamification policies beyond core score and progression evidence.',
      authority: 'gamification-authority',
      layer: 'gamification',
      criticality: 'standard',
      exclusive: true,
      transferable: false,
      tags: ['gamification'],
    }),
    responsibility({
      id: 'qcq.responsibility.ai',
      name: 'AI learning intelligence',
      description: 'AI provider, recommendation, learning path and governed AI assistance boundaries.',
      authority: 'ai-authority',
      layer: 'ai',
      criticality: 'standard',
      exclusive: true,
      transferable: false,
      tags: ['AI', 'RAG'],
    }),
    responsibility({
      id: 'qcq.responsibility.analytics',
      name: 'Analytics',
      description: 'Analytics computation, evidence aggregation and analysis boundaries.',
      authority: 'analytics-authority',
      layer: 'analytics',
      criticality: 'standard',
      exclusive: true,
      transferable: false,
      tags: ['analytics'],
    }),
    responsibility({
      id: 'qcq.responsibility.organizations',
      name: 'Organization and tenant domain',
      description: 'Organization, team, department, tenant and institutional membership boundaries.',
      authority: 'organization-authority',
      layer: 'organizations',
      criticality: 'standard',
      exclusive: true,
      transferable: false,
      tags: ['organizations', 'enterprise'],
    }),
    responsibility({
      id: 'qcq.responsibility.saas',
      name: 'SaaS platform domain',
      description: 'SaaS plans, entitlements, billing boundary, tenancy policies and platform service contracts.',
      authority: 'saas-authority',
      layer: 'saas',
      criticality: 'standard',
      exclusive: true,
      transferable: false,
      tags: ['saas', 'enterprise'],
    }),
    responsibility({
      id: 'qcq.responsibility.security',
      name: 'Security policy',
      description: 'Security controls, authorization policy, trust boundaries, validation and secure integration requirements.',
      authority: 'security-authority',
      layer: 'security',
      criticality: 'constitutional',
      exclusive: true,
      transferable: false,
      tags: ['security', 'trust'],
    }),
    responsibility({
      id: 'qcq.responsibility.accessibility',
      name: 'Accessibility policy',
      description: 'Cross-cutting accessibility requirements, release gates and accessible interaction policy.',
      authority: 'accessibility-authority',
      layer: 'accessibility',
      criticality: 'constitutional',
      exclusive: true,
      transferable: false,
      tags: ['WCAG', 'accessibility'],
    }),
    responsibility({
      id: 'qcq.responsibility.architecture',
      name: 'Architectural governance',
      description: 'Ownership, dependency, integration, conflict resolution, certification and architectural readiness.',
      authority: 'architecture-authority',
      layer: 'architecture',
      criticality: 'constitutional',
      exclusive: true,
      transferable: false,
      tags: ['architecture', 'governance'],
    }),
  ]);

export const PROTECTED_OWNERSHIP_ASSIGNMENTS: readonly OwnershipAssignment[] =
  Object.freeze([
    assignment({
      responsibilityId: 'qcq.responsibility.application-runtime',
      ownerArtifactId: 'QCQ-APP-001',
      ownerArtifactName: 'ApplicationShell',
      ownerLayer: 'runtime',
      source: 'constitutional',
      effectiveVersion: '1.0.0',
      rationale: 'APP-001 is the established application runtime authority.',
    }),
    assignment({
      responsibilityId: 'qcq.responsibility.macro-layout',
      ownerArtifactId: 'QCQ-APP-002',
      ownerArtifactName: 'LayoutEngine',
      ownerLayer: 'layout',
      source: 'constitutional',
      effectiveVersion: 'QCQ-ARCH-A1',
      rationale: 'APP-002 is the sole application macro-layout authority.',
    }),
    assignment({
      responsibilityId: 'qcq.responsibility.routing',
      ownerArtifactId: 'QCQ-LCH-010',
      ownerArtifactName: 'AppRouter',
      ownerLayer: 'routing',
      source: 'constitutional',
      effectiveVersion: 'QCQ-ARCH-A1',
      rationale: 'Routing belongs above reusable tablet subsystems.',
    }),
    assignment({
      responsibilityId: 'qcq.responsibility.tablet-experience',
      ownerArtifactId: 'QCQ-TBL-001',
      ownerArtifactName: 'TabletApplicationShell family',
      ownerLayer: 'tablet',
      source: 'constitutional',
      effectiveVersion: 'QCQ-ARCH-A1',
      rationale: 'Tablet-local experience remains below APP-002 and does not own application macro layout.',
    }),
    assignment({
      responsibilityId: 'qcq.responsibility.dataset-lifecycle',
      ownerArtifactId: 'QCQ-TBL-016',
      ownerArtifactName: 'DatasetLoader family',
      ownerLayer: 'dataset',
      source: 'constitutional',
      effectiveVersion: '1.0.0',
      rationale: 'Dataset lifecycle is isolated from presentation and effects.',
    }),
    assignment({
      responsibilityId: 'qcq.responsibility.answer-grading',
      ownerArtifactId: 'QCQ-TBL-019',
      ownerArtifactName: 'AnswerValidationEngine',
      ownerLayer: 'gameplay',
      source: 'constitutional',
      effectiveVersion: 'QCQ-ARCH-A1',
      rationale: 'Hover, focus, selection rendering and tablet presentation never mutate authoritative grading.',
    }),
    assignment({
      responsibilityId: 'qcq.responsibility.effects',
      ownerArtifactId: 'QCQ-TBL-030',
      ownerArtifactName: 'Premium Effects family',
      ownerLayer: 'effects',
      source: 'constitutional',
      effectiveVersion: '1.0.0',
      rationale: 'Effects own decorative atmosphere only and remain removable.',
    }),
    assignment({
      responsibilityId: 'qcq.responsibility.architecture',
      ownerArtifactId: 'QCQ-ARC-001',
      ownerArtifactName: 'QCQ Architecture Governance family',
      ownerLayer: 'architecture',
      source: 'constitutional',
      effectiveVersion: '1.0.0',
      rationale: 'The ARC family owns architectural governance, not runtime product behavior.',
    }),
  ]);

export const LAYER_DEPENDENCY_RULES: readonly LayerDependencyRule[] =
  Object.freeze([
    rule({
      from: 'application',
      to: 'tablet',
      allowed: true,
      rationale: 'Application composition may consume reusable tablet systems.',
    }),
    rule({
      from: 'routing',
      to: 'layout',
      allowed: true,
      rationale: 'Top-level routing may compose the application layout authority.',
    }),
    rule({
      from: 'layout',
      to: 'tablet',
      allowed: true,
      rationale: 'APP-002 allocates a tablet zone to the reusable TBL domain.',
    }),
    rule({
      from: 'tablet',
      to: 'application',
      allowed: false,
      rationale: 'Reusable TBL source may not import or depend on APP source.',
    }),
    rule({
      from: 'tablet',
      to: 'layout',
      allowed: false,
      rationale: 'Tablet-local components may not take application spatial authority.',
    }),
    rule({
      from: 'effects',
      to: 'gameplay',
      allowed: false,
      rationale: 'Decorative effects may react to events but may not own or mutate gameplay state.',
    }),
    rule({
      from: 'effects',
      to: 'dataset',
      allowed: false,
      rationale: 'Effects never parse or own certification datasets.',
    }),
    rule({
      from: 'analytics',
      to: 'layout',
      allowed: false,
      rationale: 'Analytics must not take application layout ownership.',
    }),
    rule({
      from: 'ai',
      to: 'tablet',
      allowed: true,
      rationale: 'Governed AI features may be presented by tablet or route adapters without taking tablet ownership.',
    }),
    rule({
      from: 'tablet',
      to: 'ai',
      allowed: false,
      rationale: 'Core tablet operation must not depend on optional AI availability.',
    }),
    rule({
      from: 'leaderboards',
      to: 'gameplay',
      allowed: true,
      rationale: 'Leaderboards may consume verified gameplay evidence through an integration boundary.',
    }),
    rule({
      from: 'gameplay',
      to: 'leaderboards',
      allowed: false,
      rationale: 'Core gameplay must not depend on leaderboards.',
    }),
  ]);

export const OWNERSHIP_MANIFEST: OwnershipManifestContract = Object.freeze({
  schemaVersion: OWNERSHIP_SCHEMA_VERSION,
  manifestVersion: OWNERSHIP_MANIFEST_VERSION,
  constitutionalAmendment: 'QCQ-ARCH-A1',
  principle: 'Every Responsibility Has One Owner',
  runtimeMasterArtworkUsage: false,
  imageOverlayUsage: false,
  hotspotOverlayUsage: false,
  responsibilities: CONSTITUTIONAL_RESPONSIBILITIES,
  protectedAssignments: PROTECTED_OWNERSHIP_ASSIGNMENTS,
  layerDependencyRules: LAYER_DEPENDENCY_RULES,
  invariants: Object.freeze([
    'Every exclusive responsibility has exactly one authoritative owner.',
    'Permanent artifact identifiers are never reused, renamed, or displaced.',
    'APP-002 remains the sole application macro-layout authority.',
    'APP may depend upon reusable TBL systems; TBL may not depend upon APP.',
    'The application exposes one primary main landmark and one page skip link.',
    'TBL-003 remains the single tablet scroll owner unless a constitutional amendment explicitly supersedes it.',
    'TBL-019 remains authoritative for grading; presentation events never mutate a grade.',
    'AI does not move into Tablet authority.',
    'Analytics does not move into Layout authority.',
    'Persistence does not move into Gameplay authority.',
    'Gamification does not move into Question Engine authority.',
    'Leaderboards do not move into Session Engine authority.',
    'Effects remain decorative, optional, pointer-transparent, accessibility-safe, and removable.',
    'MASTER artwork remains a visual specification and never becomes a runtime interaction surface.',
    'Cross-module integration does not transfer ownership unless an explicit approved constitutional migration exists.',
    'No artifact is production-grade merely because it exists; executable integration or intentional governance/test use is required.',
  ]),
});

export function getResponsibilityDefinition(
  id: string,
): ResponsibilityDefinition | null {
  return OWNERSHIP_MANIFEST.responsibilities.find((entry) => entry.id === id) ?? null;
}

export function getProtectedOwnership(
  responsibilityId: string,
): OwnershipAssignment | null {
  return OWNERSHIP_MANIFEST.protectedAssignments.find(
    (entry) => entry.responsibilityId === responsibilityId,
  ) ?? null;
}
