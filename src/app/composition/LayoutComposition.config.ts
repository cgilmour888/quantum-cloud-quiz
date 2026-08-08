/**
 * Artifact ID: QCQ-APP-002-022
 * Artifact Name: LayoutComposition.config
 * Artifact Purpose: Deterministic gap, padding, hidden-zone, and composition-order configuration.
 * Artifact Layer: QCQ-APP-002 — CFG (Composition Configuration Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> LayoutComposition.config -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/composition
 * Source File: LayoutComposition.config.ts
 */
import type { LayoutCompositionConfig } from './LayoutComposition.types';

export const DEFAULT_LAYOUT_COMPOSITION_CONFIG: LayoutCompositionConfig =
  Object.freeze({
    id: 'qcq.layout-composition.master4k',
    version: '1.0.0',
    gapScale: 0.0125,
    minimumGap: 10,
    maximumGap: 42,
    contentPaddingScale: 0.012,
    computeHiddenZones: true,
    preserveDeterministicOrder: true,
  });
