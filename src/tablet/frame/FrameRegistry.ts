/**
 * Artifact ID: QCQ-TBL-050
 * Artifact Name: FrameRegistry
 * Artifact Purpose: Canonical registration and discovery authority for frame-layer renderers.
 * Artifact Layer: QCQ-TBL — REG
 * Artifact Dependencies: QCQ-TBL-049
 * Artifact Dependents: QCQ-TBL-004, QCQ-TBL-057
 * Dependency Graph: FrameManifest -> FrameRegistry -> BorderFrameEngine/validation
 * Repository Path: QCQ/frontend/src/tablet/frame
 * Source File: FrameRegistry.ts
 */

import {
  FRAME_MANIFEST,
  type FrameLayerDescriptor,
  type FrameLayerId,
} from './FrameManifest';

export class FrameRegistry {
  readonly #layers =
    new Map<FrameLayerId, FrameLayerDescriptor>();
  #sealed = false;

  public register(descriptor: FrameLayerDescriptor): this {
    if (this.#sealed) {
      throw new Error('FrameRegistry is sealed.');
    }
    if (this.#layers.has(descriptor.id)) {
      throw new Error(
        `Frame layer "${descriptor.id}" is already registered.`,
      );
    }
    this.#layers.set(
      descriptor.id,
      Object.freeze({ ...descriptor }),
    );
    return this;
  }

  public resolve(id: FrameLayerId): FrameLayerDescriptor {
    const descriptor = this.#layers.get(id);
    if (descriptor === undefined) {
      throw new Error(`Frame layer "${id}" is not registered.`);
    }
    return descriptor;
  }

  public list(): readonly FrameLayerDescriptor[] {
    return Object.freeze(
      [...this.#layers.values()].sort(
        (a, b) => a.zIndex - b.zIndex,
      ),
    );
  }

  public seal(): this {
    this.#sealed = true;
    return this;
  }

  public get sealed(): boolean {
    return this.#sealed;
  }

  public get size(): number {
    return this.#layers.size;
  }
}

export function createFrameRegistry(): FrameRegistry {
  const registry = new FrameRegistry();
  for (const layer of FRAME_MANIFEST.layers) {
    registry.register(layer);
  }
  return registry.seal();
}
