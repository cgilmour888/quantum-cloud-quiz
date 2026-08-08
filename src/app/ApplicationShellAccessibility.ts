/**
 * Artifact ID: QCQ-APP-001-016
 * Artifact Name: ApplicationShellAccessibility
 * Artifact Purpose: Shell-level reduced-motion, forced-colors, contrast, pointer modality, text-scale, and input-modality observation without duplicating Phase 9 visual-token ownership.
 * Artifact Layer: Phase 1 — Application Shell / A11Y
 * Artifact Dependencies: QCQ-APP-001-004, QCQ-APP-001-006, QCQ-THM-008
 * Artifact Dependents: QCQ-APP-001-001, QCQ-APP-001-002, QCQ-APP-001-010, QCQ-APP-001-017
 * Dependency Graph: browser accessibility signals -> ApplicationShellAccessibility -> runtime/policy/root data attributes
 * Repository Path: QCQ/frontend/src/app
 * Source File: ApplicationShellAccessibility.ts
 */

import type {
  ApplicationShellAccessibilitySnapshot,
  ApplicationShellConfig,
  ApplicationShellInputModality,
} from './ApplicationShell.types';

type AccessibilityListener = (
  snapshot: ApplicationShellAccessibilitySnapshot,
) => void;

function match(query: string): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(query).matches
  );
}

function currentTextScale(): number {
  if (
    typeof document === 'undefined' ||
    typeof window === 'undefined'
  ) {
    return 1;
  }
  const rootSize = Number.parseFloat(
    window.getComputedStyle(
      document.documentElement,
    ).fontSize,
  );
  return Number.isFinite(rootSize) && rootSize > 0
    ? rootSize / 16
    : 1;
}

export class ApplicationShellAccessibility {
  readonly #listeners =
    new Set<AccessibilityListener>();

  #root: HTMLElement | null = null;

  readonly #mediaQueries: MediaQueryList[] = [];

  #input: ApplicationShellInputModality =
    'unknown';

  #revision = 0;

  #snapshot: ApplicationShellAccessibilitySnapshot =
    this.#computeSnapshot();

  public constructor(
    private readonly config: ApplicationShellConfig,
  ) {}

  public start(root: HTMLElement): void {
    if (this.#root === root) return;
    this.stop();
    this.#root = root;

    if (typeof window !== 'undefined') {
      window.addEventListener(
        'keydown',
        this.#handleKeyboard,
        true,
      );
      window.addEventListener(
        'pointerdown',
        this.#handlePointer,
        true,
      );
      window.addEventListener(
        'resize',
        this.#handleEnvironment,
      );

      for (const query of [
        '(prefers-reduced-motion: reduce)',
        '(forced-colors: active)',
        '(prefers-contrast: more)',
        '(pointer: coarse)',
      ]) {
        const mediaQuery = window.matchMedia(query);
        mediaQuery.addEventListener(
          'change',
          this.#handleEnvironment,
        );
        this.#mediaQueries.push(mediaQuery);
      }
    }

    this.#publish();
  }

  public stop(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener(
        'keydown',
        this.#handleKeyboard,
        true,
      );
      window.removeEventListener(
        'pointerdown',
        this.#handlePointer,
        true,
      );
      window.removeEventListener(
        'resize',
        this.#handleEnvironment,
      );

      for (const mediaQuery of this.#mediaQueries) {
        mediaQuery.removeEventListener(
          'change',
          this.#handleEnvironment,
        );
      }
      this.#mediaQueries.splice(0);
    }
    this.#root = null;
  }

  public getSnapshot =
    (): ApplicationShellAccessibilitySnapshot =>
      this.#snapshot;

  public subscribe = (
    listener: AccessibilityListener,
  ): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  readonly #handleKeyboard = (): void => {
    this.#input = 'keyboard';
    this.#publish();
  };

  readonly #handlePointer = (
    event: PointerEvent,
  ): void => {
    this.#input =
      event.pointerType === 'touch'
        ? 'touch'
        : event.pointerType === 'pen'
          ? 'pen'
          : 'pointer';
    this.#publish();
  };

  readonly #handleEnvironment = (): void => {
    this.#publish();
  };

  #computeSnapshot():
    ApplicationShellAccessibilitySnapshot {
    const reducedMotion = match(
      '(prefers-reduced-motion: reduce)',
    );
    const forcedColors = match(
      '(forced-colors: active)',
    );
    const highContrast =
      forcedColors ||
      match('(prefers-contrast: more)');

    return Object.freeze({
      revision: this.#revision,
      motion: reducedMotion
        ? 'reduced'
        : 'full',
      contrast: forcedColors
        ? 'forced-colors'
        : highContrast
          ? 'high'
          : 'standard',
      input: this.#input,
      textScale: currentTextScale(),
      coarsePointer: match('(pointer: coarse)'),
      updatedAt: new Date().toISOString(),
    });
  }

  #applyToRoot(
    snapshot: ApplicationShellAccessibilitySnapshot,
  ): void {
    if (this.#root === null) return;
    this.#root.dataset.qcqShellMotion =
      snapshot.motion;
    this.#root.dataset.qcqShellContrast =
      snapshot.contrast;
    this.#root.dataset.qcqShellInput =
      snapshot.input;
    this.#root.style.setProperty(
      '--qcq-shell-observed-text-scale',
      String(snapshot.textScale),
    );
    this.#root.style.setProperty(
      '--qcq-shell-minimum-target',
      `${this.config.minimumTouchTargetPx}px`,
    );
  }

  #publish(): void {
    this.#revision += 1;
    this.#snapshot = this.#computeSnapshot();
    this.#applyToRoot(this.#snapshot);
    for (const listener of this.#listeners) {
      listener(this.#snapshot);
    }
  }
}
