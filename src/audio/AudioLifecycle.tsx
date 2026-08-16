/**
 * Artifact ID: QCQ-AUD-015
 * Artifact Name: AudioLifecycle
 * Repository Path: QCQ/frontend/src/audio/AudioLifecycle.tsx
 *
 * Long-session policy: once the user explicitly enables the study soundtrack,
 * ordinary document visibility changes must never destroy the music voice.
 * Environmental audio may still be suspended while hidden. Full teardown is
 * reserved for pagehide/unmount lifecycle boundaries.
 */

import {
  useEffect,
} from 'react';

import {
  DEFAULT_AUDIO_POLICIES,
} from './AudioPolicies';
import {
  useAudio,
} from './useAudio';

export function AudioLifecycle() {
  const {
    stopAll,
    stopBus,
  } = useAudio();

  useEffect(
    () => {
      const handleVisibilityChange =
        () => {
          if (
            !DEFAULT_AUDIO_POLICIES
              .suspendWhenHidden
          ) {
            return;
          }

          if (
            document.visibilityState
            !== 'hidden'
          ) {
            return;
          }

          // Keep the user-authorized study soundtrack alive for all-day
          // sessions. Only transient environmental audio is suspended here.
          stopBus(
            'environment',
          );
        };

      const handlePageHide =
        () => {
          stopAll();
        };

      document.addEventListener(
        'visibilitychange',
        handleVisibilityChange,
      );

      window.addEventListener(
        'pagehide',
        handlePageHide,
      );

      return () => {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange,
        );

        window.removeEventListener(
          'pagehide',
          handlePageHide,
        );
      };
    },
    [
      stopAll,
      stopBus,
    ],
  );

  return null;
}
