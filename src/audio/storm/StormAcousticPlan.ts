/**
 * Owner Authority: QCQ-AUD-017.
 * Pure causal acoustic plan. No audio file paths and no media-readiness claims.
 */
import {getStormCloud,otherStormClouds} from '../../effects/storm/StormCloudTopology';
import {createStormRandom,randomBetween,weightedChoice} from '../../effects/storm/StormRandom';
import type {StormCloudId,StormElectricalEvent} from '../../effects/storm/StormOrchestration.types';
import type {StormAudioSemantic} from './StormAudioSemantics';

export interface StormAcousticCue {
  readonly semantic:StormAudioSemantic;
  readonly delayMs:number;
  readonly gain:number;
  readonly pan:number;
  readonly causalEventId:string;
}
export interface StormAcousticPlan { readonly eventId:string; readonly cues:readonly StormAcousticCue[]; }
const clamp=(value:number)=>Math.min(1,Math.max(0,value));

function murmur(cloud:StormCloudId):StormAudioSemantic {
  switch(cloud){
    case 'primary':return 'cloudMurmurPrimary';
    case 'rear-left':return 'cloudMurmurRearLeft';
    case 'rear-right':return 'cloudMurmurRearRight';
  }
}
function echo(cloud:StormCloudId):StormAudioSemantic {
  switch(cloud){
    case 'primary':return 'thunderEchoPrimary';
    case 'rear-left':return 'thunderEchoRearLeft';
    case 'rear-right':return 'thunderEchoRearRight';
  }
}

export function createStormAcousticPlan(event:StormElectricalEvent):StormAcousticPlan {
  const random=createStormRandom(`${event.id}:audio`);
  const cloud=getStormCloud(event.cloudSystem);
  const cues:StormAcousticCue[]=[];
  const add=(semantic:StormAudioSemantic,delayMs:number,gain:number,pan=cloud.stereoPan)=>{
    cues.push(Object.freeze({
      semantic,delayMs:Math.max(0,Math.round(delayMs)),gain:clamp(gain),
      pan:Math.min(0.7,Math.max(-0.7,pan)),causalEventId:event.id,
    }));
  };

  add('cloudFlicker',0,0.24+event.intensity*0.32);

  if(event.discharge==='in-cloud-flicker'){
    if(random.next()<0.79){
      add(murmur(cloud.id),randomBetween(random,250,1200),0.20+event.intensity*0.38);
      if(random.next()<0.48){
        add(echo(cloud.id),randomBetween(random,cloud.echoDelayMs.min,cloud.echoDelayMs.max),0.12+event.intensity*0.22);
      }
    }
  } else if(event.discharge==='in-cloud-discharge'){
    add('lightningCrack',0,0.28+event.intensity*0.34);
    add(murmur(cloud.id),randomBetween(random,450,1800),0.30+event.intensity*0.44);
    add(echo(cloud.id),randomBetween(random,cloud.echoDelayMs.min,cloud.echoDelayMs.max),0.16+event.intensity*0.26);
  } else if(event.discharge==='cloud-to-cloud'){
    add('lightningCrack',0,0.34+event.intensity*0.38);
    add('thunderPreRoll',randomBetween(random,500,1200),0.28+event.intensity*0.34);
    add('thunderRoll',randomBetween(random,900,2200),0.34+event.intensity*0.46);
    const neighbor=event.targetCloud??weightedChoice(random,otherStormClouds(cloud.id).map((id)=>({value:id,weight:1})));
    const neighborCloud=getStormCloud(neighbor);
    add(echo(neighbor),900+randomBetween(random,neighborCloud.echoDelayMs.min,neighborCloud.echoDelayMs.max),
      0.18+event.intensity*0.30,neighborCloud.stereoPan);
  } else {
    add('lightningCrack',0,0.48+event.intensity*0.46);
    const mainDelay=randomBetween(random,1000,3500);
    add(event.intensity>=0.82?'thunderClose':'thunderDistant',mainDelay,0.52+event.intensity*0.44);
    add('thunderRoll',mainDelay+randomBetween(random,220,720),0.40+event.intensity*0.48);

    for(const echoCloudId of ['rear-left','rear-right','primary'] as const){
      const echoCloud=getStormCloud(echoCloudId);
      add(echo(echoCloudId),mainDelay+randomBetween(random,echoCloud.echoDelayMs.min,echoCloud.echoDelayMs.max),
        (0.15+event.intensity*0.26)*(echoCloudId===cloud.id?1:0.78),echoCloud.stereoPan);
    }
    add('thunderDecay',mainDelay+randomBetween(random,1800,4200),0.20+event.intensity*0.28,0);
  }
  return Object.freeze({eventId:event.id,cues:Object.freeze(cues.sort((a,b)=>a.delayMs-b.delayMs))});
}
