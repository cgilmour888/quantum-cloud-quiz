/**
 * Artifact ID: QCQ-AUD-015
 * Artifact Name: AudioLifecycle
 * Repository Path: QCQ/frontend/src/audio/AudioLifecycle.tsx
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

          stopBus(
            'music',
          );

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
