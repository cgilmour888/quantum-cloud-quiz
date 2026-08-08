import {describe,expect,it} from 'vitest';
import {resolveQuizFinaleProfile} from '../../../effects/storm/StormFinalePolicy';
import {createFinaleRainAudioPlan} from '../StormFinaleAudioPlan';

describe('score-finale rain audio plan',()=>{
  it('adds a rain surge during crescendo and a rain decay during resolution',()=>{
    const profile=resolveQuizFinaleProfile({quizId:'q',scorePercent:95,completedAt:0});
    expect(createFinaleRainAudioPlan(profile,'crescendo').map((cue)=>cue.semantic)).toContain('rainSurge');
    expect(createFinaleRainAudioPlan(profile,'resolution').map((cue)=>cue.semantic)).toContain('rainDecay');
  });
});
