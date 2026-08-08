import {describe,expect,it} from 'vitest';
import {StormOrchestrationEngine} from '../StormOrchestrationEngine';

function collect(seed:string,count:number){
  const engine=new StormOrchestrationEngine(seed,0);let now=0;
  return Array.from({length:count},()=>{
    const decision=engine.nextDecision({now,visible:true,onscreen:true,motion:'full',quality:'cinematic'});
    if(decision===null) throw new Error('Expected decision.');
    now=decision.event.scheduledAt;return decision;
  });
}
describe('storm orchestration engine',()=>{
  it('is deterministic for identical seeds',()=>expect(collect('d',50)).toEqual(collect('d',50)));
  it('allows all three clouds across a seeded run',()=>{
    expect(new Set(collect('clouds',180).map((d)=>d.event.cloudSystem)))
      .toEqual(new Set(['primary','rear-left','rear-right']));
  });
  it('enforces the six-second major-strike hard cooldown',()=>{
    const majors=collect('major',300).filter((d)=>d.event.discharge==='major-strike');
    for(let i=1;i<majors.length;i+=1){
      expect(majors[i]!.event.scheduledAt-majors[i-1]!.event.scheduledAt).toBeGreaterThanOrEqual(6_000);
    }
  });
  it('prevents four identical discharge classes in succession',()=>{
    const items=collect('repeat',240);
    for(let i=3;i<items.length;i+=1){
      expect(new Set(items.slice(i-3,i+1).map((d)=>d.event.discharge)).size).toBeGreaterThan(1);
    }
  });
});
