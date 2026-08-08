import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  AudioEngine,
  type AudioElementFactory,
} from '../AudioEngine';
import {
  DEFAULT_AUDIO_POLICIES,
} from '../AudioPolicies';
import {
  AudioRegistry,
} from '../AudioRegistry';
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
      'ready',
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
      'none',
    defaultGain:
      1,
    maxVoices:
      1,
    cooldownMs:
      0,
    ...overrides,
  };
}

function createAudioFactory(
  elements:
    HTMLAudioElement[],
): AudioElementFactory {
  return (
    source: string,
  ) => {
    void source;

    const element =
      document.createElement(
        'audio',
      );

    Object.defineProperty(
      element,
      'play',
      {
        configurable:
          true,
        value:
          vi.fn()
            .mockResolvedValue(
              undefined,
            ),
      },
    );

    Object.defineProperty(
      element,
      'pause',
      {
        configurable:
          true,
        value:
          vi.fn(),
      },
    );

    elements.push(
      element,
    );

    return element;
  };
}

function createEngine(
  asset:
    AudioAssetDefinition,
  elements:
    HTMLAudioElement[],
): AudioEngine {
  const registry =
    new AudioRegistry(
      [
        asset,
      ],
    );

  return new AudioEngine(
    registry,
    DEFAULT_AUDIO_POLICIES,
    createAudioFactory(
      elements,
    ),
  );
}

describe(
  'QCQ AudioEngine',
  () => {
    beforeEach(
      () => {
        vi.spyOn(
          HTMLMediaElement.prototype,
          'canPlayType',
        ).mockReturnValue(
          'probably',
        );
      },
    );

    afterEach(
      () => {
        vi.restoreAllMocks();
      },
    );

    it(
      'requires an explicit user unlock before playback',
      async () => {
        const elements:
          HTMLAudioElement[] = [];

        const engine =
          createEngine(
            createAsset(),
            elements,
          );

        const result =
          await engine.play(
            'interface.test.effect',
          );

        expect(
          result,
        ).toEqual(
          {
            status:
              'blocked',
            assetId:
              'interface.test.effect',
            reason:
              'gesture-required',
          },
        );

        expect(
          elements,
        ).toHaveLength(
          0,
        );
      },
    );

    it(
      'blocks registered media until authenticated ready',
      async () => {
        const elements:
          HTMLAudioElement[] = [];

        const engine =
          createEngine(
            createAsset(
              {
                availability:
                  'pending',
              },
            ),
            elements,
          );

        engine.unlock();

        const result =
          await engine.play(
            'interface.test.effect',
          );

        expect(
          result,
        ).toEqual(
          {
            status:
              'blocked',
            assetId:
              'interface.test.effect',
            reason:
              'asset-pending',
          },
        );

        expect(
          elements,
        ).toHaveLength(
          0,
        );
      },
    );

    it(
      'enforces the per-asset maxVoices ceiling',
      async () => {
        const elements:
          HTMLAudioElement[] = [];

        const engine =
          createEngine(
            createAsset(
              {
                maxVoices:
                  1,
              },
            ),
            elements,
          );

        engine.unlock();

        const first =
          await engine.play(
            'interface.test.effect',
          );

        const second =
          await engine.play(
            'interface.test.effect',
          );

        expect(
          first.status,
        ).toBe(
          'started',
        );

        expect(
          second,
        ).toEqual(
          {
            status:
              'blocked',
            assetId:
              'interface.test.effect',
            reason:
              'voice-limit',
          },
        );

        expect(
          elements,
        ).toHaveLength(
          1,
        );

        engine.stopAsset(
          'interface.test.effect',
        );

        const third =
          await engine.play(
            'interface.test.effect',
          );

        expect(
          third.status,
        ).toBe(
          'started',
        );

        expect(
          elements,
        ).toHaveLength(
          2,
        );
      },
    );

    it(
      'honors explicit bus disabling',
      async () => {
        const elements:
          HTMLAudioElement[] = [];

        const engine =
          createEngine(
            createAsset(),
            elements,
          );

        engine.unlock();

        engine.setBusEnabled(
          'interface',
          false,
        );

        const result =
          await engine.play(
            'interface.test.effect',
          );

        expect(
          result,
        ).toEqual(
          {
            status:
              'blocked',
            assetId:
              'interface.test.effect',
            reason:
              'bus-disabled',
          },
        );

        expect(
          elements,
        ).toHaveLength(
          0,
        );
      },
    );
  },
);
