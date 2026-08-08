/**
 * Artifact ID: QCQ-THM-009
 * Artifact Name: VisualRegistry
 * Repository Path: QCQ/frontend/src/styles/VisualRegistry.ts
 */

export type VisualArtifactKind =
  | 'token-set'
  | 'theme'
  | 'effect'
  | 'motion'
  | 'accessibility'
  | 'manifest';

export interface VisualArtifactDescriptor<TValue> {
  readonly id: string;
  readonly version: string;
  readonly kind: VisualArtifactKind;
  readonly dependencies: readonly string[];
  readonly value: TValue;
}

export interface VisualRegistrySnapshot {
  readonly version: number;
  readonly artifactIds: readonly string[];
}

export class VisualRegistry {
  private readonly artifacts = new Map<
    string,
    VisualArtifactDescriptor<unknown>
  >();
  private version = 0;

  public register<TValue>(
    descriptor: VisualArtifactDescriptor<TValue>,
  ): void {
    if (descriptor.id.trim().length === 0) {
      throw new Error('Visual artifact identifier cannot be empty.');
    }
    if (descriptor.version.trim().length === 0) {
      throw new Error(`Visual artifact ${descriptor.id} requires a version.`);
    }
    if (this.artifacts.has(descriptor.id)) {
      throw new Error(
        `Visual artifact ${descriptor.id} is already registered.`,
      );
    }
    if (new Set(descriptor.dependencies).size !==
      descriptor.dependencies.length) {
      throw new Error(
        `Visual artifact ${descriptor.id} contains duplicate dependencies.`,
      );
    }

    this.artifacts.set(
      descriptor.id,
      Object.freeze({
        ...descriptor,
        dependencies: Object.freeze([...descriptor.dependencies]),
      }),
    );
    this.version += 1;
  }

  public replace<TValue>(
    descriptor: VisualArtifactDescriptor<TValue>,
  ): void {
    if (!this.artifacts.has(descriptor.id)) {
      throw new Error(
        `Visual artifact ${descriptor.id} cannot be replaced before registration.`,
      );
    }
    this.artifacts.set(
      descriptor.id,
      Object.freeze({
        ...descriptor,
        dependencies: Object.freeze([...descriptor.dependencies]),
      }),
    );
    this.version += 1;
  }

  public get<TValue>(
    id: string,
    expectedKind?: VisualArtifactKind,
  ): VisualArtifactDescriptor<TValue> {
    const descriptor = this.artifacts.get(id);
    if (!descriptor) {
      throw new Error(`Visual artifact ${id} is not registered.`);
    }
    if (
      expectedKind !== undefined &&
      descriptor.kind !== expectedKind
    ) {
      throw new Error(
        `Visual artifact ${id} is ${descriptor.kind}, not ${expectedKind}.`,
      );
    }
    return descriptor as VisualArtifactDescriptor<TValue>;
  }

  public has(id: string): boolean {
    return this.artifacts.has(id);
  }

  public list(
    kind?: VisualArtifactKind,
  ): readonly VisualArtifactDescriptor<unknown>[] {
    return Object.freeze(
      [...this.artifacts.values()]
        .filter((descriptor) =>
          kind === undefined || descriptor.kind === kind)
        .sort((left, right) => left.id.localeCompare(right.id)),
    );
  }

  public validateDependencies(): readonly string[] {
    const issues: string[] = [];
    for (const descriptor of this.artifacts.values()) {
      for (const dependency of descriptor.dependencies) {
        if (!this.artifacts.has(dependency)) {
          issues.push(
            `${descriptor.id} requires unregistered dependency ${dependency}.`,
          );
        }
      }
    }
    return Object.freeze(issues);
  }

  public resolveLoadOrder(): readonly string[] {
    const issues = this.validateDependencies();
    if (issues.length > 0) {
      throw new Error(issues.join(' '));
    }

    const temporary = new Set<string>();
    const permanent = new Set<string>();
    const ordered: string[] = [];

    const visit = (id: string): void => {
      if (permanent.has(id)) return;
      if (temporary.has(id)) {
        throw new Error(`Visual dependency cycle detected at ${id}.`);
      }
      temporary.add(id);
      const descriptor = this.artifacts.get(id);
      if (!descriptor) {
        throw new Error(`Visual artifact ${id} is not registered.`);
      }
      descriptor.dependencies.forEach(visit);
      temporary.delete(id);
      permanent.add(id);
      ordered.push(id);
    };

    [...this.artifacts.keys()].sort().forEach(visit);
    return Object.freeze(ordered);
  }

  public snapshot(): VisualRegistrySnapshot {
    return Object.freeze({
      version: this.version,
      artifactIds: Object.freeze(
        [...this.artifacts.keys()].sort(),
      ),
    });
  }
}
