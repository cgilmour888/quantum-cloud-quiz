/** Owner Authority: QCQ-TBL-030. Deterministic depth-layered rain visual. */
import {useMemo,type CSSProperties} from 'react';
import {createStormRandom} from './StormRandom';
import type {StormMotion,StormQuality} from './StormOrchestration.types';

export interface RainLayerProps {
  readonly active?:boolean|undefined; readonly intensity?:number|undefined; readonly seed?:string|undefined;
  readonly quality?:StormQuality|undefined; readonly motion?:StormMotion|undefined;
}
interface Drop {id:string;x:number;y:number;length:number;delay:number;duration:number;opacity:number;depth:'far'|'mid'|'near'}
type RainStyle=CSSProperties&Record<
  '--qcq-rain-x'|'--qcq-rain-y'|'--qcq-rain-length'|'--qcq-rain-delay'|'--qcq-rain-duration'|'--qcq-rain-opacity',string>;

const styles=`
.qcq-rain-layer{position:absolute;inset:0;z-index:2;overflow:hidden;pointer-events:none;perspective:900px}
.qcq-rain-layer[data-active="false"],.qcq-rain-layer[data-quality="off"]{display:none}
.qcq-rain-layer__drop{position:absolute;left:var(--qcq-rain-x);top:var(--qcq-rain-y);width:1px;height:var(--qcq-rain-length);
opacity:var(--qcq-rain-opacity);transform:rotate(8deg);background:linear-gradient(180deg,rgb(205 234 255/0%),rgb(186 226 255/76%));
animation:qcq-rain-fall var(--qcq-rain-duration) linear var(--qcq-rain-delay) infinite}
.qcq-rain-layer__drop[data-depth="far"]{filter:blur(.5px)}.qcq-rain-layer__drop[data-depth="near"]{width:1.5px;filter:drop-shadow(0 0 3px rgb(173 218 255/28%))}
@keyframes qcq-rain-fall{from{translate:0 -18vh}to{translate:12vw 122vh}}
.qcq-rain-layer[data-motion="reduced"] .qcq-rain-layer__drop{animation-duration:calc(var(--qcq-rain-duration)*1.8);opacity:calc(var(--qcq-rain-opacity)*.54)}
.qcq-rain-layer[data-motion="static"] .qcq-rain-layer__drop{display:none}
@media(prefers-reduced-motion:reduce){.qcq-rain-layer__drop{animation-duration:calc(var(--qcq-rain-duration)*1.8);opacity:calc(var(--qcq-rain-opacity)*.54)}}
@media(forced-colors:active){.qcq-rain-layer{display:none}}
`;
function count(quality:StormQuality,intensity:number):number {
  const ceiling=quality==='cinematic'?110:quality==='balanced'?72:quality==='performance'?34:0;
  return Math.round(ceiling*Math.min(1,Math.max(0,intensity)));
}
function drops(seed:string,total:number):readonly Drop[] {
  const random=createStormRandom(`${seed}:${total}`);const out:Drop[]=[];
  for(let index=0;index<total;index+=1){
    const roll=random.next();const depth:Drop['depth']=roll<0.38?'far':roll<0.78?'mid':'near';
    const factor=depth==='near'?1:depth==='mid'?0.74:0.48;
    out.push(Object.freeze({
      id:`${seed}-${index}`,x:random.next()*100,y:random.next()*118-18,length:(16+random.next()*48)*factor,
      delay:-random.next()*2.4,duration:0.42+(1-factor)*0.9+random.next()*0.55,
      opacity:(0.22+random.next()*0.52)*factor,depth,
    }));
  }
  return Object.freeze(out);
}
export function RainLayer({
  active=false,intensity=0,seed='qcq-rain-layer',quality='balanced',motion='full',
}:RainLayerProps) {
  const normalized=Math.min(1,Math.max(0,Number.isFinite(intensity)?intensity:0));
  const total=count(quality,normalized);
  const items=useMemo(()=>drops(seed,total),[seed,total]);
  return <>
    <style>{styles}</style>
    <div className="qcq-rain-layer" data-active={String(active&&normalized>0)}
      data-quality={quality} data-motion={motion} aria-hidden="true">
      {items.map((drop)=>{
        const style:RainStyle={
          '--qcq-rain-x':`${drop.x}%`,'--qcq-rain-y':`${drop.y}%`,'--qcq-rain-length':`${drop.length}px`,
          '--qcq-rain-delay':`${drop.delay}s`,'--qcq-rain-duration':`${drop.duration}s`,
          '--qcq-rain-opacity':String(drop.opacity*normalized),
        };
        return <i key={drop.id} className="qcq-rain-layer__drop" data-depth={drop.depth} style={style}/>;
      })}
    </div>
  </>;
}
