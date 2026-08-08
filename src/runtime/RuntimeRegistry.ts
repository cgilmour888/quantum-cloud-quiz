import {
  RUNTIME_MANIFEST,
  type RuntimeModuleDescriptor,
  type RuntimeModuleKind,
} from './RuntimeManifest';

export interface RuntimeRegistrySnapshot {
  readonly sealed: boolean;
  readonly size: number;
  readonly modules: readonly RuntimeModuleDescriptor[];
}

function freezeDescriptor(
  descriptor: RuntimeModuleDescriptor,
): RuntimeModuleDescriptor {
  return Object.freeze({
    ...descriptor,
    dependencies: Object.freeze([
      ...descriptor.dependencies,
    ]),
    capabilities: Object.freeze([
      ...descriptor.capabilities,
    ]),
  });
}

export class RuntimeRegistry {
  readonly #modules =
    new Map<string, RuntimeModuleDescriptor>();
  #sealed = false;

  public register(
    descriptor: RuntimeModuleDescriptor,
  ): this {
    if (this.#sealed) {
      throw new Error(
        'RuntimeRegistry is sealed.',
      );
    }
    if (
      this.#modules.size >=
      RUNTIME_MANIFEST.maximumRegistryCapacity
    ) {
      throw new Error(
        'RuntimeRegistry capacity exceeded.',
      );
    }
    if (descriptor.id.trim() === '') {
      throw new Error(
        'Runtime module id cannot be empty.',
      );
    }
    if (this.#modules.has(descriptor.id)) {
      throw new Error(
        `Runtime module "${descriptor.id}" is already registered.`,
      );
    }

    this.#modules.set(
      descriptor.id,
      freezeDescriptor(descriptor),
    );
    return this;
  }

  public resolve(
    id: string,
  ): RuntimeModuleDescriptor {
    const descriptor = this.#modules.get(id);
    if (descriptor === undefined) {
      throw new Error(
        `Runtime module "${id}" is not registered.`,
      );
    }
    return descriptor;
  }

  public has(id: string): boolean {
    return this.#modules.has(id);
  }

  public list(
    kind?: RuntimeModuleKind,
  ): readonly RuntimeModuleDescriptor[] {
    const values = [...this.#modules.values()];
    return Object.freeze(
      kind === undefined
        ? values
        : values.filter(
            (module) => module.kind === kind,
          ),
    );
  }

  public seal(): this {
    this.#sealed = true;
    return this;
  }

  public snapshot(): RuntimeRegistrySnapshot {
    return Object.freeze({
      sealed: this.#sealed,
      size: this.#modules.size,
      modules: this.list(),
    });
  }

  public get size(): number {
    return this.#modules.size;
  }

  public get sealed(): boolean {
    return this.#sealed;
  }
}


export function createFoundationRuntimeRegistry():
  RuntimeRegistry {
  return new RuntimeRegistry()
    .register({
      id: 'bootstrap.manifest',
      artifactId: 'QCQ-STEP2-020',
      name: 'BootstrapManifest',
      kind: 'bootstrap',
      version: '1.0.0',
      criticality: 'required',
      dependencies: Object.freeze([]),
      capabilities: Object.freeze([
        'startup-governance',
      ]),
    })
    .register({
      id: 'runtime.capabilities',
      artifactId: 'QCQ-STEP2-019',
      name: 'RuntimeCapabilities',
      kind: 'runtime',
      version: '1.0.0',
      criticality: 'required',
      dependencies: Object.freeze([
        'bootstrap.manifest',
      ]),
      capabilities: Object.freeze([
        'browser-capability-detection',
        'storage-capability-detection',
        'preference-detection',
      ]),
    })
    .register({
      id: 'runtime.policies',
      artifactId: 'QCQ-STEP2-018',
      name: 'RuntimePolicies',
      kind: 'runtime',
      version: '1.0.0',
      criticality: 'required',
      dependencies: Object.freeze([
        'runtime.capabilities',
      ]),
      capabilities: Object.freeze([
        'channel-policy',
        'recovery-policy',
        'security-policy',
      ]),
    })
    .register({
      id: 'rendering.manifest',
      artifactId: 'QCQ-STEP2-028',
      name: 'RenderingManifest',
      kind: 'rendering',
      version: '1.0.0',
      criticality: 'required',
      dependencies: Object.freeze([
        'runtime.policies',
      ]),
      capabilities: Object.freeze([
        '4k-governance',
        '8k-governance',
        '12k-governance',
      ]),
    })
    .register({
      id: 'accessibility.registry',
      artifactId: 'QCQ-STEP2-032',
      name: 'AccessibilityRegistry',
      kind: 'accessibility',
      version: '1.0.0',
      criticality: 'required',
      dependencies: Object.freeze([
        'runtime.capabilities',
      ]),
      capabilities: Object.freeze([
        'wcag-governance',
        'focus-governance',
        'motion-preference-governance',
      ]),
    })
    .register({
      id: 'provider.registry',
      artifactId: 'QCQ-STEP2-035',
      name: 'ProviderRegistry',
      kind: 'provider',
      version: '1.0.0',
      criticality: 'required',
      dependencies: Object.freeze([
        'runtime.policies',
      ]),
      capabilities: Object.freeze([
        'provider-registration',
        'provider-validation',
      ]),
    })
    .register({
      id: 'application.root',
      artifactId: 'QCQ-STEP2-008',
      name: 'ApplicationRoot',
      kind: 'application',
      version: '1.0.0',
      criticality: 'required',
      dependencies: Object.freeze([
        'rendering.manifest',
        'accessibility.registry',
        'provider.registry',
      ]),
      capabilities: Object.freeze([
        'react-root-composition',
      ]),
    })
    .seal();
}
