/**
 * Artifact ID: QCQ-AUD-014
 * Artifact Name: AmbientSoundtrack
 * Repository Path: QCQ/frontend/src/audio/AmbientSoundtrack.tsx
 */

import {
  useEffect,
  useRef,
} from 'react';

import {
  useAmbientAudio,
} from './useAmbientAudio';
import {
  useAudio,
} from './useAudio';

export interface AmbientSoundtrackProps {
  readonly enabled?: boolean;
}

function isAmbientKeyboardActivation(
  event: KeyboardEvent,
): boolean {
  return (
    !event.repeat
    && (
      event.key === 'Enter'
      || event.key === ' '
    )
  );
}

export function AmbientSoundtrack({
  enabled = true,
}: AmbientSoundtrackProps) {
  const {
    unlock,
  } = useAudio();

  const {
    start,
    stop,
  } = useAmbientAudio();

  const startedRef =
    useRef(
      false,
    );

  useEffect(
    () => {
      if (
        !enabled
      ) {
        startedRef.current =
          false;

        stop();

        return undefined;
      }

      const attemptStart =
        () => {
          if (
            startedRef.current
          ) {
            return;
          }

          unlock();

          void start().then(
            (result) => {
              if (
                result.status
                === 'started'
              ) {
                startedRef.current =
                  true;
              }
            },
          );
        };

      const handlePointerDown =
        (
          event: PointerEvent,
        ) => {
          if (
            event.button !== 0
          ) {
            return;
          }

          attemptStart();
        };

      const handleKeyDown =
        (
          event: KeyboardEvent,
        ) => {
          if (
            !isAmbientKeyboardActivation(
              event,
            )
          ) {
            return;
          }

          attemptStart();
        };

      const handleVisibilityChange =
        () => {
          if (
            document.visibilityState
            === 'hidden'
          ) {
            startedRef.current =
              false;
          }
        };

      document.addEventListener(
        'pointerdown',
        handlePointerDown,
        {
          capture: true,
          passive: true,
        },
      );

      document.addEventListener(
        'keydown',
        handleKeyDown,
        true,
      );

      document.addEventListener(
        'visibilitychange',
        handleVisibilityChange,
      );

      return () => {
        document.removeEventListener(
          'pointerdown',
          handlePointerDown,
          true,
        );

        document.removeEventListener(
          'keydown',
          handleKeyDown,
          true,
        );

        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange,
        );

        startedRef.current =
          false;

        stop();
      };
    },
    [
      enabled,
      start,
      stop,
      unlock,
    ],
  );

  return null;
}
