/**
 * Artifact ID: QCQ-APP-002-001
 * Artifact Name: LayoutEngine
 * Artifact Purpose: Sole macro-layout authority coordinating the five constitutional zones and their semantic rendering.
 * Artifact Layer: QCQ-APP-002 — APP (Layout Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> LayoutEngine -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app
 * Source File: LayoutEngine.tsx
 */
import { useId, useRef, type ReactNode } from 'react';

import styles from './styles/LayoutEngine.module.css';
import type { LayoutEngineProps } from './types/LayoutEngine.types';
import type { LayoutZoneId, LayoutZonePlacement } from './types/LayoutEngine.types';
import {
  LAYOUT_DATA_ATTRIBUTES,
  QCQ_LAYOUT_ENGINE_ARTIFACT_ID,
  QCQ_LAYOUT_ENGINE_VERSION,
} from './constants/LayoutEngine.constants';
import { useLayoutEngine } from './hooks/useLayoutEngine';

interface ZoneElementProps {
  readonly placement: LayoutZonePlacement;
  readonly className: string;
  readonly children: ReactNode;
  readonly id?: string | undefined;
}

function ZoneElement({
  placement,
  className,
  children,
  id,
}: ZoneElementProps) {
  if (!placement.visible || children === null || children === undefined) {
    return null;
  }

  const common = {
    id,
    className: `${styles.zone} ${className}`,
    [LAYOUT_DATA_ATTRIBUTES.zone]: placement.zoneId,
    [LAYOUT_DATA_ATTRIBUTES.visible]: String(placement.visible),
    'aria-label': placement.ariaLabel,
  };

  if (placement.zoneId === 'tablet') {
    return <main {...common}>{children}</main>;
  }
  if (placement.zoneId === 'performance' || placement.zoneId === 'metrics') {
    return <aside {...common}>{children}</aside>;
  }
  if (placement.zoneId === 'player-banner') {
    return <section {...common} role="status">{children}</section>;
  }
  return (
    <div {...common} role="presentation" aria-hidden="true">
      {children}
    </div>
  );
}

function definedZoneIds(slots: Readonly<Record<LayoutZoneId, ReactNode>>): readonly LayoutZoneId[] {
  const zoneIds = Object.keys(slots) as LayoutZoneId[];
  return Object.freeze(zoneIds.filter((zoneId) => slots[zoneId] !== null && slots[zoneId] !== undefined));
}

export default function LayoutEngine({
  environment,
  performance,
  tablet,
  metrics,
  playerBanner,
  children,
  className,
  id,
  ariaLabel = 'Quantum Certification Quest application layout',
  policies,
  quality,
  motion,
  viewportOverride,
  activeZones,
  debug = false,
  onCompositionChange,
  left,
  center,
  right,
  footer,
}: LayoutEngineProps) {
  const primaryId = useId();
  const resolvedSlots: Readonly<Record<LayoutZoneId, ReactNode>> = Object.freeze({
    environment,
    performance: performance ?? left,
    tablet: tablet ?? center ?? children,
    metrics: metrics ?? right,
    'player-banner': playerBanner ?? footer,
  });
  const populatedZones = definedZoneIds(resolvedSlots);
  const requestedZones = activeZones
    ? populatedZones.filter((zoneId) => activeZones.includes(zoneId))
    : populatedZones;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const engine = useLayoutEngine(rootRef, {
    ...(policies === undefined ? {} : { policies }),
    ...(quality === undefined ? {} : { quality }),
    ...(motion === undefined ? {} : { motion }),
    ...(viewportOverride === undefined
      ? {}
      : { viewportOverride }),
    activeZones: requestedZones,
    ...(onCompositionChange === undefined
      ? {}
      : { onCompositionChange }),
  });
  const rootClasses = [styles.root, className].filter(Boolean).join(' ');
  const placements = engine.composition.placements;

  return (
    <div
      ref={rootRef}
      id={id}
      className={rootClasses}
      style={engine.style}
      role="group"
      aria-label={ariaLabel}
      data-qcq-layout-engine="QCQ-APP-002"
      data-qcq-layout-artifact={QCQ_LAYOUT_ENGINE_ARTIFACT_ID}
      data-qcq-layout-version={QCQ_LAYOUT_ENGINE_VERSION}
      data-qcq-master-reference="normalized-web-native"
      data-qcq-layout-ready={String(engine.ready)}
      data-qcq-layout-category={engine.viewport.category}
      data-qcq-layout-orientation={engine.viewport.orientation}
      data-qcq-layout-quality={engine.renderingProfile.quality}
      data-qcq-layout-motion={engine.renderingProfile.motion}
      data-qcq-layout-debug={String(debug)}
    >
      <a className={styles.skipLink} href={`#${primaryId}`}>
        Skip to certification tablet
      </a>

      <div className={styles.canvas}>
        <ZoneElement placement={placements.environment} className={styles.environment ?? ''}>
          {resolvedSlots.environment}
        </ZoneElement>
        <ZoneElement
          placement={placements.performance}
          className={styles.performance ?? ''}
        >
          {resolvedSlots.performance}
        </ZoneElement>
        <ZoneElement
          id={primaryId}
          placement={placements.tablet}
          className={styles.tablet ?? ''}
        >
          {resolvedSlots.tablet}
        </ZoneElement>
        <ZoneElement placement={placements.metrics} className={styles.metrics ?? ''}>
          {resolvedSlots.metrics}
        </ZoneElement>
        <ZoneElement
          placement={placements['player-banner']}
          className={styles.playerBanner ?? ''}
        >
          {resolvedSlots['player-banner']}
        </ZoneElement>
      </div>

      {debug ? (
        <pre className={styles.debugOverlay} aria-label="Layout diagnostics">
          {JSON.stringify(
            {
              category: engine.viewport.category,
              viewport: {
                width: engine.viewport.width,
                height: engine.viewport.height,
              },
              quality: engine.renderingProfile.quality,
              motion: engine.renderingProfile.motion,
              activeZones: requestedZones,
              content: {
                width: engine.composition.contentWidth,
                height: engine.composition.contentHeight,
              },
              violations: engine.composition.violations,
            },
            null,
            2,
          )}
        </pre>
      ) : null}
    </div>
  );
}

export type { LayoutEngineProps } from './types/LayoutEngine.types';
