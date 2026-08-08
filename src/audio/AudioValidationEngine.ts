/**
 * Artifact ID: QCQ-AUD-019
 * Artifact Name: AudioValidationEngine
 * Repository Path: QCQ/frontend/src/audio/AudioValidationEngine.ts
 */

import {
  AUDIO_EVENTS,
} from './AudioEvents';
import {
  AUDIO_MANIFEST,
} from './AudioManifest';
import type {
  AudioAssetDefinition,
} from './audio.types';

export type AudioValidationCode =
  | 'duplicate-asset-id'
  | 'missing-source'
  | 'unsafe-source-path'
  | 'bus-path-mismatch'
  | 'invalid-gain'
  | 'invalid-voice-limit'
  | 'invalid-cooldown'
  | 'unknown-event-target'
  | 'unmapped-asset';

export interface AudioValidationIssue {
  readonly code:
    AudioValidationCode;

  readonly subject:
    string;

  readonly message:
    string;
}

export type AudioEventMap =
  Readonly<
    Record<
      string,
      string
    >
  >;

function createIssue(
  code: AudioValidationCode,
  subject: string,
  message: string,
): AudioValidationIssue {
  return {
    code,
    subject,
    message,
  };
}

export class AudioValidationEngine {
  public constructor(
    private readonly manifest:
      readonly AudioAssetDefinition[] =
        AUDIO_MANIFEST,
    private readonly events:
      AudioEventMap =
        AUDIO_EVENTS,
  ) {}

  public validate():
    readonly AudioValidationIssue[] {
    const issues:
      AudioValidationIssue[] = [];

    const seenIds =
      new Set<string>();

    for (
      const asset
      of this.manifest
    ) {
      if (
        seenIds.has(
          asset.id,
        )
      ) {
        issues.push(
          createIssue(
            'duplicate-asset-id',
            asset.id,
            `Duplicate audio asset ID: ${asset.id}`,
          ),
        );
      }

      seenIds.add(
        asset.id,
      );

      if (
        asset.sources.length === 0
      ) {
        issues.push(
          createIssue(
            'missing-source',
            asset.id,
            `Audio asset ${asset.id} has no source definitions.`,
          ),
        );
      }

      if (
        !Number.isFinite(
          asset.defaultGain,
        )
        || asset.defaultGain < 0
        || asset.defaultGain > 1
      ) {
        issues.push(
          createIssue(
            'invalid-gain',
            asset.id,
            `Audio asset ${asset.id} has an invalid default gain.`,
          ),
        );
      }

      if (
        !Number.isInteger(
          asset.maxVoices,
        )
        || asset.maxVoices < 1
      ) {
        issues.push(
          createIssue(
            'invalid-voice-limit',
            asset.id,
            `Audio asset ${asset.id} has an invalid voice limit.`,
          ),
        );
      }

      if (
        !Number.isInteger(
          asset.cooldownMs,
        )
        || asset.cooldownMs < 0
      ) {
        issues.push(
          createIssue(
            'invalid-cooldown',
            asset.id,
            `Audio asset ${asset.id} has an invalid cooldown.`,
          ),
        );
      }

      const governedPrefix =
        `/audio/${asset.bus}/`;

      for (
        const source
        of asset.sources
      ) {
        if (
          source.path.includes(
            '..',
          )
          || !source.path.startsWith(
            '/audio/',
          )
        ) {
          issues.push(
            createIssue(
              'unsafe-source-path',
              asset.id,
              `Audio asset ${asset.id} has an unsafe source path: ${source.path}`,
            ),
          );
        }

        if (
          !source.path.startsWith(
            governedPrefix,
          )
        ) {
          issues.push(
            createIssue(
              'bus-path-mismatch',
              asset.id,
              `Audio asset ${asset.id} is outside its governed ${asset.bus} path.`,
            ),
          );
        }
      }
    }

    const eventTargets =
      new Set<string>();

    for (
      const [
        eventName,
        assetId,
      ]
      of Object.entries(
        this.events,
      )
    ) {
      eventTargets.add(
        assetId,
      );

      if (
        !seenIds.has(
          assetId,
        )
      ) {
        issues.push(
          createIssue(
            'unknown-event-target',
            eventName,
            `Audio event ${eventName} targets unknown asset ${assetId}.`,
          ),
        );
      }
    }

    for (
      const assetId
      of seenIds
    ) {
      if (
        !eventTargets.has(
          assetId,
        )
      ) {
        issues.push(
          createIssue(
            'unmapped-asset',
            assetId,
            `Audio asset ${assetId} has no semantic event mapping.`,
          ),
        );
      }
    }

    return issues;
  }

  public isValid(): boolean {
    return (
      this.validate().length === 0
    );
  }
}

export const audioValidationEngine =
  new AudioValidationEngine();
