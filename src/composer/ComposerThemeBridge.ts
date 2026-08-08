/**
 * Artifact ID: QCQ-CMP-009
 * Artifact Name: ComposerThemeBridge
 * Repository Path: QCQ/frontend/src/composer/ComposerThemeBridge.ts
 */

import {
  applyThemeManifest,
  createThemeManifest,
  type ThemeManifest,
} from '../styles/ThemeManifest';
import type {
  ComposerAccessibilitySnapshot,
  ComposerConfig,
  ComposerThemeBridgeLike,
  ComposerThemeSnapshot,
} from './ComposerTypes';

const SERVER_THEME = createThemeManifest({
  id: 'qcq-platinum-command-server',
  resolution: 'hd',
  quality: 'balanced',
  motion: 'reduced',
});

const SERVER_SNAPSHOT: ComposerThemeSnapshot = Object.freeze({
  version: 0,
  manifest: SERVER_THEME,
  attached: false,
  target: null,
});

function createManifest(
  config: ComposerConfig,
  accessibility: ComposerAccessibilitySnapshot,
  baseManifest?: ThemeManifest,
): ThemeManifest {
  if (
    baseManifest !== undefined &&
    baseManifest.quality === config.visual.quality &&
    baseManifest.resolution === config.visual.resolution &&
    baseManifest.density === config.visual.density &&
    baseManifest.motion === accessibility.motion
  ) {
    return baseManifest;
  }

  return createThemeManifest({
    id: baseManifest?.id ?? 'qcq-platinum-command',
    scheme:
      accessibility.contrast === 'standard'
        ? baseManifest?.scheme ?? 'dark'
        : 'high-contrast',
    quality: config.visual.quality,
    resolution: config.visual.resolution,
    density: config.visual.density,
    motion: accessibility.motion,
    frameMaterial: 'platinum',
    accessibility: {
      highContrast: accessibility.contrast !== 'standard',
      forcedColors:
        accessibility.contrast === 'forced-colors',
      reducedMotion: accessibility.motion !== 'full',
      reducedTransparency:
        accessibility.reducedTransparency,
      reducedSensory: accessibility.reducedSensory,
      textScale: accessibility.textScale,
      profile: config.visual.resolution,
    },
    overrides: Object.freeze({
      '--qcq-composer-frame-intensity':
        String(config.visual.frameIntensity),
      '--qcq-composer-storm-intensity':
        String(config.visual.stormIntensity),
      '--qcq-composer-glow-intensity':
        String(config.visual.glowIntensity),
      '--qcq-composer-minimum-target':
        `${accessibility.minimumTargetSizePx}px`,
      '--qcq-composer-reflections-enabled':
        config.visual.reflectionsEnabled ? '1' : '0',
    }),
  });
}

export class ComposerThemeBridge
  implements ComposerThemeBridgeLike {
  private readonly subscribers = new Set<() => void>();
  private target: HTMLElement | null = null;
  private cleanup: (() => void) | null = null;
  private version = 0;
  private baseManifest: ThemeManifest | undefined;
  private snapshot: ComposerThemeSnapshot = SERVER_SNAPSHOT;

  public constructor(baseManifest?: ThemeManifest) {
    this.baseManifest = baseManifest;
  }

  public readonly subscribe = (
    listener: () => void,
  ): (() => void) => {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  };

  public readonly getSnapshot = (): ComposerThemeSnapshot =>
    this.snapshot;

  public readonly getServerSnapshot = (): ComposerThemeSnapshot =>
    SERVER_SNAPSHOT;

  public setBaseManifest(manifest?: ThemeManifest): void {
    this.baseManifest = manifest;
  }

  public attach(
    target: HTMLElement,
    config: ComposerConfig,
    accessibility: ComposerAccessibilitySnapshot,
  ): void {
    if (this.target !== target) {
      this.detach();
      this.target = target;
    }
    this.apply(config, accessibility);
  }

  public update(
    config: ComposerConfig,
    accessibility: ComposerAccessibilitySnapshot,
  ): void {
    if (this.target === null) {
      this.snapshot = Object.freeze({
        version: this.version,
        manifest: createManifest(
          config,
          accessibility,
          this.baseManifest,
        ),
        attached: false,
        target: null,
      });
      return;
    }
    this.apply(config, accessibility);
  }

  public detach(): void {
    this.cleanup?.();
    this.cleanup = null;
    this.target = null;
    this.version += 1;
    this.snapshot = Object.freeze({
      version: this.version,
      manifest: this.snapshot.manifest,
      attached: false,
      target: null,
    });
    this.subscribers.forEach((listener) => listener());
  }

  private apply(
    config: ComposerConfig,
    accessibility: ComposerAccessibilitySnapshot,
  ): void {
    if (this.target === null) return;

    const manifest = createManifest(
      config,
      accessibility,
      this.baseManifest,
    );
    this.cleanup?.();
    this.cleanup = applyThemeManifest(manifest, this.target);
    this.target.style.setProperty(
      '--qcq-composer-text-scale',
      String(accessibility.textScale),
    );
    this.target.style.setProperty(
      '--qcq-composer-minimum-target',
      `${accessibility.minimumTargetSizePx}px`,
    );
    this.target.setAttribute(
      'data-qcq-reflections-enabled',
      String(config.visual.reflectionsEnabled),
    );

    this.version += 1;
    this.snapshot = Object.freeze({
      version: this.version,
      manifest,
      attached: true,
      target: this.target,
    });
    this.subscribers.forEach((listener) => listener());
  }
}

export function createComposerThemeBridge(
  manifest?: ThemeManifest,
): ComposerThemeBridge {
  return new ComposerThemeBridge(manifest);
}
