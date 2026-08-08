/**
 * Artifact ID: QCQ-CMP-024
 * Artifact Name: ComposerAnalyticsBridge
 * Artifact Purpose: Typed analytics integration boundary that forwards explicit learning events and reads immutable snapshots without allowing analytics to own layout, grading, or composition.
 * Artifact Layer: Phase 10 — Master Composer / BRG (Analytics Bridge Authority)
 * Artifact Dependencies: Analytics subsystem supplied through port
 * Artifact Dependents: QCQ-TBL-040/supporting metrics consumers
 * Dependency Graph: Analytics subsystem supplied through port -> ComposerAnalyticsBridge -> QCQ-TBL-040/supporting metrics consumers
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerAnalyticsBridge.ts
 */

export interface ComposerAnalyticsEvent { readonly type:string; readonly occurredAt:string; readonly sessionId:string|null; readonly payload:Readonly<Record<string,string|number|boolean|null>>; }
export interface ComposerAnalyticsSnapshot { readonly version:number; readonly measures:Readonly<Record<string,number>>; readonly labels:Readonly<Record<string,string>>; }
export interface ComposerAnalyticsPort { record(event:ComposerAnalyticsEvent):void|Promise<void>; getSnapshot():ComposerAnalyticsSnapshot; }
export class ComposerAnalyticsBridge {
  public constructor(private port:ComposerAnalyticsPort|null=null){} public attach(port:ComposerAnalyticsPort):void{this.port=port;} public detach():void{this.port=null;}
  public async record(type:string,payload:Readonly<Record<string,string|number|boolean|null>>,sessionId:string|null=null):Promise<void>{ if(!type.trim())throw new Error('Analytics event type is required.'); await this.port?.record(Object.freeze({type,occurredAt:new Date().toISOString(),sessionId,payload:Object.freeze({...payload})})); }
  public getSnapshot():ComposerAnalyticsSnapshot|null{return this.port?.getSnapshot()??null;}
}
