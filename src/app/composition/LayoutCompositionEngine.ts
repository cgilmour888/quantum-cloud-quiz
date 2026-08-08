/**
 * Artifact ID: QCQ-APP-002-023
 * Artifact Name: LayoutCompositionEngine
 * Artifact Purpose: Deterministic cross-zone composition, constraints, CSS geometry, content bounds, and diagnostics.
 * Artifact Layer: QCQ-APP-002 — CMP (Composition Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> LayoutCompositionEngine -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/composition
 * Source File: LayoutCompositionEngine.ts
 */
import {
  DEFAULT_LAYOUT_COMPOSITION_CONFIG,
} from './LayoutComposition.config';
import type {
  LayoutCompositionConfig,
  LayoutCompositionInput,
  LayoutCompositionResult,
} from './LayoutComposition.types';
import {
  LayoutConstraintEngine,
} from '../constraints/LayoutConstraintEngine';
import {
  MASTER_4K_LAYOUT_CONSTRAINTS,
} from '../master4k/Master4KLayoutContract';
import type {
  LayoutZoneId,
  LayoutZonePlacement,
  PixelRect,
} from '../types/LayoutEngine.types';
import {
  clampLayoutNumber,
  resolveScaleFactors,
} from '../scaling/LayoutScalingRules';
import {
  LayoutZoneRegistry,
} from '../registry/LayoutZoneRegistry';

const ZONE_DEPENDENCY_ORDER =
  Object.freeze([
    'environment',
    'tablet',
    'performance',
    'metrics',
    'player-banner',
  ] satisfies readonly LayoutZoneId[]);

function createCompositionId(
  input: LayoutCompositionInput,
): string {
  const active = [...input.activeZones]
    .sort()
    .join('.');
  return [
    'qcq-layout',
    input.viewport.category,
    `${Math.round(input.viewport.width)}x${Math.round(input.viewport.height)}`,
    input.renderingProfile.quality,
    active,
  ].join('-');
}

function contentBounds(
  placements:
    ReadonlyMap<
      LayoutZoneId,
      LayoutZonePlacement
    >,
  viewportWidth: number,
  viewportHeight: number,
): PixelRect {
  const visible = [...placements.values()]
    .filter(
      (placement) =>
        placement.visible &&
        placement.zoneId !== 'environment',
    );

  if (visible.length === 0) {
    return Object.freeze({
      x: 0,
      y: 0,
      width: viewportWidth,
      height: viewportHeight,
    });
  }

  const minX = Math.min(
    ...visible.map(
      (placement) => placement.rect.x,
    ),
  );
  const minY = Math.min(
    ...visible.map(
      (placement) => placement.rect.y,
    ),
  );
  const maxX = Math.max(
    ...visible.map(
      (placement) =>
        placement.rect.x +
        placement.rect.width,
    ),
  );
  const maxY = Math.max(
    ...visible.map(
      (placement) =>
        placement.rect.y +
        placement.rect.height,
    ),
  );

  return Object.freeze({
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  });
}

export class LayoutCompositionEngine {
  readonly #registry: LayoutZoneRegistry;
  readonly #constraintEngine:
    LayoutConstraintEngine;
  readonly #config:
    LayoutCompositionConfig;

  public constructor(
    registry: LayoutZoneRegistry,
    constraintEngine =
      new LayoutConstraintEngine(),
    config =
      DEFAULT_LAYOUT_COMPOSITION_CONFIG,
  ) {
    this.#registry = registry;
    this.#constraintEngine =
      constraintEngine;
    this.#config = config;

    if (!registry.isSealed()) {
      registry.seal();
    }
  }

  public compose(
    input: LayoutCompositionInput,
  ): LayoutCompositionResult {
    const scale = resolveScaleFactors(
      input.viewport,
      input.policy.textScale,
      input.policy.effectScale,
    );

    const gap = clampLayoutNumber(
      input.viewport.visualWidth *
        this.#config.gapScale,
      this.#config.minimumGap,
      this.#config.maximumGap,
    );

    const placements =
      new Map<
        LayoutZoneId,
        LayoutZonePlacement
      >();

    for (
      const zoneId of ZONE_DEPENDENCY_ORDER
    ) {
      const registration =
        this.#registry.resolve(zoneId);
      const placement =
        registration.calculate({
          viewport: input.viewport,
          policy: input.policy,
          capabilities: input.capabilities,
          constraints:
            MASTER_4K_LAYOUT_CONSTRAINTS,
          renderingProfile:
            input.renderingProfile,
          placedZones: placements,
          gap,
        });

      const visible =
        placement.visible &&
        input.activeZones.has(zoneId);

      placements.set(
        zoneId,
        visible === placement.visible
          ? placement
          : Object.freeze({
              ...placement,
              visible,
            }),
      );
    }

    const constrained =
      this.#constraintEngine.enforce(
        placements,
        MASTER_4K_LAYOUT_CONSTRAINTS,
        input.viewport,
        gap,
      );

    const bounds = contentBounds(
      constrained.placements,
      input.viewport.visualWidth,
      input.viewport.visualHeight,
    );

    const contentHeight = Math.max(
      input.viewport.visualHeight,
      bounds.y +
        bounds.height +
        input.viewport.safeArea.bottom +
        gap,
    );
    const contentWidth = Math.max(
      input.viewport.visualWidth,
      bounds.x +
        bounds.width +
        input.viewport.safeArea.right,
    );

    const placementRecord =
      {} as Record<
        LayoutZoneId,
        LayoutZonePlacement
      >;

    const cssVariables:
      Record<string, string> = {
        '--qcq-layout-content-width':
          `${contentWidth.toFixed(3)}px`,
        '--qcq-layout-content-height':
          `${contentHeight.toFixed(3)}px`,
        '--qcq-layout-gap':
          `${gap.toFixed(3)}px`,
        '--qcq-layout-scale-x':
          scale.x.toFixed(6),
        '--qcq-layout-scale-y':
          scale.y.toFixed(6),
        '--qcq-layout-scale-uniform':
          scale.uniform.toFixed(6),
        '--qcq-layout-text-scale':
          scale.text.toFixed(6),
        '--qcq-layout-effect-scale':
          scale.effects.toFixed(6),
        '--qcq-layout-minimum-target':
          `${input.policy.minimumInteractiveTarget}px`,
      };

    for (
      const [zoneId, placement]
      of constrained.placements
    ) {
      placementRecord[zoneId] =
        placement;
      Object.assign(
        cssVariables,
        placement.cssVariables,
      );
    }

    const visibleZoneOrder =
      Object.freeze(
        input.policy.zoneOrder.filter(
          (zoneId) =>
            placementRecord[zoneId]
              ?.visible === true,
        ),
      );

    const id =
      createCompositionId(input);

    return Object.freeze({
      id,
      revision:
        `${id}:${input.viewport.timestamp}`,
      viewport: input.viewport,
      policy: input.policy,
      renderingProfile:
        input.renderingProfile,
      placements:
        Object.freeze(placementRecord),
      visibleZoneOrder,
      contentBounds: bounds,
      contentWidth,
      contentHeight,
      gap,
      cssVariables:
        Object.freeze(cssVariables),
      violations:
        constrained.violations,
      generatedAt: Date.now(),
    });
  }
}
