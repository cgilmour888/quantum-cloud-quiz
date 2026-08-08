/**
 * Artifact ID: QCQ-CMP-020
 * Artifact Name: ComposerQualityScaler
 * Artifact Purpose: Adaptive rendering-cost scaler with hysteresis that preserves APP-002 geometry, semantic content, accessibility, and tablet primacy while reducing optional visual expense.
 * Artifact Layer: Phase 10 — Master Composer / SCL (Scaling Authority)
 * Artifact Dependencies: QCQ-CMP-012, QCQ-CMP-019
 * Artifact Dependents: QCQ-CMP-023, QCQ-TBL-040 integration
 * Dependency Graph: QCQ-CMP-012, QCQ-CMP-019 -> ComposerQualityScaler -> QCQ-CMP-023, QCQ-TBL-040 integration
 * Repository Path: QCQ/frontend/src/composer
 * Source File: ComposerQualityScaler.ts
 */

import type { ComposerPerformanceSnapshot, ComposerPerformanceTier } from './ComposerPerformanceProfile';

export interface ComposerQualityConstraints {
  readonly reducedMotion: boolean;
  readonly reducedTransparency: boolean;
  readonly reducedSensory: boolean;
  readonly batterySaver: boolean;
}

export interface ComposerQualityPlan {
  readonly tier: ComposerPerformanceTier;
  readonly particleFactor: number;
  readonly reflectionFactor: number;
  readonly bloomFactor: number;
  readonly stormFactor: number;
  readonly lightningComplexity: number;
  readonly animationRateFactor: number;
  readonly preservesGeometry: true;
  readonly preservesSemantics: true;
}

const ORDER: readonly ComposerPerformanceTier[] = Object.freeze(['reduced','balanced','high','ultra']);

export class ComposerQualityScaler {
  private tier: ComposerPerformanceTier;
  private healthyWindows=0;
  private unhealthyWindows=0;
  public constructor(initial: ComposerPerformanceTier='balanced') { this.tier=initial; }

  public evaluate(performance: ComposerPerformanceSnapshot, constraints: ComposerQualityConstraints): ComposerQualityPlan {
    if (constraints.reducedMotion || constraints.reducedSensory || constraints.batterySaver) {
      this.tier='reduced'; this.healthyWindows=0; this.unhealthyWindows=0; return this.plan(constraints);
    }
    if (performance.sampleCount < 30) return this.plan(constraints);
    if (performance.withinBudget) { this.healthyWindows+=1; this.unhealthyWindows=0; }
    else { this.unhealthyWindows+=1; this.healthyWindows=0; }
    if (this.unhealthyWindows>=2) { this.shift(-1); this.unhealthyWindows=0; }
    else if (this.healthyWindows>=8) { this.shift(1); this.healthyWindows=0; }
    return this.plan(constraints);
  }

  public forceTier(tier: ComposerPerformanceTier, constraints: ComposerQualityConstraints): ComposerQualityPlan { this.tier=tier; this.healthyWindows=0; this.unhealthyWindows=0; return this.plan(constraints); }

  private shift(direction: -1|1): void {
    const current=ORDER.indexOf(this.tier);
    const next=Math.min(ORDER.length-1,Math.max(0,current+direction));
    this.tier=ORDER[next] ?? 'balanced';
  }

  private plan(c: ComposerQualityConstraints): ComposerQualityPlan {
    const values: Record<ComposerPerformanceTier, readonly [number,number,number,number,number,number]> = {
      ultra:[1,1,1,1,1,1], high:[.82,.82,.86,.9,.86,.92], balanced:[.58,.58,.68,.72,.65,.8], reduced:[.22,.18,.28,.34,.25,.45]
    };
    const v=values[this.tier];
    const transparency=c.reducedTransparency?0:v[1];
    const motion=c.reducedMotion?0:v[5];
    return Object.freeze({ tier:this.tier, particleFactor:c.reducedSensory?0:v[0], reflectionFactor:transparency, bloomFactor:c.reducedSensory?0:v[2], stormFactor:c.reducedSensory?.1:v[3], lightningComplexity:c.reducedSensory?.1:v[4], animationRateFactor:motion, preservesGeometry:true, preservesSemantics:true });
  }
}
