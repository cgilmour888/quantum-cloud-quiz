/**
 * Artifact ID: QCQ-TBL-066
 * Artifact Name: EffectsRegistry
 * Artifact Purpose: Deterministic effect registration, discovery, dependency validation, and activation-state authority.
 * Artifact Layer: Premium Effects / REG
 * Artifact Dependencies: QCQ-TBL-065
 * Artifact Dependents: QCQ-TBL-069, QCQ-TBL-075, QCQ-TBL-077, QCQ-TBL-079
 * Dependency Graph: EffectsManifest -> EffectsRegistry -> coordinator/validation/readiness/master registry
 * Repository Path: QCQ/frontend/src/effects/governance
 * Source File: EffectsRegistry.ts
 */

import {
  BUILTIN_EFFECT_DESCRIPTORS,
  type EffectKey,
  type EffectRegistrationDescriptor,
} from './EffectsManifest';

export type EffectRegistrationStatus = 'registered' | 'disabled' | 'unavailable';

export interface EffectRegistryEntry {
  readonly descriptor: EffectRegistrationDescriptor;
  readonly status: EffectRegistrationStatus;
  readonly source: 'builtin' | 'runtime';
  readonly registeredAt: number;
  readonly revision: number;
  readonly reason: string | null;
}

export interface EffectsRegistrySnapshot {
  readonly revision: number;
  readonly entries: readonly EffectRegistryEntry[];
}

export interface RegisterEffectOptions {
  readonly replace?: boolean;
  readonly status?: EffectRegistrationStatus;
  readonly reason?: string | null;
}

type RegistryListener = (snapshot: EffectsRegistrySnapshot) => void;

function freezeEntry(entry: EffectRegistryEntry): EffectRegistryEntry {
  return Object.freeze({ ...entry, descriptor: Object.freeze({ ...entry.descriptor }) });
}

export class EffectsRegistry {
  private readonly entries = new Map<EffectKey, EffectRegistryEntry>();
  private readonly listeners = new Set<RegistryListener>();
  private revision = 0;

  public constructor(registerBuiltins = true) {
    if (registerBuiltins) {
      for (const descriptor of BUILTIN_EFFECT_DESCRIPTORS) {
        this.register(descriptor, { replace: false, status: 'registered', reason: null }, 'builtin');
      }
    }
  }

  public register(
    descriptor: EffectRegistrationDescriptor,
    options: RegisterEffectOptions = {},
    source: EffectRegistryEntry['source'] = 'runtime',
  ): EffectRegistryEntry {
    this.assertDescriptor(descriptor);
    const existing = this.entries.get(descriptor.key);
    if (existing && !options.replace) {
      if (existing.descriptor.artifactId !== descriptor.artifactId) {
        throw new Error(
          `Effect key "${descriptor.key}" is already registered to ${existing.descriptor.artifactId}.`,
        );
      }
      return existing;
    }
    this.revision += 1;
    const next = freezeEntry({
      descriptor,
      status: options.status ?? 'registered',
      source,
      registeredAt: Date.now(),
      revision: this.revision,
      reason: options.reason ?? null,
    });
    this.entries.set(descriptor.key, next);
    this.emit();
    return next;
  }

  public setStatus(
    key: EffectKey,
    status: EffectRegistrationStatus,
    reason: string | null = null,
  ): EffectRegistryEntry {
    const current = this.require(key);
    this.revision += 1;
    const next = freezeEntry({ ...current, status, reason, revision: this.revision });
    this.entries.set(key, next);
    this.emit();
    return next;
  }

  public get(key: EffectKey): EffectRegistryEntry | null {
    return this.entries.get(key) ?? null;
  }

  public require(key: EffectKey): EffectRegistryEntry {
    const entry = this.get(key);
    if (!entry) throw new Error(`Effect "${key}" is not registered.`);
    return entry;
  }

  public list(status?: EffectRegistrationStatus): readonly EffectRegistryEntry[] {
    const values = [...this.entries.values()]
      .filter((entry) => status === undefined || entry.status === status)
      .sort((left, right) => left.descriptor.key.localeCompare(right.descriptor.key));
    return Object.freeze(values);
  }

  public getSnapshot = (): EffectsRegistrySnapshot =>
    Object.freeze({
      revision: this.revision,
      entries: this.list(),
    });

  public subscribe = (listener: RegistryListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public validateDependencyClosure(): readonly string[] {
    const issues: string[] = [];
    for (const entry of this.entries.values()) {
      for (const dependency of entry.descriptor.dependencies) {
        const resolved = this.entries.get(dependency);
        if (!resolved) {
          issues.push(`${entry.descriptor.key} requires missing effect ${dependency}.`);
          continue;
        }
        if (resolved.status === 'unavailable' && entry.status === 'registered') {
          issues.push(`${entry.descriptor.key} is active while dependency ${dependency} is unavailable.`);
        }
      }
    }
    return Object.freeze(issues);
  }

  private assertDescriptor(descriptor: EffectRegistrationDescriptor): void {
    if (!descriptor.artifactId.trim()) throw new Error('Effect artifactId must be non-empty.');
    if (!descriptor.artifactName.trim()) throw new Error('Effect artifactName must be non-empty.');
    if (!descriptor.repositoryPath.trim()) throw new Error('Effect repositoryPath must be non-empty.');
    if (!descriptor.pointerTransparent || !descriptor.assistiveTechnologyHidden) {
      throw new Error(`Effect "${descriptor.key}" violates the decorative-effects interaction contract.`);
    }
    if (descriptor.dependencies.includes(descriptor.key)) {
      throw new Error(`Effect "${descriptor.key}" cannot depend on itself.`);
    }
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot);
  }
}

export const qcqEffectsRegistry = new EffectsRegistry(true);
