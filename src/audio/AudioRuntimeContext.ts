/**
 * Artifact ID: QCQ-AUD-009
 * Artifact Name: AudioRuntimeContext
 * Repository Path: QCQ/frontend/src/audio/AudioRuntimeContext.ts
 */

import {
  createContext,
} from 'react';

import type {
  AudioPlaybackResult,
} from './AudioEngine';
import type {
  AudioEventName,
} from './AudioEvents';
import type {
  AudioBusName,
} from './audio.types';

export interface AudioRuntimeValue {
  readonly unlocked: boolean;
  readonly muted: boolean;
  readonly masterGain: number;

  readonly unlock:
    () => void;

  readonly setMuted:
    (muted: boolean) => void;

  readonly setMasterGain:
    (gain: number) => void;

  readonly setBusEnabled:
    (
      bus: AudioBusName,
      enabled: boolean,
    ) => void;

  readonly setBusGain:
    (
      bus: AudioBusName,
      gain: number,
    ) => void;

  readonly playEvent:
    (
      event: AudioEventName,
    ) => Promise<AudioPlaybackResult>;

  readonly stopEvent:
    (
      event: AudioEventName,
    ) => void;

  readonly stopBus:
    (
      bus: AudioBusName,
    ) => void;

  readonly stopAll:
    () => void;
}

export const AudioRuntimeContext =
  createContext<
    AudioRuntimeValue | null
  >(
    null,
  );
