/**
 * QCQ Audio Menu — production bridge to the governed QCQ audio runtime.
 * Reuses the historical QCQ-AUD-110 web-native icon while binding to the
 * current AudioRuntimeContext / AudioEngine implementation.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { AudioMenuIcon } from './AudioMenuIcon';
import { AudioMenuPopover } from './AudioMenuPopover';
import { useAmbientAudio } from './useAmbientAudio';
import { useAudio } from './useAudio';
import styles from './AudioMenuIcon.module.css';

export interface AudioMenuButtonProps {
  readonly className?: string;
  readonly label?: string;
}

function joinClassNames(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(' ');
}

export function AudioMenuButton({
  className,
  label = 'Audio options',
}: AudioMenuButtonProps) {
  const {
    unlocked,
    muted,
    masterGain,
    unlock,
    setMuted,
    setMasterGain,
  } = useAudio();

  const {
    start,
    stop,
  } = useAmbientAudio();

  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const generatedId = useId().replace(/:/gu, '');
  const popoverId = `qcq-audio-options-${generatedId}`;

  const enableSoundtrack = useCallback(async () => {
    unlock();
    const result = await start();
    setPlaying(result.status === 'started');
  }, [start, unlock]);

  const stopSoundtrack = useCallback(() => {
    stop();
    setPlaying(false);
  }, [stop]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') setPlaying(false);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <span
      className={joinClassNames(styles.menuRoot, className)}
      data-qcq-audio-menu="true"
    >
      <button
        ref={buttonRef}
        type="button"
        className={styles.menuButton}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        data-open={open ? 'true' : 'false'}
        data-audio={playing ? 'playing' : unlocked ? 'ready' : 'locked'}
        onClick={() => setOpen((current) => !current)}
      >
        <AudioMenuIcon
          paused={open}
          active={playing && !muted}
          muted={muted}
        />
      </button>

      <AudioMenuPopover
        id={popoverId}
        open={open}
        anchorRef={buttonRef}
        unlocked={unlocked}
        muted={muted}
        playing={playing}
        masterGain={masterGain}
        onClose={() => setOpen(false)}
        onEnable={enableSoundtrack}
        onStop={stopSoundtrack}
        onMutedChange={setMuted}
        onMasterGainChange={setMasterGain}
      />
    </span>
  );
}

export default AudioMenuButton;
