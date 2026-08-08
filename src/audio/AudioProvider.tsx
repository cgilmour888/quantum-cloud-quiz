/**
 * Artifact ID: QCQ-AUD-010
 * Artifact Name: AudioProvider
 * Repository Path: QCQ/frontend/src/audio/AudioProvider.tsx
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  AudioEngine,
  audioEngine,
  type AudioPlaybackResult,
} from './AudioEngine';
import {
  resolveAudioEvent,
  type AudioEventName,
} from './AudioEvents';
import {
  AudioRuntimeContext,
  type AudioRuntimeValue,
} from './AudioRuntimeContext';
import type {
  AudioBusName,
} from './audio.types';

export interface AudioProviderProps
  extends PropsWithChildren {
  readonly engine?: AudioEngine;
}

export function AudioProvider({
  children,
  engine = audioEngine,
}: AudioProviderProps) {
  const [
    unlocked,
    setUnlocked,
  ] = useState(
    engine.isUnlocked(),
  );

  const [
    muted,
    setMutedState,
  ] = useState(
    engine.isMuted(),
  );

  const [
    masterGain,
    setMasterGainState,
  ] = useState(
    engine.getMasterGain(),
  );

  const unlock =
    useCallback(
      () => {
        engine.unlock();
        setUnlocked(
          true,
        );
      },
      [
        engine,
      ],
    );

  const setMuted =
    useCallback(
      (
        nextMuted: boolean,
      ) => {
        engine.setMuted(
          nextMuted,
        );

        setMutedState(
          nextMuted,
        );
      },
      [
        engine,
      ],
    );

  const setMasterGain =
    useCallback(
      (
        gain: number,
      ) => {
        engine.setMasterGain(
          gain,
        );

        setMasterGainState(
          engine.getMasterGain(),
        );
      },
      [
        engine,
      ],
    );

  const setBusEnabled =
    useCallback(
      (
        bus: AudioBusName,
        enabled: boolean,
      ) => {
        engine.setBusEnabled(
          bus,
          enabled,
        );
      },
      [
        engine,
      ],
    );

  const setBusGain =
    useCallback(
      (
        bus: AudioBusName,
        gain: number,
      ) => {
        engine.setBusGain(
          bus,
          gain,
        );
      },
      [
        engine,
      ],
    );

  const playEvent =
    useCallback(
      (
        event: AudioEventName,
      ): Promise<AudioPlaybackResult> =>
        engine.play(
          resolveAudioEvent(
            event,
          ),
        ),
      [
        engine,
      ],
    );

  const stopEvent =
    useCallback(
      (
        event: AudioEventName,
      ) => {
        engine.stopAsset(
          resolveAudioEvent(
            event,
          ),
        );
      },
      [
        engine,
      ],
    );

  const stopBus =
    useCallback(
      (
        bus: AudioBusName,
      ) => {
        engine.stopBus(
          bus,
        );
      },
      [
        engine,
      ],
    );

  const stopAll =
    useCallback(
      () => {
        engine.stopAll();
      },
      [
        engine,
      ],
    );

  useEffect(
    () =>
      () => {
        engine.stopAll();
      },
    [
      engine,
    ],
  );

  const value =
    useMemo<AudioRuntimeValue>(
      () => ({
        unlocked,
        muted,
        masterGain,
        unlock,
        setMuted,
        setMasterGain,
        setBusEnabled,
        setBusGain,
        playEvent,
        stopEvent,
        stopBus,
        stopAll,
      }),
      [
        unlocked,
        muted,
        masterGain,
        unlock,
        setMuted,
        setMasterGain,
        setBusEnabled,
        setBusGain,
        playEvent,
        stopEvent,
        stopBus,
        stopAll,
      ],
    );

  return (
    <AudioRuntimeContext.Provider
      value={value}
    >
      {children}
    </AudioRuntimeContext.Provider>
  );
}
