/**
 * Artifact ID: QCQ-APP-002-002
 * Artifact Name: LayoutEngine.types
 * Artifact Purpose: Strict immutable contracts for viewport, zones, policies, constraints, composition, capabilities, and runtime integration.
 * Artifact Layer: QCQ-APP-002 — CTR (Contract Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> LayoutEngine.types -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/types
 * Source File: LayoutEngine.types.ts
 */
import type {
  CSSProperties,
  ReactNode,
} from 'react';

import type {
  LayoutCompositionResult,
} from '../composition/LayoutComposition.types';
import type {
  LayoutRenderingProfile,
} from '../rendering/LayoutRenderingProfile';

export type LayoutZoneId =
  | 'environment'
  | 'performance'
  | 'tablet'
  | 'metrics'
  | 'player-banner';

export type LayoutZoneRole =
  | 'presentation'
  | 'complementary'
  | 'main'
  | 'status'
  | 'region';

export type LayoutZoneOverflow =
  | 'visible'
  | 'hidden'
  | 'auto'
  | 'clip';

export type LayoutZonePointerPolicy =
  | 'none'
  | 'auto'
  | 'interactive-only';

export type LayoutPointerPrecision =
  | 'none'
  | 'coarse'
  | 'fine'
  | 'hybrid';

export type LayoutColorGamut =
  | 'srgb'
  | 'p3'
  | 'rec2020'
  | 'unknown';

export type LayoutViewportCategory =
  | 'micro'
  | 'compact'
  | 'balanced'
  | 'command'
  | 'cinematic';

export type LayoutOrientation =
  | 'portrait'
  | 'landscape'
  | 'square';

export type LayoutMotionPolicy =
  | 'full'
  | 'balanced'
  | 'reduced'
  | 'none';

export type LayoutQualityPolicy =
  | 'automatic'
  | 'minimal'
  | 'balanced'
  | 'ultra';

export type LayoutOverflowPolicy =
  | 'contain'
  | 'scroll'
  | 'clip'
  | 'expand';

export type LayoutReadingPolicy =
  | 'inline'
  | 'focus-overlay'
  | 'modal';

export interface NormalizedRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface PixelRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface LayoutReferenceGeometry {
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly pixelRect: PixelRect;
  readonly normalizedRect: NormalizedRect;
  readonly confidence: number;
  readonly calibration: 'visual-reference';
}

export interface LayoutSafeAreaInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export interface ViewportLayoutContract {
  readonly width: number;
  readonly height: number;
  readonly visualWidth: number;
  readonly visualHeight: number;
  readonly offsetLeft: number;
  readonly offsetTop: number;
  readonly devicePixelRatio: number;
  readonly zoom: number;
  readonly orientation: LayoutOrientation;
  readonly category: LayoutViewportCategory;
  readonly safeArea: LayoutSafeAreaInsets;
  readonly timestamp: number;
}

export interface ViewportMeasurementInput {
  readonly width: number;
  readonly height: number;
  readonly visualWidth?: number | undefined;
  readonly visualHeight?: number | undefined;
  readonly offsetLeft?: number | undefined;
  readonly offsetTop?: number | undefined;
  readonly devicePixelRatio?: number | undefined;
  readonly zoom?: number | undefined;
  readonly safeArea?:
    | Partial<LayoutSafeAreaInsets>
    | undefined;
  readonly timestamp?: number | undefined;
}

export interface LayoutCapabilities {
  readonly browser: {
    readonly resizeObserver: boolean;
    readonly intersectionObserver: boolean;
    readonly visualViewport: boolean;
    readonly containerQueries: boolean;
    readonly cssPropertiesAndValues: boolean;
    readonly cssMaskComposite: boolean;
    readonly backdropFilter: boolean;
    readonly contentVisibility: boolean;
  };
  readonly graphics: {
    readonly webgl2: boolean;
    readonly offscreenCanvas: boolean;
    readonly hardwareConcurrency: number;
    readonly deviceMemoryGigabytes: number | null;
    readonly devicePixelRatio: number;
    readonly colorGamut: LayoutColorGamut;
  };
  readonly input: {
    readonly pointerPrecision:
      LayoutPointerPrecision;
    readonly hover: boolean;
    readonly touchPoints: number;
    readonly stylusHoverPossible: boolean;
  };
  readonly preferences: {
    readonly reducedMotion: boolean;
    readonly reducedTransparency: boolean;
    readonly forcedColors: boolean;
    readonly highContrast: boolean;
    readonly prefersDark: boolean;
  };
  readonly runtime: {
    readonly documentVisible: boolean;
    readonly online: boolean;
  };
}

export interface LayoutPolicyPreferences {
  readonly motion?:
    | LayoutMotionPolicy
    | undefined;
  readonly quality?:
    | LayoutQualityPolicy
    | undefined;
  readonly compactConsoles?: boolean | undefined;
  readonly preserveMasterProportions?:
    | boolean
    | undefined;
  readonly allowEnvironmentEffects?:
    | boolean
    | undefined;
  readonly allowDecorativeAnimation?:
    | boolean
    | undefined;
  readonly minimumInteractiveTarget?:
    | number
    | undefined;
}

export interface ResolvedLayoutPolicy {
  readonly id: string;
  readonly viewportCategory:
    LayoutViewportCategory;
  readonly motion: LayoutMotionPolicy;
  readonly quality:
    Exclude<LayoutQualityPolicy, 'automatic'>;
  readonly overflow: LayoutOverflowPolicy;
  readonly reading: LayoutReadingPolicy;
  readonly compactConsoles: boolean;
  readonly preserveMasterProportions: boolean;
  readonly allowEnvironmentEffects: boolean;
  readonly allowDecorativeAnimation: boolean;
  readonly allowBackdropFilter: boolean;
  readonly minimumInteractiveTarget: number;
  readonly zoneVisibility:
    Readonly<Record<LayoutZoneId, boolean>>;
  readonly zoneOrder: readonly LayoutZoneId[];
  readonly textScale: number;
  readonly effectScale: number;
}

export interface LayoutPolicyMatrixEntry {
  readonly category: LayoutViewportCategory;
  readonly overflow: LayoutOverflowPolicy;
  readonly reading: LayoutReadingPolicy;
  readonly compactConsoles: boolean;
  readonly zoneOrder: readonly LayoutZoneId[];
  readonly hiddenZones: readonly LayoutZoneId[];
  readonly textScale: number;
  readonly effectScale: number;
}

export interface LayoutSizeRange {
  readonly minWidth: number;
  readonly minHeight: number;
  readonly maxWidth: number | null;
  readonly maxHeight: number | null;
}

export interface LayoutAspectRatioRange {
  readonly minimum: number | null;
  readonly maximum: number | null;
  readonly preferred: number | null;
}

export interface LayoutZoneConstraint {
  readonly zoneId: LayoutZoneId;
  readonly size: LayoutSizeRange;
  readonly aspectRatio: LayoutAspectRatioRange;
  readonly normalizedBounds: NormalizedRect;
  readonly protectedInset: number;
  readonly collisionGroup: string;
  readonly mayOverflowViewport: boolean;
  readonly mayOverlapDecorativeZones: boolean;
  readonly priority: number;
}

export interface LayoutConstraintSet {
  readonly id: string;
  readonly version: string;
  readonly minimumViewportWidth: number;
  readonly minimumViewportHeight: number;
  readonly minimumInteractiveTarget: number;
  readonly minimumTextScale: number;
  readonly maximumTextScale: number;
  readonly minimumZoneGap: number;
  readonly maximumContentWidth: number;
  readonly zoneConstraints:
    Readonly<
      Record<
        LayoutZoneId,
        LayoutZoneConstraint
      >
    >;
}

export interface LayoutConstraintViolation {
  readonly code:
    | 'outside-safe-area'
    | 'below-minimum-size'
    | 'above-maximum-size'
    | 'aspect-ratio-outside-range'
    | 'zone-collision'
    | 'protected-inset-violated';
  readonly zoneId: LayoutZoneId;
  readonly message: string;
  readonly severity: 'warning' | 'error';
  readonly corrected: boolean;
}

export interface LayoutZoneDefinition {
  readonly id: LayoutZoneId;
  readonly artifactId: string;
  readonly name: string;
  readonly role: LayoutZoneRole;
  readonly ariaLabel: string;
  readonly decorative: boolean;
  readonly required: boolean;
  readonly normalizedRect: NormalizedRect;
  readonly reference: LayoutReferenceGeometry;
  readonly zIndex: number;
  readonly overflow: LayoutZoneOverflow;
  readonly pointerPolicy:
    LayoutZonePointerPolicy;
  readonly collisionGroup: string;
  readonly capabilities: readonly string[];
}

export interface LayoutZonePlacement {
  readonly zoneId: LayoutZoneId;
  readonly rect: PixelRect;
  readonly visible: boolean;
  readonly order: number;
  readonly zIndex: number;
  readonly overflow: LayoutZoneOverflow;
  readonly pointerPolicy:
    LayoutZonePointerPolicy;
  readonly ariaLabel: string;
  readonly role: LayoutZoneRole;
  readonly decorative: boolean;
  readonly cssVariables:
    Readonly<Record<string, string>>;
}

export interface LayoutZoneCalculationContext {
  readonly viewport: ViewportLayoutContract;
  readonly policy: ResolvedLayoutPolicy;
  readonly capabilities: LayoutCapabilities;
  readonly constraints: LayoutConstraintSet;
  readonly renderingProfile:
    LayoutRenderingProfile;
  readonly placedZones:
    ReadonlyMap<
      LayoutZoneId,
      LayoutZonePlacement
    >;
  readonly gap: number;
}

export type LayoutZoneCalculator = (
  context: LayoutZoneCalculationContext,
) => LayoutZonePlacement;

export interface LayoutZoneRegistration {
  readonly definition: LayoutZoneDefinition;
  readonly calculate: LayoutZoneCalculator;
}

export interface LayoutEngineConfiguration {
  readonly artifactId: 'QCQ-APP-002-001';
  readonly version: '2.0.0';
  readonly referenceViewport: {
    readonly width: number;
    readonly height: number;
  };
  readonly policyPreferences: LayoutPolicyPreferences;
  readonly composition: import('../composition/LayoutComposition.types').LayoutCompositionConfig;
  readonly measurement: {
    readonly minimumWidth: number;
    readonly minimumHeight: number;
    readonly resizeDebounceMilliseconds: number;
    readonly useVisualViewport: boolean;
  };
  readonly diagnostics: {
    readonly warnOnConstraintCorrection: boolean;
    readonly exposeDebugAttributes: boolean;
  };
}

export interface LayoutEngineSlots {
  readonly environment?: ReactNode | undefined;
  readonly performance?: ReactNode | undefined;
  readonly tablet?: ReactNode | undefined;
  readonly metrics?: ReactNode | undefined;
  readonly playerBanner?: ReactNode | undefined;
}

export interface LayoutEngineProps
  extends LayoutEngineSlots {
  readonly children?: ReactNode | undefined;
  readonly className?: string | undefined;
  readonly id?: string | undefined;
  readonly ariaLabel?: string | undefined;
  readonly policies?:
    | LayoutPolicyPreferences
    | undefined;
  readonly quality?:
    | LayoutQualityPolicy
    | undefined;
  readonly motion?:
    | LayoutMotionPolicy
    | undefined;
  readonly viewportOverride?:
    | Partial<ViewportLayoutContract>
    | undefined;
  readonly activeZones?:
    | readonly LayoutZoneId[]
    | undefined;
  readonly debug?: boolean | undefined;
  readonly onCompositionChange?: (
    composition: LayoutCompositionResult,
  ) => void;
  readonly left?: ReactNode | undefined;
  readonly center?: ReactNode | undefined;
  readonly right?: ReactNode | undefined;
  readonly footer?: ReactNode | undefined;
}

export interface UseLayoutEngineOptions {
  readonly policies?:
    | LayoutPolicyPreferences
    | undefined;
  readonly quality?:
    | LayoutQualityPolicy
    | undefined;
  readonly motion?:
    | LayoutMotionPolicy
    | undefined;
  readonly viewportOverride?:
    | Partial<ViewportLayoutContract>
    | undefined;
  readonly activeZones?:
    | readonly LayoutZoneId[]
    | undefined;
  readonly onCompositionChange?: (
    composition: LayoutCompositionResult,
  ) => void;
}

export interface UseLayoutEngineResult {
readonly viewport: ViewportLayoutContract;
  readonly capabilities: LayoutCapabilities;
  readonly renderingProfile:
    LayoutRenderingProfile;
  readonly composition:
    LayoutCompositionResult;
  readonly style: CSSProperties;
  readonly ready: boolean;
}

export const SERVER_LAYOUT_CAPABILITIES:
  LayoutCapabilities = Object.freeze({
    browser: Object.freeze({
      resizeObserver: false,
      intersectionObserver: false,
      visualViewport: false,
      containerQueries: false,
      cssPropertiesAndValues: false,
      cssMaskComposite: false,
      backdropFilter: false,
      contentVisibility: false,
    }),
    graphics: Object.freeze({
      webgl2: false,
      offscreenCanvas: false,
      hardwareConcurrency: 1,
      deviceMemoryGigabytes: null,
      devicePixelRatio: 1,
      colorGamut: 'unknown',
    }),
    input: Object.freeze({
      pointerPrecision: 'none',
      hover: false,
      touchPoints: 0,
      stylusHoverPossible: false,
    }),
    preferences: Object.freeze({
      reducedMotion: false,
      reducedTransparency: false,
      forcedColors: false,
      highContrast: false,
      prefersDark: true,
    }),
    runtime: Object.freeze({
      documentVisible: true,
      online: true,
    }),
  });

export function determineLayoutOrientation(
  width: number,
  height: number,
): LayoutOrientation {
  const ratio = width / Math.max(height, 1);
  if (ratio > 1.08) return 'landscape';
  if (ratio < 0.92) return 'portrait';
  return 'square';
}

export function createViewportLayoutContract(
  input: ViewportMeasurementInput,
  category: LayoutViewportCategory,
): ViewportLayoutContract {
  if (
    !Number.isFinite(input.width) ||
    input.width <= 0
  ) {
    throw new Error(
      'Viewport width must be a positive finite number.',
    );
  }
  if (
    !Number.isFinite(input.height) ||
    input.height <= 0
  ) {
    throw new Error(
      'Viewport height must be a positive finite number.',
    );
  }

  const safeArea: LayoutSafeAreaInsets =
    Object.freeze({
      top: Math.max(
        0,
        input.safeArea?.top ?? 0,
      ),
      right: Math.max(
        0,
        input.safeArea?.right ?? 0,
      ),
      bottom: Math.max(
        0,
        input.safeArea?.bottom ?? 0,
      ),
      left: Math.max(
        0,
        input.safeArea?.left ?? 0,
      ),
    });

  const visualWidth =
    input.visualWidth ?? input.width;
  const visualHeight =
    input.visualHeight ?? input.height;

  if (
    !Number.isFinite(visualWidth) ||
    visualWidth <= 0 ||
    !Number.isFinite(visualHeight) ||
    visualHeight <= 0
  ) {
    throw new Error(
      'Visual viewport dimensions must be positive finite numbers.',
    );
  }

  return Object.freeze({
    width: input.width,
    height: input.height,
    visualWidth,
    visualHeight,
    offsetLeft: input.offsetLeft ?? 0,
    offsetTop: input.offsetTop ?? 0,
    devicePixelRatio: Math.max(
      1,
      input.devicePixelRatio ?? 1,
    ),
    zoom: Math.max(
      0.25,
      input.zoom ?? 1,
    ),
    orientation: determineLayoutOrientation(
      input.width,
      input.height,
    ),
    category,
    safeArea,
    timestamp: input.timestamp ?? Date.now(),
  });
}
