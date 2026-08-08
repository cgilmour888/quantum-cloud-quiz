/**
 * Artifact ID: QCQ-TBL-062
 * Artifact Name: MasterTabletRegistry
 * Artifact Purpose: MASTER fidelity anchor registration and lookup authority.
 * Artifact Layer: QCQ-TBL — REG
 * Artifact Dependencies: QCQ-TBL-061
 * Artifact Dependents: QCQ-TBL-063, QCQ-TBL-064
 * Dependency Graph: MasterTabletManifest -> MasterTabletRegistry -> contract/capability
 * Repository Path: QCQ/frontend/src/tablet/master
 * Source File: MasterTabletRegistry.ts
 */

import {
  MASTER_TABLET_MANIFEST,
  type MasterTabletAnchor,
} from './MasterTabletManifest';

export class MasterTabletRegistry {
  readonly #anchors =
    new Map<MasterTabletAnchor['id'], MasterTabletAnchor>();
  #sealed = false;

  public register(anchor: MasterTabletAnchor): this {
    if (this.#sealed) {
      throw new Error('MasterTabletRegistry is sealed.');
    }
    if (this.#anchors.has(anchor.id)) {
      throw new Error(
        `MASTER tablet anchor "${anchor.id}" is already registered.`,
      );
    }
    this.#anchors.set(
      anchor.id,
      Object.freeze({
        ...anchor,
        rect: Object.freeze({ ...anchor.rect }),
      }),
    );
    return this;
  }

  public resolve(id: MasterTabletAnchor['id']): MasterTabletAnchor {
    const anchor = this.#anchors.get(id);
    if (anchor === undefined) {
      throw new Error(
        `MASTER tablet anchor "${id}" is not registered.`,
      );
    }
    return anchor;
  }

  public list(): readonly MasterTabletAnchor[] {
    return Object.freeze([...this.#anchors.values()]);
  }

  public seal(): this {
    this.#sealed = true;
    return this;
  }

  public get size(): number {
    return this.#anchors.size;
  }
}

export function createMasterTabletRegistry(): MasterTabletRegistry {
  const registry = new MasterTabletRegistry();
  for (const anchor of MASTER_TABLET_MANIFEST.anchors) {
    registry.register(anchor);
  }
  return registry.seal();
}
