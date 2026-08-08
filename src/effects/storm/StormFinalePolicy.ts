/** Owner Authority: QCQ-TBL-069. Pure score-reactive finale policy. */
import {clampUnit} from './StormRandom';
import type {FinaleAct,NumericRange,QuizFinaleProfile,QuizFinaleRequest} from './StormOrchestration.types';

const MAX_FINALE_DURATION_MS=60_000;
const DEFAULT_FINALE_DURATION_MS=50_000;

function density(score:number):{eventCount:NumericRange;major:NumericRange} {
  if (score>=90) return {eventCount:{min:5,max:8},major:{min:0.22,max:0.32}};
  if (score>=80) return {eventCount:{min:4,max:7},major:{min:0.17,max:0.25}};
  if (score>=70) return {eventCount:{min:3,max:6},major:{min:0.12,max:0.20}};
  if (score>=60) return {eventCount:{min:3,max:5},major:{min:0.09,max:0.15}};
  return {eventCount:{min:2,max:4},major:{min:0.05,max:0.11}};
}
export function resolveQuizFinaleProfile(request:QuizFinaleRequest):QuizFinaleProfile {
  const scorePercent=Math.min(100,Math.max(0,Number.isFinite(request.scorePercent)?request.scorePercent:0));
  const scoreNormalized=clampUnit(scorePercent/100);
  const overallIntensity=0.34+scoreNormalized*0.66;
  const band=density(scorePercent);
  const durationMs=Math.min(MAX_FINALE_DURATION_MS,Math.max(1_000,Math.round(request.durationMs??DEFAULT_FINALE_DURATION_MS)));
  const whole=scorePercent>=80 ? 0.08+clampUnit((scorePercent-80)/20)*0.10 : 0;
  return Object.freeze({
    quizId:request.quizId,scorePercent,scoreNormalized,overallIntensity,
    lightningIntensity:Math.min(1,0.36+overallIntensity*0.64),
    thunderIntensity:Math.min(1,0.32+overallIntensity*0.62),
    echoIntensity:Math.min(1,0.26+overallIntensity*0.58),
    rainIntensity:Math.min(1,0.25+overallIntensity*0.65),
    eventCountPerTenSeconds:Object.freeze({...band.eventCount}),
    majorStrikeProbability:Object.freeze({...band.major}),
    wholeSystemIlluminationProbability:Object.freeze({min:whole*0.72,max:whole}),
    grandFinaleEligible:scorePercent>=90,durationMs,startedAt:request.completedAt,endsAt:request.completedAt+durationMs,
  });
}
export function resolveFinaleAct(now:number,profile:QuizFinaleProfile):FinaleAct {
  const progress=clampUnit((now-profile.startedAt)/profile.durationMs);
  if (progress<0.15) return 'ignition';
  if (progress<0.40) return 'build';
  if (progress<0.75) return 'crescendo';
  return 'resolution';
}
export function finaleEventIntervalMs(profile:QuizFinaleProfile):NumericRange {
  const low=Math.max(1,profile.eventCountPerTenSeconds.min);
  const high=Math.max(low,profile.eventCountPerTenSeconds.max);
  return Object.freeze({min:10_000/high,max:10_000/low});
}
