import {
  useEffect,
  useRef,
  type RefObject,
} from 'react';

import styles from './AudioMenuIcon.module.css';

export interface AudioMenuPopoverProps {
  readonly id: string;
  readonly open: boolean;
  readonly anchorRef: RefObject<HTMLButtonElement | null>;
  readonly unlocked: boolean;
  readonly muted: boolean;
  readonly playing: boolean;
  readonly masterGain: number;
  readonly onClose: () => void;
  readonly onEnable: () => Promise<void>;
  readonly onStop: () => void;
  readonly onMutedChange: (muted: boolean) => void;
  readonly onMasterGainChange: (gain: number) => void;
}

export function AudioMenuPopover({
  id,
  open,
  anchorRef,
  unlocked,
  muted,
  playing,
  masterGain,
  onClose,
  onEnable,
  onStop,
  onMutedChange,
  onMasterGainChange,
}: AudioMenuPopoverProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
      anchorRef.current?.focus({ preventScroll: true });
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const insideDialog = dialogRef.current?.contains(target) ?? false;
      const insideAnchor = anchorRef.current?.contains(target) ?? false;
      if (!insideDialog && !insideAnchor) onClose();
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [anchorRef, onClose, open]);

  if (!open) return null;

  return (
    <span className={styles.popoverLayer}>
      <div
        ref={dialogRef}
        id={id}
        className={styles.popover}
        role="dialog"
        aria-modal="false"
        aria-label="Audio options"
      >
        <header className={styles.popoverHeader}>
          <span className={styles.popoverEyebrow}>QCQ AUDIO</span>
          <strong>Study Soundtrack</strong>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close audio options"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className={styles.popoverBody}>
          {!unlocked ? (
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() => void onEnable()}
            >
              Enable soundtrack
            </button>
          ) : (
            <button
              type="button"
              className={styles.primaryAction}
              onClick={playing ? onStop : () => void onEnable()}
            >
              {playing ? 'Stop soundtrack' : 'Play soundtrack'}
            </button>
          )}

          <label className={styles.toggleRow}>
            <span>Mute audio</span>
            <input
              type="checkbox"
              checked={muted}
              onChange={(event) => onMutedChange(event.currentTarget.checked)}
            />
          </label>

          <label className={styles.sliderRow}>
            <span>Master volume</span>
            <output>{Math.round(masterGain * 100)}%</output>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterGain}
              onChange={(event) => onMasterGainChange(Number(event.currentTarget.value))}
            />
          </label>

          <p className={styles.audioStatus} aria-live="polite">
            {playing
              ? muted
                ? 'Soundtrack running — muted'
                : 'Soundtrack running'
              : unlocked
                ? 'Audio ready'
                : 'Audio requires explicit activation'}
          </p>
        </div>
      </div>
    </span>
  );
}

export default AudioMenuPopover;
