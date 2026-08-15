/**
 * Artifact ID: QCQ-AUD-014
 * Artifact Name: AmbientSoundtrack
 * Production policy: soundtrack start is owned by the explicit audio-menu
 * activation gesture. This lifecycle component is intentionally silent and
 * only stops ambient playback when disabled or unmounted.
 */
import { useEffect } from 'react';

import { useAmbientAudio } from './useAmbientAudio';

export interface AmbientSoundtrackProps {
  readonly enabled?: boolean;
}

export function AmbientSoundtrack({
  enabled = true,
}: AmbientSoundtrackProps) {
  const { stop } = useAmbientAudio();

  useEffect(() => {
    if (!enabled) {
      stop();
    }
  }, [enabled, stop]);

  useEffect(
    () => () => {
      stop();
    },
    [stop],
  );

  return null;
}
