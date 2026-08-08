/**
 * Artifact ID: QCQ-TBL-079
 * Artifact Name: MasterEffectsRegistry
 * Artifact Purpose: Registration and lookup authority for MASTER visual-fidelity phenomena, normalized regions, weights, and effect ownership.
 * Artifact Layer: Premium Effects / REG
 * Artifact Dependencies: QCQ-TBL-078
 * Artifact Dependents: QCQ-TBL-080
 * Dependency Graph: MasterEffectsManifest -> MasterEffectsRegistry -> MasterEffectsContract
 * Repository Path: QCQ/frontend/src/effects/master
 * Source File: MasterEffectsRegistry.ts
 */

import {
  MASTER_EFFECTS_MANIFEST,
  type MasterEffectPhenomenon,
  type MasterVisualRegion,
} from './MasterEffectsManifest';

export interface MasterEffectsRegistrySnapshot {
  readonly revision: number;
  readonly phenomena: readonly MasterEffectPhenomenon[];
}

export class MasterEffectsRegistry {
  private readonly byId = new Map<string, MasterEffectPhenomenon>();
  private revision = 0;

  public constructor(
    phenomena: readonly MasterEffectPhenomenon[] = MASTER_EFFECTS_MANIFEST.phenomena,
  ) {
    for (const phenomenon of phenomena) this.register(phenomenon);
  }

  public register(
    phenomenon: MasterEffectPhenomenon,
    replace = false,
  ): void {
    if (!phenomenon.id.trim()) throw new Error('MASTER effect phenomenon ID must be non-empty.');
    if (!phenomenon.name.trim()) throw new Error('MASTER effect phenomenon name must be non-empty.');
    if (phenomenon.fidelityWeight < 0 || phenomenon.fidelityWeight > 1) {
      throw new Error(`Invalid fidelity weight for ${phenomenon.id}.`);
    }
    if (this.byId.has(phenomenon.id) && !replace) {
      throw new Error(`MASTER effect phenomenon "${phenomenon.id}" is already registered.`);
    }
    this.byId.set(phenomenon.id, Object.freeze({
      ...phenomenon,
      regions: Object.freeze([...phenomenon.regions]),
    }));
    this.revision += 1;
  }

  public get(id: string): MasterEffectPhenomenon | null {
    return this.byId.get(id) ?? null;
  }

  public require(id: string): MasterEffectPhenomenon {
    const result = this.get(id);
    if (!result) throw new Error(`Unknown MASTER effect phenomenon "${id}".`);
    return result;
  }

  public list(): readonly MasterEffectPhenomenon[] {
    return Object.freeze([...this.byId.values()].sort((a, b) => a.id.localeCompare(b.id)));
  }

  public forRegion(region: MasterVisualRegion): readonly MasterEffectPhenomenon[] {
    return Object.freeze(this.list().filter((entry) => entry.regions.includes(region)));
  }

  public getSnapshot(): MasterEffectsRegistrySnapshot {
    return Object.freeze({
      revision: this.revision,
      phenomena: this.list(),
    });
  }

  public calculateWeightedFidelity(
    scores: Readonly<Record<string, number>>,
  ): number {
    let weighted = 0;
    let weight = 0;
    for (const phenomenon of this.byId.values()) {
      const score = Math.min(1, Math.max(0, scores[phenomenon.id] ?? 0));
      weighted += score * phenomenon.fidelityWeight;
      weight += phenomenon.fidelityWeight;
    }
    return weight === 0 ? 0 : weighted / weight;
  }
}

export const qcqMasterEffectsRegistry = new MasterEffectsRegistry();
