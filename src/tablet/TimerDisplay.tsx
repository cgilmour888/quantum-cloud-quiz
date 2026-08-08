/**
 * Artifact ID: QCQ-TBL-015
 * Artifact Name: TimerDisplay
 * Repository Path: QCQ/frontend/src/tablet/TimerDisplay.tsx
 */

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

export type TimerDisplayMode = 'elapsed' | 'remaining';
export type TimerDisplayStatus = 'running' | 'paused' | 'expired' | 'stopped';

export interface TimerDisplayProps {
  readonly mode: TimerDisplayMode;
  readonly startedAt: number;
  readonly durationSeconds?: number | undefined;
  readonly pausedAt?: number | null | undefined;
  readonly accumulatedPausedMilliseconds?: number | undefined;
  readonly stoppedAt?: number | null | undefined;
  readonly status?: TimerDisplayStatus | undefined;
  readonly warningAtSeconds?: number | undefined;
  readonly criticalAtSeconds?: number | undefined;
  readonly className?: string | undefined;
  readonly label?: string | undefined;
  readonly onExpire?: (() => void) | undefined;
}

const styles = `
  .qcq-timer-display {
    display: grid;
    min-width: 8.6rem;
    padding: 0.58rem 0.78rem;
    border: 1px solid rgb(169 112 255 / 38%);
    border-radius: 0.62rem;
    color: #f7efff;
    text-align: center;
    background:
      linear-gradient(180deg, rgb(255 255 255 / 6%), transparent),
      rgb(29 13 61 / 74%);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 10%),
      inset 0 0 1rem rgb(169 112 255 / 10%),
      0 0 0.8rem rgb(75 47 148 / 14%);
  }

  .qcq-timer-display__label {
    color: rgb(215 190 255 / 78%);
    font-size: 0.61rem;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .qcq-timer-display__value {
    margin-top: 0.13rem;
    font-family: "Arial Black", Inter, system-ui, sans-serif;
    font-size: 1.08rem;
    font-weight: 950;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.045em;
    text-shadow:
      0 0.08em 0 rgb(0 0 0 / 88%),
      0 0 0.72rem rgb(169 112 255 / 34%);
  }

  .qcq-timer-display__status {
    margin-top: 0.1rem;
    color: rgb(179 206 232 / 72%);
    font-size: 0.56rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .qcq-timer-display[data-urgency="warning"] {
    border-color: rgb(255 224 93 / 56%);
    color: #fff6bd;
    background: rgb(66 50 8 / 72%);
  }

  .qcq-timer-display[data-urgency="critical"],
  .qcq-timer-display[data-status="expired"] {
    border-color: rgb(255 92 88 / 62%);
    color: #ffe3e1;
    background: rgb(70 17 22 / 74%);
    box-shadow:
      inset 0 0 1rem rgb(255 92 88 / 12%),
      0 0 1rem rgb(255 92 88 / 24%);
  }

  .qcq-timer-display[data-status="paused"] {
    border-color: rgb(255 138 31 / 52%);
    color: #ffe0bd;
  }

  @media (forced-colors: active) {
    .qcq-timer-display {
      border: 1px solid CanvasText;
      color: CanvasText;
      background: Canvas;
      box-shadow: none;
    }
  }
`;

class SharedClock {
  private subscribers = new Set<() => void>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private now = Date.now();

  public subscribe = (listener: () => void): (() => void) => {
    this.subscribers.add(listener);
    this.ensureRunning();
    return () => {
      this.subscribers.delete(listener);
      if (this.subscribers.size === 0 && this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    };
  };

  public getSnapshot = (): number => this.now;
  public getServerSnapshot = (): number => 0;

  private ensureRunning(): void {
    if (this.intervalId !== null || this.subscribers.size === 0) return;
    this.now = Date.now();
    this.intervalId = setInterval(() => {
      this.now = Date.now();
      for (const subscriber of this.subscribers) subscriber();
    }, 250);
  }
}

const sharedClock = new SharedClock();
const noSubscribe = (): (() => void) => () => undefined;

function formatDuration(totalSeconds: number): string {
  const bounded = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(bounded / 3600);
  const minutes = Math.floor((bounded % 3600) / 60);
  const seconds = bounded % 60;
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function TimerDisplay({
  mode,
  startedAt,
  durationSeconds,
  pausedAt = null,
  accumulatedPausedMilliseconds = 0,
  stoppedAt = null,
  status = 'running',
  warningAtSeconds = 300,
  criticalAtSeconds = 60,
  className,
  label,
  onExpire,
}: TimerDisplayProps) {
  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    throw new Error('TimerDisplay startedAt must be a valid epoch timestamp.');
  }
  if (mode === 'remaining' && (!Number.isFinite(durationSeconds) || (durationSeconds ?? 0) <= 0)) {
    throw new Error('TimerDisplay remaining mode requires a positive durationSeconds value.');
  }

  const frozenNow = stoppedAt ?? pausedAt ?? startedAt;
  const now = useSyncExternalStore(
    status === 'running' ? sharedClock.subscribe : noSubscribe,
    status === 'running' ? sharedClock.getSnapshot : () => frozenNow,
    () => startedAt,
  );
  const effectiveNow = stoppedAt ?? (status === 'paused' ? pausedAt ?? now : now);
  const elapsedMilliseconds = Math.max(0, effectiveNow - startedAt - accumulatedPausedMilliseconds);
  const elapsedSeconds = elapsedMilliseconds / 1000;
  const displayedSeconds = mode === 'elapsed'
    ? elapsedSeconds
    : Math.max(0, (durationSeconds ?? 0) - elapsedSeconds);
  const expired = mode === 'remaining' && displayedSeconds <= 0;

  const expireNotified = useRef(false);
  useEffect(() => {
    if (expired && !expireNotified.current) {
      expireNotified.current = true;
      onExpire?.();
    } else if (!expired) {
      expireNotified.current = false;
    }
  }, [expired, onExpire]);

  const urgency = useMemo(() => {
    if (mode !== 'remaining') return 'normal';
    if (displayedSeconds <= Math.max(0, criticalAtSeconds)) return 'critical';
    if (displayedSeconds <= Math.max(criticalAtSeconds, warningAtSeconds)) return 'warning';
    return 'normal';
  }, [criticalAtSeconds, displayedSeconds, mode, warningAtSeconds]);

  const resolvedStatus: TimerDisplayStatus = expired ? 'expired' : status;
  const resolvedLabel = label ?? (mode === 'elapsed' ? 'Elapsed' : 'Remaining');
  const classes = ['qcq-timer-display', className].filter(Boolean).join(' ');

  return (
    <>
      <style>{styles}</style>
      <div
        className={classes}
        data-status={resolvedStatus}
        data-urgency={urgency}
        role="timer"
        aria-label={`${resolvedLabel}: ${formatDuration(displayedSeconds)}; ${resolvedStatus}`}
      >
        <span className="qcq-timer-display__label" aria-hidden="true">{resolvedLabel}</span>
        <strong className="qcq-timer-display__value" aria-hidden="true">
          {formatDuration(displayedSeconds)}
        </strong>
        <span className="qcq-timer-display__status" aria-hidden="true">{resolvedStatus}</span>
      </div>
    </>
  );
}
