import {describe,expect,it} from 'vitest';

import {
  createLightningStrikeFromElectricalEvent,
} from '../LightningExternalGeometry';
import type {
  StormElectricalEvent,
} from '../StormOrchestration.types';

function event(
  overrides:Partial<StormElectricalEvent>={},
):StormElectricalEvent {
  return {
    id:'visual-event-1',
    sequence:1,
    scheduledAt:5000,
    cloudSystem:'primary',
    targetCloud:null,
    discharge:'major-strike',
    depth:'foreground',
    intensity:0.9,
    originX:0.50,
    terminalX:0.53,
    branchBudget:6,
    wholeSystemIllumination:false,
    finaleAct:null,
    ...overrides,
  };
}

describe('QCQ externally orchestrated lightning geometry',()=>{
  it('does not draw a bolt for a pure in-cloud flicker',()=>{
    expect(
      createLightningStrikeFromElectricalEvent(
        event({
          discharge:'in-cloud-flicker',
          branchBudget:0,
        }),
        'cinematic',
        0.34,
      ),
    ).toBeNull();
  });

  it('creates a major strike from the authoritative cloud-origin geometry',()=>{
    const strike=createLightningStrikeFromElectricalEvent(
      event(),
      'cinematic',
      0.34,
    );
    expect(strike).not.toBeNull();
    expect(strike?.id).toBe('visual-event-1');
    expect(strike?.originX).toBeCloseTo(500,4);
    expect(strike?.main.d.startsWith('M ')).toBe(true);
  });

  it('creates a cloud-to-cloud path toward the authoritative target coordinate',()=>{
    const strike=createLightningStrikeFromElectricalEvent(
      event({
        id:'cross-cloud',
        cloudSystem:'rear-left',
        targetCloud:'rear-right',
        discharge:'cloud-to-cloud',
        depth:'background',
        originX:0.27,
        terminalX:0.73,
        branchBudget:4,
      }),
      'balanced',
      0.34,
    );
    expect(strike).not.toBeNull();
    expect(strike?.originX).toBeCloseTo(270,4);
    expect(strike?.terminalX).toBeGreaterThan(600);
  });
});
