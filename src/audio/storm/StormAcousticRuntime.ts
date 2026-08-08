/** Owner Authority: QCQ-AUD-017. Cancellable semantic cue scheduler. */
import type {StormAcousticPlan,StormAcousticCue} from './StormAcousticPlan';
import type {StormAudioSemantic} from './StormAudioSemantics';

export interface StormSemanticAudioSink {
  readonly play:(semantic:StormAudioSemantic,cue:StormAcousticCue)=>void|Promise<void>;
}
export interface StormAcousticScheduler {
  readonly schedule:(task:()=>void,delayMs:number)=>(()=>void);
}
const browserScheduler:StormAcousticScheduler={
  schedule(task,delayMs){const timer=globalThis.setTimeout(task,delayMs);return ()=>globalThis.clearTimeout(timer);},
};

export class StormAcousticRuntime {
  private readonly pending=new Set<()=>void>();
  public constructor(
    private readonly sink:StormSemanticAudioSink,
    private readonly scheduler:StormAcousticScheduler=browserScheduler,
  ) {}
  public schedulePlan(plan:StormAcousticPlan):void {
    for(const cue of plan.cues){
      let cancel:()=>void=()=>undefined;
      cancel=this.scheduler.schedule(()=>{
        this.pending.delete(cancel);
        void this.sink.play(cue.semantic,cue);
      },cue.delayMs);
      this.pending.add(cancel);
    }
  }
  public cancelPending():void { for(const cancel of this.pending) cancel();this.pending.clear(); }
  public dispose():void { this.cancelPending(); }
}
