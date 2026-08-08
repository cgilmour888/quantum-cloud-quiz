/**
 * Artifact ID: QCQ-AUD-011
 * Artifact Name: useAudio
 * Repository Path: QCQ/frontend/src/audio/useAudio.ts
 */

import {
  useContext,
} from 'react';

import {
  AudioRuntimeContext,
  type AudioRuntimeValue,
} from './AudioRuntimeContext';

export function useAudio():
  AudioRuntimeValue {
  const runtime =
    useContext(
      AudioRuntimeContext,
    );

  if (
    runtime === null
  ) {
    throw new Error(
      'useAudio must be used within AudioProvider.',
    );
  }

  return runtime;
}
