/**
 * Artifact ID: QCQ-CMP-008
 * Artifact Name: ComposerAccessibilityEngine
 * Repository Path: QCQ/frontend/src/composer/ComposerAccessibilityEngine.ts
 */

import {
  COMPOSER_DATA_ATTRIBUTES,
  COMPOSER_LIMITS,
} from './ComposerConstants';
import type {
  ComposerAccessibilityConfig,
  ComposerAccessibilityEngineLike,
  ComposerAccessibilitySnapshot,
  ComposerInputModality,
} from './ComposerTypes';

interface AccessibilityMediaState {
  readonly forcedColorsActive: boolean;
  readonly prefersReducedMotion: boolean;
  readonly prefersHighContrast: boolean;
}

const SERVER_SNAPSHOT: ComposerAccessibilitySnapshot = Object.freeze({
  version: 0,
  contrast: 'standard',
  motion: 'full',
  reducedTransparency: false,
  reducedSensory: false,
  screenReaderOptimized: false,
  textScale: 1,
  minimumTargetSizePx: COMPOSER_LIMITS.minimumTargetSizePx,
  inputModality: 'unknown',
  keyboardNavigationActive: false,
  forcedColorsActive: false,
  prefersReducedMotion: false,
  prefersHighContrast: false,
});

function clampTextScale(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(
    COMPOSER_LIMITS.maximumTextScale,
    Math.max(COMPOSER_LIMITS.minimumTextScale, value),
  );
}

function createSnapshot(
  version: number,
  preferences: ComposerAccessibilityConfig,
  media: AccessibilityMediaState,
  inputModality: ComposerInputModality,
): ComposerAccessibilitySnapshot {
  const contrast = media.forcedColorsActive
    ? 'forced-colors'
    : preferences.highContrast || media.prefersHighContrast
      ? 'high'
      : 'standard';
  const reducedMotion =
    preferences.reducedMotion ||
    preferences.reducedSensory ||
    media.prefersReducedMotion;

  return Object.freeze({
    version,
    contrast,
    motion: reducedMotion ? 'reduced' : 'full',
    reducedTransparency:
      preferences.reducedTransparency ||
      media.forcedColorsActive,
    reducedSensory: preferences.reducedSensory,
    screenReaderOptimized: preferences.screenReaderOptimized,
    textScale: clampTextScale(preferences.textScale),
    minimumTargetSizePx: Math.max(
      COMPOSER_LIMITS.minimumTargetSizePx,
      Math.round(preferences.minimumTargetSizePx),
    ),
    inputModality,
    keyboardNavigationActive: inputModality === 'keyboard',
    forcedColorsActive: media.forcedColorsActive,
    prefersReducedMotion: media.prefersReducedMotion,
    prefersHighContrast: media.prefersHighContrast,
  });
}

export class ComposerAccessibilityEngine
  implements ComposerAccessibilityEngineLike {
  private readonly subscribers = new Set<() => void>();
  private preferences: ComposerAccessibilityConfig;
  private media: AccessibilityMediaState = Object.freeze({
    forcedColorsActive: false,
    prefersReducedMotion: false,
    prefersHighContrast: false,
  });
  private inputModality: ComposerInputModality = 'unknown';
  private snapshot: ComposerAccessibilitySnapshot;
  private document: Document | null = null;
  private mediaQueries: readonly MediaQueryList[] = Object.freeze([]);
  private version = 0;

  public constructor(preferences: ComposerAccessibilityConfig) {
    this.preferences = Object.freeze({ ...preferences });
    this.snapshot = createSnapshot(
      this.version,
      this.preferences,
      this.media,
      this.inputModality,
    );
  }

  public readonly subscribe = (
    listener: () => void,
  ): (() => void) => {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  };

  public readonly getSnapshot = (): ComposerAccessibilitySnapshot =>
    this.snapshot;

  public readonly getServerSnapshot = (): ComposerAccessibilitySnapshot =>
    SERVER_SNAPSHOT;

  public start(target: Document = document): void {
    if (this.document === target) return;
    this.stop();
    this.document = target;

    const windowObject = target.defaultView;
    if (windowObject !== null) {
      const forcedColors = windowObject.matchMedia(
        '(forced-colors: active)',
      );
      const reducedMotion = windowObject.matchMedia(
        '(prefers-reduced-motion: reduce)',
      );
      const highContrast = windowObject.matchMedia(
        '(prefers-contrast: more)',
      );
      this.mediaQueries = Object.freeze([
        forcedColors,
        reducedMotion,
        highContrast,
      ]);
      this.updateMediaState();

      for (const query of this.mediaQueries) {
        query.addEventListener('change', this.handleMediaChange);
      }
    }

    target.addEventListener('keydown', this.handleKeyboardInput, true);
    target.addEventListener('pointerdown', this.handlePointerInput, true);
    target.addEventListener('touchstart', this.handleTouchInput, {
      capture: true,
      passive: true,
    });
  }

  public stop(): void {
    if (this.document === null) return;

    for (const query of this.mediaQueries) {
      query.removeEventListener('change', this.handleMediaChange);
    }
    this.document.removeEventListener(
      'keydown',
      this.handleKeyboardInput,
      true,
    );
    this.document.removeEventListener(
      'pointerdown',
      this.handlePointerInput,
      true,
    );
    this.document.removeEventListener(
      'touchstart',
      this.handleTouchInput,
      true,
    );

    this.document = null;
    this.mediaQueries = Object.freeze([]);
  }

  public updatePreferences(
    preferences: Partial<ComposerAccessibilityConfig>,
  ): void {
    this.preferences = Object.freeze({
      ...this.preferences,
      ...preferences,
      textScale: clampTextScale(
        preferences.textScale ?? this.preferences.textScale,
      ),
      minimumTargetSizePx: Math.max(
        COMPOSER_LIMITS.minimumTargetSizePx,
        Math.round(
          preferences.minimumTargetSizePx ??
          this.preferences.minimumTargetSizePx,
        ),
      ),
    });
    this.commit();
  }

  public getRootAttributes(): Readonly<Record<string, string>> {
    return Object.freeze({
      [COMPOSER_DATA_ATTRIBUTES.inputModality]:
        this.snapshot.inputModality,
      [COMPOSER_DATA_ATTRIBUTES.contrast]:
        this.snapshot.contrast,
      [COMPOSER_DATA_ATTRIBUTES.motion]:
        this.snapshot.motion,
      'data-qcq-keyboard-navigation':
        String(this.snapshot.keyboardNavigationActive),
      'data-qcq-reduced-transparency':
        String(this.snapshot.reducedTransparency),
      'data-qcq-reduced-sensory':
        String(this.snapshot.reducedSensory),
      'data-qcq-screen-reader-optimized':
        String(this.snapshot.screenReaderOptimized),
      'data-qcq-text-scale':
        String(this.snapshot.textScale),
    });
  }

  public announce(
    message: string,
    priority: 'polite' | 'assertive' = 'polite',
  ): void {
    if (
      this.document === null ||
      !this.preferences.announceStatusChanges ||
      message.trim().length === 0
    ) {
      return;
    }

    const region = this.document.createElement('div');
    region.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('data-qcq-composer-announcement', 'true');
    Object.assign(region.style, {
      position: 'fixed',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      clipPath: 'inset(50%)',
      whiteSpace: 'nowrap',
    });
    this.document.body.append(region);
    const scheduler = this.document.defaultView;
    scheduler?.setTimeout(() => {
      region.remove();
    }, 1_500);
    scheduler?.setTimeout(() => {
      region.textContent = message;
    }, 16);
  }

  private readonly handleMediaChange = (): void => {
    this.updateMediaState();
    this.commit();
  };

  private readonly handleKeyboardInput = (
    event: KeyboardEvent,
  ): void => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    this.setInputModality('keyboard');
  };

  private readonly handlePointerInput = (
    event: PointerEvent,
  ): void => {
    const modality: ComposerInputModality =
      event.pointerType === 'touch'
        ? 'touch'
        : event.pointerType === 'pen'
          ? 'stylus'
          : 'pointer';
    this.setInputModality(modality);
  };

  private readonly handleTouchInput = (): void => {
    this.setInputModality('touch');
  };

  private setInputModality(modality: ComposerInputModality): void {
    if (this.inputModality === modality) return;
    this.inputModality = modality;
    this.commit();
  }

  private updateMediaState(): void {
    const [
      forcedColors,
      reducedMotion,
      highContrast,
    ] = this.mediaQueries;

    this.media = Object.freeze({
      forcedColorsActive: forcedColors?.matches ?? false,
      prefersReducedMotion: reducedMotion?.matches ?? false,
      prefersHighContrast: highContrast?.matches ?? false,
    });
  }

  private commit(): void {
    this.version += 1;
    this.snapshot = createSnapshot(
      this.version,
      this.preferences,
      this.media,
      this.inputModality,
    );
    this.subscribers.forEach((listener) => listener());
  }
}

export function createComposerAccessibilityEngine(
  preferences: ComposerAccessibilityConfig,
): ComposerAccessibilityEngine {
  return new ComposerAccessibilityEngine(preferences);
}
