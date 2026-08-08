/**
 * Artifact ID: QCQ-AUD-020
 * Artifact Name: AudioReadinessEvaluator
 * Repository Path: QCQ/frontend/src/audio/AudioReadinessEvaluator.ts
 */

import {
  detectAudioCapabilities,
  selectSupportedAudioSource,
  type AudioCapabilitySnapshot,
} from './AudioCapabilities';
import {
  AUDIO_MANIFEST,
} from './AudioManifest';
import type {
  AudioAssetDefinition,
  AudioSourceDefinition,
} from './audio.types';

export type AudioReadinessStatus =
  | 'pending'
  | 'ready'
  | 'unsupported';

export interface AudioAssetReadiness {
  readonly assetId: string;
  readonly status:
    AudioReadinessStatus;
  readonly source:
    AudioSourceDefinition | null;
}

export interface AudioReadinessReport {
  readonly total: number;
  readonly ready: number;
  readonly pending: number;
  readonly unsupported: number;
  readonly assets:
    readonly AudioAssetReadiness[];
}

export class AudioReadinessEvaluator {
  public constructor(
    private readonly capabilities:
      AudioCapabilitySnapshot,
  ) {}

  public evaluate(
    asset:
      AudioAssetDefinition,
  ): AudioAssetReadiness {
    if (
      asset.availability
      !== 'ready'
    ) {
      return {
        assetId:
          asset.id,
        status:
          'pending',
        source:
          null,
      };
    }

    const source =
      selectSupportedAudioSource(
        asset.sources,
        this.capabilities,
      );

    if (
      source === undefined
    ) {
      return {
        assetId:
          asset.id,
        status:
          'unsupported',
        source:
          null,
      };
    }

    return {
      assetId:
        asset.id,
      status:
        'ready',
      source,
    };
  }

  public evaluateManifest(
    manifest:
      readonly AudioAssetDefinition[] =
        AUDIO_MANIFEST,
  ): AudioReadinessReport {
    const assets =
      manifest.map(
        (asset) =>
          this.evaluate(
            asset,
          ),
      );

    let ready = 0;
    let pending = 0;
    let unsupported = 0;

    for (
      const asset
      of assets
    ) {
      switch (
        asset.status
      ) {
        case 'ready':
          ready += 1;
          break;

        case 'pending':
          pending += 1;
          break;

        case 'unsupported':
          unsupported += 1;
          break;
      }
    }

    return {
      total:
        assets.length,
      ready,
      pending,
      unsupported,
      assets,
    };
  }
}

export function createBrowserAudioReadinessEvaluator():
  AudioReadinessEvaluator {
  return new AudioReadinessEvaluator(
    detectAudioCapabilities(),
  );
}
