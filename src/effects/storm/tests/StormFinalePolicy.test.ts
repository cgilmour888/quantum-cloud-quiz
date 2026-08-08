import {describe,expect,it} from 'vitest';
import {resolveFinaleAct,resolveQuizFinaleProfile} from '../StormFinalePolicy';
describe('score-reactive finale policy',()=>{
  it('caps duration at sixty seconds',()=>{
    expect(resolveQuizFinaleProfile({quizId:'q',scorePercent:100,completedAt:0,durationMs:90_000}).durationMs).toBe(60_000);
  });
  it('increases brilliance with authoritative score',()=>{
    const low=resolveQuizFinaleProfile({quizId:'l',scorePercent:40,completedAt:0});
    const high=resolveQuizFinaleProfile({quizId:'h',scorePercent:96,completedAt:0});
    expect(high.overallIntensity).toBeGreaterThan(low.overallIntensity);
    expect(high.rainIntensity).toBeGreaterThan(low.rainIntensity);
    expect(high.majorStrikeProbability.max).toBeGreaterThan(low.majorStrikeProbability.max);
  });
  it('resolves all four finale acts',()=>{
    const p=resolveQuizFinaleProfile({quizId:'q',scorePercent:90,completedAt:10_000,durationMs:40_000});
    expect(resolveFinaleAct(10_000,p)).toBe('ignition');
    expect(resolveFinaleAct(20_000,p)).toBe('build');
    expect(resolveFinaleAct(32_000,p)).toBe('crescendo');
    expect(resolveFinaleAct(48_000,p)).toBe('resolution');
  });
});
