/**
 * Owner Authorities: QCQ-TBL-069 / 070 / 071.
 * Seeded bounded stochastic decision engine. No rendering, audio file paths or score calculation.
 */
import {cloudHistoryMultiplier,eventHistoryMultiplier} from './StormAntiRepetitionPolicy';
import {getStormCloud,otherStormClouds,STORM_CLOUD_TOPOLOGY} from './StormCloudTopology';
import {DEFAULT_STORM_ORCHESTRATION_POLICY,type StormOrchestrationPolicy} from './StormOrchestrationPolicy';
import {finaleEventIntervalMs,resolveFinaleAct,resolveQuizFinaleProfile} from './StormFinalePolicy';
import {clampUnit,createStormRandom,randomBetween,randomInteger,weightedChoice,type StormRandomSource} from './StormRandom';
import {
  STORM_DISCHARGE_TYPES,type FinaleAct,type QuizFinaleRequest,type StormClusterPlan,type StormDecision,
  type StormDischargeType,type StormHistoryEntry,type StormPhase,type StormScheduleInput,type StormSnapshot,
} from './StormOrchestration.types';

const NEXT_PHASE:Readonly<Record<StormPhase,readonly {value:StormPhase;weight:number}[]>>={
  ambient:[{value:'ambient',weight:0.26},{value:'building',weight:0.74}],
  building:[{value:'ambient',weight:0.14},{value:'building',weight:0.20},{value:'charged',weight:0.66}],
  charged:[{value:'recovery',weight:1}],
  recovery:[{value:'ambient',weight:0.78},{value:'building',weight:0.22}],
};

function intensityRange(discharge:StormDischargeType):readonly [number,number] {
  switch (discharge) {
    case 'in-cloud-flicker': return [0.22,0.52];
    case 'in-cloud-discharge': return [0.44,0.72];
    case 'cloud-to-cloud': return [0.52,0.82];
    case 'major-strike': return [0.72,1];
  }
}
function branches(discharge:StormDischargeType,intensity:number):number {
  if (discharge==='in-cloud-flicker') return 0;
  const ceiling=discharge==='major-strike'?8:discharge==='cloud-to-cloud'?5:3;
  return Math.max(1,Math.round(ceiling*clampUnit(intensity)));
}

export class StormOrchestrationEngine {
  private readonly random:StormRandomSource;
  private readonly policy:StormOrchestrationPolicy;
  private mode:'gameplay'|'finale'='gameplay';
  private phase:StormPhase='ambient';
  private phaseStartedAt:number;
  private phaseEndsAt:number;
  private sequence=0;
  private recentEvents:StormHistoryEntry[]=[];
  private lastMajorStrikeAt:number|null=null;
  private lastClusterAt:number|null=null;
  private finale:ReturnType<typeof resolveQuizFinaleProfile>|null=null;
  private grandFinaleUsed=false;
  private finaleCloudsSeen=new Set<(typeof STORM_CLOUD_TOPOLOGY)[number]['id']>();

  public constructor(
    seed:string,startedAt=0,policy:StormOrchestrationPolicy=DEFAULT_STORM_ORCHESTRATION_POLICY,
  ) {
    this.random=createStormRandom(seed);
    this.policy=policy;
    this.phaseStartedAt=startedAt;
    this.phaseEndsAt=startedAt+this.randomPhaseDuration('ambient');
  }

  public getSnapshot():StormSnapshot {
    return Object.freeze({
      mode:this.mode,phase:this.phase,phaseStartedAt:this.phaseStartedAt,phaseEndsAt:this.phaseEndsAt,
      sequence:this.sequence,finale:this.finale,recentEvents:Object.freeze([...this.recentEvents]),
      lastMajorStrikeAt:this.lastMajorStrikeAt,lastClusterAt:this.lastClusterAt,
    });
  }

  public beginGameplay(now:number):void {
    this.mode='gameplay';this.finale=null;this.grandFinaleUsed=false;this.finaleCloudsSeen.clear();this.phase='ambient';
    this.phaseStartedAt=now;this.phaseEndsAt=now+this.randomPhaseDuration('ambient');
  }
  public startFinale(request:QuizFinaleRequest):void {
    this.mode='finale';this.finale=resolveQuizFinaleProfile(request);this.grandFinaleUsed=false;this.finaleCloudsSeen.clear();
  }
  public stopFinale(now:number):void { this.beginGameplay(now); }
  public isFinaleExpired(now:number):boolean {
    return this.mode==='finale'&&this.finale!==null&&now>=this.finale.endsAt;
  }

  public nextDecision(input:StormScheduleInput):StormDecision|null {
    if (!input.visible||!input.onscreen||input.quality==='off') return null;
    if (this.isFinaleExpired(input.now)) this.stopFinale(input.now);
    if (this.mode==='gameplay') this.advancePhase(input.now);

    const finaleAct:FinaleAct|null=
      this.mode==='finale'&&this.finale!==null?resolveFinaleAct(input.now,this.finale):null;
    const interval=this.mode==='finale'&&this.finale!==null
      ?finaleEventIntervalMs(this.finale):this.policy.phase[this.phase].eventIntervalMs;

    let delayMs=Math.round(randomBetween(this.random,interval.min,interval.max));
    const quiet=this.shouldApplyQuietPeriod(finaleAct);
    if (quiet) delayMs+=Math.round(randomBetween(this.random,this.policy.quietPeriodMs.min,this.policy.quietPeriodMs.max));
    const scheduledAt=input.now+delayMs;

    const cloud=this.selectCloud(finaleAct);
    const discharge=this.selectDischarge(cloud.id,scheduledAt,finaleAct);
    const targetCloud=discharge==='cloud-to-cloud'
      ?weightedChoice(this.random,otherStormClouds(cloud.id).map((id)=>({value:id,weight:getStormCloud(id).sourceWeight})))
      :null;

    const [minIntensity,maxIntensity]=intensityRange(discharge);
    const modeIntensity=this.mode==='finale'&&this.finale!==null?this.finale.lightningIntensity:1;
    const intensity=clampUnit(randomBetween(this.random,minIntensity,maxIntensity)*modeIntensity);

    this.sequence+=1;
    const spread=cloud.width*0.34;
    const originX=clampUnit(cloud.centerX+randomBetween(this.random,-spread,spread));
    const terminalX=targetCloud===null
      ?clampUnit(originX+randomBetween(this.random,-0.18,0.18))
      :getStormCloud(targetCloud).centerX;

    const event=Object.freeze({
      id:`storm-${this.sequence}-${scheduledAt}`,sequence:this.sequence,scheduledAt,
      cloudSystem:cloud.id,targetCloud,discharge,depth:cloud.depth,intensity,originX,terminalX,
      branchBudget:branches(discharge,intensity),
      wholeSystemIllumination:this.resolveWholeSystemIllumination(discharge),
      finaleAct,
    });

    this.recordEvent(event);
    const cluster=this.resolveCluster(event.scheduledAt,discharge,input.motion);
    return Object.freeze({mode:this.mode,phase:this.phase,delayMs,event,cluster,quietPeriodApplied:quiet});
  }

  private randomPhaseDuration(phase:StormPhase):number {
    const range=this.policy.phase[phase].durationMs;
    return Math.round(randomBetween(this.random,range.min,range.max));
  }
  private advancePhase(now:number):void {
    while (now>=this.phaseEndsAt) {
      this.phase=weightedChoice(this.random,NEXT_PHASE[this.phase]);
      this.phaseStartedAt=this.phaseEndsAt;
      this.phaseEndsAt=this.phaseStartedAt+this.randomPhaseDuration(this.phase);
    }
  }
  private selectCloud(finaleAct:FinaleAct|null) {
    const unseen=STORM_CLOUD_TOPOLOGY.filter((cloud)=>!this.finaleCloudsSeen.has(cloud.id));
    if (this.mode==='finale'&&finaleAct==='resolution'&&unseen.length>0) {
      return getStormCloud(weightedChoice(this.random,unseen.map((cloud)=>({
        value:cloud.id,weight:cloud.sourceWeight,
      }))));
    }
    const id=weightedChoice(this.random,STORM_CLOUD_TOPOLOGY.map((cloud)=>{
      const participationBoost=this.mode==='finale'&&finaleAct==='crescendo'&&!this.finaleCloudsSeen.has(cloud.id)?2.4:1;
      return {
        value:cloud.id,
        weight:cloud.sourceWeight*cloudHistoryMultiplier(cloud.id,this.recentEvents,this.policy)*participationBoost,
      };
    }));
    return getStormCloud(id);
  }
  private selectDischarge(cloudId:(typeof STORM_CLOUD_TOPOLOGY)[number]['id'],scheduledAt:number,finaleAct:FinaleAct|null):StormDischargeType {
    const cloud=getStormCloud(cloudId);
    const phaseModifiers=this.policy.phase[this.phase].eventModifiers;
    const finaleMajor=this.mode==='finale'&&this.finale!==null
      ?randomBetween(this.random,this.finale.majorStrikeProbability.min,this.finale.majorStrikeProbability.max):null;
    const majorBlocked=this.lastMajorStrikeAt!==null&&scheduledAt-this.lastMajorStrikeAt<this.policy.hardMajorCooldownMs;

    return weightedChoice(this.random,STORM_DISCHARGE_TYPES.map((discharge)=>{
      let weight=this.policy.baseEventWeights[discharge]*cloud.eventModifiers[discharge]*
        phaseModifiers[discharge]*eventHistoryMultiplier(discharge,this.recentEvents,this.policy);
      if (discharge==='major-strike'&&finaleMajor!==null) {
        weight=finaleMajor*cloud.eventModifiers[discharge];
        if (finaleAct==='crescendo') weight*=1.25;
        if (finaleAct==='resolution') weight*=0.58;
      }
      if (discharge==='major-strike'&&majorBlocked) weight=0;
      return {value:discharge,weight};
    }));
  }
  private recordEvent(event:StormDecision['event']):void {
    this.recentEvents.push(Object.freeze({
      cloudSystem:event.cloudSystem,discharge:event.discharge,scheduledAt:event.scheduledAt,
    }));
    if (this.recentEvents.length>this.policy.historyWindow) {
      this.recentEvents=this.recentEvents.slice(-this.policy.historyWindow);
    }
    if (event.discharge==='major-strike') this.lastMajorStrikeAt=event.scheduledAt;
  }
  private shouldApplyQuietPeriod(finaleAct:FinaleAct|null):boolean {
    if (this.mode==='finale') return finaleAct==='resolution'&&this.random.next()<0.10;
    if (this.phase!=='recovery'&&this.phase!=='ambient') return false;
    return this.random.next()<this.policy.quietProbability;
  }
  private resolveCluster(scheduledAt:number,discharge:StormDischargeType,motion:StormScheduleInput['motion']):StormClusterPlan|null {
    if (motion!=='full'||discharge==='major-strike'||
      (this.lastClusterAt!==null&&scheduledAt-this.lastClusterAt<this.policy.clusterCooldownMs)||
      this.random.next()>=this.policy.clusterProbability) return null;

    const count=randomInteger(this.random,2,3) as 2|3;
    const spacing:number[]=[];
    for (let index=1;index<count;index+=1) {
      spacing.push(Math.round(randomBetween(this.random,this.policy.clusterSpacingMs.min,this.policy.clusterSpacingMs.max)));
    }
    this.lastClusterAt=scheduledAt;
    return Object.freeze({count,spacingMs:Object.freeze(spacing)});
  }
  private resolveWholeSystemIllumination(discharge:StormDischargeType):boolean {
    if (discharge!=='major-strike'||this.mode!=='finale'||this.finale===null||this.finale.scorePercent<80) return false;
    const probability=randomBetween(
      this.random,this.finale.wholeSystemIlluminationProbability.min,this.finale.wholeSystemIlluminationProbability.max,
    );
    if (this.finale.grandFinaleEligible&&!this.grandFinaleUsed&&this.random.next()<0.12) {
      this.grandFinaleUsed=true;return true;
    }
    return this.random.next()<probability;
  }
}
