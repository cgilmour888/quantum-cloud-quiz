/**
 * Artifact ID: QCQ-CMP-006
 * Artifact Name: ComposerRegistry
 * Repository Path: QCQ/frontend/src/composer/ComposerRegistry.ts
 */

import {
  COMPOSER_LIMITS,
  COMPOSER_ZONE_ORDER,
} from './ComposerConstants';
import {
  compareComposerVersions,
  isVersionCompatible,
} from './ComposerDependencyGraph';
import type {
  ComposerModuleDescriptor,
  ComposerModuleKind,
  ComposerModuleValue,
  ComposerRegistryLike,
  ComposerRegistrySnapshot,
  ComposerZoneId,
} from './ComposerTypes';

function emptyModulesByZone(): Record<
  ComposerZoneId,
  ComposerModuleDescriptor[]
> {
  return {
    environment: [],
    performance: [],
    tablet: [],
    metrics: [],
    'player-banner': [],
  };
}


function moduleOrder(value: ComposerModuleValue): number {
  if (
    typeof value === 'object' &&
    value !== null &&
    'order' in value &&
    typeof value.order === 'number'
  ) {
    return value.order;
  }
  return 0;
}

function freezeSnapshot(
  version: number,
  modules: ReadonlyMap<string, ComposerModuleDescriptor>,
): ComposerRegistrySnapshot {
  const modulesByZone = emptyModulesByZone();
  for (const descriptor of modules.values()) {
    if (descriptor.zone !== null) {
      modulesByZone[descriptor.zone].push(descriptor);
    }
  }

  for (const zone of COMPOSER_ZONE_ORDER) {
    modulesByZone[zone].sort((left, right) => {
      const leftOrder = moduleOrder(left.value);
      const rightOrder = moduleOrder(right.value);
      return leftOrder - rightOrder ||
        left.artifactId.localeCompare(right.artifactId);
    });
    Object.freeze(modulesByZone[zone]);
  }

  return Object.freeze({
    version,
    artifactIds: Object.freeze([...modules.keys()].sort()),
    modulesByZone: Object.freeze(modulesByZone),
  });
}

function normalizeDescriptor<
  TValue extends ComposerModuleValue,
>(
  descriptor: ComposerModuleDescriptor<TValue>,
): ComposerModuleDescriptor<TValue> {
  if (descriptor.artifactId.trim().length === 0) {
    throw new Error('Composer module artifactId cannot be empty.');
  }
  if (descriptor.artifactName.trim().length === 0) {
    throw new Error(
      `Composer module ${descriptor.artifactId} requires a name.`,
    );
  }
  if (descriptor.version.trim().length === 0) {
    throw new Error(
      `Composer module ${descriptor.artifactId} requires a version.`,
    );
  }
  if (
    new Set(descriptor.dependencies).size !==
    descriptor.dependencies.length
  ) {
    throw new Error(
      `Composer module ${descriptor.artifactId} contains duplicate dependencies.`,
    );
  }
  if (descriptor.dependencies.includes(descriptor.artifactId)) {
    throw new Error(
      `Composer module ${descriptor.artifactId} cannot depend upon itself.`,
    );
  }

  return Object.freeze({
    ...descriptor,
    dependencies: Object.freeze([...descriptor.dependencies]),
    compatibleWith: Object.freeze({
      ...descriptor.compatibleWith,
    }),
    metadata: Object.freeze({
      ...descriptor.metadata,
    }),
  });
}

export class ComposerRegistry implements ComposerRegistryLike {
  private readonly modules = new Map<
    string,
    ComposerModuleDescriptor
  >();
  private readonly subscribers = new Set<() => void>();
  private version = 0;
  private snapshot = freezeSnapshot(0, this.modules);

  public readonly subscribe = (
    listener: () => void,
  ): (() => void) => {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  };

  public readonly getSnapshot = (): ComposerRegistrySnapshot =>
    this.snapshot;

  public readonly getServerSnapshot = (): ComposerRegistrySnapshot =>
    this.snapshot;

  public has(artifactId: string): boolean {
    return this.modules.has(artifactId);
  }

  public register<TValue extends ComposerModuleValue>(
    descriptor: ComposerModuleDescriptor<TValue>,
  ): void {
    if (this.modules.size >= COMPOSER_LIMITS.maximumRegistryModules) {
      throw new Error(
        'Composer registry exceeds the configured module ceiling.',
      );
    }
    if (this.modules.has(descriptor.artifactId)) {
      throw new Error(
        `Composer module ${descriptor.artifactId} is already registered.`,
      );
    }
    this.modules.set(
      descriptor.artifactId,
      normalizeDescriptor(descriptor),
    );
    this.commit();
  }

  public registerAll(
    descriptors: readonly ComposerModuleDescriptor[],
  ): void {
    const incomingIds = new Set<string>();
    for (const descriptor of descriptors) {
      if (
        incomingIds.has(descriptor.artifactId) ||
        this.modules.has(descriptor.artifactId)
      ) {
        throw new Error(
          `Composer module ${descriptor.artifactId} is duplicated.`,
        );
      }
      incomingIds.add(descriptor.artifactId);
    }
    if (
      this.modules.size + descriptors.length >
      COMPOSER_LIMITS.maximumRegistryModules
    ) {
      throw new Error(
        'Composer registry exceeds the configured module ceiling.',
      );
    }
    for (const descriptor of descriptors) {
      this.modules.set(
        descriptor.artifactId,
        normalizeDescriptor(descriptor),
      );
    }
    this.commit();
  }

  public replace<TValue extends ComposerModuleValue>(
    descriptor: ComposerModuleDescriptor<TValue>,
  ): void {
    const current = this.modules.get(descriptor.artifactId);
    if (!current) {
      throw new Error(
        `Composer module ${descriptor.artifactId} is not registered.`,
      );
    }
    if (
      compareComposerVersions(
        descriptor.version,
        current.version,
      ) < 0
    ) {
      throw new Error(
        `Composer module ${descriptor.artifactId} cannot be replaced with an older version.`,
      );
    }
    this.modules.set(
      descriptor.artifactId,
      normalizeDescriptor(descriptor),
    );
    this.commit();
  }

  public remove(artifactId: string): void {
    if (!this.modules.delete(artifactId)) {
      throw new Error(
        `Composer module ${artifactId} is not registered.`,
      );
    }
    this.commit();
  }

  public enable(artifactId: string, enabled: boolean): void {
    const current = this.get(artifactId);
    if (current.enabled === enabled) return;
    this.modules.set(
      artifactId,
      Object.freeze({
        ...current,
        enabled,
      }),
    );
    this.commit();
  }

  public get<
    TValue extends ComposerModuleValue = ComposerModuleValue,
  >(
    artifactId: string,
  ): ComposerModuleDescriptor<TValue> {
    const descriptor = this.modules.get(artifactId);
    if (!descriptor) {
      throw new Error(
        `Composer module ${artifactId} is not registered.`,
      );
    }
    return descriptor as ComposerModuleDescriptor<TValue>;
  }

  public list(
    options: {
      readonly kind?: ComposerModuleKind;
      readonly zone?: ComposerZoneId;
      readonly enabledOnly?: boolean;
    } = {},
  ): readonly ComposerModuleDescriptor[] {
    return Object.freeze(
      [...this.modules.values()]
        .filter((descriptor) => {
          if (
            options.kind !== undefined &&
            descriptor.kind !== options.kind
          ) {
            return false;
          }
          if (
            options.zone !== undefined &&
            descriptor.zone !== options.zone
          ) {
            return false;
          }
          if (
            options.enabledOnly === true &&
            !descriptor.enabled
          ) {
            return false;
          }
          return true;
        })
        .sort((left, right) =>
          left.artifactId.localeCompare(right.artifactId)),
    );
  }

  public validateCompatibility(
    composerVersion: string,
  ): readonly string[] {
    const issues: string[] = [];
    for (const descriptor of this.modules.values()) {
      if (
        !isVersionCompatible(
          composerVersion,
          descriptor.compatibleWith.minimumVersion,
          descriptor.compatibleWith.maximumVersion,
        )
      ) {
        issues.push(
          `${descriptor.artifactId} is incompatible with composer ${composerVersion}.`,
        );
      }
    }
    return Object.freeze(issues);
  }

  public validateDependencies(): readonly string[] {
    const issues: string[] = [];
    for (const descriptor of this.modules.values()) {
      for (const dependencyId of descriptor.dependencies) {
        if (!this.modules.has(dependencyId)) {
          issues.push(
            `${descriptor.artifactId} requires unregistered module ${dependencyId}.`,
          );
        }
      }
    }
    return Object.freeze(issues);
  }

  private commit(): void {
    this.version += 1;
    this.snapshot = freezeSnapshot(this.version, this.modules);
    this.subscribers.forEach((listener) => listener());
  }
}

export function createComposerRegistry(
  descriptors: readonly ComposerModuleDescriptor[] = [],
): ComposerRegistry {
  const registry = new ComposerRegistry();
  if (descriptors.length > 0) {
    registry.registerAll(descriptors);
  }
  return registry;
}
