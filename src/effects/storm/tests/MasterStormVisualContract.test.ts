import {describe,expect,it} from 'vitest';

import {
  MASTER_STORM_CLOUD_VISUALS,
  MASTER_STORM_VISUAL_INVARIANTS,
} from '../MasterStormVisualContract';

describe('QCQ MASTER storm visual contract',()=>{
  it('keeps one dominant foreground cloud and two horizon-broadening rear clouds',()=>{
    expect(MASTER_STORM_VISUAL_INVARIANTS.cloudCount).toBe(3);
    expect(MASTER_STORM_VISUAL_INVARIANTS.primaryDominant).toBe(true);
    expect(MASTER_STORM_VISUAL_INVARIANTS.rearCloudsBroadenHorizon).toBe(true);
    expect(MASTER_STORM_CLOUD_VISUALS.primary.width)
      .toBeGreaterThan(MASTER_STORM_CLOUD_VISUALS['rear-left'].width);
    expect(MASTER_STORM_CLOUD_VISUALS.primary.depthScale)
      .toBeGreaterThan(MASTER_STORM_CLOUD_VISUALS['rear-left'].depthScale);
  });

  it('permanently prohibits runtime MASTER raster and baked dynamic metrics',()=>{
    expect(MASTER_STORM_VISUAL_INVARIANTS.runtimeMasterRasterAllowed).toBe(false);
    expect(MASTER_STORM_VISUAL_INVARIANTS.bakedDynamicMetricsAllowed).toBe(false);
    expect(MASTER_STORM_VISUAL_INVARIANTS.genericOverlayPanelsAllowed).toBe(false);
  });
});
