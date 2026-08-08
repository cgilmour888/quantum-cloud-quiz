import {
  PROVIDER_MANIFEST,
  type ProviderDescriptor,
  type ProviderDomain,
} from './ProviderManifest';

export interface ProviderRuntimeAdapter {
  readonly descriptor: ProviderDescriptor;
  start(): void | Promise<void>;
  stop(): void | Promise<void>;
  health(): 'healthy' | 'degraded' | 'unhealthy';
}

export interface ProviderRegistrySnapshot {
  readonly sealed: boolean;
  readonly size: number;
  readonly providers:
    readonly ProviderDescriptor[];
}

export class ProviderRegistry {
  readonly #providers =
    new Map<string, ProviderRuntimeAdapter>();
  #sealed = false;

  public register(
    provider: ProviderRuntimeAdapter,
  ): this {
    if (this.#sealed) {
      throw new Error(
        'ProviderRegistry is sealed.',
      );
    }
    if (
      this.#providers.size >=
      PROVIDER_MANIFEST.maximumProviders
    ) {
      throw new Error(
        'ProviderRegistry capacity exceeded.',
      );
    }
    if (
      this.#providers.has(
        provider.descriptor.id,
      )
    ) {
      throw new Error(
        `Provider "${provider.descriptor.id}" is already registered.`,
      );
    }

    this.#providers.set(
      provider.descriptor.id,
      provider,
    );
    return this;
  }

  public resolve(
    id: string,
  ): ProviderRuntimeAdapter {
    const provider =
      this.#providers.get(id);
    if (provider === undefined) {
      throw new Error(
        `Provider "${id}" is not registered.`,
      );
    }
    return provider;
  }

  public list(
    domain?: ProviderDomain,
  ): readonly ProviderRuntimeAdapter[] {
    const providers = [
      ...this.#providers.values(),
    ];

    return Object.freeze(
      domain === undefined
        ? providers
        : providers.filter(
            (provider) =>
              provider.descriptor.domain ===
              domain,
          ),
    );
  }

  public seal(): this {
    this.#sealed = true;
    return this;
  }

  public snapshot():
    ProviderRegistrySnapshot {
    return Object.freeze({
      sealed: this.#sealed,
      size: this.#providers.size,
      providers: Object.freeze(
        this.list().map(
          (provider) =>
            provider.descriptor,
        ),
      ),
    });
  }

  public get size(): number {
    return this.#providers.size;
  }
}
