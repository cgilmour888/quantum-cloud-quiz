/**
 * Artifact ID: QCQ-APP-002-021
 * Artifact Name: LayoutComposition.types
 * Artifact Purpose: Strict contracts for composition input, output, diagnostics, and geometry aggregation.
 * Artifact Layer: QCQ-APP-002 — CTR (Composition Contract Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> LayoutComposition.types -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/composition
 * Source File: LayoutComposition.types.ts
 */
import type { LayoutCapabilities } from '../types/LayoutEngine.types';
import type { LayoutConstraintViolation } from '../types/LayoutEngine.types';
import type { ResolvedLayoutPolicy } from '../types/LayoutEngine.types';
import type {
  LayoutZoneId,
  LayoutZonePlacement,
  PixelRect,
} from '../types/LayoutEngine.types';
import type { ViewportLayoutContract } from '../types/LayoutEngine.types';
import type { LayoutRenderingProfile } from '../rendering/LayoutRenderingProfile';

export interface LayoutCompositionConfig {
  readonly id: string;
  readonly version: string;
  readonly gapScale: number;
  readonly minimumGap: number;
  readonly maximumGap: number;
  readonly contentPaddingScale: number;
  readonly computeHiddenZones: boolean;
  readonly preserveDeterministicOrder: boolean;
}

export interface LayoutCompositionInput {
  readonly viewport: ViewportLayoutContract;
  readonly capabilities: LayoutCapabilities;
  readonly policy: ResolvedLayoutPolicy;
  readonly renderingProfile: LayoutRenderingProfile;
  readonly activeZones: ReadonlySet<LayoutZoneId>;
}

export interface LayoutCompositionResult {
  readonly id: string;
  readonly revision: string;
  readonly viewport: ViewportLayoutContract;
  readonly policy: ResolvedLayoutPolicy;
  readonly renderingProfile: LayoutRenderingProfile;
  readonly placements: Readonly<Record<LayoutZoneId, LayoutZonePlacement>>;
  readonly visibleZoneOrder: readonly LayoutZoneId[];
  readonly contentBounds: PixelRect;
  readonly contentWidth: number;
  readonly contentHeight: number;
  readonly gap: number;
  readonly cssVariables: Readonly<Record<string, string>>;
  readonly violations: readonly LayoutConstraintViolation[];
  readonly generatedAt: number;
}

export interface LayoutCompositionDiagnostics {
  readonly compositionId: string;
  readonly visibleZoneCount: number;
  readonly hiddenZoneCount: number;
  readonly correctedConstraintCount: number;
  readonly collisions: readonly LayoutConstraintViolation[];
}
