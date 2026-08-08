/** Owner Authorities: QCQ-TBL-069 / 070 / 071. Governed storm policy. */
import type {NumericRange,StormDischargeType,StormPhase} from './StormOrchestration.types';

export interface StormPhasePolicy {
  readonly durationMs:NumericRange;
  readonly eventIntervalMs:NumericRange;
  readonly eventModifiers:Readonly<Record<StormDischargeType,number>>;
}
export interface StormOrchestrationPolicy {
  readonly phase:Readonly<Record<StormPhase,StormPhasePolicy>>;
  readonly baseEventWeights:Readonly<Record<StormDischargeType,number>>;
  readonly historyWindow:number;
  readonly repeatCloudPenalty:number;
  readonly tripleCloudPenalty:number;
  readonly repeatEventPenalty:number;
  readonly tripleEventPenalty:number;
  readonly hardMajorCooldownMs:number;
  readonly preferredMajorSpacingMs:NumericRange;
  readonly clusterProbability:number;
  readonly clusterCooldownMs:number;
  readonly clusterSpacingMs:NumericRange;
  readonly quietProbability:number;
  readonly quietPeriodMs:NumericRange;
}
const mods=(f:number,d:number,c:number,m:number):Readonly<Record<StormDischargeType,number>>=>
  Object.freeze({'in-cloud-flicker':f,'in-cloud-discharge':d,'cloud-to-cloud':c,'major-strike':m});

export const DEFAULT_STORM_ORCHESTRATION_POLICY:StormOrchestrationPolicy=Object.freeze({
  phase:Object.freeze({
    ambient:Object.freeze({durationMs:Object.freeze({min:20_000,max:55_000}),eventIntervalMs:Object.freeze({min:4_500,max:12_000}),eventModifiers:mods(1.20,0.92,0.78,0.55)}),
    building:Object.freeze({durationMs:Object.freeze({min:12_000,max:35_000}),eventIntervalMs:Object.freeze({min:2_500,max:7_000}),eventModifiers:mods(0.95,1.10,1.20,0.90)}),
    charged:Object.freeze({durationMs:Object.freeze({min:8_000,max:22_000}),eventIntervalMs:Object.freeze({min:1_400,max:4_500}),eventModifiers:mods(0.78,1.08,1.24,1.60)}),
    recovery:Object.freeze({durationMs:Object.freeze({min:12_000,max:30_000}),eventIntervalMs:Object.freeze({min:4_000,max:10_000}),eventModifiers:mods(1.18,0.94,0.75,0.45)}),
  }),
  baseEventWeights:Object.freeze({'in-cloud-flicker':0.45,'in-cloud-discharge':0.27,'cloud-to-cloud':0.18,'major-strike':0.10}),
  historyWindow:6,repeatCloudPenalty:0.58,tripleCloudPenalty:0.30,repeatEventPenalty:0.68,tripleEventPenalty:0.34,
  hardMajorCooldownMs:6_000,preferredMajorSpacingMs:Object.freeze({min:9_000,max:24_000}),
  clusterProbability:0.15,clusterCooldownMs:8_000,clusterSpacingMs:Object.freeze({min:250,max:1_400}),
  quietProbability:0.28,quietPeriodMs:Object.freeze({min:8_000,max:18_000}),
});
