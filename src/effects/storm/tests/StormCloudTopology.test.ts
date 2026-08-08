import {describe,expect,it} from 'vitest';
import {STORM_CLOUD_TOPOLOGY} from '../StormCloudTopology';
describe('three-cloud topology',()=>{
  it('contains exactly primary rear-left rear-right',()=>{
    expect(STORM_CLOUD_TOPOLOGY.map((cloud)=>cloud.id)).toEqual(['primary','rear-left','rear-right']);
  });
  it('preserves 56/22/22 source weights',()=>{
    expect(STORM_CLOUD_TOPOLOGY.map((cloud)=>cloud.sourceWeight)).toEqual([0.56,0.22,0.22]);
    expect(STORM_CLOUD_TOPOLOGY.reduce((sum,cloud)=>sum+cloud.sourceWeight,0)).toBeCloseTo(1,10);
  });
  it('places rear clouds on opposite acoustic sides',()=>{
    expect(STORM_CLOUD_TOPOLOGY[1]!.stereoPan).toBeLessThan(0);
    expect(STORM_CLOUD_TOPOLOGY[2]!.stereoPan).toBeGreaterThan(0);
  });
});
