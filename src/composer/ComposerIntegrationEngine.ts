/**
 * Artifact ID: QCQ-CMP-018
 * Artifact Name: ComposerIntegrationEngine
 * Artifact Purpose: Dependency-ordered integration orchestration for registered composer adapters with policy checks, capability evidence, failure isolation, deterministic initialization, and reverse-order disposal.
 * Artifact Layer: Phase 10 — Master Composer / INT (Integration Authority)
 * Artifact Dependencies: QCQ-CMP-011 through QCQ-CMP-015
 * Artifact Dependents: QCQ-TBL-040/application integration
 * Dependency Graph: QCQ-CMP-011 through QCQ-CMP-015 -> ComposerIntegrationEngine -> QCQ-TBL-040/application integration
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerIntegrationEngine.ts
 */

import type { ComposerLifecycleEngine } from './ComposerLifecycleEngine';
import type { ComposerCapabilityId, ComposerCapabilityMatrix } from './ComposerCapabilityMatrix';
import type { ComposerOwnershipRegistry } from './ComposerOwnershipRegistry';
import type { ComposerPolicyEngine } from './ComposerPolicyEngine';
import { ComposerConflictResolver, type ComposerConflict } from './ComposerConflictResolver';

export type ComposerIntegrationStatus='registered'|'initializing'|'ready'|'degraded'|'failed'|'disposed';
export interface ComposerIntegrationContext { readonly signal:AbortSignal; readonly compositionId:string; }
export interface ComposerIntegrationAdapter {
  readonly id:string; readonly artifactId:string; readonly capability:ComposerCapabilityId; readonly dependencies:readonly string[]; readonly optional:boolean;
  initialize(context:ComposerIntegrationContext):void|Promise<void>;
  dispose():void|Promise<void>;
  health?(): 'ready'|'degraded'|'failed';
}
export interface ComposerIntegrationRecord { readonly id:string; readonly artifactId:string; readonly capability:ComposerCapabilityId; readonly optional:boolean; readonly status:ComposerIntegrationStatus; readonly error:string|null; }
export interface ComposerIntegrationSnapshot { readonly version:number; readonly initialized:boolean; readonly records:readonly ComposerIntegrationRecord[]; readonly conflicts:readonly ComposerConflict[]; }

export class ComposerIntegrationEngine {
  private readonly adapters=new Map<string,ComposerIntegrationAdapter>();
  private readonly records=new Map<string,ComposerIntegrationRecord>();
  private version=0; private initialized=false; private controller:AbortController|null=null; private order:string[]=[];
  public constructor(private readonly services:{readonly lifecycle:ComposerLifecycleEngine; readonly capabilities:ComposerCapabilityMatrix; readonly ownership:ComposerOwnershipRegistry; readonly policy:ComposerPolicyEngine}){}

  public register(adapter:ComposerIntegrationAdapter):ComposerIntegrationSnapshot {
    if (!adapter.id.trim()||!adapter.artifactId.trim()) throw new Error('Integration id and artifactId are required.');
    if (this.adapters.has(adapter.id)) throw new Error(`Duplicate composer integration ${adapter.id}.`);
    this.adapters.set(adapter.id,Object.freeze({...adapter,dependencies:Object.freeze([...adapter.dependencies])}));
    this.records.set(adapter.id,Object.freeze({id:adapter.id,artifactId:adapter.artifactId,capability:adapter.capability,optional:adapter.optional,status:'registered',error:null}));
    this.version+=1; return this.getSnapshot();
  }

  public async initialize(compositionId:string):Promise<ComposerIntegrationSnapshot>{
    if(this.initialized) return this.getSnapshot();
    this.controller=new AbortController();
    const conflicts=this.detectConflicts();
    const report=new ComposerConflictResolver().resolve(conflicts);
    if(!report.canContinue) throw new Error(`Composer integration conflicts block initialization: ${report.blockingConflictIds.join(', ')}.`);
    this.order=this.topologicalOrder();
    for(const id of this.order){
      const adapter=this.adapters.get(id); if(!adapter) continue;
      this.setStatus(id,'initializing',null);
      try{
        await adapter.initialize({signal:this.controller.signal,compositionId});
        const health=adapter.health?.()??'ready';
        this.setStatus(id,health==='failed'?'failed':health==='degraded'?'degraded':'ready',health==='failed'?'Integration health failed.':null);
        this.services.capabilities.registerEvidence({ capabilityId:adapter.capability, providerArtifactId:adapter.artifactId, status:health==='failed'?'blocked':health==='degraded'?'degraded':'available', version:null, observedAt:new Date().toISOString(), notes:Object.freeze([`Integration ${id} initialized.`]) });
        if(health==='failed'&&!adapter.optional) throw new Error(`Required integration ${id} failed health check.`);
      }catch(error){
        const message=error instanceof Error?error.message:'Integration initialization failed.';
        this.setStatus(id,'failed',message);
        this.services.capabilities.registerEvidence({ capabilityId:adapter.capability, providerArtifactId:adapter.artifactId, status:adapter.optional?'degraded':'blocked', version:null, observedAt:new Date().toISOString(), notes:Object.freeze([message]) });
        if(!adapter.optional) throw error;
      }
    }
    this.initialized=true; this.version+=1; return this.getSnapshot();
  }

  public async dispose():Promise<void>{
    this.controller?.abort();
    for(const id of [...this.order].reverse()){
      const adapter=this.adapters.get(id); if(!adapter) continue;
      try{await adapter.dispose();}finally{this.setStatus(id,'disposed',null);}
    }
    this.initialized=false; this.order=[]; this.controller=null; this.version+=1;
  }

  public getSnapshot():ComposerIntegrationSnapshot { return Object.freeze({version:this.version,initialized:this.initialized,records:Object.freeze([...this.records.values()].sort((a,b)=>a.id.localeCompare(b.id))),conflicts:Object.freeze(this.detectConflicts())}); }

  private detectConflicts():ComposerConflict[]{
    const conflicts:ComposerConflict[]=[];
    for(const adapter of this.adapters.values()){
      for(const dep of adapter.dependencies){ if(!this.adapters.has(dep)) conflicts.push(Object.freeze({id:`missing:${adapter.id}:${dep}`,kind:'integration',severity:adapter.optional?'warning':'error',artifactIds:Object.freeze([adapter.artifactId]),message:`Integration ${adapter.id} requires missing integration ${dep}.`,optional:adapter.optional})); }
    }
    return conflicts;
  }
  private topologicalOrder():string[]{
    const visiting=new Set<string>(); const visited=new Set<string>(); const result:string[]=[];
    const visit=(id:string)=>{ if(visited.has(id))return; if(visiting.has(id))throw new Error(`Integration dependency cycle at ${id}.`); visiting.add(id); const a=this.adapters.get(id); a?.dependencies.forEach(visit); visiting.delete(id); visited.add(id); result.push(id); };
    [...this.adapters.keys()].sort().forEach(visit); return result;
  }
  private setStatus(id:string,status:ComposerIntegrationStatus,error:string|null):void{ const r=this.records.get(id); if(!r)return; this.records.set(id,Object.freeze({...r,status,error})); this.version+=1; }
}
