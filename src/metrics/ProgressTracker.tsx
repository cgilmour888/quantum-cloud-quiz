/**
 * Artifact ID: QCQ-TBL-029
 * Artifact Name: ProgressTracker
 * Repository Path: QCQ/frontend/src/metrics/ProgressTracker.tsx
 */

import type { CSSProperties } from 'react';

export type ProgressTrackerVariant = 'linear' | 'radial' | 'segmented';
export type ProgressTrackerTone = 'cyan' | 'violet' | 'emerald' | 'orange' | 'gold';

export interface ProgressTrackerProps {
  readonly label: string;
  readonly value: number;
  readonly maximum?: number | undefined;
  readonly variant?: ProgressTrackerVariant | undefined;
  readonly tone?: ProgressTrackerTone | undefined;
  readonly segments?: number | undefined;
  readonly showValue?: boolean | undefined;
  readonly valueFormatter?: ((value: number, maximum: number) => string) | undefined;
  readonly className?: string | undefined;
  readonly description?: string | undefined;
}

type ProgressStyle = CSSProperties &
  Record<'--qcq-progress-ratio' | '--qcq-progress-segments', string>;

const styles = `
  .qcq-progress-tracker {
    --qcq-progress-accent: #20ddff;
    --qcq-progress-accent-rgb: 32 221 255;
    display: grid;
    gap: 0.48rem;
    min-width: 0;
    color: #f5fbff;
  }
  .qcq-progress-tracker[data-tone="violet"] { --qcq-progress-accent: #b17aff; --qcq-progress-accent-rgb: 177 122 255; }
  .qcq-progress-tracker[data-tone="emerald"] { --qcq-progress-accent: #27e6a1; --qcq-progress-accent-rgb: 39 230 161; }
  .qcq-progress-tracker[data-tone="orange"] { --qcq-progress-accent: #ff9a35; --qcq-progress-accent-rgb: 255 154 53; }
  .qcq-progress-tracker[data-tone="gold"] { --qcq-progress-accent: #ffe05d; --qcq-progress-accent-rgb: 255 224 93; }

  .qcq-progress-tracker__header {
    display: flex;
    gap: 0.75rem;
    align-items: baseline;
    justify-content: space-between;
    min-width: 0;
  }
  .qcq-progress-tracker__label {
    min-width: 0;
    color: rgb(193 221 242 / 84%);
    font-size: 0.68rem;
    font-weight: 900;
    letter-spacing: 0.1em;
    overflow-wrap: anywhere;
    text-transform: uppercase;
  }
  .qcq-progress-tracker__value {
    flex: none;
    color: var(--qcq-progress-accent);
    font-family: "Arial Black", Inter, system-ui, sans-serif;
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 0.65rem rgb(var(--qcq-progress-accent-rgb) / 38%);
  }

  .qcq-progress-tracker__linear {
    position: relative;
    height: 0.62rem;
    overflow: hidden;
    border: 1px solid rgb(var(--qcq-progress-accent-rgb) / 22%);
    border-radius: 999px;
    background: rgb(57 91 127 / 18%);
    box-shadow: inset 0 0.18rem 0.36rem rgb(0 0 0 / 38%);
  }
  .qcq-progress-tracker__linear::after {
    position: absolute;
    inset: 0 auto 0 0;
    width: calc(var(--qcq-progress-ratio) * 100%);
    border-radius: inherit;
    background: linear-gradient(90deg, rgb(var(--qcq-progress-accent-rgb) / 58%), var(--qcq-progress-accent));
    box-shadow: 0 0 0.8rem rgb(var(--qcq-progress-accent-rgb) / 52%);
    content: "";
  }

  .qcq-progress-tracker__segments {
    display: grid;
    grid-template-columns: repeat(var(--qcq-progress-segments), minmax(0, 1fr));
    gap: 0.24rem;
  }
  .qcq-progress-tracker__segment {
    height: 0.58rem;
    border: 1px solid rgb(var(--qcq-progress-accent-rgb) / 22%);
    transform: skewX(-12deg);
    background: rgb(57 91 127 / 18%);
  }
  .qcq-progress-tracker__segment[data-filled="true"] {
    background: var(--qcq-progress-accent);
    box-shadow: 0 0 0.62rem rgb(var(--qcq-progress-accent-rgb) / 44%);
  }

  .qcq-progress-tracker__radial-wrap {
    position: relative;
    display: grid;
    width: clamp(5.5rem, 13cqi, 7.2rem);
    aspect-ratio: 1;
    place-items: center;
  }
  .qcq-progress-tracker__radial {
    width: 100%;
    height: 100%;
    overflow: visible;
    transform: rotate(-90deg);
  }
  .qcq-progress-tracker__radial-track,
  .qcq-progress-tracker__radial-value {
    fill: none;
    stroke-width: 8;
  }
  .qcq-progress-tracker__radial-track { stroke: rgb(86 125 163 / 18%); }
  .qcq-progress-tracker__radial-value {
    stroke: var(--qcq-progress-accent);
    stroke-linecap: round;
    stroke-dasharray: 100;
    stroke-dashoffset: calc(100 - (var(--qcq-progress-ratio) * 100));
    filter: drop-shadow(0 0 0.36rem rgb(var(--qcq-progress-accent-rgb) / 52%));
  }
  .qcq-progress-tracker__radial-text {
    position: absolute;
    color: #fff;
    font-family: "Arial Black", Inter, system-ui, sans-serif;
    font-size: clamp(0.78rem, 2cqi, 1.05rem);
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 0.7rem rgb(var(--qcq-progress-accent-rgb) / 38%);
  }

  .qcq-progress-tracker__description {
    margin: 0;
    color: rgb(169 201 225 / 70%);
    font-size: 0.7rem;
    line-height: 1.4;
  }

  @media (forced-colors: active) {
    .qcq-progress-tracker { color: CanvasText; }
    .qcq-progress-tracker__linear,
    .qcq-progress-tracker__segment { border: 1px solid CanvasText; background: Canvas; box-shadow: none; }
    .qcq-progress-tracker__linear::after,
    .qcq-progress-tracker__segment[data-filled="true"] { background: Highlight; box-shadow: none; }
    .qcq-progress-tracker__radial-track { stroke: GrayText; }
    .qcq-progress-tracker__radial-value { stroke: Highlight; filter: none; }
  }
`;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function ProgressTracker({
  label,
  value,
  maximum = 1,
  variant = 'linear',
  tone = 'cyan',
  segments = 10,
  showValue = true,
  valueFormatter,
  className,
  description,
}: ProgressTrackerProps) {
  if (!label.trim()) throw new Error('ProgressTracker requires a non-empty label.');
  if (!Number.isFinite(maximum) || maximum <= 0) {
    throw new Error('ProgressTracker maximum must be a positive finite number.');
  }
  if (!Number.isFinite(value)) {
    throw new Error('ProgressTracker value must be finite.');
  }
  const safeSegments = clamp(Math.trunc(segments), 2, 50);
  const ratio = clamp(value / maximum, 0, 1);
  const formatted = valueFormatter
    ? valueFormatter(value, maximum)
    : `${Math.round(ratio * 100)}%`;
  const classes = ['qcq-progress-tracker', className].filter(Boolean).join(' ');
  const style: ProgressStyle = {
    '--qcq-progress-ratio': String(ratio),
    '--qcq-progress-segments': String(safeSegments),
  };
  const progressProps = {
    role: 'progressbar',
    'aria-label': label,
    'aria-valuemin': 0,
    'aria-valuemax': maximum,
    'aria-valuenow': clamp(value, 0, maximum),
    'aria-valuetext': formatted,
  } as const;

  return (
    <>
      <style>{styles}</style>
      <section className={classes} style={style} data-tone={tone}>
        <header className="qcq-progress-tracker__header">
          <span className="qcq-progress-tracker__label">{label}</span>
          {showValue && variant !== 'radial' ? (
            <strong className="qcq-progress-tracker__value">{formatted}</strong>
          ) : null}
        </header>

        {variant === 'linear' ? (
          <div className="qcq-progress-tracker__linear" {...progressProps} />
        ) : variant === 'segmented' ? (
          <div className="qcq-progress-tracker__segments" {...progressProps}>
            {Array.from({ length: safeSegments }, (_, index) => (
              <span
                key={index}
                className="qcq-progress-tracker__segment"
                data-filled={String((index + 1) / safeSegments <= ratio)}
                aria-hidden="true"
              />
            ))}
          </div>
        ) : (
          <div className="qcq-progress-tracker__radial-wrap" {...progressProps}>
            <svg
              className="qcq-progress-tracker__radial"
              viewBox="0 0 42 42"
              aria-hidden="true"
            >
              <circle className="qcq-progress-tracker__radial-track" cx="21" cy="21" r="15.9155" />
              <circle className="qcq-progress-tracker__radial-value" cx="21" cy="21" r="15.9155" pathLength="100" />
            </svg>
            {showValue ? <strong className="qcq-progress-tracker__radial-text">{formatted}</strong> : null}
          </div>
        )}

        {description ? <p className="qcq-progress-tracker__description">{description}</p> : null}
      </section>
    </>
  );
}
