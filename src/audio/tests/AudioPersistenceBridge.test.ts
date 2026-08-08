import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  AudioPersistenceBridge,
  createDefaultAudioPreferenceSnapshot,
  normalizeAudioPreferenceSnapshot,
  type AudioPreferenceSnapshot,
  type AudioPreferenceStorePort,
} from '../AudioPersistenceBridge';

describe(
  'QCQ AudioPersistenceBridge',
  () => {
    it(
      'creates a complete five-bus default preference snapshot',
      () => {
        const snapshot =
          createDefaultAudioPreferenceSnapshot();

        expect(
          snapshot.muted,
        ).toBe(
          false,
        );

        expect(
          snapshot.masterGain,
        ).toBe(
          1,
        );

        expect(
          Object.keys(
            snapshot.buses,
          ),
        ).toEqual(
          [
            'music',
            'environment',
            'interface',
            'gameplay',
            'achievements',
          ],
        );

        expect(
          snapshot.buses.music.gain,
        ).toBeGreaterThanOrEqual(
          0,
        );

        expect(
          snapshot.buses.music.gain,
        ).toBeLessThanOrEqual(
          1,
        );
      },
    );

    it(
      'normalizes malformed persisted values without trusting their types or ranges',
      () => {
        const normalized =
          normalizeAudioPreferenceSnapshot(
            {
              muted:
                'yes',
              masterGain:
                4,
              buses: {
                music: {
                  enabled:
                    'yes',
                  gain:
                    2,
                },
                environment: {
                  enabled:
                    false,
                  gain:
                    -1,
                },
                interface: {
                  enabled:
                    true,
                  gain:
                    0.4,
                },
              },
            },
          );

        expect(
          normalized.muted,
        ).toBe(
          false,
        );

        expect(
          normalized.masterGain,
        ).toBe(
          1,
        );

        expect(
          normalized.buses.music.enabled,
        ).toBe(
          true,
        );

        expect(
          normalized.buses.music.gain,
        ).toBe(
          1,
        );

        expect(
          normalized.buses.environment.enabled,
        ).toBe(
          false,
        );

        expect(
          normalized.buses.environment.gain,
        ).toBe(
          0,
        );

        expect(
          normalized.buses.interface,
        ).toEqual(
          {
            enabled:
              true,
            gain:
              0.4,
          },
        );

        expect(
          normalized.buses.gameplay.enabled,
        ).toBe(
          true,
        );

        expect(
          normalized.buses.achievements.enabled,
        ).toBe(
          true,
        );
      },
    );

    it(
      'normalizes non-finite persisted gain values to safe finite values',
      () => {
        const normalized =
          normalizeAudioPreferenceSnapshot(
            {
              muted:
                true,
              masterGain:
                Number.NaN,
              buses: {
                music: {
                  enabled:
                    true,
                  gain:
                    Number.POSITIVE_INFINITY,
                },
              },
            },
          );

        expect(
          normalized.muted,
        ).toBe(
          true,
        );

        expect(
          normalized.masterGain,
        ).toBe(
          0,
        );

        expect(
          normalized.buses.music.gain,
        ).toBe(
          0,
        );

        expect(
          Number.isFinite(
            normalized.masterGain,
          ),
        ).toBe(
          true,
        );

        expect(
          Number.isFinite(
            normalized.buses.music.gain,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      'loads and saves only normalized snapshots through the injected persistence port',
      async () => {
        const save =
          vi.fn<
            (
              snapshot:
                AudioPreferenceSnapshot,
            ) => Promise<void>
          >()
            .mockResolvedValue(
              undefined,
            );

        const store:
          AudioPreferenceStorePort = {
            load:
              vi.fn()
                .mockResolvedValue(
                  {
                    muted:
                      true,
                    masterGain:
                      8,
                    buses: {
                      gameplay: {
                        enabled:
                          false,
                        gain:
                          -5,
                      },
                    },
                  },
                ),
            save,
          };

        const bridge =
          new AudioPersistenceBridge(
            store,
          );

        const loaded =
          await bridge.load();

        expect(
          loaded.muted,
        ).toBe(
          true,
        );

        expect(
          loaded.masterGain,
        ).toBe(
          1,
        );

        expect(
          loaded.buses.gameplay.enabled,
        ).toBe(
          false,
        );

        expect(
          loaded.buses.gameplay.gain,
        ).toBe(
          0,
        );

        expect(
          bridge.listGovernedBuses(),
        ).toEqual(
          [
            'music',
            'environment',
            'interface',
            'gameplay',
            'achievements',
          ],
        );

        await bridge.save(
          {
            ...loaded,
            masterGain:
              12,
          },
        );

        expect(
          save,
        ).toHaveBeenCalledTimes(
          1,
        );

        const saved =
          save.mock.calls[0]?.[0];

        expect(
          saved?.masterGain,
        ).toBe(
          1,
        );
      },
    );
  },
);
