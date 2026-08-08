import {describe,expect,it} from 'vitest';
import {createStormRandom,weightedChoice} from '../StormRandom';
describe('storm seeded randomness',()=>{
  it('reproduces the same sequence for the same seed',()=>{
    const a=createStormRandom('same');const b=createStormRandom('same');
    expect(Array.from({length:20},()=>a.next())).toEqual(Array.from({length:20},()=>b.next()));
  });
  it('never selects a zero-weight entry',()=>{
    const r=createStormRandom('weights');
    for(let i=0;i<100;i+=1) expect(weightedChoice(r,[{value:'no',weight:0},{value:'yes',weight:1}])).toBe('yes');
  });
});
