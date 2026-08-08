/**
 * Owner Authority: QCQ-AUD-017.
 * Rain/storm-bed plan for score-reactive finale acts. No media paths.
 */
import type {FinaleAct,QuizFinaleProfile} from '../../effects/storm/StormOrchestration.types';
import type {StormAcousticCue} from './StormAcousticPlan';

export function createFinaleRainAudioPlan(
  profile:QuizFinaleProfile,
  act:FinaleAct,
):readonly StormAcousticCue[] {
  const id=`finale-rain:${profile.quizId}`;
  const rain=profile.rainIntensity;
  const cues:StormAcousticCue[]=[
    Object.freeze({semantic:'rainBed',delayMs:0,gain:Math.min(1,0.22+rain*0.56),pan:0,causalEventId:id}),
    Object.freeze({semantic:'rainDropsNear',delayMs:280,gain:Math.min(1,0.12+rain*0.38),pan:0.08,causalEventId:id}),
    Object.freeze({semantic:'rainDropsSurface',delayMs:520,gain:Math.min(1,0.10+rain*0.30),pan:-0.06,causalEventId:id}),
  ];
  if (act==='build'||act==='crescendo') {
    cues.push(Object.freeze({
      semantic:'rainSurge',delayMs:act==='crescendo'?650:1200,
      gain:Math.min(1,0.18+rain*0.54),pan:0,causalEventId:id,
    }));
  }
  if (act==='resolution') {
    cues.push(Object.freeze({
      semantic:'rainDecay',delayMs:0,gain:Math.min(1,0.16+rain*0.36),pan:0,causalEventId:id,
    }));
  }
  return Object.freeze(cues);
}
