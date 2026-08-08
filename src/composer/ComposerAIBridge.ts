/**
 * Artifact ID: QCQ-CMP-025
 * Artifact Name: ComposerAIBridge
 * Artifact Purpose: Optional assistive-AI integration boundary for explanation/coaching requests; AI never owns grading, navigation, persistence, or question truth.
 * Artifact Layer: Phase 10 — Master Composer / BRG (AI Bridge Authority)
 * Artifact Dependencies: AI subsystem supplied through port
 * Artifact Dependents: Optional coaching/explanation surfaces
 * Dependency Graph: AI subsystem supplied through port -> ComposerAIBridge -> Optional coaching/explanation surfaces
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerAIBridge.ts
 */

export type ComposerAIIntent='explain'|'coach'|'summarize-progress'|'study-plan';
export interface ComposerAIRequest { readonly requestId:string; readonly intent:ComposerAIIntent; readonly prompt:string; readonly context:Readonly<Record<string,string|number|boolean|null>>; }
export interface ComposerAIResponse { readonly requestId:string; readonly text:string; readonly citations:readonly string[]; readonly model:string|null; readonly generatedAt:string; }
export interface ComposerAIPort { request(input:ComposerAIRequest,signal:AbortSignal):Promise<ComposerAIResponse>; }
export class ComposerAIBridge {
  private controller:AbortController|null=null; public constructor(private port:ComposerAIPort|null=null){} public attach(port:ComposerAIPort):void{this.port=port;} public detach():void{this.cancel();this.port=null;}
  public async request(input:ComposerAIRequest):Promise<ComposerAIResponse>{ if(!this.port)throw new Error('AI capability is unavailable.'); if(!input.requestId.trim()||!input.prompt.trim())throw new Error('AI requestId and prompt are required.'); this.cancel(); this.controller=new AbortController(); return this.port.request(Object.freeze({...input,context:Object.freeze({...input.context})}),this.controller.signal); }
  public cancel():void{this.controller?.abort();this.controller=null;}
}
