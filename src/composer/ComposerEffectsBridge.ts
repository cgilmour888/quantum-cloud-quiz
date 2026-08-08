/**
 * Artifact ID: QCQ-CMP-023
 * Artifact Name: ComposerEffectsBridge
 * Artifact Purpose: Typed non-owning bridge from composition events/quality state into Premium Effects; effects remain optional, pointer-transparent, accessibility-hidden, and incapable of mutating gameplay.
 * Artifact Layer: Phase 10 — Master Composer / BRG (Effects Bridge Authority)
 * Artifact Dependencies: QCQ-CMP-011, QCQ-CMP-020, Premium Effects authority
 * Artifact Dependents: QCQ-TBL-040/environment composition
 * Dependency Graph: QCQ-CMP-011, QCQ-CMP-020, Premium Effects authority -> ComposerEffectsBridge -> QCQ-TBL-040/environment composition
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerEffectsBridge.ts
 */

export type ComposerVisualCue='question-enter'|'answer-selected'|'answer-correct'|'answer-incorrect'|'streak'|'achievement'|'session-complete'|'suspend'|'resume';
export interface ComposerEffectsCommand { readonly cue:ComposerVisualCue; readonly intensity:number; readonly durationMs:number; readonly metadata:Readonly<Record<string,string|number|boolean>>; }
export interface ComposerEffectsPort { emit(command:ComposerEffectsCommand):void; setQuality(input:{readonly particleFactor:number;readonly reflectionFactor:number;readonly bloomFactor:number;readonly stormFactor:number;readonly lightningComplexity:number;readonly animationRateFactor:number}):void; suspend():void; resume():void; }
export class ComposerEffectsBridge {
  public constructor(private port:ComposerEffectsPort|null=null){}
  public attach(port:ComposerEffectsPort):void{this.port=port;} public detach():void{this.port=null;}
  public emit(cue:ComposerVisualCue,intensity=1,durationMs=600,metadata:Readonly<Record<string,string|number|boolean>>={}):void{
    if(!this.port)return; const safe=Math.min(1,Math.max(0,intensity)); this.port.emit(Object.freeze({cue,intensity:safe,durationMs:Math.max(0,durationMs),metadata:Object.freeze({...metadata})}));
  }
  public applyQuality(plan:{readonly particleFactor:number;readonly reflectionFactor:number;readonly bloomFactor:number;readonly stormFactor:number;readonly lightningComplexity:number;readonly animationRateFactor:number}):void{this.port?.setQuality(plan);}
  public suspend():void{this.port?.suspend();} public resume():void{this.port?.resume();}
}
