/**
 * Artifact ID: QCQ-AUD-013
 * Artifact Name: useSoundEffect
 * Repository Path: QCQ/frontend/src/audio/useSoundEffect.ts
 */

import {
  useCallback,
} from 'react';

import type {
  AudioPlaybackResult,
} from './AudioEngine';
import type {
  AudioEventName,
} from './AudioEvents';
import {
  useAudio,
} from './useAudio';

export interface SoundEffectController {
  readonly play:
    () => Promise<AudioPlaybackResult>;

  readonly stop:
    () => void;
}

export function useSoundEffect(
  event: AudioEventName,
): SoundEffectController {
  const {
    playEvent,
    stopEvent,
  } = useAudio();

  const play =
    useCallback(
      () =>
        playEvent(
          event,
        ),
      [
        event,
        playEvent,
      ],
    );

  const stop =
    useCallback(
      () => {
        stopEvent(
          event,
        );
      },
      [
        event,
        stopEvent,
      ],
    );

  return {
    play,
    stop,
  };
}
