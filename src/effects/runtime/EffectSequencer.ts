/**
 * Artifact ID: QCQ-TBL-070
 * Artifact Name: EffectSequencer
 * Artifact Purpose: Deterministic priority-aware sequencing authority for bounded ambient and semantic visual-effect cues.
 * Artifact Layer: Premium Effects / SEQ
 * Artifact Dependencies: QCQ-TBL-071
 * Artifact Dependents: QCQ-TBL-069
 * Dependency Graph: EnvironmentalStateEngine -> EffectSequencer -> EnvironmentEffectsCoordinator
 * Repository Path: QCQ/frontend/src/effects/runtime
 * Source File: EffectSequencer.ts
 */

import type { EffectKey } from '../governance/EffectsManifest';
import type { EnvironmentalPhase, EnvironmentalState } from './EnvironmentalStateEngine';

export type EffectCueKind =
  | 'ambient'
  | 'lightning-pulse'
  | 'glow-pulse'
  | 'particle-lift'
  | 'reflection-sweep';

export interface EffectCue {
  readonly id: string;
  readonly effect: EffectKey;
  readonly kind: EffectCueKind;
  readonly priority: number;
  readonly intensity: number;
  readonly earliestAt: number;
  readonly expiresAt: number;
  readonly source: string;
}

export interface SequencerSnapshot {
  readonly revision: number;
  readonly queued: readonly EffectCue[];
  readonly lastIssuedAt: Readonly<Partial<Record<EffectKey, number>>>;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function cueDuration(kind: EffectCueKind): number {
  switch (kind) {
    case 'lightning-pulse': return 420;
    case 'glow-pulse': return 520;
    case 'particle-lift': return 900;
    case 'reflection-sweep': return 760;
    case 'ambient': return 1600;
  }
}

function minimumInterval(effect: EffectKey): number {
  switch (effect) {
    case 'lightning': return 1_200;
    case 'particles': return 300;
    case 'reflection': return 180;
    case 'glow': return 120;
    case 'storm': return 400;
  }
}

export class EffectSequencer {
  private queue: EffectCue[] = [];
  private revision = 0;
  private lastIssuedAt: Partial<Record<EffectKey, number>> = {};

  public enqueue(
    effect: EffectKey,
    kind: EffectCueKind,
    intensity: number,
    source: string,
    priority = 50,
    now = Date.now(),
  ): EffectCue {
    if (!source.trim()) throw new Error('Effect cue source must be non-empty.');
    const cue: EffectCue = Object.freeze({
      id: `qcq-fx-${effect}-${this.revision + 1}-${now.toString(36)}`,
      effect,
      kind,
      priority: Math.round(Math.min(100, Math.max(0, priority))),
      intensity: clamp01(intensity),
      earliestAt: now,
      expiresAt: now + cueDuration(kind),
      source,
    });
    this.queue.push(cue);
    this.queue.sort((a, b) => b.priority - a.priority || a.earliestAt - b.earliestAt);
    this.revision += 1;
    return cue;
  }

  public deriveFromEnvironmentalState(
    state: EnvironmentalState,
    previousPhase: EnvironmentalPhase | null,
    now = Date.now(),
  ): readonly EffectCue[] {
    if (!state.visible || !state.onscreen || state.quality === 'off') return Object.freeze([]);
    if (previousPhase === state.phase) return Object.freeze([]);

    const created: EffectCue[] = [];
    if (state.semanticPulse > 0) {
      created.push(this.enqueue('glow', 'glow-pulse', state.semanticPulse, state.phase, 80, now));
      created.push(this.enqueue('reflection', 'reflection-sweep', state.reflectionEnergy, state.phase, 56, now));
    }
    if (state.phase === 'feedback-correct' || state.phase === 'completed') {
      created.push(this.enqueue('particles', 'particle-lift', state.particleEnergy, state.phase, 44, now));
    }
    if (state.motion === 'full' && state.electricalEnergy >= 0.72) {
      created.push(this.enqueue('lightning', 'lightning-pulse', state.electricalEnergy, state.phase, 64, now));
    }
    return Object.freeze(created);
  }

  public takeReady(now = Date.now(), limit = 8): readonly EffectCue[] {
    this.queue = this.queue.filter((cue) => cue.expiresAt >= now);
    const ready: EffectCue[] = [];
    const retained: EffectCue[] = [];

    for (const cue of this.queue) {
      if (ready.length >= Math.max(0, limit)) {
        retained.push(cue);
        continue;
      }
      const last = this.lastIssuedAt[cue.effect] ?? -Infinity;
      if (cue.earliestAt <= now && now - last >= minimumInterval(cue.effect)) {
        ready.push(cue);
        this.lastIssuedAt[cue.effect] = now;
      } else {
        retained.push(cue);
      }
    }

    this.queue = retained;
    if (ready.length > 0) this.revision += 1;
    return Object.freeze(ready);
  }

  public clear(source?: string): void {
    this.queue = source === undefined ? [] : this.queue.filter((cue) => cue.source !== source);
    this.revision += 1;
  }

  public getSnapshot(): SequencerSnapshot {
    return Object.freeze({
      revision: this.revision,
      queued: Object.freeze([...this.queue]),
      lastIssuedAt: Object.freeze({ ...this.lastIssuedAt }),
    });
  }
}
