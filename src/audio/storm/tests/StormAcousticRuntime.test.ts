import {describe,expect,it,vi} from 'vitest';
import {StormAcousticRuntime,type StormAcousticScheduler} from '../StormAcousticRuntime';
describe('storm acoustic runtime',()=>{
  it('cancels all pending echo/roll cues during disposal',()=>{
    const cancels:ReturnType<typeof vi.fn>[]=[];
    const scheduler:StormAcousticScheduler={schedule(){const cancel=vi.fn();cancels.push(cancel);return cancel;}};
    const runtime=new StormAcousticRuntime({play(){return undefined;}},scheduler);
    runtime.schedulePlan({eventId:'e',cues:[
      {semantic:'thunderRoll',delayMs:500,gain:0.5,pan:0,causalEventId:'e'},
      {semantic:'thunderDecay',delayMs:900,gain:0.3,pan:0,causalEventId:'e'},
    ]});
    runtime.dispose();expect(cancels).toHaveLength(2);
    expect(cancels.every((cancel)=>cancel.mock.calls.length===1)).toBe(true);
  });
});
