/**
 * Artifact ID: QCQ-TBL-014
 * Artifact Name: QuestionCounter
 * Repository Path: QCQ/frontend/src/tablet/QuestionCounter.tsx
 */

import type { CSSProperties } from 'react';

export interface QuestionCounterProps {
  readonly current: number;
  readonly total: number;
  readonly answered?: number | undefined;
  readonly flagged?: number | undefined;
  readonly className?: string | undefined;
  readonly compact?: boolean | undefined;
}

type CounterStyle = CSSProperties & Record<'--qcq-counter-progress', string>;

const styles = `
  .qcq-question-counter {
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(5rem, 1fr);
    gap: 0.72rem;
    align-items: center;
    min-width: min(100%, 13rem);
    padding: 0.52rem 0.68rem;
    border: 1px solid rgb(32 221 255 / 28%);
    border-radius: 0.62rem;
    color: #f6fbff;
    background:
      linear-gradient(180deg, rgb(255 255 255 / 5%), transparent),
      rgb(3 10 24 / 78%);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 9%),
      inset 0 0 1rem rgb(32 221 255 / 6%);
  }

  .qcq-question-counter__position {
    display: flex;
    align-items: baseline;
    gap: 0.22rem;
    font-family: "Arial Black", Inter, system-ui, sans-serif;
    font-variant-numeric: tabular-nums;
    text-shadow:
      0 0.08em 0 rgb(0 0 0 / 86%),
      0 0 0.65rem rgb(32 221 255 / 28%);
  }

  .qcq-question-counter__current {
    color: #fff;
    font-size: 1.18rem;
    font-weight: 950;
  }

  .qcq-question-counter__separator,
  .qcq-question-counter__total {
    color: rgb(173 211 237 / 78%);
    font-size: 0.78rem;
    font-weight: 850;
  }

  .qcq-question-counter__track {
    position: relative;
    height: 0.34rem;
    overflow: hidden;
    border-radius: 999px;
    background: rgb(88 142 198 / 18%);
  }

  .qcq-question-counter__track::after {
    position: absolute;
    inset: 0;
    width: var(--qcq-counter-progress);
    border-radius: inherit;
    background: linear-gradient(90deg, #20ddff, #3978ff 46%, #a970ff 78%, #ff8a1f);
    box-shadow: 0 0 0.75rem rgb(32 221 255 / 58%);
    content: "";
  }

  .qcq-question-counter__metadata {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.75rem;
    color: rgb(167 202 228 / 76%);
    font-size: 0.63rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .qcq-question-counter[data-compact="true"] {
    grid-template-columns: auto 4rem;
    min-width: 8rem;
  }

  .qcq-question-counter[data-compact="true"] .qcq-question-counter__metadata {
    display: none;
  }

  @media (forced-colors: active) {
    .qcq-question-counter {
      border: 1px solid CanvasText;
      color: CanvasText;
      background: Canvas;
      box-shadow: none;
    }
  }
`;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function QuestionCounter({
  current,
  total,
  answered = 0,
  flagged = 0,
  className,
  compact = false,
}: QuestionCounterProps) {
  if (!Number.isInteger(total) || total < 1) {
    throw new Error('QuestionCounter total must be a positive integer.');
  }
  if (!Number.isInteger(current) || current < 1 || current > total) {
    throw new Error('QuestionCounter current must be within the total question range.');
  }

  const safeAnswered = clamp(Math.trunc(answered), 0, total);
  const safeFlagged = clamp(Math.trunc(flagged), 0, total);
  const percentage = (current / total) * 100;
  const classes = ['qcq-question-counter', className].filter(Boolean).join(' ');
  const style: CounterStyle = { '--qcq-counter-progress': `${percentage}%` };

  return (
    <>
      <style>{styles}</style>
      <div
        className={classes}
        style={style}
        data-compact={String(compact)}
        role="group"
        aria-label={`Question ${current} of ${total}; ${safeAnswered} answered; ${safeFlagged} flagged`}
      >
        <div className="qcq-question-counter__position" aria-hidden="true">
          <span className="qcq-question-counter__current">{current}</span>
          <span className="qcq-question-counter__separator">/</span>
          <span className="qcq-question-counter__total">{total}</span>
        </div>
        <div
          className="qcq-question-counter__track"
          role="progressbar"
          aria-label="Question position"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={current}
        />
        <div className="qcq-question-counter__metadata" aria-hidden="true">
          <span>{safeAnswered} answered</span>
          <span>{safeFlagged} flagged</span>
        </div>
      </div>
    </>
  );
}
