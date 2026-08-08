/** Owner Authority: QCQ-TBL-030. Immutable three-cloud topology. */
import {MASTER_STORM_CLOUD_VISUALS} from './MasterStormVisualContract';
import type {StormCloudDescriptor,StormCloudId,StormDischargeType} from './StormOrchestration.types';

const primary:Readonly<Record<StormDischargeType,number>>=Object.freeze({
  'in-cloud-flicker':0.85,'in-cloud-discharge':1,'cloud-to-cloud':1.05,'major-strike':1.65,
});
const rear:Readonly<Record<StormDischargeType,number>>=Object.freeze({
  'in-cloud-flicker':1.2,'in-cloud-discharge':1,'cloud-to-cloud':1.15,'major-strike':0.55,
});

export const STORM_CLOUD_TOPOLOGY:readonly StormCloudDescriptor[]=Object.freeze([
  Object.freeze({
    id:'primary',depth:'foreground',sourceWeight:0.56,visualMass:0.60,
    centerX:MASTER_STORM_CLOUD_VISUALS.primary.centerX,centerY:MASTER_STORM_CLOUD_VISUALS.primary.centerY,
    width:MASTER_STORM_CLOUD_VISUALS.primary.width,height:MASTER_STORM_CLOUD_VISUALS.primary.height,zIndex:3,stereoPan:0,
    murmurDelayMs:Object.freeze({min:120,max:450}),
    echoDelayMs:Object.freeze({min:300,max:900}),eventModifiers:primary,
  }),
  Object.freeze({
    id:'rear-left',depth:'background',sourceWeight:0.22,visualMass:0.20,
    centerX:MASTER_STORM_CLOUD_VISUALS['rear-left'].centerX,centerY:MASTER_STORM_CLOUD_VISUALS['rear-left'].centerY,
    width:MASTER_STORM_CLOUD_VISUALS['rear-left'].width,height:MASTER_STORM_CLOUD_VISUALS['rear-left'].height,zIndex:1,stereoPan:-0.34,
    murmurDelayMs:Object.freeze({min:220,max:700}),
    echoDelayMs:Object.freeze({min:450,max:1200}),eventModifiers:rear,
  }),
  Object.freeze({
    id:'rear-right',depth:'background',sourceWeight:0.22,visualMass:0.20,
    centerX:MASTER_STORM_CLOUD_VISUALS['rear-right'].centerX,centerY:MASTER_STORM_CLOUD_VISUALS['rear-right'].centerY,
    width:MASTER_STORM_CLOUD_VISUALS['rear-right'].width,height:MASTER_STORM_CLOUD_VISUALS['rear-right'].height,zIndex:1,stereoPan:0.34,
    murmurDelayMs:Object.freeze({min:240,max:750}),
    echoDelayMs:Object.freeze({min:480,max:1250}),eventModifiers:rear,
  }),
]);

export function getStormCloud(id:StormCloudId):StormCloudDescriptor {
  const cloud=STORM_CLOUD_TOPOLOGY.find((candidate)=>candidate.id===id);
  if (cloud===undefined) throw new Error(`Unknown storm cloud "${id}".`);
  return cloud;
}
export function otherStormClouds(source:StormCloudId):readonly StormCloudId[] {
  return Object.freeze(STORM_CLOUD_TOPOLOGY.map((cloud)=>cloud.id).filter((id)=>id!==source));
}
