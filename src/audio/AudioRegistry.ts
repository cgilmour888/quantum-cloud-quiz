/**
 * Artifact ID: QCQ-AUD-004
 * Artifact Name: AudioRegistry
 * Repository Path: QCQ/frontend/src/audio/AudioRegistry.ts
 */

import {
  AUDIO_MANIFEST,
} from './AudioManifest';
import type {
  AudioAssetDefinition,
  AudioBusName,
} from './audio.types';

function validateAsset(
  asset: AudioAssetDefinition,
): void {
  if (
    asset.id.trim().length === 0
  ) {
    throw new Error(
      'QCQ audio asset ID must not be empty.',
    );
  }

  if (
    asset.sources.length === 0
  ) {
    throw new Error(
      `QCQ audio asset ${asset.id} has no sources.`,
    );
  }

  if (
    asset.defaultGain < 0
    || asset.defaultGain > 1
  ) {
    throw new Error(
      `QCQ audio asset ${asset.id} has an invalid default gain.`,
    );
  }

  if (
    !Number.isInteger(
      asset.maxVoices,
    )
    || asset.maxVoices < 1
  ) {
    throw new Error(
      `QCQ audio asset ${asset.id} has an invalid voice limit.`,
    );
  }

  if (
    !Number.isInteger(
      asset.cooldownMs,
    )
    || asset.cooldownMs < 0
  ) {
    throw new Error(
      `QCQ audio asset ${asset.id} has an invalid cooldown.`,
    );
  }

  const expectedPrefix =
    `/audio/${asset.bus}/`;

  for (
    const source
    of asset.sources
  ) {
    if (
      !source.path.startsWith(
        expectedPrefix,
      )
    ) {
      throw new Error(
        `QCQ audio asset ${asset.id} is outside its governed bus path.`,
      );
    }

    if (
      source.path.includes('..')
    ) {
      throw new Error(
        `QCQ audio asset ${asset.id} contains an unsafe source path.`,
      );
    }
  }
}

export class AudioRegistry {
  private readonly assets:
    ReadonlyMap<
      string,
      AudioAssetDefinition
    >;

  public constructor(
    manifest:
      readonly AudioAssetDefinition[]
      = AUDIO_MANIFEST,
  ) {
    const registry =
      new Map<
        string,
        AudioAssetDefinition
      >();

    for (
      const asset
      of manifest
    ) {
      validateAsset(
        asset,
      );

      if (
        registry.has(
          asset.id,
        )
      ) {
        throw new Error(
          `Duplicate QCQ audio asset ID: ${asset.id}`,
        );
      }

      registry.set(
        asset.id,
        asset,
      );
    }

    this.assets = registry;
  }

  public get(
    id: string,
  ): AudioAssetDefinition | undefined {
    return this.assets.get(
      id,
    );
  }

  public require(
    id: string,
  ): AudioAssetDefinition {
    const asset =
      this.assets.get(
        id,
      );

    if (
      asset === undefined
    ) {
      throw new Error(
        `Unknown QCQ audio asset: ${id}`,
      );
    }

    return asset;
  }

  public list(
    bus?: AudioBusName,
  ): readonly AudioAssetDefinition[] {
    const assets = [
      ...this.assets.values(),
    ];

    if (
      bus === undefined
    ) {
      return assets;
    }

    return assets.filter(
      (asset) =>
        asset.bus === bus,
    );
  }

  public listReady(
    bus?: AudioBusName,
  ): readonly AudioAssetDefinition[] {
    return this.list(
      bus,
    ).filter(
      (asset) =>
        asset.availability
        === 'ready',
    );
  }

  public isReady(
    id: string,
  ): boolean {
    return (
      this.assets.get(
        id,
      )?.availability
      === 'ready'
    );
  }
}

export const audioRegistry =
  new AudioRegistry();
