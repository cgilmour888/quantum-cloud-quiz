/**
 * Artifact ID: QCQ-APP-002-007
 * Artifact Name: LayoutEngine.test
 * Artifact Purpose: Executable validation for zone semantics, spatial scaling, deterministic composition, responsive behavior, and no-raster constraints.
 * Artifact Layer: QCQ-APP-002 — VAL (Validation Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> LayoutEngine.test -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/tests
 * Source File: LayoutEngine.test.tsx
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import LayoutEngine from '../LayoutEngine';
import { LayoutBreakpointRegistry } from '../responsive/LayoutBreakpointRegistry';
import { LayoutPolicyEngine } from '../policies/LayoutPolicyEngine';
import { LayoutCompositionEngine } from '../composition/LayoutCompositionEngine';
import { createMaster4KLayoutRegistry } from '../master4k/Master4KLayoutRegistry';
import { createViewportLayoutContract } from '../types/LayoutEngine.types';
import { SERVER_LAYOUT_CAPABILITIES } from '../types/LayoutEngine.types';
import { resolveLayoutRenderingProfile } from '../rendering/LayoutRenderingProfile';

function compositionAt(width: number, height: number) {
  const breakpoints = new LayoutBreakpointRegistry();
  const category = breakpoints.resolve(width, height);
  const viewport = createViewportLayoutContract({ width, height }, category);
  const activeZones = new Set([
    'environment',
    'performance',
    'tablet',
    'metrics',
    'player-banner',
  ] as const);
  const policy = new LayoutPolicyEngine().resolve(
    viewport,
    SERVER_LAYOUT_CAPABILITIES,
    { quality: 'balanced', motion: 'reduced' },
    activeZones,
  );
  const renderingProfile = resolveLayoutRenderingProfile(
    SERVER_LAYOUT_CAPABILITIES,
    policy,
    viewport,
  );
  return new LayoutCompositionEngine(createMaster4KLayoutRegistry()).compose({
    viewport,
    capabilities: SERVER_LAYOUT_CAPABILITIES,
    policy,
    renderingProfile,
    activeZones,
  });
}

describe('QCQ-APP-002 LayoutEngine', () => {
  it('renders semantic tablet, console, environment, and player zones', () => {
    const html = renderToStaticMarkup(
      <LayoutEngine
        environment={<span>environment</span>}
        performance={<span>performance</span>}
        tablet={<span>tablet</span>}
        metrics={<span>metrics</span>}
        playerBanner={<span>player</span>}
        motion="reduced"
      />,
    );

    expect(html).toContain('data-qcq-layout-engine="QCQ-APP-002"');
    expect(html).toContain('data-qcq-layout-zone="tablet"');
    expect(html).toContain('data-qcq-layout-zone="performance"');
    expect(html).toContain('data-qcq-layout-zone="metrics"');
    expect(html).toContain('data-qcq-layout-zone="player-banner"');
    expect(html).toContain('Skip to certification tablet');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<map');
    expect(html).not.toContain('usemap=');
    expect(html).toContain('data-qcq-master-reference="normalized-web-native"');
  });

  it('preserves the MASTER side-console/tablet relationship at command width', () => {
    const composition = compositionAt(1600, 900);
    const performance = composition.placements.performance.rect;
    const tablet = composition.placements.tablet.rect;
    const metrics = composition.placements.metrics.rect;

    expect(composition.viewport.category).toBe('command');
    expect(performance.x + performance.width).toBeLessThanOrEqual(tablet.x);
    expect(tablet.x + tablet.width).toBeLessThanOrEqual(metrics.x);
    expect(composition.violations.filter((violation) => violation.code === 'zone-collision')).toHaveLength(0);
  });

  it('reflows into a vertically accessible composition on compact viewports', () => {
    const composition = compositionAt(390, 844);
    const tablet = composition.placements.tablet.rect;
    const performance = composition.placements.performance.rect;
    const metrics = composition.placements.metrics.rect;
    const banner = composition.placements['player-banner'].rect;

    expect(composition.viewport.category).toBe('micro');
    expect(tablet.y + tablet.height).toBeLessThanOrEqual(performance.y);
    expect(performance.y + performance.height).toBeLessThanOrEqual(metrics.y);
    expect(metrics.y + metrics.height).toBeLessThanOrEqual(banner.y);
    expect(composition.contentHeight).toBeGreaterThan(composition.viewport.height);
  });


  it('maps the supplied MASTER reference geometry proportionally into canonical 4K space', () => {
    const composition = compositionAt(3840, 2160);
    const performance = composition.placements.performance.rect;
    const tablet = composition.placements.tablet.rect;
    const metrics = composition.placements.metrics.rect;
    const banner = composition.placements['player-banner'].rect;

    expect(composition.viewport.category).toBe('cinematic');
    expect(performance.x).toBeCloseTo(281.25, 2);
    expect(performance.y).toBeCloseTo(281.25, 2);
    expect(performance.width).toBeCloseTo(750, 2);
    expect(performance.height).toBeCloseTo(1368.75, 2);

    expect(tablet.x).toBeCloseTo(1170, 2);
    expect(tablet.y).toBeCloseTo(506.25, 2);
    expect(tablet.width).toBeCloseTo(1567.5, 2);
    expect(tablet.height).toBeCloseTo(1078.125, 2);

    expect(metrics.x).toBeCloseTo(2846.25, 2);
    expect(metrics.y).toBeCloseTo(281.25, 2);
    expect(metrics.width).toBeCloseTo(684.375, 2);
    expect(metrics.height).toBeCloseTo(1368.75, 2);

    expect(banner.x).toBeCloseTo(1421.25, 2);
    expect(banner.y).toBeCloseTo(1912.5, 2);
    expect(banner.width).toBeCloseTo(997.5, 2);
    expect(banner.height).toBeCloseTo(225, 2);
    expect(composition.violations).toHaveLength(0);
  });

  it('preserves normalized geometry at 8K and 12K while rendering cost adapts independently', () => {
    const fourK = compositionAt(3840, 2160);
    const eightK = compositionAt(7680, 4320);
    const twelveK = compositionAt(11520, 6480);

    expect(
      eightK.placements.tablet.rect.x /
        fourK.placements.tablet.rect.x,
    ).toBeCloseTo(2, 5);
    expect(
      twelveK.placements.tablet.rect.x /
        fourK.placements.tablet.rect.x,
    ).toBeCloseTo(3, 5);
    expect(eightK.violations).toHaveLength(0);
    expect(twelveK.violations).toHaveLength(0);
  });

  it('is deterministic for an identical viewport and policy contract', () => {
    const first = compositionAt(1920, 1080);
    const second = compositionAt(1920, 1080);
    expect(first.id).toBe(second.id);
    expect(first.placements.tablet.rect).toEqual(second.placements.tablet.rect);
    expect(first.visibleZoneOrder).toEqual(second.visibleZoneOrder);
  });
});
