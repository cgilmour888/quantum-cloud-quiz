/**
 * Artifact ID: QCQ-APP-002-005
 * Artifact Name: useLayoutEngine
 * Artifact Purpose: Viewport measurement, capability detection, adaptive policy resolution, rendering-profile selection, and live composition.
 * Artifact Layer: QCQ-APP-002 — RUN (Runtime Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> useLayoutEngine -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/hooks
 * Source File: useLayoutEngine.ts
 */
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type RefObject,
} from 'react';

import {
  SERVER_LAYOUT_CAPABILITIES,
  createViewportLayoutContract,
  type LayoutCapabilities,
  type LayoutColorGamut,
  type LayoutPointerPrecision,
  type LayoutZoneId,
  type UseLayoutEngineOptions,
  type UseLayoutEngineResult,
  type ViewportMeasurementInput,
} from '../types/LayoutEngine.types';
import { LayoutBreakpointRegistry } from '../responsive/LayoutBreakpointRegistry';
import { LayoutPolicyEngine } from '../policies/LayoutPolicyEngine';
import { resolveLayoutRenderingProfile } from '../rendering/LayoutRenderingProfile';
import { createMaster4KLayoutRegistry } from '../master4k/Master4KLayoutRegistry';
import { LayoutCompositionEngine } from '../composition/LayoutCompositionEngine';

const DEFAULT_ACTIVE_ZONES = Object.freeze([
  'environment',
  'performance',
  'tablet',
  'metrics',
  'player-banner',
] satisfies readonly LayoutZoneId[]);

function media(query: string): boolean {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(query).matches;
}

function detectColorGamut(): LayoutColorGamut {
  if (media('(color-gamut: rec2020)')) return 'rec2020';
  if (media('(color-gamut: p3)')) return 'p3';
  if (media('(color-gamut: srgb)')) return 'srgb';
  return 'unknown';
}

function detectPointerPrecision(): LayoutPointerPrecision {
  const fine = media('(pointer: fine)');
  const coarse = media('(pointer: coarse)');
  if (fine && coarse) return 'hybrid';
  if (fine) return 'fine';
  if (coarse) return 'coarse';
  return 'none';
}

function detectWebGL2(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

function detectCapabilities(): LayoutCapabilities {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined'
  ) {
    return SERVER_LAYOUT_CAPABILITIES;
  }

  const cssSupports =
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function'
      ? CSS.supports.bind(CSS)
      : () => false;

  const navigatorWithMemory =
    navigator as Navigator & {
      readonly deviceMemory?: number;
    };

  const pointerPrecision =
    detectPointerPrecision();

  return Object.freeze({
    browser: Object.freeze({
      resizeObserver:
        typeof ResizeObserver !== 'undefined',
      intersectionObserver:
        typeof IntersectionObserver !== 'undefined',
      visualViewport:
        window.visualViewport !== null &&
        window.visualViewport !== undefined,
      containerQueries:
        cssSupports('container-type: inline-size'),
      cssPropertiesAndValues:
        typeof CSS !== 'undefined' &&
        'registerProperty' in CSS,
      cssMaskComposite:
        cssSupports('mask-composite: intersect'),
      backdropFilter:
        cssSupports('backdrop-filter: blur(1px)'),
      contentVisibility:
        cssSupports('content-visibility: auto'),
    }),
    graphics: Object.freeze({
      webgl2: detectWebGL2(),
      offscreenCanvas:
        typeof OffscreenCanvas !== 'undefined',
      hardwareConcurrency:
        Math.max(1, navigator.hardwareConcurrency || 1),
      deviceMemoryGigabytes:
        typeof navigatorWithMemory.deviceMemory === 'number'
          ? navigatorWithMemory.deviceMemory
          : null,
      devicePixelRatio:
        Math.max(1, window.devicePixelRatio || 1),
      colorGamut: detectColorGamut(),
    }),
    input: Object.freeze({
      pointerPrecision,
      hover: media('(hover: hover)'),
      touchPoints:
        Math.max(0, navigator.maxTouchPoints || 0),
      stylusHoverPossible:
        pointerPrecision === 'fine' ||
        pointerPrecision === 'hybrid',
    }),
    preferences: Object.freeze({
      reducedMotion:
        media('(prefers-reduced-motion: reduce)'),
      reducedTransparency:
        media('(prefers-reduced-transparency: reduce)'),
      forcedColors: media('(forced-colors: active)'),
      highContrast:
        media('(prefers-contrast: more)'),
      prefersDark:
        media('(prefers-color-scheme: dark)'),
    }),
    runtime: Object.freeze({
      documentVisible:
        document.visibilityState !== 'hidden',
      online:
        typeof navigator.onLine !== 'boolean'
          ? true
          : navigator.onLine,
    }),
  });
}

function initialMeasurement(): ViewportMeasurementInput {
  if (typeof window === 'undefined') {
    return Object.freeze({
      width: 1280,
      height: 720,
      visualWidth: 1280,
      visualHeight: 720,
      devicePixelRatio: 1,
      timestamp: 0,
    });
  }
  return Object.freeze({
    width: Math.max(320, window.innerWidth),
    height: Math.max(568, window.innerHeight),
    visualWidth:
      window.visualViewport?.width ??
      window.innerWidth,
    visualHeight:
      window.visualViewport?.height ??
      window.innerHeight,
    offsetLeft:
      window.visualViewport?.offsetLeft ?? 0,
    offsetTop:
      window.visualViewport?.offsetTop ?? 0,
    devicePixelRatio:
      Math.max(1, window.devicePixelRatio || 1),
    zoom:
      window.visualViewport?.scale ?? 1,
    timestamp: Date.now(),
  });
}

function activeZoneKey(
  activeZones: readonly LayoutZoneId[] | undefined,
): string {
  return [...(activeZones ?? DEFAULT_ACTIVE_ZONES)]
    .sort()
    .join('|');
}

function activeZonesFromKey(
  key: string,
): readonly LayoutZoneId[] {
  if (key.length === 0) {
    return [];
  }

  return key.split('|') as LayoutZoneId[];
}

export function useLayoutEngine(
  rootRef: RefObject<HTMLDivElement | null>,
  options: UseLayoutEngineOptions = {},
): UseLayoutEngineResult {
  const breakpointRegistry = useMemo(
    () => new LayoutBreakpointRegistry(),
    [],
  );
  const policyEngine = useMemo(
    () => new LayoutPolicyEngine(),
    [],
  );
  const compositionEngine = useMemo(
    () =>
      new LayoutCompositionEngine(
        createMaster4KLayoutRegistry(),
      ),
    [],
  );

  const [measurement, setMeasurement] =
    useState<ViewportMeasurementInput>(
      initialMeasurement,
    );
  const [ready, setReady] = useState(false);
  const [capabilities, setCapabilities] =
    useState<LayoutCapabilities>(
      detectCapabilities,
    );

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (
      root === null ||
      typeof window === 'undefined' ||
      typeof document === 'undefined'
    ) {
      return undefined;
    }

    let frame = 0;
    const measure = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect =
          root.getBoundingClientRect();
        const visual =
          window.visualViewport;

        setMeasurement(
          Object.freeze({
            width: Math.max(
              320,
              rect.width || window.innerWidth,
            ),
            height: Math.max(
              568,
              rect.height || window.innerHeight,
            ),
            visualWidth: Math.max(
              320,
              visual?.width ||
                rect.width ||
                window.innerWidth,
            ),
            visualHeight: Math.max(
              568,
              visual?.height ||
                rect.height ||
                window.innerHeight,
            ),
            offsetLeft:
              visual?.offsetLeft ?? 0,
            offsetTop:
              visual?.offsetTop ?? 0,
            devicePixelRatio:
              Math.max(
                1,
                window.devicePixelRatio || 1,
              ),
            zoom: visual?.scale ?? 1,
            timestamp: Date.now(),
          }),
        );
        setCapabilities(
          detectCapabilities(),
        );
        setReady(true);
      });
    };

    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(measure);
    observer?.observe(root);

    window.addEventListener(
      'resize',
      measure,
      { passive: true },
    );
    window.visualViewport?.addEventListener(
      'resize',
      measure,
      { passive: true },
    );
    window.visualViewport?.addEventListener(
      'scroll',
      measure,
      { passive: true },
    );
    document.addEventListener(
      'visibilitychange',
      measure,
    );

    measure();

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener(
        'resize',
        measure,
      );
      window.visualViewport?.removeEventListener(
        'resize',
        measure,
      );
      window.visualViewport?.removeEventListener(
        'scroll',
        measure,
      );
      document.removeEventListener(
        'visibilitychange',
        measure,
      );
    };
  }, [rootRef]);

  const mergedMeasurement =
    useMemo<ViewportMeasurementInput>(
      () =>
        Object.freeze({
          ...measurement,
          ...options.viewportOverride,
          safeArea:
            options.viewportOverride?.safeArea ??
            measurement.safeArea,
          timestamp:
            options.viewportOverride?.timestamp ??
            measurement.timestamp,
        }),
      [
        measurement,
        options.viewportOverride,
      ],
    );

  const category =
    breakpointRegistry.resolve(
      mergedMeasurement.width,
      mergedMeasurement.height,
    );

  const viewport = useMemo(
    () =>
      createViewportLayoutContract(
        mergedMeasurement,
        category,
      ),
    [category, mergedMeasurement],
  );

  const zoneKey =
    activeZoneKey(options.activeZones);
  const activeZones = useMemo(
    () =>
      new Set<LayoutZoneId>(
        activeZonesFromKey(zoneKey),
      ),
    [zoneKey],
  );

  const policy = useMemo(
    () =>
      policyEngine.resolve(
        viewport,
        capabilities,
        {
          ...options.policies,
          quality:
            options.quality ??
            options.policies?.quality,
          motion:
            options.motion ??
            options.policies?.motion,
        },
        activeZones,
      ),
    [
      activeZones,
      capabilities,
      options.motion,
      options.policies,
      options.quality,
      policyEngine,
      viewport,
    ],
  );

  const renderingProfile = useMemo(
    () =>
      resolveLayoutRenderingProfile(
        capabilities,
        policy,
        viewport,
      ),
    [capabilities, policy, viewport],
  );

  const composition = useMemo(
    () =>
      compositionEngine.compose({
        viewport,
        capabilities,
        policy,
        renderingProfile,
        activeZones,
      }),
    [
      activeZones,
      capabilities,
      compositionEngine,
      policy,
      renderingProfile,
      viewport,
    ],
  );

  const onCompositionChange =
    options.onCompositionChange;

  useEffect(() => {
    onCompositionChange?.(
      composition,
    );
  }, [
    composition,
    onCompositionChange,
  ]);

  const style = useMemo(
    () =>
      ({
        ...composition.cssVariables,
      }),
    [composition.cssVariables],
  );

  return Object.freeze({
    viewport,
    capabilities,
    renderingProfile,
    composition,
    style,
    ready,
  });
}
