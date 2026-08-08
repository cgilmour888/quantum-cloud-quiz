/**
 * Owner Authority: QCQ-TBL-030
 * Purpose: native, MASTER-guided three-cloud storm body.
 * No runtime MASTER bitmap is used.
 */
import {type CSSProperties} from 'react';
import {MASTER_STORM_CLOUD_VISUALS} from './MasterStormVisualContract';
import {STORM_CLOUD_TOPOLOGY} from './StormCloudTopology';
import type {StormCloudId,StormQuality} from './StormOrchestration.types';

export interface ThreeCloudSystemProps {
  readonly active?: boolean | undefined;
  readonly intensity?: number | undefined;
  readonly quality?: StormQuality | undefined;
  readonly illumination?: Readonly<Partial<Record<StormCloudId,number>>> | undefined;
}

type CloudStyle=CSSProperties&Record<
  '--qcq-cloud-x'|'--qcq-cloud-y'|'--qcq-cloud-width'|'--qcq-cloud-height'|
  '--qcq-cloud-opacity'|'--qcq-cloud-flash'|'--qcq-cloud-blur'|'--qcq-cloud-depth-scale',
  string
>;

const styles=`
.qcq-three-cloud-system{position:absolute;inset:0;z-index:1;overflow:hidden;pointer-events:none;isolation:isolate;transform:translateZ(0)}
.qcq-three-cloud-system[data-active="false"],.qcq-three-cloud-system[data-quality="off"]{display:none}
.qcq-three-cloud-system__cloud{position:absolute;left:var(--qcq-cloud-x);top:var(--qcq-cloud-y);width:var(--qcq-cloud-width);height:var(--qcq-cloud-height);
transform:translate(-50%,-50%) scale(var(--qcq-cloud-depth-scale));transform-origin:center;border-radius:50%;opacity:var(--qcq-cloud-opacity);
filter:blur(var(--qcq-cloud-blur)) saturate(calc(1.08 + var(--qcq-cloud-flash)*.28)) contrast(calc(1.02 + var(--qcq-cloud-flash)*.18));
mix-blend-mode:screen;
background:
radial-gradient(ellipse at 22% 58%,rgb(108 72 190/calc(.20 + var(--qcq-cloud-flash)*.30)) 0%,rgb(43 40 111/38%) 24%,transparent 58%),
radial-gradient(ellipse at 39% 36%,rgb(119 99 224/calc(.20 + var(--qcq-cloud-flash)*.34)) 0%,rgb(41 45 123/46%) 29%,transparent 62%),
radial-gradient(ellipse at 58% 52%,rgb(216 239 255/calc(var(--qcq-cloud-flash)*.56)) 0%,rgb(78 112 231/calc(.14 + var(--qcq-cloud-flash)*.30)) 17%,rgb(43 38 119/42%) 41%,transparent 69%),
radial-gradient(ellipse at 75% 34%,rgb(130 76 218/calc(.17 + var(--qcq-cloud-flash)*.31)) 0%,rgb(38 39 109/43%) 33%,transparent 66%),
radial-gradient(ellipse at 72% 69%,rgb(41 91 165/calc(.18 + var(--qcq-cloud-flash)*.24)) 0%,rgb(8 17 48/76%) 49%,transparent 76%),
linear-gradient(180deg,rgb(24 28 78/18%),rgb(6 11 34/72%));
box-shadow:0 -1rem 5rem rgb(101 61 218/calc(.12 + var(--qcq-cloud-flash)*.24)),
0 0 calc(4rem + 8rem*var(--qcq-cloud-flash)) rgb(56 138 255/calc(var(--qcq-cloud-flash)*.24));
transition:opacity 300ms ease-out,filter 180ms ease-out,box-shadow 180ms ease-out}
.qcq-three-cloud-system__cloud::before,.qcq-three-cloud-system__cloud::after{position:absolute;content:"";pointer-events:none;border-radius:50%;mix-blend-mode:screen}
.qcq-three-cloud-system__cloud::before{inset:8% 9% 26% 7%;background:
radial-gradient(ellipse at 31% 54%,rgb(187 157 255/calc(.07 + var(--qcq-cloud-flash)*.28)),transparent 38%),
radial-gradient(ellipse at 67% 45%,rgb(117 190 255/calc(.06 + var(--qcq-cloud-flash)*.26)),transparent 42%);
filter:blur(calc(var(--qcq-cloud-blur)*.52))}
.qcq-three-cloud-system__cloud::after{inset:35% 4% 2% 10%;background:
radial-gradient(ellipse at 50% 45%,rgb(10 17 48/82%),rgb(35 40 103/42%) 49%,transparent 74%);
filter:blur(calc(var(--qcq-cloud-blur)*.74))}
.qcq-three-cloud-system__cloud[data-cloud="primary"]{z-index:3}
.qcq-three-cloud-system__cloud[data-cloud="rear-left"],.qcq-three-cloud-system__cloud[data-cloud="rear-right"]{
z-index:1;filter:blur(var(--qcq-cloud-blur)) saturate(.94) brightness(.80)}
@media(prefers-reduced-motion:reduce){.qcq-three-cloud-system__cloud{transition:none}}
@media(forced-colors:active){.qcq-three-cloud-system{display:none}}
`;

function clamp(value:number):number {
  return Math.min(1,Math.max(0,Number.isFinite(value)?value:0));
}

export function ThreeCloudSystem({
  active=true,intensity=0.72,quality='balanced',illumination={},
}:ThreeCloudSystemProps) {
  const normalizedIntensity=clamp(intensity);
  return (
    <>
      <style>{styles}</style>
      <div className="qcq-three-cloud-system" data-active={String(active)}
        data-quality={quality} data-cloud-count="3" aria-hidden="true">
        {STORM_CLOUD_TOPOLOGY.map((cloud)=>{
          const visual=MASTER_STORM_CLOUD_VISUALS[cloud.id];
          const flash=clamp(illumination[cloud.id]??0);
          const style:CloudStyle={
            '--qcq-cloud-x':`${visual.centerX*100}%`,
            '--qcq-cloud-y':`${visual.centerY*100}%`,
            '--qcq-cloud-width':`${visual.width*100}%`,
            '--qcq-cloud-height':`${visual.height*100}%`,
            '--qcq-cloud-opacity':String(clamp(visual.baseOpacity*normalizedIntensity)),
            '--qcq-cloud-flash':String(flash),
            '--qcq-cloud-blur':`${visual.atmosphericBlurPx}px`,
            '--qcq-cloud-depth-scale':String(visual.depthScale),
            zIndex:cloud.zIndex,
          };
          return <div key={cloud.id} className="qcq-three-cloud-system__cloud"
            data-cloud={cloud.id} data-depth={cloud.depth} style={style}/>;
        })}
      </div>
    </>
  );
}
