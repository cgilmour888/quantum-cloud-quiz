/**
 * Artifact ID: QCQ-APP-002-009
 * Artifact Name: LayoutZoneManifest
 * Artifact Purpose: Immutable governance manifest for the five constitutional macro zones and their reference geometry.
 * Artifact Layer: QCQ-APP-002 — GOV (Governance Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> LayoutZoneManifest -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/registry
 * Source File: LayoutZoneManifest.ts
 */
import {
  createMaster4KLayoutRegistry,
} from '../master4k/Master4KLayoutRegistry';

const registry =
  createMaster4KLayoutRegistry();

export const LAYOUT_ZONE_MANIFEST =
  Object.freeze({
    artifactId: 'QCQ-APP-002-009',
    schemaVersion: '2.0.0',
    layoutAuthority: 'QCQ-APP-002-001',
    zoneCount: registry.size,
    zones: Object.freeze(
      registry.list().map(
        ({ definition }) =>
          Object.freeze({
            id: definition.id,
            artifactId:
              definition.artifactId,
            name: definition.name,
            role: definition.role,
            ariaLabel:
              definition.ariaLabel,
            decorative:
              definition.decorative,
            required: definition.required,
            normalizedRect:
              definition.normalizedRect,
            reference:
              definition.reference,
            zIndex: definition.zIndex,
            overflow:
              definition.overflow,
            pointerPolicy:
              definition.pointerPolicy,
            collisionGroup:
              definition.collisionGroup,
            capabilities:
              definition.capabilities,
          }),
      ),
    ),
  });
