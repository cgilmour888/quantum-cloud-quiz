/**
 * Artifact ID: QCQ-APP-002-008
 * Artifact Name: LayoutZoneRegistry
 * Artifact Purpose: Canonical zone registration with duplicate prevention, deterministic discovery, sealing, and scale-safe registry behavior.
 * Artifact Layer: QCQ-APP-002 — REG (Registration Authority)
 * Artifact Dependencies: Governed APP-002 imports and Phase 9 visual variables where applicable
 * Artifact Dependents: APP-002 runtime, validation, integration, and downstream QCQ feature layers
 * Dependency Graph: APP-002 constitutional inputs -> LayoutZoneRegistry -> governed spatial composition
 * Repository Path: QCQ/frontend/src/app/registry
 * Source File: LayoutZoneRegistry.ts
 */
import type {
  LayoutZoneId,
  LayoutZoneRegistration,
} from '../types/LayoutEngine.types';
import {
  LAYOUT_RUNTIME_LIMITS,
} from '../constants/LayoutEngine.constants';

export class LayoutZoneRegistry {
  readonly #registrations =
    new Map<
      LayoutZoneId,
      LayoutZoneRegistration
    >();
  #sealed = false;

  public register(
    registration: LayoutZoneRegistration,
  ): this {
    if (this.#sealed) {
      throw new Error(
        'LayoutZoneRegistry is sealed.',
      );
    }
    if (
      this.#registrations.size >=
      LAYOUT_RUNTIME_LIMITS.registryCapacity
    ) {
      throw new Error(
        'LayoutZoneRegistry capacity exceeded.',
      );
    }
    if (
      this.#registrations.has(
        registration.definition.id,
      )
    ) {
      throw new Error(
        `Layout zone "${registration.definition.id}" is already registered.`,
      );
    }
    this.#registrations.set(
      registration.definition.id,
      Object.freeze(registration),
    );
    return this;
  }

  public resolve(
    zoneId: LayoutZoneId,
  ): LayoutZoneRegistration {
    const registration =
      this.#registrations.get(zoneId);
    if (registration === undefined) {
      throw new Error(
        `Layout zone "${zoneId}" is not registered.`,
      );
    }
    return registration;
  }

  public has(zoneId: LayoutZoneId): boolean {
    return this.#registrations.has(zoneId);
  }

  public list():
    readonly LayoutZoneRegistration[] {
    return Object.freeze(
      [...this.#registrations.values()],
    );
  }

  public seal(): this {
    this.#sealed = true;
    return this;
  }

  public isSealed(): boolean {
    return this.#sealed;
  }

  public get size(): number {
    return this.#registrations.size;
  }
}
