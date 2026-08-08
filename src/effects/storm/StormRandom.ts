/** Owner Authority: QCQ-TBL-070. Deterministic seeded random source. */
export interface StormRandomSource { next():number; }

export function hashStormSeed(seed:string):number {
  let hash=2166136261;
  for (const character of seed) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash,16777619);
  }
  return hash>>>0;
}
export function createStormRandom(seed:string):StormRandomSource {
  let state=hashStormSeed(seed);
  return { next() {
    state += 0x6d2b79f5;
    let value=state;
    value=Math.imul(value^(value>>>15),value|1);
    value^=value+Math.imul(value^(value>>>7),value|61);
    return ((value^(value>>>14))>>>0)/4294967296;
  }};
}
export function clampUnit(value:number):number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1,Math.max(0,value));
}
export function randomBetween(random:StormRandomSource,minimum:number,maximum:number):number {
  const low=Math.min(minimum,maximum);
  const high=Math.max(minimum,maximum);
  return low+random.next()*(high-low);
}
export function randomInteger(random:StormRandomSource,minimum:number,maximum:number):number {
  return Math.floor(randomBetween(random,minimum,maximum+1));
}
export function weightedChoice<T>(
  random:StormRandomSource,
  entries:readonly {readonly value:T;readonly weight:number}[],
):T {
  const eligible=entries.filter((entry)=>Number.isFinite(entry.weight)&&entry.weight>0);
  if (eligible.length===0) throw new Error('Storm weighted selection requires a positive finite weight.');
  const total=eligible.reduce((sum,entry)=>sum+entry.weight,0);
  let cursor=random.next()*total;
  for (const entry of eligible) {
    cursor-=entry.weight;
    if (cursor<=0) return entry.value;
  }
  return eligible[eligible.length-1]!.value;
}
