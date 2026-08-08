/**
 * Artifact ID: QCQ-TBL-033
 * Artifact Name: GlowEngine
 * Repository Path: QCQ/frontend/src/effects/GlowEngine.ts
 *
 * Centralized, framework-neutral glow authority for the QCQ visual system.
 */

export type GlowQuality = 'off' | 'performance' | 'balanced' | 'cinematic';
export type GlowMotion = 'static' | 'reduced' | 'full';
export type GlowRole =
  | 'frame'
  | 'node'
  | 'rail'
  | 'answer-hover'
  | 'button'
  | 'lightning-flash'
  | 'xp'
  | 'rank'
  | 'certification'
  | 'particle'
  | 'reflection';

export interface GlowPalette {
  readonly primary: string;
  readonly secondary: string;
  readonly core: string;
}

export interface GlowProfileOptions {
  readonly intensity?: number | undefined;
  readonly quality?: GlowQuality | undefined;
  readonly motion?: GlowMotion | undefined;
  readonly palette?: Partial<GlowPalette> | undefined;
}

export interface GlowProfile {
  readonly role: GlowRole;
  readonly quality: GlowQuality;
  readonly motion: GlowMotion;
  readonly intensity: number;
  readonly palette: GlowPalette;
  readonly blurRadiusPx: number;
  readonly spreadRadiusPx: number;
  readonly outerOpacity: number;
  readonly innerOpacity: number;
  readonly pulseDurationMs: number;
  readonly boxShadow: string;
  readonly textShadow: string;
  readonly filter: string;
}

export interface GlowPulseCommand {
  readonly source: string;
  readonly role?: GlowRole | undefined;
  readonly intensity: number;
  readonly durationMs?: number | undefined;
  readonly color?: string | undefined;
  readonly timestamp?: number | undefined;
}

export interface GlowSignalSnapshot {
  readonly version: number;
  readonly source: string | null;
  readonly role: GlowRole | null;
  readonly flashIntensity: number;
  readonly flashColor: string;
  readonly startedAt: number;
  readonly expiresAt: number;
}

export interface GlowController {
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => GlowSignalSnapshot;
  readonly pulse: (command: GlowPulseCommand) => void;
  readonly clear: (source?: string  ) => void;
  readonly dispose: () => void;
}

export type GlowCssVariable =
  | '--qcq-glow-primary'
  | '--qcq-glow-secondary'
  | '--qcq-glow-core'
  | '--qcq-glow-intensity'
  | '--qcq-glow-blur'
  | '--qcq-glow-spread'
  | '--qcq-glow-outer-opacity'
  | '--qcq-glow-inner-opacity'
  | '--qcq-glow-pulse-duration';

const DEFAULT_FLASH_COLOR = '#d8f7ff';

const ROLE_PALETTES: Readonly<Record<GlowRole, GlowPalette>> = Object.freeze({
  frame: Object.freeze({ primary: '#34d8ff', secondary: '#7d5cff', core: '#f3fdff' }),
  node: Object.freeze({ primary: '#55e8ff', secondary: '#9f72ff', core: '#ffffff' }),
  rail: Object.freeze({ primary: '#22c8ff', secondary: '#ff8f2d', core: '#eaffff' }),
  'answer-hover': Object.freeze({ primary: '#3fe7ff', secondary: '#738dff', core: '#ffffff' }),
  button: Object.freeze({ primary: '#31d6ff', secondary: '#a36dff', core: '#ffffff' }),
  'lightning-flash': Object.freeze({ primary: '#bdefff', secondary: '#8c72ff', core: '#ffffff' }),
  xp: Object.freeze({ primary: '#3af2b0', secondary: '#2bcaff', core: '#effff9' }),
  rank: Object.freeze({ primary: '#ffb34d', secondary: '#ff6f4d', core: '#fff9e8' }),
  certification: Object.freeze({ primary: '#8d78ff', secondary: '#28d8ff', core: '#ffffff' }),
  particle: Object.freeze({ primary: '#54dfff', secondary: '#8d68ff', core: '#eaffff' }),
  reflection: Object.freeze({ primary: '#d7f6ff', secondary: '#8aa4ff', core: '#ffffff' }),
});

const ROLE_MULTIPLIER: Readonly<Record<GlowRole, number>> = Object.freeze({
  frame: 0.9,
  node: 1,
  rail: 0.82,
  'answer-hover': 0.74,
  button: 0.68,
  'lightning-flash': 1,
  xp: 0.78,
  rank: 0.82,
  certification: 0.88,
  particle: 0.52,
  reflection: 0.62,
});

const QUALITY_MULTIPLIER: Readonly<Record<GlowQuality, number>> = Object.freeze({
  off: 0,
  performance: 0.52,
  balanced: 0.78,
  cinematic: 1,
});

const MOTION_MULTIPLIER: Readonly<Record<GlowMotion, number>> = Object.freeze({
  static: 0.66,
  reduced: 0.78,
  full: 1,
});

export const EMPTY_GLOW_SNAPSHOT: GlowSignalSnapshot = Object.freeze({
  version: 0,
  source: null,
  role: null,
  flashIntensity: 0,
  flashColor: DEFAULT_FLASH_COLOR,
  startedAt: 0,
  expiresAt: 0,
});

export function clampGlow(value: number, minimum = 0, maximum = 1): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

function sanitizeDuration(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.round(Math.min(1600, Math.max(80, value)));
}

function resolvePalette(role: GlowRole, override: Partial<GlowPalette> | undefined): GlowPalette {
  const base = ROLE_PALETTES[role];
  return Object.freeze({
    primary: override?.primary ?? base.primary,
    secondary: override?.secondary ?? base.secondary,
    core: override?.core ?? base.core,
  });
}

export function resolveGlowProfile(
  role: GlowRole,
  options: GlowProfileOptions = {},
): GlowProfile {
  const quality = options.quality ?? 'balanced';
  const motion = options.motion ?? 'full';
  const requestedIntensity = clampGlow(options.intensity ?? 1);
  const intensity = clampGlow(
    requestedIntensity
      * ROLE_MULTIPLIER[role]
      * QUALITY_MULTIPLIER[quality]
      * MOTION_MULTIPLIER[motion],
  );
  const palette = resolvePalette(role, options.palette);
  const blurRadiusPx = Math.round((8 + intensity * 26) * 100) / 100;
  const spreadRadiusPx = Math.round((1 + intensity * 7) * 100) / 100;
  const outerOpacity = Math.round(clampGlow(0.08 + intensity * 0.46) * 1000) / 1000;
  const innerOpacity = Math.round(clampGlow(0.16 + intensity * 0.7) * 1000) / 1000;
  const pulseDurationMs = motion === 'full' ? Math.round(760 - intensity * 260) : 0;
  const boxShadow = intensity === 0
    ? 'none'
    : [
        `0 0 ${spreadRadiusPx}px ${palette.core}`,
        `0 0 ${blurRadiusPx}px rgb(52 216 255 / ${outerOpacity})`,
        `0 0 ${Math.round(blurRadiusPx * 1.7 * 100) / 100}px rgb(125 92 255 / ${Math.round(outerOpacity * 0.72 * 1000) / 1000})`,
      ].join(', ');
  const textShadow = intensity === 0
    ? 'none'
    : `0 0 ${Math.max(2, Math.round(blurRadiusPx * 0.38))}px ${palette.primary}`;
  const filter = intensity === 0
    ? 'none'
    : `drop-shadow(0 0 ${Math.max(1, Math.round(blurRadiusPx * 0.34))}px ${palette.primary}) drop-shadow(0 0 ${Math.max(2, Math.round(blurRadiusPx * 0.7))}px ${palette.secondary})`;

  return Object.freeze({
    role,
    quality,
    motion,
    intensity,
    palette,
    blurRadiusPx,
    spreadRadiusPx,
    outerOpacity,
    innerOpacity,
    pulseDurationMs,
    boxShadow,
    textShadow,
    filter,
  });
}

export function createGlowCssVariables(
  profile: GlowProfile,
): Readonly<Record<GlowCssVariable, string>> {
  return Object.freeze({
    '--qcq-glow-primary': profile.palette.primary,
    '--qcq-glow-secondary': profile.palette.secondary,
    '--qcq-glow-core': profile.palette.core,
    '--qcq-glow-intensity': String(profile.intensity),
    '--qcq-glow-blur': `${profile.blurRadiusPx}px`,
    '--qcq-glow-spread': `${profile.spreadRadiusPx}px`,
    '--qcq-glow-outer-opacity': String(profile.outerOpacity),
    '--qcq-glow-inner-opacity': String(profile.innerOpacity),
    '--qcq-glow-pulse-duration': `${profile.pulseDurationMs}ms`,
  });
}

export function createGlowController(): GlowController {
  const listeners = new Set<() => void>();
  let snapshot = EMPTY_GLOW_SNAPSHOT;
  let expiryTimer: number | undefined;
  let disposed = false;

  const emit = (): void => {
    for (const listener of listeners) listener();
  };

  const clearTimer = (): void => {
    if (expiryTimer === undefined) return;
    globalThis.clearTimeout(expiryTimer);
    expiryTimer = undefined;
  };

  const publish = (next: GlowSignalSnapshot): void => {
    if (disposed) return;
    snapshot = Object.freeze(next);
    emit();
  };

  const clear = (source?: string): void => {
    if (disposed) return;
    if (source !== undefined && snapshot.source !== source) return;
    clearTimer();
    publish({
      ...EMPTY_GLOW_SNAPSHOT,
      version: snapshot.version + 1,
    });
  };

  return Object.freeze({
    subscribe: (listener: () => void): (() => void) => {
      if (disposed) return () => undefined;
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: (): GlowSignalSnapshot => snapshot,
    pulse: (command: GlowPulseCommand): void => {
      if (disposed) return;
      const startedAt = command.timestamp ?? Date.now();
      const durationMs = sanitizeDuration(command.durationMs, 520);
      const source = command.source.trim() || 'qcq-glow-source';
      const nextVersion = snapshot.version + 1;
      clearTimer();
      publish({
        version: nextVersion,
        source,
        role: command.role ?? 'lightning-flash',
        flashIntensity: clampGlow(command.intensity),
        flashColor: command.color ?? DEFAULT_FLASH_COLOR,
        startedAt,
        expiresAt: startedAt + durationMs,
      });
      expiryTimer = window.setTimeout(() => clear(source), durationMs);
    },
    clear,
    dispose: (): void => {
      if (disposed) return;
      disposed = true;
      clearTimer();
      listeners.clear();
      snapshot = EMPTY_GLOW_SNAPSHOT;
    },
  });
}

/**
 * Shared opt-in controller for independently mounted effects. Composite systems
 * should prefer an owned controller and pass it to their descendants.
 */
export const qcqGlowController = createGlowController();
