/**
 * Artifact ID: QCQ-TBL-073
 * Artifact Name: EffectsQualityScaler
 * Artifact Purpose: Deterministic adaptive quality scaler selecting safe effect quality and render scale from capabilities, profile, visibility, motion preference, and measured frame time.
 * Artifact Layer: Premium Effects / SCL
 * Artifact Dependencies: QCQ-TBL-068, QCQ-TBL-072
 * Artifact Dependents: QCQ-TBL-069, QCQ-TBL-074, QCQ-TBL-077
 * Dependency Graph: capabilities + performance profile + frame samples -> EffectsQualityScaler -> coordinator/budget/readiness
 * Repository Path: QCQ/frontend/src/effects/performance
 * Source File: EffectsQualityScaler.ts
 */

import type { EffectsCapabilitySnapshot } from '../governance/EffectsCapabilities';
import type { EffectsMotion, EffectsQuality } from '../governance/EffectsManifest';
import type { EffectsPerformanceProfile } from './EffectsPerformanceProfile';

export interface EffectsQualityDecision {
  readonly quality: EffectsQuality;
  readonly motion: EffectsMotion;
  readonly renderScale: number;
  readonly particleScale: number;
  readonly blurScale: number;
  readonly reflectionScale: number;
  readonly reason: string;
  readonly averageFrameMs: number | null;
}

export interface EffectsQualityScalerOptions {
  readonly requestedQuality?: EffectsQuality;
  readonly requestedMotion?: EffectsMotion;
  readonly minimumQuality?: Exclude<EffectsQuality, 'cinematic'>;
}

const ORDER: readonly EffectsQuality[] = ['off', 'performance', 'balanced', 'cinematic'];

function rank(value: EffectsQuality): number {
  return ORDER.indexOf(value);
}

function byRank(value: number): EffectsQuality {
  return ORDER[Math.max(0, Math.min(ORDER.length - 1, Math.round(value)))] ?? 'off';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export class EffectsQualityScaler {
  private readonly samples: number[] = [];

  public constructor(
    private readonly capabilities: EffectsCapabilitySnapshot,
    private readonly profile: EffectsPerformanceProfile,
  ) {}

  public recordFrame(frameMs: number): void {
    if (!Number.isFinite(frameMs) || frameMs <= 0 || frameMs > 1000) return;
    this.samples.push(frameMs);
    const overflow = this.samples.length - this.profile.adaptiveSampleWindow;
    if (overflow > 0) this.samples.splice(0, overflow);
  }

  public resetSamples(): void {
    this.samples.length = 0;
  }

  public decide(
    options: EffectsQualityScalerOptions = {},
  ): EffectsQualityDecision {
    if (
      !this.capabilities.browser ||
      this.capabilities.forcedColors ||
      !this.capabilities.canvas2D ||
      !this.capabilities.svg
    ) {
      return Object.freeze({
        quality: 'off',
        motion: 'static',
        renderScale: 0,
        particleScale: 0,
        blurScale: 0,
        reflectionScale: 0,
        reason: 'Rendering capability or accessibility policy disables decorative effects.',
        averageFrameMs: this.averageFrameMs(),
      });
    }

    const average = this.averageFrameMs();
    let quality = options.requestedQuality ?? this.profile.defaultQuality;
    quality = rank(quality) <= rank(this.profile.defaultQuality)
      ? quality
      : this.profile.defaultQuality;

    if (this.capabilities.saveData) quality = 'performance';
    if (average !== null) {
      if (average > this.profile.frameBudgetMs * 1.45) quality = byRank(rank(quality) - 2);
      else if (average > this.profile.frameBudgetMs * 1.15) quality = byRank(rank(quality) - 1);
    }

    const minimum = options.minimumQuality ?? 'off';
    if (rank(quality) < rank(minimum) && quality !== 'off') quality = minimum;

    const motion: EffectsMotion = this.capabilities.prefersReducedMotion
      ? 'reduced'
      : options.requestedMotion ?? 'full';

    const qualityScale = ({ off: 0, performance: 0.55, balanced: 0.8, cinematic: 1 } as const)[quality];
    const dprScale = clamp(
      this.profile.canvasDprCeiling / Math.max(1, this.capabilities.devicePixelRatio),
      0.45,
      1,
    );

    return Object.freeze({
      quality,
      motion,
      renderScale: quality === 'off' ? 0 : Math.min(1, qualityScale * dprScale + 0.15),
      particleScale: qualityScale,
      blurScale: quality === 'performance' ? 0.48 : qualityScale,
      reflectionScale: quality === 'performance' ? 0.58 : qualityScale,
      reason: average === null
        ? 'Initial capability-based quality decision.'
        : `Adaptive decision from ${average.toFixed(2)} ms average frame time.`,
      averageFrameMs: average,
    });
  }

  public averageFrameMs(): number | null {
    if (this.samples.length === 0) return null;
    return this.samples.reduce((sum, value) => sum + value, 0) / this.samples.length;
  }
}
