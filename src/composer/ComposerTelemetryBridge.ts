/**
 * Artifact ID: QCQ-CMP-022
 * Artifact Name: ComposerTelemetryBridge
 * Artifact Purpose: Privacy-bounded telemetry queue and optional sink bridge with bounded memory, sanitization, explicit flushing, and no implicit fetch/network behavior.
 * Artifact Layer: Phase 10 — Master Composer / TEL (Telemetry Authority)
 * Artifact Dependencies: QCQ-CMP-021
 * Artifact Dependents: QCQ-CMP-016, operations integration
 * Dependency Graph: QCQ-CMP-021 -> ComposerTelemetryBridge -> QCQ-CMP-016, operations integration
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerTelemetryBridge.ts
 */

export type ComposerTelemetryPrimitive=string|number|boolean|null;
export interface ComposerTelemetryEvent { readonly name:string; readonly occurredAt:string; readonly properties:Readonly<Record<string,ComposerTelemetryPrimitive>>; }
export interface ComposerTelemetrySink { write(events:readonly ComposerTelemetryEvent[]):void|Promise<void>; }
export interface ComposerTelemetrySnapshot { readonly queued:number; readonly dropped:number; readonly lastFlushedAt:string|null; readonly sinkAttached:boolean; }

const DENIED_KEYS=/pass(word)?|token|secret|authorization|cookie|session[-_]?key/i;
export class ComposerTelemetryBridge {
  private readonly queue:ComposerTelemetryEvent[]=[]; private dropped=0; private lastFlushedAt:string|null=null;
  public constructor(private sink:ComposerTelemetrySink|null=null,private readonly maximumQueue=5000,private readonly maximumBatch=200){}
  public setSink(sink:ComposerTelemetrySink|null):void{this.sink=sink;}
  public record(name:string,properties:Readonly<Record<string,unknown>>={}):ComposerTelemetrySnapshot{
    if(!name.trim())throw new Error('Telemetry event name is required.');
    const sanitized:Record<string,ComposerTelemetryPrimitive>={};
    for(const [key,value] of Object.entries(properties)){ if(DENIED_KEYS.test(key))continue; if(value===null||['string','number','boolean'].includes(typeof value)) sanitized[key]=value as ComposerTelemetryPrimitive; }
    if(this.queue.length>=this.maximumQueue){this.queue.shift();this.dropped+=1;}
    this.queue.push(Object.freeze({name,occurredAt:new Date().toISOString(),properties:Object.freeze(sanitized)})); return this.getSnapshot();
  }
  public async flush():Promise<ComposerTelemetrySnapshot>{
    if(!this.sink||this.queue.length===0)return this.getSnapshot();
    const batch=Object.freeze(this.queue.slice(0,this.maximumBatch)); await this.sink.write(batch); this.queue.splice(0,batch.length); this.lastFlushedAt=new Date().toISOString(); return this.getSnapshot();
  }
  public clear():void{this.queue.length=0;}
  public getSnapshot():ComposerTelemetrySnapshot{return Object.freeze({queued:this.queue.length,dropped:this.dropped,lastFlushedAt:this.lastFlushedAt,sinkAttached:this.sink!==null});}
}
