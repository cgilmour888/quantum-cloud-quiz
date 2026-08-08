/**
 * Artifact ID: QCQ-CMP-026
 * Artifact Name: ComposerGamificationBridge
 * Artifact Purpose: Non-owning gamification boundary forwarding gameplay evidence and exposing immutable reward state without allowing rewards to determine correctness.
 * Artifact Layer: Phase 10 — Master Composer / BRG (Gamification Bridge Authority)
 * Artifact Dependencies: Gamification subsystem supplied through port
 * Artifact Dependents: Optional reward presentation
 * Dependency Graph: Gamification subsystem supplied through port -> ComposerGamificationBridge -> Optional reward presentation
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerGamificationBridge.ts
 */

export interface ComposerGamificationEvent { readonly type:'question-completed'|'streak-updated'|'session-completed'|'achievement-evidence'; readonly evidenceId:string; readonly value:number; readonly occurredAt:string; }
export interface ComposerGamificationSnapshot { readonly xp:number; readonly level:number; readonly streak:number; readonly achievementIds:readonly string[]; }
export interface ComposerGamificationPort { publish(event:ComposerGamificationEvent):void|Promise<void>; getSnapshot():ComposerGamificationSnapshot; }
export class ComposerGamificationBridge { public constructor(private port:ComposerGamificationPort|null=null){} public attach(port:ComposerGamificationPort):void{this.port=port;} public detach():void{this.port=null;} public async publish(input:Omit<ComposerGamificationEvent,'occurredAt'>):Promise<void>{await this.port?.publish(Object.freeze({...input,occurredAt:new Date().toISOString()}));} public getSnapshot():ComposerGamificationSnapshot|null{return this.port?.getSnapshot()??null;} }
