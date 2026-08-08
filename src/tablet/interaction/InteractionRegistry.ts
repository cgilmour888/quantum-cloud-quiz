/**
 * Artifact ID: QCQ-TBL-054
 * Artifact Name: InteractionRegistry
 * Artifact Purpose: Interaction binding registration authority with duplicate rejection and immutable discovery.
 * Artifact Layer: QCQ-TBL — REG
 * Artifact Dependencies: QCQ-TBL-053
 * Artifact Dependents: QCQ-TBL-010, QCQ-TBL-057
 * Dependency Graph: InteractionManifest -> InteractionRegistry -> QuestionTablet/validation
 * Repository Path: QCQ/frontend/src/tablet/interaction
 * Source File: InteractionRegistry.ts
 */

import {
  INTERACTION_MANIFEST,
  type InteractionActionId,
  type InteractionDescriptor,
} from './InteractionManifest';

export class InteractionRegistry {
  readonly #actions =
    new Map<InteractionActionId, InteractionDescriptor>();
  #sealed = false;

  public register(descriptor: InteractionDescriptor): this {
    if (this.#sealed) {
      throw new Error('InteractionRegistry is sealed.');
    }
    if (
      this.#actions.size >=
      INTERACTION_MANIFEST.registryCapacity
    ) {
      throw new Error('InteractionRegistry capacity exceeded.');
    }
    if (this.#actions.has(descriptor.id)) {
      throw new Error(
        `Interaction action "${descriptor.id}" is already registered.`,
      );
    }
    this.#actions.set(
      descriptor.id,
      Object.freeze({
        ...descriptor,
        keyboard: Object.freeze([...descriptor.keyboard]),
      }),
    );
    return this;
  }

  public resolve(id: InteractionActionId): InteractionDescriptor {
    const descriptor = this.#actions.get(id);
    if (descriptor === undefined) {
      throw new Error(
        `Interaction action "${id}" is not registered.`,
      );
    }
    return descriptor;
  }

  public list(): readonly InteractionDescriptor[] {
    return Object.freeze([...this.#actions.values()]);
  }

  public seal(): this {
    this.#sealed = true;
    return this;
  }

  public get size(): number {
    return this.#actions.size;
  }
}

export function createInteractionRegistry(): InteractionRegistry {
  const registry = new InteractionRegistry();
  for (const action of INTERACTION_MANIFEST.actions) {
    registry.register(action);
  }
  return registry.seal();
}
