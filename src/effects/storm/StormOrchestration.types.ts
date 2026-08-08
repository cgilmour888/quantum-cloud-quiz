/**
 * Owner Authorities: QCQ-TBL-030 / 069 / 070 / 071
 * Subordinate storm contracts. No permanent Artifact ID allocated here.
 */
export const STORM_CLOUD_IDS = ['primary','rear-left','rear-right'] as const;
export type StormCloudId = (typeof STORM_CLOUD_IDS)[number];

export const STORM_DISCHARGE_TYPES = [
  'in-cloud-flicker','in-cloud-discharge','cloud-to-cloud','major-strike',
] as const;
export type StormDischargeType = (typeof STORM_DISCHARGE_TYPES)[number];

export const STORM_PHASES = ['ambient','building','charged','recovery'] as const;
export type StormPhase = (typeof STORM_PHASES)[number];
export type StormDepth = 'foreground'|'background';
export type StormRuntimeMode = 'gameplay'|'finale';
export type FinaleAct = 'ignition'|'build'|'crescendo'|'resolution';
export type StormMotion = 'full'|'reduced'|'static';
export type StormQuality = 'off'|'performance'|'balanced'|'cinematic';

export interface NumericRange { readonly min:number; readonly max:number; }

export interface StormCloudDescriptor {
  readonly id:StormCloudId;
  readonly depth:StormDepth;
  readonly sourceWeight:number;
  readonly visualMass:number;
  readonly centerX:number;
  readonly centerY:number;
  readonly width:number;
  readonly height:number;
  readonly zIndex:number;
  readonly stereoPan:number;
  readonly murmurDelayMs:NumericRange;
  readonly echoDelayMs:NumericRange;
  readonly eventModifiers:Readonly<Record<StormDischargeType,number>>;
}

export interface StormElectricalEvent {
  readonly id:string;
  readonly sequence:number;
  readonly scheduledAt:number;
  readonly cloudSystem:StormCloudId;
  readonly targetCloud:StormCloudId|null;
  readonly discharge:StormDischargeType;
  readonly depth:StormDepth;
  readonly intensity:number;
  readonly originX:number;
  readonly terminalX:number;
  readonly branchBudget:number;
  readonly wholeSystemIllumination:boolean;
  readonly finaleAct:FinaleAct|null;
}

export interface StormClusterPlan { readonly count:2|3; readonly spacingMs:readonly number[]; }
export interface StormDecision {
  readonly mode:StormRuntimeMode;
  readonly phase:StormPhase;
  readonly delayMs:number;
  readonly event:StormElectricalEvent;
  readonly cluster:StormClusterPlan|null;
  readonly quietPeriodApplied:boolean;
}
export interface StormHistoryEntry {
  readonly cloudSystem:StormCloudId;
  readonly discharge:StormDischargeType;
  readonly scheduledAt:number;
}
export interface QuizFinaleRequest {
  readonly quizId:string;
  readonly scorePercent:number;
  readonly completedAt:number;
  readonly durationMs?:number|undefined;
}
export interface QuizFinaleProfile {
  readonly quizId:string;
  readonly scorePercent:number;
  readonly scoreNormalized:number;
  readonly overallIntensity:number;
  readonly lightningIntensity:number;
  readonly thunderIntensity:number;
  readonly echoIntensity:number;
  readonly rainIntensity:number;
  readonly eventCountPerTenSeconds:NumericRange;
  readonly majorStrikeProbability:NumericRange;
  readonly wholeSystemIlluminationProbability:NumericRange;
  readonly grandFinaleEligible:boolean;
  readonly durationMs:number;
  readonly startedAt:number;
  readonly endsAt:number;
}
export interface StormScheduleInput {
  readonly now:number;
  readonly visible:boolean;
  readonly onscreen:boolean;
  readonly motion:StormMotion;
  readonly quality:StormQuality;
}
export interface StormSnapshot {
  readonly mode:StormRuntimeMode;
  readonly phase:StormPhase;
  readonly phaseStartedAt:number;
  readonly phaseEndsAt:number;
  readonly sequence:number;
  readonly finale:QuizFinaleProfile|null;
  readonly recentEvents:readonly StormHistoryEntry[];
  readonly lastMajorStrikeAt:number|null;
  readonly lastClusterAt:number|null;
}
export interface StormRuntimeCallbacks {
  readonly onDecision?:((decision:StormDecision)=>void)|undefined;
  readonly onFinaleEnded?:((quizId:string)=>void)|undefined;
}
