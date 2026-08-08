/**
 * Artifact ID: QCQ-CMP-017
 * Artifact Name: ComposerCertificationEngine
 * Artifact Purpose: Tamper-evident composition certification authority that issues deterministic evidence certificates only for evidence-backed readiness states and never self-certifies deployment.
 * Artifact Layer: Phase 10 — Master Composer / CRT (Certification Authority)
 * Artifact Dependencies: QCQ-CMP-016
 * Artifact Dependents: Release/launch certification consumers
 * Dependency Graph: QCQ-CMP-016 -> ComposerCertificationEngine -> Release/launch certification consumers
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerCertificationEngine.ts
 */

import type { ComposerReadinessReport } from './ComposerReadinessEvaluator';

export type ComposerCertificationLevel = 'platform' | 'enterprise' | 'government';
export interface ComposerCertificationEvidence { readonly id:string; readonly passed:boolean; readonly digest:string; readonly observedAt:string; }
export interface ComposerCertificate { readonly certificateId:string; readonly level:ComposerCertificationLevel; readonly readinessStatus:string; readonly issuedAt:string; readonly expiresAt:string|null; readonly evidenceDigest:string; readonly evidenceIds:readonly string[]; readonly valid:true; }

function fnv1a(value:string):string { let hash=0x811c9dc5; for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i); hash=Math.imul(hash,0x01000193)>>>0;} return hash.toString(16).padStart(8,'0'); }

export class ComposerCertificationEngine {
  public certify(level:ComposerCertificationLevel, readiness:ComposerReadinessReport, evidence:readonly ComposerCertificationEvidence[], options:{readonly expiresAt?:string|null}={}):ComposerCertificate {
    const requiredStatus = level==='government'?'government-ready':level==='enterprise'?'enterprise-ready':null;
    if (!readiness.ready || readiness.status==='blocked' || readiness.status==='conditional') throw new Error(`Composer readiness ${readiness.status} is not certifiable.`);
    if (requiredStatus && readiness.status!==requiredStatus && !(level==='enterprise'&&readiness.status==='government-ready')) throw new Error(`${level} certification requires ${requiredStatus} readiness.`);
    if (evidence.length===0 || evidence.some((item)=>!item.passed || !item.digest.trim())) throw new Error('Certification requires non-empty passing evidence with digests.');
    const ordered=[...evidence].sort((a,b)=>a.id.localeCompare(b.id));
    const payload=ordered.map((item)=>`${item.id}:${item.digest}:${item.observedAt}`).join('|');
    const digest=fnv1a(`${level}|${readiness.status}|${payload}`);
    const issuedAt=new Date().toISOString();
    return Object.freeze({ certificateId:`QCQ-CMP-CERT-${level.toUpperCase()}-${digest}`, level, readinessStatus:readiness.status, issuedAt, expiresAt:options.expiresAt??null, evidenceDigest:digest, evidenceIds:Object.freeze(ordered.map((item)=>item.id)), valid:true });
  }

  public verify(certificate:ComposerCertificate, evidence:readonly ComposerCertificationEvidence[]):boolean {
    if (!certificate.valid || evidence.length===0) return false;
    if (certificate.expiresAt && Date.parse(certificate.expiresAt)<=Date.now()) return false;
    const ordered=[...evidence].sort((a,b)=>a.id.localeCompare(b.id));
    if (ordered.some((item)=>!item.passed)) return false;
    const payload=ordered.map((item)=>`${item.id}:${item.digest}:${item.observedAt}`).join('|');
    return fnv1a(`${certificate.level}|${certificate.readinessStatus}|${payload}`)===certificate.evidenceDigest && certificate.evidenceIds.join('|')===ordered.map((item)=>item.id).join('|');
  }
}
