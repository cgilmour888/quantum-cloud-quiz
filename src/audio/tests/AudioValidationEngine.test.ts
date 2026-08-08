import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  AudioValidationEngine,
  type AudioEventMap,
} from '../AudioValidationEngine';
import type {
  AudioAssetDefinition,
} from '../audio.types';

function createAsset(
  overrides:
    Partial<AudioAssetDefinition> = {},
): AudioAssetDefinition {
  return {
    id:
      'interface.test.effect',
    bus:
      'interface',
    availability:
      'pending',
    sources: [
      {
        path:
          '/audio/interface/test-effect.mp3',
        format:
          'audio/mpeg',
      },
    ],
    loop:
      false,
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
  'QCQ AudioValidationEngine',
  () => {
    it(
      'accepts the production manifest and semantic event map with zero structural issues',
      () => {
        const engine =
          new AudioValidationEngine();

        expect(
          engine.validate(),
        ).toEqual(
          [],
        );

        expect(
          engine.isValid(),
        ).toBe(
          true,
        );
      },
    );

    it(
      'detects semantic events that target unknown assets',
      () => {
        const events:
          AudioEventMap = {
            mapped:
              'interface.test.effect',
            broken:
              'interface.missing.effect',
          };

        const issues =
          new AudioValidationEngine(
            [
              createAsset(),
            ],
            events,
          ).validate();

        expect(
          issues.some(
            (issue) =>
              issue.code
              === 'unknown-event-target',
          ),
        ).toBe(
          true,
        );

        expect(
          issues.some(
            (issue) =>
              issue.code
              === 'unmapped-asset',
          ),
        ).toBe(
          false,
        );
      },
    );

    it(
      'detects malformed gain voice cooldown and governed source-path contracts',
      () => {
        const malformed =
          createAsset(
            {
              id:
                'gameplay.bad.effect',
              bus:
                'gameplay',
              sources: [
                {
                  path:
                    '/audio/interface/../bad.mp3',
                  format:
                    'audio/mpeg',
                },
              ],
              defaultGain:
                2,
              maxVoices:
                0,
              cooldownMs:
                -1,
            },
          );

        const issues =
          new AudioValidationEngine(
            [
              malformed,
            ],
            {
              mapped:
                'gameplay.bad.effect',
            },
          ).validate();

        const codes =
          new Set(
            issues.map(
              (issue) =>
                issue.code,
            ),
          );

        expect(
          codes,
        ).toEqual(
          expect.objectContaining(
            new Set(
              [
                'unsafe-source-path',
                'bus-path-mismatch',
                'invalid-gain',
                'invalid-voice-limit',
                'invalid-cooldown',
              ],
            ),
          ),
        );
      },
    );

    it(
      'detects registered assets without semantic event mappings',
      () => {
        const issues =
          new AudioValidationEngine(
            [
              createAsset(),
            ],
            {},
          ).validate();

        expect(
          issues,
        ).toEqual(
          expect.arrayContaining(
            [
              expect.objectContaining(
                {
                  code:
                    'unmapped-asset',
                  subject:
                    'interface.test.effect',
                },
              ),
            ],
          ),
        );
      },
    );
  },
);
