/**
 * Artifact ID: QCQ-CMP-021
 * Artifact Name: ComposerMonitoringBridge
 * Artifact Purpose: Local health-probe orchestration with bounded history, aggregate status, and no implicit network ownership.
 * Artifact Layer: Phase 10 — Master Composer / MON (Monitoring Authority)
 * Artifact Dependencies: QCQ-CMP-011, QCQ-CMP-012
 * Artifact Dependents: QCQ-CMP-016, QCQ-CMP-022
 * Dependency Graph: QCQ-CMP-011, QCQ-CMP-012 -> ComposerMonitoringBridge -> QCQ-CMP-016, QCQ-CMP-022
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerMonitoringBridge.ts
 */

export type ComposerHealthStatus='healthy'|'degraded'|'unhealthy'|'unknown';
export interface ComposerHealthObservation { readonly probeId:string; readonly status:ComposerHealthStatus; readonly message:string; readonly observedAt:string; readonly latencyMs:number|null; }
export interface ComposerHealthProbe { readonly id:string; readonly critical:boolean; check():ComposerHealthObservation|Promise<ComposerHealthObservation>; }
export interface ComposerMonitoringSnapshot { readonly status:ComposerHealthStatus; readonly observations:readonly ComposerHealthObservation[]; readonly criticalFailures:readonly string[]; }

export class ComposerMonitoringBridge {
  private readonly probes=new Map<string,ComposerHealthProbe>(); private observations:readonly ComposerHealthObservation[]=Object.freeze([]);
  public register(probe:ComposerHealthProbe):void{ if(this.probes.has(probe.id))throw new Error(`Duplicate health probe ${probe.id}.`); this.probes.set(probe.id,probe); }
  public async checkAll():Promise<ComposerMonitoringSnapshot>{
    const observations:ComposerHealthObservation[]=[]; const criticalFailures:string[]=[];
    for(const probe of [...this.probes.values()].sort((a,b)=>a.id.localeCompare(b.id))){
      try{ const observation=await probe.check(); observations.push(Object.freeze({...observation})); if(probe.critical&&observation.status==='unhealthy')criticalFailures.push(probe.id); }
      catch(error){ const message=error instanceof Error?error.message:'Health probe failed.'; observations.push(Object.freeze({probeId:probe.id,status:'unhealthy',message,observedAt:new Date().toISOString(),latencyMs:null})); if(probe.critical)criticalFailures.push(probe.id); }
    }
    this.observations=Object.freeze(observations);
    return Object.freeze({status:this.aggregate(observations,criticalFailures),observations:this.observations,criticalFailures:Object.freeze(criticalFailures)});
  }
  public getSnapshot():ComposerMonitoringSnapshot{ return Object.freeze({status:this.aggregate(this.observations,[]),observations:this.observations,criticalFailures:Object.freeze([])}); }
  private aggregate(items:readonly ComposerHealthObservation[],critical:readonly string[]):ComposerHealthStatus{ if(critical.length)return'unhealthy'; if(items.length===0)return'unknown'; if(items.some((x)=>x.status==='unhealthy'||x.status==='degraded'))return'degraded'; if(items.every((x)=>x.status==='healthy'))return'healthy'; return'unknown'; }
}
