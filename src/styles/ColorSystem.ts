/**
 * Artifact ID: QCQ-THM-001
 * Artifact Name: ColorSystem
 * Repository Path: QCQ/frontend/src/styles/ColorSystem.ts
 */

import {
  QCQ_PRIMITIVE_TOKENS,
  type CssVariableMap,
} from './DesignTokens';

export type QcqColorScheme = 'dark' | 'light' | 'high-contrast';
export type QcqStatusTone =
  | 'neutral'
  | 'information'
  | 'success'
  | 'warning'
  | 'danger';

export interface SemanticColorPalette {
  readonly canvas: string;
  readonly canvasElevated: string;
  readonly surface: string;
  readonly surfaceStrong: string;
  readonly surfaceInteractive: string;
  readonly border: string;
  readonly borderStrong: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textMuted: string;
  readonly focus: string;
  readonly selection: string;
  readonly selectionText: string;
  readonly disabled: string;
  readonly disabledText: string;
  readonly scrim: string;
}

export interface StatusColorPalette {
  readonly foreground: string;
  readonly background: string;
  readonly border: string;
  readonly glow: string;
}

export interface CertificationColorPalette {
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly surface: string;
  readonly text: string;
}

export interface QcqColorSystem {
  readonly version: '1.0.0';
  readonly scheme: QcqColorScheme;
  readonly semantic: SemanticColorPalette;
  readonly statuses: Readonly<Record<QcqStatusTone, StatusColorPalette>>;
  readonly certifications: Readonly<Record<string, CertificationColorPalette>>;
  readonly organizationPalette: readonly string[];
}

const colors = QCQ_PRIMITIVE_TOKENS.colors;

const DARK_SEMANTIC: SemanticColorPalette = Object.freeze({
  canvas: colors.void0,
  canvasElevated: colors.void1,
  surface: '#071329',
  surfaceStrong: '#0d203c',
  surfaceInteractive: '#102b4c',
  border: '#31506b',
  borderStrong: colors.platinum300,
  textPrimary: colors.platinum50,
  textSecondary: colors.platinum200,
  textMuted: colors.platinum400,
  focus: colors.cyan300,
  selection: colors.blue500,
  selectionText: colors.white,
  disabled: '#182638',
  disabledText: '#718397',
  scrim: 'rgb(0 4 14 / 78%)',
});

const LIGHT_SEMANTIC: SemanticColorPalette = Object.freeze({
  canvas: '#edf4f8',
  canvasElevated: colors.white,
  surface: '#f8fbfd',
  surfaceStrong: '#e2edf3',
  surfaceInteractive: '#d6e8f2',
  border: '#6c8492',
  borderStrong: '#314b59',
  textPrimary: '#08151d',
  textSecondary: '#203944',
  textMuted: '#526874',
  focus: '#00627b',
  selection: '#174d9a',
  selectionText: colors.white,
  disabled: '#d7e0e5',
  disabledText: '#667984',
  scrim: 'rgb(0 14 24 / 52%)',
});

const HIGH_CONTRAST_SEMANTIC: SemanticColorPalette = Object.freeze({
  canvas: colors.black,
  canvasElevated: colors.black,
  surface: colors.black,
  surfaceStrong: '#101010',
  surfaceInteractive: '#161616',
  border: colors.white,
  borderStrong: colors.white,
  textPrimary: colors.white,
  textSecondary: colors.white,
  textMuted: '#e6e6e6',
  focus: '#00ffff',
  selection: '#ffff00',
  selectionText: colors.black,
  disabled: '#202020',
  disabledText: '#bfbfbf',
  scrim: 'rgb(0 0 0 / 92%)',
});

const STATUS_PALETTES: Readonly<Record<QcqStatusTone, StatusColorPalette>> =
  Object.freeze({
    neutral: Object.freeze({
      foreground: colors.platinum100,
      background: '#122238',
      border: colors.platinum500,
      glow: colors.platinum300,
    }),
    information: Object.freeze({
      foreground: '#e8fbff',
      background: '#08334b',
      border: colors.cyan400,
      glow: colors.cyan300,
    }),
    success: Object.freeze({
      foreground: '#ebfff7',
      background: '#073b2b',
      border: colors.emerald400,
      glow: colors.emerald400,
    }),
    warning: Object.freeze({
      foreground: '#fff7e2',
      background: '#4b3008',
      border: colors.amber400,
      glow: colors.amber400,
    }),
    danger: Object.freeze({
      foreground: '#fff0f2',
      background: '#4b111b',
      border: colors.red400,
      glow: colors.red400,
    }),
  });

const CERTIFICATION_PALETTES: Readonly<
  Record<string, CertificationColorPalette>
> = Object.freeze({
  'aws-clf-c02': Object.freeze({
    primary: '#ff9900',
    secondary: '#232f3e',
    accent: '#ffd27a',
    surface: '#2f2313',
    text: '#fff7e9',
  }),
  'aws-saa-c03': Object.freeze({
    primary: '#44b9ff',
    secondary: '#1b365d',
    accent: '#8bd8ff',
    surface: '#0b2942',
    text: '#edfaff',
  }),
  'aws-dva-c02': Object.freeze({
    primary: '#8d74ff',
    secondary: '#2b235c',
    accent: '#c0b2ff',
    surface: '#211b48',
    text: '#f5f1ff',
  }),
  'aws-soa-c02': Object.freeze({
    primary: '#34d5a2',
    secondary: '#164638',
    accent: '#8af1d0',
    surface: '#0c3027',
    text: '#effff9',
  }),
  default: Object.freeze({
    primary: colors.cyan400,
    secondary: colors.violet500,
    accent: colors.platinum50,
    surface: colors.void2,
    text: colors.platinum50,
  }),
});

const ORGANIZATION_PALETTE = Object.freeze([
  '#35dcff',
  '#a77cff',
  '#3df2b2',
  '#ffc45e',
  '#ff6f78',
  '#548dff',
  '#ff8b32',
  '#7de2d1',
]);

function parseHexChannel(value: string): number {
  return Number.parseInt(value, 16) / 255;
}

function expandHex(value: string): string {
  const normalized = value.trim().replace(/^#/u, '');
  if (normalized.length === 3) {
    return normalized
      .split('')
      .map((character) => `${character}${character}`)
      .join('');
  }
  return normalized;
}

function linearize(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hexColor: string): number {
  const hex = expandHex(hexColor);
  if (!/^[0-9a-f]{6}$/iu.test(hex)) {
    throw new Error(`Expected a six-digit hexadecimal color, received ${hexColor}.`);
  }
  const red = linearize(parseHexChannel(hex.slice(0, 2)));
  const green = linearize(parseHexChannel(hex.slice(2, 4)));
  const blue = linearize(parseHexChannel(hex.slice(4, 6)));
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

export function contrastRatio(
  foreground: string,
  background: string,
): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

export function meetsContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA',
  largeText = false,
): boolean {
  const ratio = contrastRatio(foreground, background);
  const minimum = level === 'AAA'
    ? largeText ? 4.5 : 7
    : largeText ? 3 : 4.5;
  return ratio >= minimum;
}

export function resolveCertificationPalette(
  certificationId: string,
): CertificationColorPalette {
  return CERTIFICATION_PALETTES[certificationId] ??
    CERTIFICATION_PALETTES.default!;
}

export function resolveOrganizationColor(index: number): string {
  const normalized = Number.isFinite(index)
    ? Math.abs(Math.trunc(index))
    : 0;
  return ORGANIZATION_PALETTE[
    normalized % ORGANIZATION_PALETTE.length
  ] ?? ORGANIZATION_PALETTE[0]!;
}

export function createColorSystem(
  scheme: QcqColorScheme = 'dark',
): QcqColorSystem {
  const semantic = scheme === 'light'
    ? LIGHT_SEMANTIC
    : scheme === 'high-contrast'
      ? HIGH_CONTRAST_SEMANTIC
      : DARK_SEMANTIC;

  return Object.freeze({
    version: '1.0.0',
    scheme,
    semantic,
    statuses: STATUS_PALETTES,
    certifications: CERTIFICATION_PALETTES,
    organizationPalette: ORGANIZATION_PALETTE,
  });
}

export const QCQ_DARK_COLOR_SYSTEM = createColorSystem('dark');
export const QCQ_LIGHT_COLOR_SYSTEM = createColorSystem('light');
export const QCQ_HIGH_CONTRAST_COLOR_SYSTEM =
  createColorSystem('high-contrast');

export function createColorCssVariables(
  system: QcqColorSystem,
): CssVariableMap {
  const variables: Record<`--qcq-${string}`, string> = {
    '--qcq-canvas': system.semantic.canvas,
    '--qcq-canvas-elevated': system.semantic.canvasElevated,
    '--qcq-surface': system.semantic.surface,
    '--qcq-surface-strong': system.semantic.surfaceStrong,
    '--qcq-surface-interactive': system.semantic.surfaceInteractive,
    '--qcq-border': system.semantic.border,
    '--qcq-border-strong': system.semantic.borderStrong,
    '--qcq-text-primary': system.semantic.textPrimary,
    '--qcq-text-secondary': system.semantic.textSecondary,
    '--qcq-text-muted': system.semantic.textMuted,
    '--qcq-focus': system.semantic.focus,
    '--qcq-selection': system.semantic.selection,
    '--qcq-selection-text': system.semantic.selectionText,
    '--qcq-disabled': system.semantic.disabled,
    '--qcq-disabled-text': system.semantic.disabledText,
    '--qcq-scrim': system.semantic.scrim,
  };

  for (const [name, palette] of Object.entries(system.statuses)) {
    variables[`--qcq-status-${name}-foreground`] = palette.foreground;
    variables[`--qcq-status-${name}-background`] = palette.background;
    variables[`--qcq-status-${name}-border`] = palette.border;
    variables[`--qcq-status-${name}-glow`] = palette.glow;
  }

  return Object.freeze(variables);
}
