/**
 * Artifact ID: QCQ-TBL-074
 * Artifact Name: EffectsBudgetManager
 * Artifact Purpose: Budget authority that reserves and accounts frame-time, particle, lightning, blur, reflection, and draw-call budgets without allowing runaway effects.
 * Artifact Layer: Premium Effects / BGT
 * Artifact Dependencies: QCQ-TBL-072, QCQ-TBL-073
 * Artifact Dependents: QCQ-TBL-069, QCQ-TBL-075, QCQ-TBL-077
 * Dependency Graph: profile + quality decision -> EffectsBudgetManager -> coordinator/validator/readiness
 * Repository Path: QCQ/frontend/src/effects/performance
 * Source File: EffectsBudgetManager.ts
 */

import type { EffectKey } from '../governance/EffectsManifest';
import type { EffectsPerformanceProfile } from './EffectsPerformanceProfile';
import type { EffectsQualityDecision } from './EffectsQualityScaler';

export interface EffectBudgetReservation {
  readonly effect: EffectKey;
  readonly frameTimeMs: number;
  readonly drawCalls: number;
  readonly particleCount: number;
  readonly lightningBranches: number;
  readonly blurRadiusPx: number;
  readonly reflectionLayers: number;
}

export interface EffectsBudgetSnapshot {
  readonly frameBudgetMs: number;
  readonly effectsBudgetMs: number;
  readonly consumedFrameTimeMs: number;
  readonly consumedDrawCalls: number;
  readonly consumedParticles: number;
  readonly consumedLightningBranches: number;
  readonly maxBlurRadiusPx: number;
  readonly consumedReflectionLayers: number;
  readonly reservations: readonly EffectBudgetReservation[];
  readonly withinBudget: boolean;
  readonly violations: readonly string[];
}

function nonNegative(value: number): number {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

export class EffectsBudgetManager {
  private readonly reservations = new Map<EffectKey, EffectBudgetReservation>();

  public constructor(
    private readonly profile: EffectsPerformanceProfile,
    private readonly quality: EffectsQualityDecision,
  ) {}

  public reserve(reservation: EffectBudgetReservation): void {
    const normalized = Object.freeze({
      ...reservation,
      frameTimeMs: nonNegative(reservation.frameTimeMs),
      drawCalls: Math.floor(nonNegative(reservation.drawCalls)),
      particleCount: Math.floor(nonNegative(reservation.particleCount)),
      lightningBranches: Math.floor(nonNegative(reservation.lightningBranches)),
      blurRadiusPx: nonNegative(reservation.blurRadiusPx),
      reflectionLayers: Math.floor(nonNegative(reservation.reflectionLayers)),
    });
    this.reservations.set(reservation.effect, normalized);
  }

  public release(effect: EffectKey): void {
    this.reservations.delete(effect);
  }

  public clear(): void {
    this.reservations.clear();
  }

  public getSnapshot(): EffectsBudgetSnapshot {
    const reservations = [...this.reservations.values()];
    const consumedFrameTimeMs = reservations.reduce((sum, value) => sum + value.frameTimeMs, 0);
    const consumedDrawCalls = reservations.reduce((sum, value) => sum + value.drawCalls, 0);
    const consumedParticles = reservations.reduce((sum, value) => sum + value.particleCount, 0);
    const consumedLightningBranches = reservations.reduce((sum, value) => sum + value.lightningBranches, 0);
    const maxBlurRadiusPx = reservations.reduce((max, value) => Math.max(max, value.blurRadiusPx), 0);
    const consumedReflectionLayers = reservations.reduce((sum, value) => sum + value.reflectionLayers, 0);

    const particleCeiling = Math.round(this.profile.particleCeiling * this.quality.particleScale);
    const blurCeiling = this.profile.blurRadiusCeilingPx * this.quality.blurScale;
    const reflectionCeiling = Math.ceil(this.profile.reflectionLayerCeiling * this.quality.reflectionScale);

    const violations: string[] = [];
    if (consumedFrameTimeMs > this.profile.effectsBudgetMs + 0.001) {
      violations.push(`Effects frame-time budget exceeded: ${consumedFrameTimeMs.toFixed(2)} > ${this.profile.effectsBudgetMs.toFixed(2)} ms.`);
    }
    if (consumedDrawCalls > this.profile.drawCallCeiling) {
      violations.push(`Draw-call ceiling exceeded: ${consumedDrawCalls} > ${this.profile.drawCallCeiling}.`);
    }
    if (consumedParticles > particleCeiling) {
      violations.push(`Particle ceiling exceeded: ${consumedParticles} > ${particleCeiling}.`);
    }
    if (consumedLightningBranches > this.profile.lightningBranchCeiling) {
      violations.push(`Lightning branch ceiling exceeded: ${consumedLightningBranches} > ${this.profile.lightningBranchCeiling}.`);
    }
    if (maxBlurRadiusPx > blurCeiling + 0.001) {
      violations.push(`Blur radius ceiling exceeded: ${maxBlurRadiusPx.toFixed(2)} > ${blurCeiling.toFixed(2)} px.`);
    }
    if (consumedReflectionLayers > reflectionCeiling) {
      violations.push(`Reflection layer ceiling exceeded: ${consumedReflectionLayers} > ${reflectionCeiling}.`);
    }

    return Object.freeze({
      frameBudgetMs: this.profile.frameBudgetMs,
      effectsBudgetMs: this.profile.effectsBudgetMs,
      consumedFrameTimeMs,
      consumedDrawCalls,
      consumedParticles,
      consumedLightningBranches,
      maxBlurRadiusPx,
      consumedReflectionLayers,
      reservations: Object.freeze(reservations),
      withinBudget: violations.length === 0,
      violations: Object.freeze(violations),
    });
  }
}
