/**
 * Owner Authority: QCQ-TBL-030 StormLayer
 * Purpose: MASTER-reference calibration for the native three-cloud reconstruction.
 *
 * The original artwork remains a visual specification only. No runtime raster
 * dependency is introduced by this contract.
 */
import type {StormCloudId} from './StormOrchestration.types';

export interface MasterStormCloudVisualProfile {
  readonly id: StormCloudId;
  readonly centerX: number;
  readonly centerY: number;
  readonly width: number;
  readonly height: number;
  readonly depthScale: number;
  readonly atmosphericBlurPx: number;
  readonly baseOpacity: number;
}

export const MASTER_STORM_CLOUD_VISUALS:
  Readonly<Record<StormCloudId, MasterStormCloudVisualProfile>> =
  Object.freeze({
    primary: Object.freeze({
      id: 'primary',
      centerX: 0.50,
      centerY: 0.27,
      width: 0.66,
      height: 0.44,
      depthScale: 1,
      atmosphericBlurPx: 7,
      baseOpacity: 0.92,
    }),
    'rear-left': Object.freeze({
      id: 'rear-left',
      centerX: 0.27,
      centerY: 0.23,
      width: 0.50,
      height: 0.36,
      depthScale: 0.86,
      atmosphericBlurPx: 15,
      baseOpacity: 0.72,
    }),
    'rear-right': Object.freeze({
      id: 'rear-right',
      centerX: 0.73,
      centerY: 0.23,
      width: 0.50,
      height: 0.36,
      depthScale: 0.86,
      atmosphericBlurPx: 15,
      baseOpacity: 0.72,
    }),
  });

export const MASTER_STORM_VISUAL_INVARIANTS = Object.freeze({
  cloudCount: 3,
  primaryDominant: true,
  rearCloudsBroadenHorizon: true,
  runtimeMasterRasterAllowed: false,
  bakedDynamicMetricsAllowed: false,
  genericOverlayPanelsAllowed: false,
});
