/**
 * Artifact ID: QCQ-THM-003
 * Artifact Name: SpacingSystem
 * Repository Path: QCQ/frontend/src/styles/SpacingSystem.ts
 */

import {
  createFluidValue,
  type CssVariableMap,
  type QcqDensity,
  type QcqResolutionProfile,
} from './DesignTokens';

export type SpacingStep =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '8'
  | '10'
  | '12'
  | '16'
  | '20'
  | '24';

export interface LayoutRhythm {
  readonly viewportGutter: string;
  readonly zoneGap: string;
  readonly panelGap: string;
  readonly panelPadding: string;
  readonly controlGap: string;
  readonly controlPaddingInline: string;
  readonly controlPaddingBlock: string;
  readonly minimumTouchTarget: string;
  readonly gridColumnMinimum: string;
}

export interface SpacingSystem {
  readonly version: '1.0.0';
  readonly density: QcqDensity;
  readonly profile: QcqResolutionProfile;
  readonly scale: Readonly<Record<SpacingStep, string>>;
  readonly layout: LayoutRhythm;
}

const DENSITY_MULTIPLIER: Readonly<Record<QcqDensity, number>> =
  Object.freeze({
    compact: 0.82,
    comfortable: 1,
    cinematic: 1.2,
  });

const PROFILE_MULTIPLIER: Readonly<Record<QcqResolutionProfile, number>> =
  Object.freeze({
    compact: 0.88,
    hd: 1,
    qhd: 1.08,
    '4k': 1.18,
    '8k': 1.3,
  });

const SPACING_STEPS: readonly SpacingStep[] = Object.freeze([
  '0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16', '20', '24',
]);

function createScale(
  density: QcqDensity,
  profile: QcqResolutionProfile,
): Readonly<Record<SpacingStep, string>> {
  const multiplier = DENSITY_MULTIPLIER[density] *
    PROFILE_MULTIPLIER[profile];

  const result = {} as Record<SpacingStep, string>;
  for (const step of SPACING_STEPS) {
    const numeric = Number(step);
    if (numeric === 0) {
      result[step] = '0';
      continue;
    }
    const minimum = Math.max(2, numeric * 2.5 * multiplier);
    const preferred = numeric * 0.18 * multiplier;
    const maximum = numeric * 5.5 * multiplier;
    result[step] = createFluidValue(minimum, preferred, maximum);
  }
  return Object.freeze(result);
}

export function createSpacingSystem(
  density: QcqDensity = 'comfortable',
  profile: QcqResolutionProfile = 'hd',
): SpacingSystem {
  const scale = createScale(density, profile);
  return Object.freeze({
    version: '1.0.0',
    density,
    profile,
    scale,
    layout: Object.freeze({
      viewportGutter: scale['6'],
      zoneGap: scale['5'],
      panelGap: scale['4'],
      panelPadding: scale['5'],
      controlGap: scale['3'],
      controlPaddingInline: scale['5'],
      controlPaddingBlock: scale['3'],
      minimumTouchTarget: 'max(44px, 2.75rem)',
      gridColumnMinimum: 'min(100%, 18rem)',
    }),
  });
}

export const QCQ_SPACING_SYSTEM =
  createSpacingSystem('comfortable', 'hd');

export function createSpacingCssVariables(
  system: SpacingSystem,
): CssVariableMap {
  const variables: Record<`--qcq-${string}`, string> = {};
  for (const [step, value] of Object.entries(system.scale)) {
    variables[`--qcq-space-${step}`] = value;
  }

  variables['--qcq-layout-viewport-gutter'] =
    system.layout.viewportGutter;
  variables['--qcq-layout-zone-gap'] = system.layout.zoneGap;
  variables['--qcq-layout-panel-gap'] = system.layout.panelGap;
  variables['--qcq-layout-panel-padding'] = system.layout.panelPadding;
  variables['--qcq-layout-control-gap'] = system.layout.controlGap;
  variables['--qcq-layout-control-padding-inline'] =
    system.layout.controlPaddingInline;
  variables['--qcq-layout-control-padding-block'] =
    system.layout.controlPaddingBlock;
  variables['--qcq-layout-minimum-touch-target'] =
    system.layout.minimumTouchTarget;
  variables['--qcq-layout-grid-column-minimum'] =
    system.layout.gridColumnMinimum;

  return Object.freeze(variables);
}
