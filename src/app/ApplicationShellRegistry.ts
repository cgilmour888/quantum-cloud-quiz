/**
 * Artifact ID: QCQ-APP-001-009
 * Artifact Name: ApplicationShellRegistry
 * Artifact Purpose: Permanent shell module registration, external-authority discovery, dependency metadata, duplicate rejection, and immutable runtime snapshots.
 * Artifact Layer: Phase 1 — Application Shell / REG
 * Artifact Dependencies: QCQ-APP-001-005, QCQ-APP-001-006, QCQ-APP-001-008
 * Artifact Dependents: QCQ-APP-001-001, QCQ-APP-001-002, QCQ-APP-001-010, QCQ-APP-001-017
 * Dependency Graph: ApplicationShellManifest -> ApplicationShellRegistry -> shell runtime/policy/integration
 * Repository Path: QCQ/frontend/src/app
 * Source File: ApplicationShellRegistry.ts
 */

import {
  APPLICATION_SHELL_REFERENCE,
} from './ApplicationShell.constants';
import {
  APPLICATION_SHELL_ARTIFACTS,
} from './ApplicationShellManifest';
import type {
  ApplicationShellRegistryDescriptor,
  ApplicationShellRegistryEntry,
  ApplicationShellRegistrySnapshot,
} from './ApplicationShell.types';

type RegistryListener = (
  snapshot: ApplicationShellRegistrySnapshot,
) => void;

function createSnapshot(
  revision: number,
  entries: ReadonlyMap<
    string,
    ApplicationShellRegistryEntry<unknown>
  >,
): ApplicationShellRegistrySnapshot {
  const values = [...entries.values()].sort((left, right) =>
    left.descriptor.artifactId.localeCompare(
      right.descriptor.artifactId,
    ),
  );
  const externalAuthorityIds = values
    .filter(
      (entry) =>
        entry.descriptor.kind ===
        'external-authority',
    )
    .map((entry) => entry.descriptor.artifactId);

  return Object.freeze({
    revision,
    total: values.length,
    enabled: values.filter((entry) => entry.enabled).length,
    artifactIds: Object.freeze(
      values.map((entry) => entry.descriptor.artifactId),
    ),
    enabledArtifactIds: Object.freeze(
      values
        .filter((entry) => entry.enabled)
        .map((entry) => entry.descriptor.artifactId),
    ),
    externalAuthorityIds:
      Object.freeze(externalAuthorityIds),
    registeredAt:
      values
        .map((entry) => entry.registeredAt)
        .sort()
        .at(-1) ?? null,
  });
}

export class ApplicationShellRegistry {
  readonly #entries = new Map<
    string,
    ApplicationShellRegistryEntry<unknown>
  >();

  readonly #listeners = new Set<RegistryListener>();

  #revision = 0;

  #snapshot = createSnapshot(0, this.#entries);

  public constructor(
    private readonly capacity: number =
      APPLICATION_SHELL_REFERENCE.maximumRegistryEntries,
  ) {
    if (
      !Number.isInteger(capacity) ||
      capacity <= 0 ||
      capacity >
        APPLICATION_SHELL_REFERENCE.maximumRegistryEntries
    ) {
      throw new Error(
        `Application Shell registry capacity must be an integer from 1 to ${APPLICATION_SHELL_REFERENCE.maximumRegistryEntries}.`,
      );
    }
  }

  public register<TValue>(
    descriptor: ApplicationShellRegistryDescriptor,
    value: TValue,
    options: {
      readonly enabled?: boolean | undefined;
      readonly registeredAt?: string | undefined;
      readonly metadata?:
        | Readonly<Record<string, string>>
        | undefined;
    } = {},
  ): ApplicationShellRegistryEntry<TValue> {
    if (this.#entries.has(descriptor.artifactId)) {
      throw new Error(
        `Application Shell registry already owns ${descriptor.artifactId}.`,
      );
    }
    if (this.#entries.size >= this.capacity) {
      throw new Error(
        `Application Shell registry capacity ${this.capacity} reached.`,
      );
    }

    const registeredAt =
      options.registeredAt ?? new Date().toISOString();
    if (!Number.isFinite(Date.parse(registeredAt))) {
      throw new Error(
        'registeredAt must be a valid ISO-8601 date-time.',
      );
    }

    const entry: ApplicationShellRegistryEntry<TValue> =
      Object.freeze({
        descriptor: Object.freeze({
          ...descriptor,
          dependencies: Object.freeze([
            ...descriptor.dependencies,
          ]),
          capabilities: Object.freeze([
            ...descriptor.capabilities,
          ]),
        }),
        value,
        enabled: options.enabled ?? true,
        registeredAt,
        metadata: Object.freeze({
          ...(options.metadata ?? {}),
        }),
      });

    this.#entries.set(
      descriptor.artifactId,
      entry,
    );
    this.#publish();
    return entry;
  }

  public registerExternalAuthority(
    artifactId: string,
    name: string,
    version: string,
    value: unknown = null,
    dependencies: readonly string[] = [],
  ): ApplicationShellRegistryEntry<unknown> {
    return this.register(
      Object.freeze({
        artifactId,
        name,
        kind: 'external-authority',
        version,
        required: true,
        dependencies: Object.freeze([
          ...dependencies,
        ]),
        capabilities: Object.freeze([
          'external-authority',
        ]),
        owner: artifactId,
      }),
      value,
      {
        metadata: Object.freeze({
          registration: 'external-authority',
        }),
      },
    );
  }

  public unregister(artifactId: string): boolean {
    const deleted = this.#entries.delete(artifactId);
    if (deleted) this.#publish();
    return deleted;
  }

  public setEnabled(
    artifactId: string,
    enabled: boolean,
  ): ApplicationShellRegistryEntry<unknown> {
    const current = this.#entries.get(artifactId);
    if (current === undefined) {
      throw new Error(
        `Cannot change unknown shell registry artifact ${artifactId}.`,
      );
    }
    const next = Object.freeze({
      ...current,
      enabled,
    });
    this.#entries.set(artifactId, next);
    this.#publish();
    return next;
  }

  public has(artifactId: string): boolean {
    return this.#entries.has(artifactId);
  }

  public get<TValue = unknown>(
    artifactId: string,
  ): ApplicationShellRegistryEntry<TValue> | null {
    const entry = this.#entries.get(artifactId);
    return entry === undefined
      ? null
      : (entry as ApplicationShellRegistryEntry<TValue>);
  }

  public require<TValue = unknown>(
    artifactId: string,
  ): ApplicationShellRegistryEntry<TValue> {
    const entry = this.get<TValue>(artifactId);
    if (entry === null) {
      throw new Error(
        `Required shell registry artifact ${artifactId} is not registered.`,
      );
    }
    return entry;
  }

  public list(): readonly ApplicationShellRegistryEntry<unknown>[] {
    return Object.freeze(
      [...this.#entries.values()].sort((left, right) =>
        left.descriptor.artifactId.localeCompare(
          right.descriptor.artifactId,
        ),
      ),
    );
  }

  public getSnapshot(): ApplicationShellRegistrySnapshot {
    return this.#snapshot;
  }

  public subscribe(listener: RegistryListener): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  #publish(): void {
    this.#revision += 1;
    this.#snapshot = createSnapshot(
      this.#revision,
      this.#entries,
    );
    for (const listener of this.#listeners) {
      listener(this.#snapshot);
    }
  }
}

export function createApplicationShellRegistry(
  options: {
    readonly capacity?: number | undefined;
    readonly registerPhaseOneArtifacts?: boolean | undefined;
  } = {},
): ApplicationShellRegistry {
  const registry = new ApplicationShellRegistry(
    options.capacity,
  );

  if (options.registerPhaseOneArtifacts ?? true) {
    for (const descriptor of APPLICATION_SHELL_ARTIFACTS) {
      registry.register(descriptor, descriptor.artifactId, {
        metadata: Object.freeze({
          registration: 'phase-one-manifest',
        }),
      });
    }
  }

  return registry;
}
