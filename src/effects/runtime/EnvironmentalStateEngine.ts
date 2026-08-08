/**
 * Artifact ID: QCQ-TBL-071
 * Artifact Name: EnvironmentalStateEngine
 * Artifact Purpose: Pure environmental state machine for ambient intensity, storm energy, gameplay resonance, visibility, focus, motion, and quality state.
 * Artifact Layer: Premium Effects / STA
 * Artifact Dependencies: QCQ-TBL-065
 * Artifact Dependents: QCQ-TBL-069, QCQ-TBL-070, QCQ-TBL-073
 * Dependency Graph: ambient/gameplay/visibility inputs -> EnvironmentalStateEngine -> coordinator/sequencer/quality
 * Repository Path: QCQ/frontend/src/effects/runtime
 * Source File: EnvironmentalStateEngine.ts
 */

import type {
  EffectsMotion,
  EffectsQuality,
} from '../governance/EffectsManifest';

export type EnvironmentalPhase =
  | 'idle'
  | 'answering'
  | 'feedback-correct'
  | 'feedback-incorrect'
  | 'transition'
  | 'completed';

export interface EnvironmentalState {
  readonly revision: number;
  readonly phase: EnvironmentalPhase;
  readonly quality: EffectsQuality;
  readonly motion: EffectsMotion;
  readonly visible: boolean;
  readonly onscreen: boolean;
  readonly focused: boolean;
  readonly ambientIntensity: number;
  readonly stormEnergy: number;
  readonly electricalEnergy: number;
  readonly particleEnergy: number;
  readonly reflectionEnergy: number;
  readonly semanticPulse: number;
  readonly updatedAt: number;
}

export type EnvironmentalEvent =
  | { readonly type: 'environment:set-quality'; readonly quality: EffectsQuality; readonly motion: EffectsMotion }
  | { readonly type: 'environment:visibility'; readonly visible: boolean }
  | { readonly type: 'environment:onscreen'; readonly onscreen: boolean }
  | { readonly type: 'environment:focus'; readonly focused: boolean }
  | { readonly type: 'quiz:question-active' }
  | { readonly type: 'quiz:answer-selected' }
  | { readonly type: 'quiz:answer-correct' }
  | { readonly type: 'quiz:answer-incorrect' }
  | { readonly type: 'quiz:question-transition' }
  | { readonly type: 'quiz:completed' }
  | { readonly type: 'environment:set-ambient'; readonly intensity: number };

type StateListener = (state: EnvironmentalState) => void;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function freezeState(value: EnvironmentalState): EnvironmentalState {
  return Object.freeze({ ...value });
}

export class EnvironmentalStateEngine {
  private state: EnvironmentalState;
  private readonly listeners = new Set<StateListener>();

  public constructor(
    quality: EffectsQuality = 'balanced',
    motion: EffectsMotion = 'full',
  ) {
    this.state = freezeState({
      revision: 0,
      phase: 'idle',
      quality,
      motion,
      visible: true,
      onscreen: true,
      focused: true,
      ambientIntensity: 0.68,
      stormEnergy: 0.62,
      electricalEnergy: 0.32,
      particleEnergy: 0.48,
      reflectionEnergy: 0.56,
      semanticPulse: 0,
      updatedAt: Date.now(),
    });
  }

  public getSnapshot = (): EnvironmentalState => this.state;

  public subscribe = (listener: StateListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public dispatch(event: EnvironmentalEvent): EnvironmentalState {
    const current = this.state;
    let patch: Partial<EnvironmentalState>;

    switch (event.type) {
      case 'environment:set-quality':
        patch = { quality: event.quality, motion: event.motion };
        break;
      case 'environment:visibility':
        patch = { visible: event.visible };
        break;
      case 'environment:onscreen':
        patch = { onscreen: event.onscreen };
        break;
      case 'environment:focus':
        patch = { focused: event.focused };
        break;
      case 'environment:set-ambient':
        patch = { ambientIntensity: clamp01(event.intensity) };
        break;
      case 'quiz:question-active':
        patch = { phase: 'answering', stormEnergy: 0.62, electricalEnergy: 0.3, semanticPulse: 0 };
        break;
      case 'quiz:answer-selected':
        patch = { phase: 'answering', electricalEnergy: 0.42, semanticPulse: 0.22 };
        break;
      case 'quiz:answer-correct':
        patch = {
          phase: 'feedback-correct',
          electricalEnergy: 0.82,
          reflectionEnergy: 0.76,
          particleEnergy: 0.66,
          semanticPulse: 0.82,
        };
        break;
      case 'quiz:answer-incorrect':
        patch = {
          phase: 'feedback-incorrect',
          electricalEnergy: 0.62,
          reflectionEnergy: 0.64,
          particleEnergy: 0.42,
          semanticPulse: 0.58,
        };
        break;
      case 'quiz:question-transition':
        patch = { phase: 'transition', electricalEnergy: 0.5, semanticPulse: 0.34 };
        break;
      case 'quiz:completed':
        patch = {
          phase: 'completed',
          stormEnergy: 0.74,
          electricalEnergy: 0.68,
          particleEnergy: 0.78,
          reflectionEnergy: 0.82,
          semanticPulse: 0.92,
        };
        break;
    }

    this.state = freezeState({
      ...current,
      ...patch,
      revision: current.revision + 1,
      updatedAt: Date.now(),
    });
    for (const listener of this.listeners) listener(this.state);
    return this.state;
  }
}
