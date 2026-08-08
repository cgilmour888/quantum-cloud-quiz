import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  AudioReadinessEvaluator,
} from '../AudioReadinessEvaluator';
import type {
  AudioCapabilitySnapshot,
} from '../AudioCapabilities';
import type {
  AudioAssetDefinition,
  AudioSourceFormat,
} from '../audio.types';

function createCapabilities(
  formats:
    readonly AudioSourceFormat[],
): AudioCapabilitySnapshot {
  return {
    supportedFormats:
      new Set<AudioSourceFormat>(
        formats,
      ),
  };
}

function createAsset(
  overrides:
    Partial<AudioAssetDefinition> = {},
): AudioAssetDefinition {
  return {
    id:
      'music.test.asset',
    bus:
      'music',
    availability:
      'pending',
    sources: [
      {
        path:
          '/audio/music/test.mp3',
        format:
          'audio/mpeg',
      },
      {
        path:
          '/audio/music/test.ogg',
        format:
          'audio/ogg',
      },
    ],
    loop:
      true,
    preload:
      'metadata',
    defaultGain:
      0.5,
    maxVoices:
      1,
    cooldownMs:
      0,
    ...overrides,
  };
}

describe(
  'QCQ AudioReadinessEvaluator',
  () => {
    it(
      'keeps unauthenticated assets pending even when the browser supports their codecs',
      () => {
        const evaluator =
          new AudioReadinessEvaluator(
            createCapabilities(
              [
                'audio/mpeg',
                'audio/ogg',
              ],
            ),
          );

        const result =
          evaluator.evaluate(
            createAsset(),
          );

        expect(
          result,
        ).toEqual(
          {
            assetId:
              'music.test.asset',
            status:
              'pending',
            source:
              null,
          },
        );
      },
    );

    it(
      'marks an authenticated asset ready and selects the first supported governed source',
      () => {
        const evaluator =
          new AudioReadinessEvaluator(
            createCapabilities(
              [
                'audio/ogg',
              ],
            ),
          );

        const result =
          evaluator.evaluate(
            createAsset(
              {
                availability:
                  'ready',
              },
            ),
          );

        expect(
          result.status,
        ).toBe(
          'ready',
        );

        expect(
          result.source,
        ).toEqual(
          {
            path:
              '/audio/music/test.ogg',
            format:
              'audio/ogg',
          },
        );
      },
    );

    it(
      'reports authenticated media as unsupported when no source codec is playable',
      () => {
        const evaluator =
          new AudioReadinessEvaluator(
            createCapabilities(
              [],
            ),
          );

        const asset =
          createAsset(
            {
              availability:
                'ready',
            },
          );

        const result =
          evaluator.evaluate(
            asset,
          );

        expect(
          result,
        ).toEqual(
          {
            assetId:
              'music.test.asset',
            status:
              'unsupported',
            source:
              null,
          },
        );

        expect(
          evaluator.evaluateManifest(
            [
              asset,
              createAsset(
                {
                  id:
                    'music.pending.asset',
                },
              ),
            ],
          ),
        ).toMatchObject(
          {
            total:
              2,
            ready:
              0,
            pending:
              1,
            unsupported:
              1,
          },
        );
      },
    );
  },
);
