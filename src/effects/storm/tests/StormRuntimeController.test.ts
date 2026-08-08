import {describe,expect,it,vi} from 'vitest';
import {StormOrchestrationEngine} from '../StormOrchestrationEngine';
import {StormRuntimeController,type StormRuntimeScheduler} from '../StormRuntimeController';

describe('storm runtime controller',()=>{
  it('cancels its one pending timer when hidden',()=>{
    const cancels:ReturnType<typeof vi.fn>[]=[];
    const scheduler:StormRuntimeScheduler={schedule(){const cancel=vi.fn();cancels.push(cancel);return cancel;}};
    const c=new StormRuntimeController(new StormOrchestrationEngine('r'),{},scheduler,()=>1_000);
    c.start();expect(cancels).toHaveLength(1);c.setVisibility(false);expect(cancels[0]).toHaveBeenCalledTimes(1);
  });
  it('ends the score finale when the next quiz begins',()=>{
    const e=new StormOrchestrationEngine('f');
    e.startFinale({quizId:'quiz-a',scorePercent:93,completedAt:1_000});
    const c=new StormRuntimeController(e,{}, {schedule(){return ()=>undefined;}},()=>2_000);
    c.beginNextQuiz();
    expect(e.getSnapshot().mode).toBe('gameplay');expect(e.getSnapshot().finale).toBeNull();
  });
});
