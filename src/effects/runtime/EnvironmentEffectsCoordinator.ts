/**
 * Artifact ID: QCQ-TBL-069
 * Artifact Name: EnvironmentEffectsCoordinator
 * Artifact Purpose: Composition authority that resolves environmental state, policies, capabilities, budgets, sequencing, and quality into one immutable effects plan.
 * Artifact Layer: Premium Effects / CMP
 * Artifact Dependencies: QCQ-TBL-066, QCQ-TBL-067, QCQ-TBL-068, QCQ-TBL-070, QCQ-TBL-071, QCQ-TBL-072, QCQ-TBL-073, QCQ-TBL-074
 * Artifact Dependents: QCQ-TBL-030, QCQ-TBL-031, QCQ-TBL-032, QCQ-TBL-033, QCQ-TBL-041, QCQ-APP-002 EnvironmentZone
 * Dependency Graph: governance + state + sequencer + performance -> coordinator -> existing effect renderers / EnvironmentZone
 * Repository Path: QCQ/frontend/src/effects/runtime
 * Source File: EnvironmentEffectsCoordinator.ts
 */

import type { EffectKey, EffectsMotion, EffectsQuality } from '../governance/EffectsManifest';
import {
  detectEffectsCapabilities,
  type EffectsCapabilitySnapshot,
} from '../governance/EffectsCapabilities';
import {
  resolveEffectsPolicy,
  type EffectsPolicy,
  type EffectsPolicyPreferences,
} from '../governance/EffectsPolicies';
import { EffectsRegistry, qcqEffectsRegistry } from '../governance/EffectsRegistry';
import {
  createEffectsPerformanceProfile,
  type EffectsPerformanceProfile,
} from '../performance/EffectsPerformanceProfile';
import {
  EffectsQualityScaler,
  type EffectsQualityDecision,
} from '../performance/EffectsQualityScaler';
import {
  EffectsBudgetManager,
  type EffectsBudgetSnapshot,
} from '../performance/EffectsBudgetManager';
import { EffectSequencer, type EffectCue } from './EffectSequencer';
import {
  EnvironmentalStateEngine,
  type EnvironmentalEvent,
  type EnvironmentalPhase,
  type EnvironmentalState,
} from './EnvironmentalStateEngine';

export interface EnvironmentEffectRenderPlan {
  readonly revision: number;
  readonly active: boolean;
  readonly quality: EffectsQuality;
  readonly motion: EffectsMotion;
  readonly globalIntensity: number;
  readonly effectEnabled: Readonly<Record<EffectKey, boolean>>;
  readonly stormIntensity: number;
  readonly lightningIntensity: number;
  readonly particleIntensity: number;
  readonly reflectionIntensity: number;
  readonly glowIntensity: number;
  readonly cues: readonly EffectCue[];
  readonly capabilities: EffectsCapabilitySnapshot;
  readonly policy: EffectsPolicy;
  readonly performance: EffectsPerformanceProfile;
  readonly qualityDecision: EffectsQualityDecision;
  readonly budget: EffectsBudgetSnapshot;
  readonly generatedAt: number;
}

type PlanListener = (plan: EnvironmentEffectRenderPlan) => void;

export class EnvironmentEffectsCoordinator {
  private readonly registry: EffectsRegistry;
  private readonly capabilities: EffectsCapabilitySnapshot;
  private readonly performance: EffectsPerformanceProfile;
  private readonly qualityScaler: EffectsQualityScaler;
  private readonly state: EnvironmentalStateEngine;
  private readonly sequencer = new EffectSequencer();
  private readonly listeners = new Set<PlanListener>();
  private preferences: EffectsPolicyPreferences;
  private revision = 0;
  private previousPhase: EnvironmentalPhase | null = null;
  private currentPlan: EnvironmentEffectRenderPlan;

  public constructor(options: {
    readonly registry?: EffectsRegistry;
    readonly capabilities?: EffectsCapabilitySnapshot;
    readonly preferences?: EffectsPolicyPreferences;
  } = {}) {
    this.registry = options.registry ?? qcqEffectsRegistry;
    this.capabilities = options.capabilities ?? detectEffectsCapabilities();
    this.performance = createEffectsPerformanceProfile(this.capabilities);
    this.qualityScaler = new EffectsQualityScaler(this.capabilities, this.performance);
    this.preferences = options.preferences ?? {};
    const policy = resolveEffectsPolicy(this.capabilities, this.preferences);
    this.state = new EnvironmentalStateEngine(policy.quality, policy.motion);
    this.currentPlan = this.buildPlan(policy, this.qualityScaler.decide({
      requestedQuality: policy.quality,
      requestedMotion: policy.motion,
    }), this.state.getSnapshot());
  }

  public dispatch(event: EnvironmentalEvent): EnvironmentEffectRenderPlan {
    const previous = this.state.getSnapshot();
    const next = this.state.dispatch(event);
    this.sequencer.deriveFromEnvironmentalState(next, this.previousPhase ?? previous.phase);
    this.previousPhase = next.phase;
    return this.recompute(next);
  }

  public setPreferences(preferences: EffectsPolicyPreferences): EnvironmentEffectRenderPlan {
    this.preferences = { ...preferences };
    const policy = resolveEffectsPolicy(this.capabilities, this.preferences);
    this.state.dispatch({
      type: 'environment:set-quality',
      quality: policy.quality,
      motion: policy.motion,
    });
    return this.recompute(this.state.getSnapshot());
  }

  public recordFrame(frameMs: number): EnvironmentEffectRenderPlan {
    this.qualityScaler.recordFrame(frameMs);
    return this.recompute(this.state.getSnapshot());
  }

  public getSnapshot = (): EnvironmentEffectRenderPlan => this.currentPlan;

  public subscribe = (listener: PlanListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private recompute(state: EnvironmentalState): EnvironmentEffectRenderPlan {
    const policy = resolveEffectsPolicy(this.capabilities, this.preferences);
    const decision = this.qualityScaler.decide({
      requestedQuality: policy.quality,
      requestedMotion: policy.motion,
    });
    this.currentPlan = this.buildPlan(policy, decision, state);
    for (const listener of this.listeners) listener(this.currentPlan);
    return this.currentPlan;
  }

  private buildPlan(
    policy: EffectsPolicy,
    decision: EffectsQualityDecision,
    state: EnvironmentalState,
  ): EnvironmentEffectRenderPlan {
    const active = decision.quality !== 'off' &&
      state.visible &&
      state.onscreen &&
      this.capabilities.documentVisible;

    const enabled = (key: EffectKey, base: boolean): boolean => {
      const registered = this.registry.get(key);
      const override = policy.effectOverrides[key];
      return active &&
        registered !== null &&
        registered.status === 'registered' &&
        (override ?? base);
    };

    const effectEnabled = Object.freeze({
      storm: enabled('storm', true),
      lightning: enabled('lightning', policy.lightningEnabled),
      particles: enabled('particles', policy.particlesEnabled),
      glow: enabled('glow', true),
      reflection: enabled('reflection', policy.reflectionsEnabled),
    });

    const budgetManager = new EffectsBudgetManager(this.performance, decision);
    if (effectEnabled.storm) budgetManager.reserve({
      effect: 'storm', frameTimeMs: 0.9, drawCalls: 10, particleCount: 0,
      lightningBranches: 0, blurRadiusPx: 8 * decision.blurScale, reflectionLayers: 0,
    });
    if (effectEnabled.lightning) budgetManager.reserve({
      effect: 'lightning', frameTimeMs: 0.7, drawCalls: 16, particleCount: 0,
      lightningBranches: Math.min(4, this.performance.lightningBranchCeiling),
      blurRadiusPx: 12 * decision.blurScale, reflectionLayers: 0,
    });
    if (effectEnabled.particles) budgetManager.reserve({
      effect: 'particles', frameTimeMs: 1.2, drawCalls: 8,
      particleCount: Math.round(this.performance.particleCeiling * decision.particleScale * 0.72),
      lightningBranches: 0, blurRadiusPx: 4 * decision.blurScale, reflectionLayers: 0,
    });
    if (effectEnabled.glow) budgetManager.reserve({
      effect: 'glow', frameTimeMs: 0.45, drawCalls: 12, particleCount: 0,
      lightningBranches: 0, blurRadiusPx: 18 * decision.blurScale, reflectionLayers: 0,
    });
    if (effectEnabled.reflection) budgetManager.reserve({
      effect: 'reflection', frameTimeMs: 0.75, drawCalls: 10, particleCount: 0,
      lightningBranches: 0, blurRadiusPx: 10 * decision.blurScale,
      reflectionLayers: Math.max(1, Math.floor(this.performance.reflectionLayerCeiling * decision.reflectionScale)),
    });

    this.revision += 1;
    const qualityFactor = ({ off: 0, performance: 0.55, balanced: 0.8, cinematic: 1 } as const)[decision.quality];
    const intensity = active ? policy.globalIntensity * qualityFactor : 0;

    return Object.freeze({
      revision: this.revision,
      active,
      quality: decision.quality,
      motion: decision.motion,
      globalIntensity: intensity,
      effectEnabled,
      stormIntensity: effectEnabled.storm ? intensity * state.stormEnergy : 0,
      lightningIntensity: effectEnabled.lightning ? intensity * state.electricalEnergy : 0,
      particleIntensity: effectEnabled.particles ? intensity * state.particleEnergy : 0,
      reflectionIntensity: effectEnabled.reflection ? intensity * state.reflectionEnergy : 0,
      glowIntensity: effectEnabled.glow ? intensity * Math.max(0.3, state.electricalEnergy) : 0,
      cues: this.sequencer.takeReady(Date.now()),
      capabilities: this.capabilities,
      policy,
      performance: this.performance,
      qualityDecision: decision,
      budget: budgetManager.getSnapshot(),
      generatedAt: Date.now(),
    });
  }
}
