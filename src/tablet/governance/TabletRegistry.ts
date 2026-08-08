/**
 * Artifact ID: QCQ-TBL-043
 * Artifact Name: TabletRegistry
 * Artifact Purpose: Tablet capability and module registration authority.
 * Artifact Layer: QCQ-TBL — REG
 * Artifact Dependencies: QCQ-TBL-042
 * Artifact Dependents: QCQ-TBL-046, QCQ-TBL-057, QCQ-TBL-061
 * Dependency Graph: TabletManifest -> TabletRegistry -> composition/validation/fidelity
 * Repository Path: QCQ/frontend/src/tablet/governance
 * Source File: TabletRegistry.ts
 */

import {
  TABLET_MANIFEST,
  type TabletModuleDescriptor,
  type TabletModuleKind,
} from './TabletManifest';

function freezeDescriptor(
  descriptor: TabletModuleDescriptor,
): TabletModuleDescriptor {
  return Object.freeze({
    ...descriptor,
    dependencies: Object.freeze([...descriptor.dependencies]),
    capabilities: Object.freeze([...descriptor.capabilities]),
  });
}

export class TabletRegistry {
  readonly #modules = new Map<string, TabletModuleDescriptor>();
  #sealed = false;

  public register(descriptor: TabletModuleDescriptor): this {
    if (this.#sealed) {
      throw new Error('TabletRegistry is sealed.');
    }
    if (this.#modules.size >= TABLET_MANIFEST.registryCapacity) {
      throw new Error('TabletRegistry capacity exceeded.');
    }
    if (descriptor.id.trim() === '') {
      throw new Error('Tablet module id cannot be empty.');
    }
    if (this.#modules.has(descriptor.id)) {
      throw new Error(
        `Tablet module "${descriptor.id}" is already registered.`,
      );
    }
    this.#modules.set(descriptor.id, freezeDescriptor(descriptor));
    return this;
  }

  public resolve(id: string): TabletModuleDescriptor {
    const descriptor = this.#modules.get(id);
    if (descriptor === undefined) {
      throw new Error(`Tablet module "${id}" is not registered.`);
    }
    return descriptor;
  }

  public list(kind?: TabletModuleKind): readonly TabletModuleDescriptor[] {
    const values = [...this.#modules.values()];
    return Object.freeze(
      kind === undefined
        ? values
        : values.filter((descriptor) => descriptor.kind === kind),
    );
  }

  public has(id: string): boolean {
    return this.#modules.has(id);
  }

  public seal(): this {
    this.#sealed = true;
    return this;
  }

  public get size(): number {
    return this.#modules.size;
  }

  public get sealed(): boolean {
    return this.#sealed;
  }
}

export function createCoreTabletRegistry(): TabletRegistry {
  return new TabletRegistry()
    .register({
      id: 'tablet.shell',
      artifactId: 'QCQ-TBL-001',
      name: 'TabletApplicationShell',
      kind: 'shell',
      version: '1.0.0',
      required: true,
      dependencies: Object.freeze(['tablet.layout']),
      capabilities: Object.freeze(['gameplay-root', 'semantic-shell']),
    })
    .register({
      id: 'tablet.layout',
      artifactId: 'QCQ-TBL-002',
      name: 'TabletLayoutEngine',
      kind: 'layout',
      version: '1.0.0',
      required: true,
      dependencies: Object.freeze(['tablet.viewport', 'tablet.frame']),
      capabilities: Object.freeze(['spatial-orchestration']),
    })
    .register({
      id: 'tablet.viewport',
      artifactId: 'QCQ-TBL-003',
      name: 'TabletViewport',
      kind: 'viewport',
      version: '1.0.0',
      required: true,
      dependencies: Object.freeze([]),
      capabilities: Object.freeze(['responsive-scale', 'safe-area']),
    })
    .register({
      id: 'tablet.frame',
      artifactId: 'QCQ-TBL-004',
      name: 'BorderFrameEngine',
      kind: 'frame',
      version: '1.0.0',
      required: true,
      dependencies: Object.freeze([]),
      capabilities: Object.freeze(['outer-frame', 'inner-frame', 'energy-rails']),
    })
    .register({
      id: 'tablet.question',
      artifactId: 'QCQ-TBL-010',
      name: 'QuestionTablet',
      kind: 'question',
      version: '1.0.0',
      required: true,
      dependencies: Object.freeze(['tablet.interaction']),
      capabilities: Object.freeze(['question', 'answers', 'selection', 'feedback']),
    })
    .register({
      id: 'tablet.interaction',
      artifactId: 'QCQ-TBL-053',
      name: 'InteractionManifest',
      kind: 'interaction',
      version: '1.0.0',
      required: true,
      dependencies: Object.freeze([]),
      capabilities: Object.freeze(['keyboard', 'pointer', 'stylus', 'focus']),
    })
    .seal();
}
