/** Owner Authority: QCQ-TBL-070. One-timer runtime controller. */
import type {QuizFinaleRequest,StormDecision,StormRuntimeCallbacks,StormScheduleInput} from './StormOrchestration.types';
import {StormOrchestrationEngine} from './StormOrchestrationEngine';

export interface StormRuntimeScheduler {
  readonly schedule:(task:()=>void,delayMs:number)=>(()=>void);
}
const browserScheduler:StormRuntimeScheduler={
  schedule(task,delayMs) {
    const timer=globalThis.setTimeout(task,delayMs);
    return ()=>globalThis.clearTimeout(timer);
  },
};

export class StormRuntimeController {
  private cancelTimer:(()=>void)|null=null;
  private active=false;
  private visible=true;
  private onscreen=true;
  private motion:StormScheduleInput['motion']='full';
  private quality:StormScheduleInput['quality']='balanced';

  public constructor(
    private readonly engine:StormOrchestrationEngine,
    private readonly callbacks:StormRuntimeCallbacks={},
    private readonly scheduler:StormRuntimeScheduler=browserScheduler,
    private readonly clock:()=>number=()=>Date.now(),
  ) {}

  public start():void { if (!this.active) { this.active=true;this.scheduleNext(); } }
  public stop():void { this.active=false;this.cancelScheduled(); }
  public dispose():void { this.stop(); }

  public setVisibility(visible:boolean,onscreen=this.onscreen):void {
    this.visible=visible;this.onscreen=onscreen;
    if (!visible||!onscreen) { this.cancelScheduled();return; }
    if (this.active) this.scheduleNext();
  }
  public setPresentation(motion:StormScheduleInput['motion'],quality:StormScheduleInput['quality']):void {
    this.motion=motion;this.quality=quality;
  }
  public startFinale(request:QuizFinaleRequest):void {
    this.engine.startFinale(request);
    if (this.active) this.scheduleNext();
  }
  public beginNextQuiz():void {
    const quizId=this.engine.getSnapshot().finale?.quizId??null;
    this.engine.stopFinale(this.clock());
    if (quizId!==null) this.callbacks.onFinaleEnded?.(quizId);
    if (this.active) this.scheduleNext();
  }

  private scheduleNext():void {
    this.cancelScheduled();
    if (!this.active||!this.visible||!this.onscreen) return;
    const decision=this.engine.nextDecision({
      now:this.clock(),visible:this.visible,onscreen:this.onscreen,motion:this.motion,quality:this.quality,
    });
    if (decision===null) return;
    this.cancelTimer=this.scheduler.schedule(()=>{
      this.cancelTimer=null;
      this.emit(decision);
      this.scheduleNext();
    },decision.delayMs);
  }
  private emit(decision:StormDecision):void { this.callbacks.onDecision?.(decision); }
  private cancelScheduled():void { this.cancelTimer?.();this.cancelTimer=null; }
}
