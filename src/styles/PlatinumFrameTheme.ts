/**
 * Artifact ID: QCQ-TBL-037
 * Artifact Name: PlatinumFrameTheme
 * Repository Path: QCQ/frontend/src/styles/PlatinumFrameTheme.ts
 */

import {
  QCQ_PRIMITIVE_TOKENS,
  mergeCssVariableMaps,
  type CssVariableMap,
  type QcqVisualQuality,
} from './DesignTokens';
import {
  createColorCssVariables,
  createColorSystem,
  type QcqColorScheme,
} from './ColorSystem';
import {
  createElevationCssVariables,
  createElevationSystem,
} from './ElevationSystem';

export type FrameMaterial =
  | 'platinum'
  | 'oxidized-platinum'
  | 'titanium'
  | 'obsidian';

export interface MetallicStop {
  readonly offset: number;
  readonly color: string;
  readonly opacity: number;
}

export interface FrameDepthProfile {
  readonly bevelWidth: string;
  readonly insetDepth: string;
  readonly ridgeDepth: string;
  readonly edgeHighlight: string;
  readonly innerShadow: string;
  readonly outerShadow: string;
}

export interface PlatinumFrameTheme {
  readonly version: '1.0.0';
  readonly id: string;
  readonly displayName: string;
  readonly scheme: QcqColorScheme;
  readonly quality: QcqVisualQuality;
  readonly material: FrameMaterial;
  readonly materialStops: readonly MetallicStop[];
  readonly surfaceGradient: string;
  readonly oxidizedGradient: string;
  readonly highlightGradient: string;
  readonly edgeGradient: string;
  readonly nodeGradient: string;
  readonly depth: FrameDepthProfile;
  readonly nodeColors: {
    readonly idle: string;
    readonly active: string;
    readonly warning: string;
    readonly critical: string;
  };
  readonly edgeColors: {
    readonly cold: string;
    readonly hot: string;
    readonly neutral: string;
  };
  readonly cssVariables: CssVariableMap;
}

export interface PlatinumFrameThemeOptions {
  readonly id?: string;
  readonly displayName?: string;
  readonly scheme?: QcqColorScheme;
  readonly quality?: QcqVisualQuality;
  readonly material?: FrameMaterial;
}

const MATERIAL_STOPS: Readonly<Record<FrameMaterial, readonly MetallicStop[]>> =
  Object.freeze({
    platinum: Object.freeze([
      Object.freeze({ offset: 0, color: '#243746', opacity: 1 }),
      Object.freeze({ offset: 0.12, color: '#e8f5fb', opacity: 1 }),
      Object.freeze({ offset: 0.28, color: '#6f8999', opacity: 1 }),
      Object.freeze({ offset: 0.48, color: '#f7fcff', opacity: 1 }),
      Object.freeze({ offset: 0.68, color: '#829eae', opacity: 1 }),
      Object.freeze({ offset: 0.86, color: '#d7e9f1', opacity: 1 }),
      Object.freeze({ offset: 1, color: '#1c2b37', opacity: 1 }),
    ]),
    'oxidized-platinum': Object.freeze([
      Object.freeze({ offset: 0, color: '#14242c', opacity: 1 }),
      Object.freeze({ offset: 0.16, color: '#7d9b9c', opacity: 1 }),
      Object.freeze({ offset: 0.34, color: '#315d62', opacity: 1 }),
      Object.freeze({ offset: 0.52, color: '#d8e7e5', opacity: 1 }),
      Object.freeze({ offset: 0.72, color: '#426c70', opacity: 1 }),
      Object.freeze({ offset: 0.88, color: '#a8bdbb', opacity: 1 }),
      Object.freeze({ offset: 1, color: '#102028', opacity: 1 }),
    ]),
    titanium: Object.freeze([
      Object.freeze({ offset: 0, color: '#18242f', opacity: 1 }),
      Object.freeze({ offset: 0.18, color: '#b9c8d4', opacity: 1 }),
      Object.freeze({ offset: 0.38, color: '#506474', opacity: 1 }),
      Object.freeze({ offset: 0.58, color: '#eef5f8', opacity: 1 }),
      Object.freeze({ offset: 0.78, color: '#718795', opacity: 1 }),
      Object.freeze({ offset: 1, color: '#16232e', opacity: 1 }),
    ]),
    obsidian: Object.freeze([
      Object.freeze({ offset: 0, color: '#010208', opacity: 1 }),
      Object.freeze({ offset: 0.22, color: '#1a2637', opacity: 1 }),
      Object.freeze({ offset: 0.44, color: '#050912', opacity: 1 }),
      Object.freeze({ offset: 0.64, color: '#263b55', opacity: 1 }),
      Object.freeze({ offset: 0.82, color: '#080d18', opacity: 1 }),
      Object.freeze({ offset: 1, color: '#000105', opacity: 1 }),
    ]),
  });

function stopToCss(stop: MetallicStop): string {
  const percent = Math.round(stop.offset * 10000) / 100;
  return `color-mix(in srgb, ${stop.color} ${Math.round(stop.opacity * 100)}%, transparent) ${percent}%`;
}

function gradientFromStops(
  stops: readonly MetallicStop[],
  angle = 128,
): string {
  return `linear-gradient(${angle}deg, ${stops.map(stopToCss).join(', ')})`;
}

function createDepth(
  quality: QcqVisualQuality,
): FrameDepthProfile {
  const factor = quality === 'cinematic'
    ? 1
    : quality === 'balanced'
      ? 0.82
      : 0.58;
  return Object.freeze({
    bevelWidth: `clamp(3px, ${0.24 * factor}vw, ${Math.round(14 * factor)}px)`,
    insetDepth: `clamp(2px, ${0.14 * factor}vw, ${Math.round(9 * factor)}px)`,
    ridgeDepth: `clamp(1px, ${0.08 * factor}vw, ${Math.round(5 * factor)}px)`,
    edgeHighlight: `0 0 ${Math.round(10 + 20 * factor)}px rgb(118 239 255 / ${0.2 + factor * 0.22})`,
    innerShadow: `inset 0 0 ${Math.round(18 + 32 * factor)}px rgb(0 3 12 / ${0.62 + factor * 0.18})`,
    outerShadow: `0 ${Math.round(8 + 20 * factor)}px ${Math.round(30 + 54 * factor)}px rgb(0 2 12 / ${0.48 + factor * 0.2})`,
  });
}

export function createPlatinumFrameTheme(
  options: PlatinumFrameThemeOptions = {},
): PlatinumFrameTheme {
  const scheme = options.scheme ?? 'dark';
  const quality = options.quality ?? 'balanced';
  const material = options.material ?? 'platinum';
  const colors = createColorSystem(scheme);
  const elevation = createElevationSystem(quality);
  const materialStops = MATERIAL_STOPS[material];
  const depth = createDepth(quality);
  const surfaceGradient = gradientFromStops(materialStops);
  const oxidizedGradient = [
    'radial-gradient(circle at 20% 30%, rgb(64 151 153 / 15%), transparent 36%)',
    'radial-gradient(circle at 78% 62%, rgb(52 95 106 / 18%), transparent 42%)',
    surfaceGradient,
  ].join(', ');
  const highlightGradient =
    'linear-gradient(118deg, transparent 0 18%, rgb(255 255 255 / 42%) 27%, rgb(176 232 255 / 16%) 35%, transparent 48% 100%)';
  const edgeGradient = [
    `linear-gradient(90deg, ${colors.semantic.borderStrong}, ${QCQ_PRIMITIVE_TOKENS.colors.cyan400}, ${colors.semantic.borderStrong})`,
    `linear-gradient(180deg, rgb(255 255 255 / 18%), transparent 34%, rgb(0 0 0 / 48%))`,
  ].join(', ');
  const nodeGradient = [
    'radial-gradient(circle at 40% 32%, #ffffff 0 5%, #76efff 12%, #2e65df 42%, #071227 72%)',
    'conic-gradient(from 45deg, #35dcff, #a77cff, #35dcff)',
  ].join(', ');

  const variables = mergeCssVariableMaps(
    createColorCssVariables(colors),
    createElevationCssVariables(elevation),
    Object.freeze({
      '--qcq-frame-material': surfaceGradient,
      '--qcq-frame-material-oxidized': oxidizedGradient,
      '--qcq-frame-highlight': highlightGradient,
      '--qcq-frame-edge-gradient': edgeGradient,
      '--qcq-frame-node-gradient': nodeGradient,
      '--qcq-frame-bevel-width': depth.bevelWidth,
      '--qcq-frame-inset-depth': depth.insetDepth,
      '--qcq-frame-ridge-depth': depth.ridgeDepth,
      '--qcq-frame-edge-highlight': depth.edgeHighlight,
      '--qcq-frame-inner-shadow': depth.innerShadow,
      '--qcq-frame-outer-shadow': depth.outerShadow,
      '--qcq-frame-node-idle': '#315d7a',
      '--qcq-frame-node-active': '#76efff',
      '--qcq-frame-node-warning': '#ffc45e',
      '--qcq-frame-node-critical': '#ff6f78',
      '--qcq-frame-edge-cold': '#35dcff',
      '--qcq-frame-edge-hot': '#ff8b32',
      '--qcq-frame-edge-neutral': '#afc8d5',
    }),
  );

  return Object.freeze({
    version: '1.0.0',
    id: options.id ?? 'qcq-platinum-command-dark',
    displayName: options.displayName ?? 'QCQ Platinum Command',
    scheme,
    quality,
    material,
    materialStops,
    surfaceGradient,
    oxidizedGradient,
    highlightGradient,
    edgeGradient,
    nodeGradient,
    depth,
    nodeColors: Object.freeze({
      idle: '#315d7a',
      active: '#76efff',
      warning: '#ffc45e',
      critical: '#ff6f78',
    }),
    edgeColors: Object.freeze({
      cold: '#35dcff',
      hot: '#ff8b32',
      neutral: '#afc8d5',
    }),
    cssVariables: variables,
  });
}

export const PLATINUM_FRAME_THEME = createPlatinumFrameTheme();
