/**
 * Artifact ID: QCQ-THM-010
 * Artifact Name: ThemeManifest
 * Repository Path: QCQ/frontend/src/styles/ThemeManifest.ts
 */

import {
  QCQ_PRIMITIVE_TOKENS,
  createPrimitiveCssVariables,
  mergeCssVariableMaps,
  type CssVariableMap,
  type QcqDensity,
  type QcqMotionMode,
  type QcqResolutionProfile,
  type QcqVisualQuality,
} from './DesignTokens';
import {
  createAccessibilityTheme,
  type AccessibilityThemeOptions,
} from './AccessibilityTheme';
import {
  createColorCssVariables,
  createColorSystem,
  type QcqColorScheme,
} from './ColorSystem';
import {
  createElevationCssVariables,
  createElevationSystem,
} from './ElevationSystem';
import {
  createMotionCssVariables,
  createMotionProfiles,
} from './MotionProfiles';
import {
  createPlatinumFrameTheme,
  type FrameMaterial,
} from './PlatinumFrameTheme';
import {
  createSpacingCssVariables,
  createSpacingSystem,
} from './SpacingSystem';
import {
  createTypographyCssVariables,
  createTypographySystem,
} from './TypographySystem';
import {
  VisualRegistry,
  type VisualArtifactDescriptor,
} from './VisualRegistry';

export interface ThemeManifestOptions {
  readonly id?: string;
  readonly scheme?: QcqColorScheme;
  readonly quality?: QcqVisualQuality;
  readonly resolution?: QcqResolutionProfile;
  readonly density?: QcqDensity;
  readonly motion?: QcqMotionMode;
  readonly frameMaterial?: FrameMaterial;
  readonly accessibility?: AccessibilityThemeOptions;
  readonly overrides?: CssVariableMap;
}

export interface ThemeCompatibility {
  readonly minimumQcQVersion: string;
  readonly maximumQcQVersion: string | null;
  readonly supportsForcedColors: true;
  readonly supportsReducedMotion: true;
  readonly supports4K: true;
  readonly supports8K: true;
  readonly requiresRasterAssets: false;
}

export interface ThemeManifest {
  readonly schemaVersion: '1.0.0';
  readonly id: string;
  readonly version: '1.0.0';
  readonly displayName: string;
  readonly scheme: QcqColorScheme;
  readonly quality: QcqVisualQuality;
  readonly resolution: QcqResolutionProfile;
  readonly density: QcqDensity;
  readonly motion: QcqMotionMode;
  readonly fallbackThemeId: 'qcq-platinum-command';
  readonly compatibility: ThemeCompatibility;
  readonly cssVariables: CssVariableMap;
  readonly accessibilityStyleSheet: string;
  readonly registryLoadOrder: readonly string[];
}

const ARTIFACT_IDS = Object.freeze({
  tokens: 'QCQ-TBL-036',
  frame: 'QCQ-TBL-037',
  cyber: 'QCQ-TBL-038',
  energy: 'QCQ-TBL-039',
  colors: 'QCQ-THM-001',
  typography: 'QCQ-THM-002',
  spacing: 'QCQ-THM-003',
  elevation: 'QCQ-THM-004',
  glow: 'QCQ-THM-005',
  reflection: 'QCQ-THM-006',
  motion: 'QCQ-THM-007',
  accessibility: 'QCQ-THM-008',
  registry: 'QCQ-THM-009',
  manifest: 'QCQ-THM-010',
});

function register(
  registry: VisualRegistry,
  descriptor: VisualArtifactDescriptor<unknown>,
): void {
  registry.register(descriptor);
}

export function createThemeManifest(
  options: ThemeManifestOptions = {},
): ThemeManifest {
  const scheme = options.scheme ?? 'dark';
  const quality = options.quality ?? 'balanced';
  const resolution = options.resolution ?? 'hd';
  const density = options.density ?? 'comfortable';
  const motion = options.motion ?? 'full';

  const colors = createColorSystem(scheme);
  const typography = createTypographySystem(resolution);
  const spacing = createSpacingSystem(density, resolution);
  const elevation = createElevationSystem(quality);
  const motionProfiles = createMotionProfiles(motion, quality);
  const frame = createPlatinumFrameTheme({
    scheme,
    quality,
    material: options.frameMaterial ?? 'platinum',
  });
  const accessibility = createAccessibilityTheme({
    ...options.accessibility,
    profile: resolution,
    reducedMotion:
      options.accessibility?.reducedMotion ?? motion !== 'full',
  });

  const variables = mergeCssVariableMaps(
    createPrimitiveCssVariables(),
    createColorCssVariables(colors),
    createTypographyCssVariables(typography),
    createSpacingCssVariables(spacing),
    createElevationCssVariables(elevation),
    createMotionCssVariables(motionProfiles),
    frame.cssVariables,
    accessibility.cssVariables,
    options.overrides ?? Object.freeze({}),
  );

  const registry = new VisualRegistry();
  register(registry, {
    id: ARTIFACT_IDS.tokens,
    version: QCQ_PRIMITIVE_TOKENS.version,
    kind: 'token-set',
    dependencies: Object.freeze([]),
    value: QCQ_PRIMITIVE_TOKENS,
  });
  register(registry, {
    id: ARTIFACT_IDS.colors,
    version: colors.version,
    kind: 'token-set',
    dependencies: Object.freeze([ARTIFACT_IDS.tokens]),
    value: colors,
  });
  register(registry, {
    id: ARTIFACT_IDS.typography,
    version: typography.version,
    kind: 'token-set',
    dependencies: Object.freeze([ARTIFACT_IDS.tokens]),
    value: typography,
  });
  register(registry, {
    id: ARTIFACT_IDS.spacing,
    version: spacing.version,
    kind: 'token-set',
    dependencies: Object.freeze([ARTIFACT_IDS.tokens]),
    value: spacing,
  });
  register(registry, {
    id: ARTIFACT_IDS.elevation,
    version: elevation.version,
    kind: 'token-set',
    dependencies: Object.freeze([ARTIFACT_IDS.tokens]),
    value: elevation,
  });
  register(registry, {
    id: ARTIFACT_IDS.glow,
    version: '1.0.0',
    kind: 'effect',
    dependencies: Object.freeze([
      ARTIFACT_IDS.tokens,
      'QCQ-TBL-033',
    ]),
    value: 'GlowProfiles',
  });
  register(registry, {
    id: ARTIFACT_IDS.reflection,
    version: '1.0.0',
    kind: 'effect',
    dependencies: Object.freeze([
      ARTIFACT_IDS.tokens,
      ARTIFACT_IDS.glow,
      'QCQ-TBL-041',
    ]),
    value: 'ReflectionProfiles',
  });
  register(registry, {
    id: ARTIFACT_IDS.motion,
    version: motionProfiles.version,
    kind: 'motion',
    dependencies: Object.freeze([ARTIFACT_IDS.tokens]),
    value: motionProfiles,
  });
  register(registry, {
    id: ARTIFACT_IDS.frame,
    version: frame.version,
    kind: 'theme',
    dependencies: Object.freeze([
      ARTIFACT_IDS.colors,
      ARTIFACT_IDS.elevation,
    ]),
    value: frame,
  });
  register(registry, {
    id: ARTIFACT_IDS.cyber,
    version: '1.0.0',
    kind: 'effect',
    dependencies: Object.freeze([
      ARTIFACT_IDS.glow,
      ARTIFACT_IDS.reflection,
    ]),
    value: 'CyberEffects',
  });
  register(registry, {
    id: ARTIFACT_IDS.energy,
    version: '1.0.0',
    kind: 'motion',
    dependencies: Object.freeze([ARTIFACT_IDS.motion]),
    value: 'EnergyAnimations',
  });
  register(registry, {
    id: ARTIFACT_IDS.accessibility,
    version: accessibility.version,
    kind: 'accessibility',
    dependencies: Object.freeze([
      ARTIFACT_IDS.colors,
      ARTIFACT_IDS.typography,
      ARTIFACT_IDS.motion,
    ]),
    value: accessibility,
  });
  register(registry, {
    id: 'QCQ-TBL-033',
    version: '1.0.0',
    kind: 'effect',
    dependencies: Object.freeze([]),
    value: 'GlowEngine',
  });
  register(registry, {
    id: 'QCQ-TBL-041',
    version: '1.0.0',
    kind: 'effect',
    dependencies: Object.freeze(['QCQ-TBL-033']),
    value: 'ReflectionEngine',
  });
  register(registry, {
    id: ARTIFACT_IDS.registry,
    version: '1.0.0',
    kind: 'manifest',
    dependencies: Object.freeze([]),
    value: 'VisualRegistry',
  });
  register(registry, {
    id: ARTIFACT_IDS.manifest,
    version: '1.0.0',
    kind: 'manifest',
    dependencies: Object.freeze([
      ARTIFACT_IDS.registry,
      ARTIFACT_IDS.frame,
      ARTIFACT_IDS.cyber,
      ARTIFACT_IDS.energy,
      ARTIFACT_IDS.accessibility,
    ]),
    value: 'ThemeManifest',
  });

  return Object.freeze({
    schemaVersion: '1.0.0',
    id: options.id ?? 'qcq-platinum-command',
    version: '1.0.0',
    displayName: 'QCQ Platinum Command Visual System',
    scheme,
    quality,
    resolution,
    density,
    motion,
    fallbackThemeId: 'qcq-platinum-command',
    compatibility: Object.freeze({
      minimumQcQVersion: '0.1.0-foundation.1',
      maximumQcQVersion: null,
      supportsForcedColors: true,
      supportsReducedMotion: true,
      supports4K: true,
      supports8K: true,
      requiresRasterAssets: false,
    }),
    cssVariables: variables,
    accessibilityStyleSheet: accessibility.mediaStyleSheet,
    registryLoadOrder: registry.resolveLoadOrder(),
  });
}

export const QCQ_THEME_MANIFEST = createThemeManifest();

export function applyThemeManifest(
  manifest: ThemeManifest,
  target: HTMLElement = document.documentElement,
): () => void {
  const previousAttributes = {
    theme: target.getAttribute('data-qcq-theme'),
    scheme: target.getAttribute('data-qcq-color-scheme'),
    quality: target.getAttribute('data-qcq-quality'),
    resolution: target.getAttribute('data-qcq-resolution'),
    density: target.getAttribute('data-qcq-density'),
    motion: target.getAttribute('data-qcq-motion'),
  };
  const previousVariables = new Map<string, string>();

  target.setAttribute('data-qcq-theme', manifest.id);
  target.setAttribute('data-qcq-color-scheme', manifest.scheme);
  target.setAttribute('data-qcq-quality', manifest.quality);
  target.setAttribute('data-qcq-resolution', manifest.resolution);
  target.setAttribute('data-qcq-density', manifest.density);
  target.setAttribute('data-qcq-motion', manifest.motion);

  for (const [name, value] of Object.entries(manifest.cssVariables)) {
    previousVariables.set(name, target.style.getPropertyValue(name));
    target.style.setProperty(name, value);
  }

  return () => {
    const restoreAttribute = (
      name: string,
      value: string | null,
    ): void => {
      if (value === null) target.removeAttribute(name);
      else target.setAttribute(name, value);
    };

    restoreAttribute('data-qcq-theme', previousAttributes.theme);
    restoreAttribute(
      'data-qcq-color-scheme',
      previousAttributes.scheme,
    );
    restoreAttribute('data-qcq-quality', previousAttributes.quality);
    restoreAttribute(
      'data-qcq-resolution',
      previousAttributes.resolution,
    );
    restoreAttribute('data-qcq-density', previousAttributes.density);
    restoreAttribute('data-qcq-motion', previousAttributes.motion);

    for (const [name, value] of previousVariables) {
      if (value.length === 0) target.style.removeProperty(name);
      else target.style.setProperty(name, value);
    }
  };
}
