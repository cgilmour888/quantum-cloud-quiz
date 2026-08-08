/**
 * Artifact ID: QCQ-CMP-030
 * Artifact Name: ComposerSecurityBridge
 * Artifact Purpose: Security posture/authorization bridge with fail-closed decisions for protected actions; no secret storage, authentication implementation, or security-policy ownership.
 * Artifact Layer: Phase 10 — Master Composer / BRG (Security Bridge Authority)
 * Artifact Dependencies: Security subsystem supplied through port
 * Artifact Dependents: QCQ-CMP-016, QCQ-CMP-018, protected composition actions
 * Dependency Graph: Security subsystem supplied through port -> ComposerSecurityBridge -> QCQ-CMP-016, QCQ-CMP-018, protected composition actions
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerSecurityBridge.ts
 */

export type ComposerSecurityDecision='allow'|'deny';
export interface ComposerSecuritySubject { readonly subjectId:string|null; readonly roles:readonly string[]; readonly tenantId:string|null; }
export interface ComposerSecurityRequest { readonly action:string; readonly resource:string; readonly subject:ComposerSecuritySubject; readonly context:Readonly<Record<string,string|number|boolean|null>>; }
export interface ComposerSecurityResult { readonly decision:ComposerSecurityDecision; readonly reason:string; readonly policyId:string|null; }
export interface ComposerSecurityPosture { readonly healthy:boolean; readonly controls:Readonly<Record<string,boolean>>; readonly evaluatedAt:string; }
export interface ComposerSecurityPort { authorize(request:ComposerSecurityRequest):ComposerSecurityResult|Promise<ComposerSecurityResult>; posture():ComposerSecurityPosture; }
export class ComposerSecurityBridge {
  public constructor(private port:ComposerSecurityPort|null=null){} public attach(port:ComposerSecurityPort):void{this.port=port;} public detach():void{this.port=null;}
  public async authorize(request:ComposerSecurityRequest):Promise<ComposerSecurityResult>{ if(!this.port)return Object.freeze({decision:'deny',reason:'Security capability is unavailable.',policyId:null}); const safe=Object.freeze({...request,subject:Object.freeze({...request.subject,roles:Object.freeze([...request.subject.roles])}),context:Object.freeze({...request.context})}); return this.port.authorize(safe); }
  public posture():ComposerSecurityPosture{return this.port?.posture()??Object.freeze({healthy:false,controls:Object.freeze({}),evaluatedAt:new Date().toISOString()});}
}
