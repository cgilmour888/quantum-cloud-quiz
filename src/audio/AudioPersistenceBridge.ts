/**
 * Artifact ID: QCQ-AUD-016
 * Artifact Name: AudioPersistenceBridge
 * Repository Path: QCQ/frontend/src/audio/AudioPersistenceBridge.ts
 */

import {
  DEFAULT_AUDIO_POLICIES,
} from './AudioPolicies';
import type {
  AudioBusName,
} from './audio.types';

export interface AudioBusPreference {
  readonly enabled: boolean;
  readonly gain: number;
}

export interface AudioPreferenceSnapshot {
  readonly muted: boolean;
  readonly masterGain: number;
  readonly buses: Readonly<
    Record<
      AudioBusName,
      AudioBusPreference
    >
  >;
}

export interface AudioPreferenceStorePort {
  readonly load:
    () => Promise<unknown>;

  readonly save:
    (
      snapshot:
        AudioPreferenceSnapshot,
    ) => Promise<void>;
}

const AUDIO_BUS_NAMES = [
  'music',
  'environment',
  'interface',
  'gameplay',
  'achievements',
] as const satisfies readonly AudioBusName[];

function clampGain(
  value: number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0;
  }

  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
  );
}

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === 'object'
    && value !== null
  );
}

function readBoolean(
  value: unknown,
  fallback: boolean,
): boolean {
  return (
    typeof value === 'boolean'
      ? value
      : fallback
  );
}

function readGain(
  value: unknown,
  fallback: number,
): number {
  return (
    typeof value === 'number'
      ? clampGain(
          value,
        )
      : fallback
  );
}

export function createDefaultAudioPreferenceSnapshot():
  AudioPreferenceSnapshot {
  return {
    muted: false,
    masterGain: 1,
    buses: {
      music: {
        enabled:
          DEFAULT_AUDIO_POLICIES
            .buses
            .music
            .enabledByDefault,
        gain:
          DEFAULT_AUDIO_POLICIES
            .buses
            .music
            .defaultGain,
      },
      environment: {
        enabled:
          DEFAULT_AUDIO_POLICIES
            .buses
            .environment
            .enabledByDefault,
        gain:
          DEFAULT_AUDIO_POLICIES
            .buses
            .environment
            .defaultGain,
      },
      interface: {
        enabled:
          DEFAULT_AUDIO_POLICIES
            .buses
            .interface
            .enabledByDefault,
        gain:
          DEFAULT_AUDIO_POLICIES
            .buses
            .interface
            .defaultGain,
      },
      gameplay: {
        enabled:
          DEFAULT_AUDIO_POLICIES
            .buses
            .gameplay
            .enabledByDefault,
        gain:
          DEFAULT_AUDIO_POLICIES
            .buses
            .gameplay
            .defaultGain,
      },
      achievements: {
        enabled:
          DEFAULT_AUDIO_POLICIES
            .buses
            .achievements
            .enabledByDefault,
        gain:
          DEFAULT_AUDIO_POLICIES
            .buses
            .achievements
            .defaultGain,
      },
    },
  };
}

export function normalizeAudioPreferenceSnapshot(
  input: unknown,
): AudioPreferenceSnapshot {
  const defaults =
    createDefaultAudioPreferenceSnapshot();

  if (
    !isRecord(
      input,
    )
  ) {
    return defaults;
  }

  const rawBuses =
    isRecord(
      input.buses,
    )
      ? input.buses
      : {};

  const normalizeBus =
    (
      bus: AudioBusName,
    ): AudioBusPreference => {
      const fallback =
        defaults.buses[
          bus
        ];

      const raw =
        isRecord(
          rawBuses[
            bus
          ],
        )
          ? rawBuses[
              bus
            ]
          : {};

      return {
        enabled:
          readBoolean(
            raw.enabled,
            fallback.enabled,
          ),
        gain:
          readGain(
            raw.gain,
            fallback.gain,
          ),
      };
    };

  return {
    muted:
      readBoolean(
        input.muted,
        defaults.muted,
      ),
    masterGain:
      readGain(
        input.masterGain,
        defaults.masterGain,
      ),
    buses: {
      music:
        normalizeBus(
          'music',
        ),
      environment:
        normalizeBus(
          'environment',
        ),
      interface:
        normalizeBus(
          'interface',
        ),
      gameplay:
        normalizeBus(
          'gameplay',
        ),
      achievements:
        normalizeBus(
          'achievements',
        ),
    },
  };
}

export class AudioPersistenceBridge {
  public constructor(
    private readonly store:
      AudioPreferenceStorePort,
  ) {}

  public async load():
    Promise<AudioPreferenceSnapshot> {
    const stored =
      await this.store.load();

    return normalizeAudioPreferenceSnapshot(
      stored,
    );
  }

  public async save(
    snapshot:
      AudioPreferenceSnapshot,
  ): Promise<void> {
    await this.store.save(
      normalizeAudioPreferenceSnapshot(
        snapshot,
      ),
    );
  }

  public listGovernedBuses():
    readonly AudioBusName[] {
    return AUDIO_BUS_NAMES;
  }
}
