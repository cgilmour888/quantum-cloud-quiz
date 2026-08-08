/**
 * Artifact ID: QCQ-AUD-012
 * Artifact Name: useAmbientAudio
 * Repository Path: QCQ/frontend/src/audio/useAmbientAudio.ts
 */

import {
  useCallback,
} from 'react';

import type {
  AudioPlaybackResult,
} from './AudioEngine';
import {
  useAudio,
} from './useAudio';

export interface AmbientAudioController {
  readonly unlocked: boolean;
  readonly muted: boolean;

  readonly start:
    () => Promise<AudioPlaybackResult>;

  readonly stop:
    () => void;
}

export function useAmbientAudio():
  AmbientAudioController {
  const {
    unlocked,
    muted,
    playEvent,
    stopEvent,
  } = useAudio();

  const start =
    useCallback(
      () =>
        playEvent(
          'ambientStart',
        ),
      [
        playEvent,
      ],
    );

  const stop =
    useCallback(
      () => {
        stopEvent(
          'ambientStart',
        );
      },
      [
        stopEvent,
      ],
    );

  return {
    unlocked,
    muted,
    start,
    stop,
  };
}
