import {describe,expect,it} from 'vitest';
import {createStormAcousticPlan} from '../StormAcousticPlan';
import type {StormElectricalEvent} from '../../../effects/storm/StormOrchestration.types';

const make=(overrides:Partial<StormElectricalEvent>={}):StormElectricalEvent=>({
  id:'e1',sequence:1,scheduledAt:10_000,cloudSystem:'primary',targetCloud:null,discharge:'major-strike',
  depth:'foreground',intensity:0.9,originX:0.5,terminalX:0.5,branchBudget:7,
  wholeSystemIllumination:false,finaleAct:null,...overrides,
});
describe('storm acoustic plan',()=>{
  it('keeps associated major thunder after lightning',()=>{
    const thunder=createStormAcousticPlan(make()).cues.filter((cue)=>cue.semantic.startsWith('thunder'));
    expect(thunder.length).toBeGreaterThan(0);
    expect(thunder.filter((cue)=>cue.semantic==='thunderClose'||cue.semantic==='thunderDistant')
      .every((cue)=>cue.delayMs>=1_000)).toBe(true);
  });
  it('does not force a clap for baby in-cloud flicker',()=>{
    const semantics=createStormAcousticPlan(make({id:'baby',cloudSystem:'rear-left',
      discharge:'in-cloud-flicker',depth:'background',intensity:0.35})).cues.map((cue)=>cue.semantic);
    expect(semantics).not.toContain('thunderClose');expect(semantics).not.toContain('thunderDistant');
  });
  it('builds major thunder into roll and left/right echoes',()=>{
    const semantics=new Set(createStormAcousticPlan(make()).cues.map((cue)=>cue.semantic));
    expect(semantics.has('lightningCrack')).toBe(true);expect(semantics.has('thunderRoll')).toBe(true);
    expect(semantics.has('thunderEchoRearLeft')).toBe(true);expect(semantics.has('thunderEchoRearRight')).toBe(true);
  });
});
