/**
 * Artifact ID: QCQ-AUD-005
 * Artifact Name: AudioCapabilities
 * Repository Path: QCQ/frontend/src/audio/AudioCapabilities.ts
 */

import type {
  AudioSourceDefinition,
  AudioSourceFormat,
} from './audio.types';

export interface AudioCapabilitySnapshot {
  readonly supportedFormats:
    ReadonlySet<AudioSourceFormat>;
}

const FORMAT_PROBES = [
  {
    format: 'audio/mpeg',
    mime: 'audio/mpeg',
  },
  {
    format: 'audio/ogg',
    mime: 'audio/ogg; codecs="vorbis"',
  },
] as const satisfies readonly {
  readonly format: AudioSourceFormat;
  readonly mime: string;
}[];

function isPlayableResponse(
  response: string,
): boolean {
  return (
    response === 'probably'
    || response === 'maybe'
  );
}

export function detectAudioCapabilities():
  AudioCapabilitySnapshot {
  const element =
    document.createElement(
      'audio',
    );

  const supportedFormats =
    new Set<AudioSourceFormat>();

  for (
    const probe
    of FORMAT_PROBES
  ) {
    if (
      isPlayableResponse(
        element.canPlayType(
          probe.mime,
        ),
      )
    ) {
      supportedFormats.add(
        probe.format,
      );
    }
  }

  return {
    supportedFormats,
  };
}

export function selectSupportedAudioSource(
  sources:
    readonly AudioSourceDefinition[],
  capabilities:
    AudioCapabilitySnapshot,
): AudioSourceDefinition | undefined {
  return sources.find(
    (source) =>
      capabilities.supportedFormats.has(
        source.format,
      ),
  );
}
