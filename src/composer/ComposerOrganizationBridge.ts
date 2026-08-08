/**
 * Artifact ID: QCQ-CMP-028
 * Artifact Name: ComposerOrganizationBridge
 * Artifact Purpose: Tenant/organization context bridge exposing immutable organizational identity and policy context without owning authentication, tenancy, or layout.
 * Artifact Layer: Phase 10 — Master Composer / BRG (Organization Bridge Authority)
 * Artifact Dependencies: Organization subsystem supplied through port
 * Artifact Dependents: Enterprise/government composition policy
 * Dependency Graph: Organization subsystem supplied through port -> ComposerOrganizationBridge -> Enterprise/government composition policy
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerOrganizationBridge.ts
 */

export interface ComposerOrganizationContext { readonly organizationId:string; readonly displayName:string; readonly tenantId:string; readonly roles:readonly string[]; readonly policyFlags:Readonly<Record<string,boolean>>; }
export interface ComposerOrganizationPort { getContext():ComposerOrganizationContext|null; subscribe?(listener:()=>void):()=>void; }
export class ComposerOrganizationBridge { public constructor(private port:ComposerOrganizationPort|null=null){} public attach(port:ComposerOrganizationPort):void{this.port=port;} public detach():void{this.port=null;} public getContext():ComposerOrganizationContext|null{const c=this.port?.getContext()??null;return c?Object.freeze({...c,roles:Object.freeze([...c.roles]),policyFlags:Object.freeze({...c.policyFlags})}):null;} }
