/** Owner Authority: QCQ-TBL-070. Recent-history weighting policy. */
import type {StormCloudId,StormDischargeType,StormHistoryEntry} from './StormOrchestration.types';
import type {StormOrchestrationPolicy} from './StormOrchestrationPolicy';

export function cloudHistoryMultiplier(
  cloud:StormCloudId,history:readonly StormHistoryEntry[],policy:StormOrchestrationPolicy,
):number {
  const previous=history.at(-1);
  const before=history.at(-2);
  if (previous?.cloudSystem===cloud&&before?.cloudSystem===cloud) return policy.tripleCloudPenalty;
  if (previous?.cloudSystem===cloud) return policy.repeatCloudPenalty;
  return 1;
}

export function eventHistoryMultiplier(
  discharge:StormDischargeType,history:readonly StormHistoryEntry[],policy:StormOrchestrationPolicy,
):number {
  let count=0;
  for (let index=history.length-1;index>=0;index-=1) {
    if (history[index]?.discharge!==discharge) break;
    count+=1;
  }
  if (count>=3) return 0;
  if (count===2) return policy.tripleEventPenalty;
  if (count===1) return policy.repeatEventPenalty;
  return 1;
}
