/**
 * Artifact ID: QCQ-TBL-036
 * Artifact Name: DesignTokens
 * Repository Path: QCQ/frontend/src/styles/DesignTokens.ts
 *
 * Primitive, theme-independent visual constitution for Quantum Certification
 * Quest. Higher-level color, typography, spacing, elevation, glow, reflection,
 * motion, theme, and accessibility systems derive from these immutable values.
 */

export type QcqResolutionProfile =
  | 'compact'
  | 'hd'
  | 'qhd'
  | '4k'
  | '8k';

export type QcqDensity = 'compact' | 'comfortable' | 'cinematic';
export type QcqContrastMode = 'standard' | 'high' | 'forced-colors';
export type QcqMotionMode = 'full' | 'reduced' | 'static';
export type QcqVisualQuality = 'performance' | 'balanced' | 'cinematic';

export type CssVariableName = `--qcq-${string}`;
export type CssVariableMap = Readonly<Record<CssVariableName, string>>;

export interface ResolutionProfile {
  readonly id: QcqResolutionProfile;
  readonly referenceWidth: number;
  readonly referenceHeight: number;
  readonly scale: number;
  readonly minimumRootFontPx: number;
  readonly maximumRootFontPx: number;
  readonly maximumCanvasDpr: number;
  readonly atmosphericDetail: number;
  readonly reflectionDetail: number;
}

export interface PrimitiveColorTokens {
  readonly void0: string;
  readonly void1: string;
  readonly void2: string;
  readonly void3: string;
  readonly platinum50: string;
  readonly platinum100: string;
  readonly platinum200: string;
  readonly platinum300: string;
  readonly platinum400: string;
  readonly platinum500: string;
  readonly platinum600: string;
  readonly cyan300: string;
  readonly cyan400: string;
  readonly cyan500: string;
  readonly blue400: string;
  readonly blue500: string;
  readonly violet400: string;
  readonly violet500: string;
  readonly emerald400: string;
  readonly emerald500: string;
  readonly amber400: string;
  readonly orange500: string;
  readonly red400: string;
  readonly red500: string;
  readonly white: string;
  readonly black: string;
}

export interface PrimitiveTypographyTokens {
  readonly fontSans: string;
  readonly fontDisplay: string;
  readonly fontMono: string;
  readonly weightRegular: number;
  readonly weightMedium: number;
  readonly weightSemibold: number;
  readonly weightBold: number;
  readonly trackingTight: string;
  readonly trackingNormal: string;
  readonly trackingWide: string;
  readonly trackingHud: string;
  readonly lineHeightCompact: number;
  readonly lineHeightNormal: number;
  readonly lineHeightRelaxed: number;
}

export interface PrimitiveSpacingTokens {
  readonly unit: number;
  readonly none: string;
  readonly xxs: string;
  readonly xs: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
  readonly xxl: string;
  readonly xxxl: string;
  readonly viewportGutter: string;
  readonly panelGap: string;
  readonly controlGap: string;
}

export interface PrimitiveShapeTokens {
  readonly radiusXs: string;
  readonly radiusSm: string;
  readonly radiusMd: string;
  readonly radiusLg: string;
  readonly radiusXl: string;
  readonly radiusPill: string;
  readonly borderHairline: string;
  readonly borderThin: string;
  readonly borderMedium: string;
  readonly borderStrong: string;
}

export interface PrimitiveMotionTokens {
  readonly durationInstant: number;
  readonly durationFast: number;
  readonly durationMedium: number;
  readonly durationSlow: number;
  readonly durationAmbient: number;
  readonly easeStandard: string;
  readonly easeEnter: string;
  readonly easeExit: string;
  readonly easeEmphasized: string;
  readonly easeLinear: string;
}

export interface PrimitiveDepthTokens {
  readonly zBackground: number;
  readonly zAtmosphere: number;
  readonly zFrame: number;
  readonly zContent: number;
  readonly zFloating: number;
  readonly zOverlay: number;
  readonly zDialog: number;
  readonly zCritical: number;
}

export interface PrimitiveBreakpointTokens {
  readonly phone: number;
  readonly tablet: number;
  readonly desktop: number;
  readonly wide: number;
  readonly ultraWide: number;
  readonly fourK: number;
  readonly eightK: number;
}

export interface QcqPrimitiveTokens {
  readonly version: '1.0.0';
  readonly colors: PrimitiveColorTokens;
  readonly typography: PrimitiveTypographyTokens;
  readonly spacing: PrimitiveSpacingTokens;
  readonly shape: PrimitiveShapeTokens;
  readonly motion: PrimitiveMotionTokens;
  readonly depth: PrimitiveDepthTokens;
  readonly breakpoints: PrimitiveBreakpointTokens;
  readonly resolutions: Readonly<Record<QcqResolutionProfile, ResolutionProfile>>;
}

export const QCQ_PRIMITIVE_TOKENS: QcqPrimitiveTokens = Object.freeze({
  version: '1.0.0',
  colors: Object.freeze({
    void0: '#01030a',
    void1: '#030817',
    void2: '#071227',
    void3: '#0b1b35',
    platinum50: '#f7fcff',
    platinum100: '#e8f5fb',
    platinum200: '#cfe4ee',
    platinum300: '#afc8d5',
    platinum400: '#829eae',
    platinum500: '#5e7888',
    platinum600: '#3d5362',
    cyan300: '#76efff',
    cyan400: '#35dcff',
    cyan500: '#08bce8',
    blue400: '#548dff',
    blue500: '#2e65df',
    violet400: '#a77cff',
    violet500: '#7551df',
    emerald400: '#3df2b2',
    emerald500: '#13bd7d',
    amber400: '#ffc45e',
    orange500: '#ff8b32',
    red400: '#ff6f78',
    red500: '#df3d50',
    white: '#ffffff',
    black: '#000000',
  }),
  typography: Object.freeze({
    fontSans:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontDisplay:
      '"Rajdhani", "Arial Narrow", Inter, ui-sans-serif, system-ui, sans-serif',
    fontMono:
      '"IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
    weightRegular: 400,
    weightMedium: 500,
    weightSemibold: 600,
    weightBold: 700,
    trackingTight: '-0.025em',
    trackingNormal: '0',
    trackingWide: '0.06em',
    trackingHud: '0.12em',
    lineHeightCompact: 1.1,
    lineHeightNormal: 1.45,
    lineHeightRelaxed: 1.65,
  }),
  spacing: Object.freeze({
    unit: 4,
    none: '0',
    xxs: '0.125rem',
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    xxl: '2rem',
    xxxl: '3rem',
    viewportGutter: 'clamp(0.75rem, 1.4vw, 2.5rem)',
    panelGap: 'clamp(0.5rem, 0.9vw, 1.5rem)',
    controlGap: 'clamp(0.375rem, 0.6vw, 0.875rem)',
  }),
  shape: Object.freeze({
    radiusXs: '0.1875rem',
    radiusSm: '0.375rem',
    radiusMd: '0.625rem',
    radiusLg: '0.875rem',
    radiusXl: '1.25rem',
    radiusPill: '999px',
    borderHairline: '1px',
    borderThin: 'clamp(1px, 0.08vw, 2px)',
    borderMedium: 'clamp(2px, 0.12vw, 4px)',
    borderStrong: 'clamp(3px, 0.18vw, 7px)',
  }),
  motion: Object.freeze({
    durationInstant: 80,
    durationFast: 140,
    durationMedium: 240,
    durationSlow: 420,
    durationAmbient: 3200,
    easeStandard: 'cubic-bezier(0.2, 0, 0, 1)',
    easeEnter: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeExit: 'cubic-bezier(0.7, 0, 0.84, 0)',
    easeEmphasized: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    easeLinear: 'linear',
  }),
  depth: Object.freeze({
    zBackground: 0,
    zAtmosphere: 10,
    zFrame: 20,
    zContent: 30,
    zFloating: 40,
    zOverlay: 100,
    zDialog: 200,
    zCritical: 1000,
  }),
  breakpoints: Object.freeze({
    phone: 480,
    tablet: 768,
    desktop: 1200,
    wide: 1600,
    ultraWide: 2200,
    fourK: 3200,
    eightK: 6400,
  }),
  resolutions: Object.freeze({
    compact: Object.freeze({
      id: 'compact',
      referenceWidth: 1280,
      referenceHeight: 720,
      scale: 0.84,
      minimumRootFontPx: 14,
      maximumRootFontPx: 17,
      maximumCanvasDpr: 1,
      atmosphericDetail: 0.48,
      reflectionDetail: 0.52,
    }),
    hd: Object.freeze({
      id: 'hd',
      referenceWidth: 1920,
      referenceHeight: 1080,
      scale: 1,
      minimumRootFontPx: 15,
      maximumRootFontPx: 19,
      maximumCanvasDpr: 1.5,
      atmosphericDetail: 0.68,
      reflectionDetail: 0.72,
    }),
    qhd: Object.freeze({
      id: 'qhd',
      referenceWidth: 2560,
      referenceHeight: 1440,
      scale: 1.12,
      minimumRootFontPx: 16,
      maximumRootFontPx: 21,
      maximumCanvasDpr: 1.75,
      atmosphericDetail: 0.82,
      reflectionDetail: 0.86,
    }),
    '4k': Object.freeze({
      id: '4k',
      referenceWidth: 3840,
      referenceHeight: 2160,
      scale: 1.32,
      minimumRootFontPx: 17,
      maximumRootFontPx: 24,
      maximumCanvasDpr: 2,
      atmosphericDetail: 1,
      reflectionDetail: 1,
    }),
    '8k': Object.freeze({
      id: '8k',
      referenceWidth: 7680,
      referenceHeight: 4320,
      scale: 1.62,
      minimumRootFontPx: 18,
      maximumRootFontPx: 30,
      maximumCanvasDpr: 2,
      atmosphericDetail: 1,
      reflectionDetail: 1,
    }),
  }),
});

export function clampToken(
  value: number,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

export function roundToken(value: number, precision = 1000): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * precision) / precision;
}

export function resolveResolutionProfile(
  width: number,
): ResolutionProfile {
  const breakpoints = QCQ_PRIMITIVE_TOKENS.breakpoints;
  if (width >= breakpoints.eightK) return QCQ_PRIMITIVE_TOKENS.resolutions['8k'];
  if (width >= breakpoints.fourK) return QCQ_PRIMITIVE_TOKENS.resolutions['4k'];
  if (width >= breakpoints.ultraWide) return QCQ_PRIMITIVE_TOKENS.resolutions.qhd;
  if (width >= breakpoints.desktop) return QCQ_PRIMITIVE_TOKENS.resolutions.hd;
  return QCQ_PRIMITIVE_TOKENS.resolutions.compact;
}

export function createFluidValue(
  minimumPx: number,
  preferredViewportWidthPercent: number,
  maximumPx: number,
): string {
  const minimum = Math.max(0, minimumPx);
  const maximum = Math.max(minimum, maximumPx);
  const preferred = Math.max(0, preferredViewportWidthPercent);
  return `clamp(${roundToken(minimum)}px, ${roundToken(preferred)}vw, ${roundToken(maximum)}px)`;
}

export function createPrimitiveCssVariables(
  tokens: QcqPrimitiveTokens = QCQ_PRIMITIVE_TOKENS,
): CssVariableMap {
  return Object.freeze({
    '--qcq-color-void-0': tokens.colors.void0,
    '--qcq-color-void-1': tokens.colors.void1,
    '--qcq-color-void-2': tokens.colors.void2,
    '--qcq-color-void-3': tokens.colors.void3,
    '--qcq-color-platinum-50': tokens.colors.platinum50,
    '--qcq-color-platinum-100': tokens.colors.platinum100,
    '--qcq-color-platinum-200': tokens.colors.platinum200,
    '--qcq-color-platinum-300': tokens.colors.platinum300,
    '--qcq-color-platinum-400': tokens.colors.platinum400,
    '--qcq-color-platinum-500': tokens.colors.platinum500,
    '--qcq-color-platinum-600': tokens.colors.platinum600,
    '--qcq-color-cyan-300': tokens.colors.cyan300,
    '--qcq-color-cyan-400': tokens.colors.cyan400,
    '--qcq-color-cyan-500': tokens.colors.cyan500,
    '--qcq-color-blue-400': tokens.colors.blue400,
    '--qcq-color-blue-500': tokens.colors.blue500,
    '--qcq-color-violet-400': tokens.colors.violet400,
    '--qcq-color-violet-500': tokens.colors.violet500,
    '--qcq-color-emerald-400': tokens.colors.emerald400,
    '--qcq-color-emerald-500': tokens.colors.emerald500,
    '--qcq-color-amber-400': tokens.colors.amber400,
    '--qcq-color-orange-500': tokens.colors.orange500,
    '--qcq-color-red-400': tokens.colors.red400,
    '--qcq-color-red-500': tokens.colors.red500,
    '--qcq-font-sans': tokens.typography.fontSans,
    '--qcq-font-display': tokens.typography.fontDisplay,
    '--qcq-font-mono': tokens.typography.fontMono,
    '--qcq-space-xxs': tokens.spacing.xxs,
    '--qcq-space-xs': tokens.spacing.xs,
    '--qcq-space-sm': tokens.spacing.sm,
    '--qcq-space-md': tokens.spacing.md,
    '--qcq-space-lg': tokens.spacing.lg,
    '--qcq-space-xl': tokens.spacing.xl,
    '--qcq-space-xxl': tokens.spacing.xxl,
    '--qcq-space-xxxl': tokens.spacing.xxxl,
    '--qcq-radius-xs': tokens.shape.radiusXs,
    '--qcq-radius-sm': tokens.shape.radiusSm,
    '--qcq-radius-md': tokens.shape.radiusMd,
    '--qcq-radius-lg': tokens.shape.radiusLg,
    '--qcq-radius-xl': tokens.shape.radiusXl,
    '--qcq-border-hairline': tokens.shape.borderHairline,
    '--qcq-border-thin': tokens.shape.borderThin,
    '--qcq-border-medium': tokens.shape.borderMedium,
    '--qcq-border-strong': tokens.shape.borderStrong,
    '--qcq-duration-instant': `${tokens.motion.durationInstant}ms`,
    '--qcq-duration-fast': `${tokens.motion.durationFast}ms`,
    '--qcq-duration-medium': `${tokens.motion.durationMedium}ms`,
    '--qcq-duration-slow': `${tokens.motion.durationSlow}ms`,
    '--qcq-duration-ambient': `${tokens.motion.durationAmbient}ms`,
    '--qcq-ease-standard': tokens.motion.easeStandard,
    '--qcq-ease-enter': tokens.motion.easeEnter,
    '--qcq-ease-exit': tokens.motion.easeExit,
    '--qcq-ease-emphasized': tokens.motion.easeEmphasized,
  });
}

export function mergeCssVariableMaps(
  ...maps: readonly CssVariableMap[]
): CssVariableMap {
  return Object.freeze(
    maps.reduce<Record<CssVariableName, string>>((result, map) => {
      for (const [key, value] of Object.entries(map)) {
        result[key as CssVariableName] = value;
      }
      return result;
    }, {}),
  );
}

export function applyCssVariables(
  target: HTMLElement,
  variables: CssVariableMap,
): () => void {
  const previous = new Map<string, string>();
  for (const [name, value] of Object.entries(variables)) {
    previous.set(name, target.style.getPropertyValue(name));
    target.style.setProperty(name, value);
  }

  return () => {
    for (const [name, value] of previous) {
      if (value.length === 0) target.style.removeProperty(name);
      else target.style.setProperty(name, value);
    }
  };
}
