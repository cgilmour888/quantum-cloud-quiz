import {describe,expect,it} from 'vitest';
import {createQuizFinaleRequest} from '../StormQuizFinaleBridge';

describe('storm quiz-finale bridge',()=>{
  it('passes through an authoritative score without calculating correctness',()=>{
    expect(createQuizFinaleRequest({quizId:'quiz-7',scorePercent:92.5,completedAt:1234}))
      .toEqual({quizId:'quiz-7',scorePercent:92.5,completedAt:1234});
  });
});
