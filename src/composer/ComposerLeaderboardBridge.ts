/**
 * Artifact ID: QCQ-CMP-027
 * Artifact Name: ComposerLeaderboardBridge
 * Artifact Purpose: Read-oriented leaderboard integration boundary exposing immutable standings while keeping ranking computation and identity ownership outside the composer.
 * Artifact Layer: Phase 10 — Master Composer / BRG (Leaderboard Bridge Authority)
 * Artifact Dependencies: Leaderboard subsystem supplied through port
 * Artifact Dependents: Optional leaderboard surfaces
 * Dependency Graph: Leaderboard subsystem supplied through port -> ComposerLeaderboardBridge -> Optional leaderboard surfaces
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerLeaderboardBridge.ts
 */

export interface ComposerLeaderboardEntry { readonly rank:number; readonly displayName:string; readonly score:number; readonly isCurrentPlayer:boolean; }
export interface ComposerLeaderboardSnapshot { readonly scope:string; readonly updatedAt:string; readonly entries:readonly ComposerLeaderboardEntry[]; }
export interface ComposerLeaderboardPort { refresh(scope:string,signal:AbortSignal):Promise<ComposerLeaderboardSnapshot>; getSnapshot(scope:string):ComposerLeaderboardSnapshot|null; }
export class ComposerLeaderboardBridge { private controller:AbortController|null=null; public constructor(private port:ComposerLeaderboardPort|null=null){} public attach(port:ComposerLeaderboardPort):void{this.port=port;} public detach():void{this.cancel();this.port=null;} public async refresh(scope:string):Promise<ComposerLeaderboardSnapshot>{if(!this.port)throw new Error('Leaderboard capability is unavailable.');this.cancel();this.controller=new AbortController();return this.port.refresh(scope,this.controller.signal);} public getSnapshot(scope:string):ComposerLeaderboardSnapshot|null{return this.port?.getSnapshot(scope)??null;} public cancel():void{this.controller?.abort();this.controller=null;} }
