/**
 * Artifact ID: QCQ-TBL-028
 * Artifact Name: MetricTile
 * Repository Path: QCQ/frontend/src/metrics/MetricTile.tsx
 */

import type { ReactNode } from 'react';

export type MetricTileTone =
  | 'cyan'
  | 'violet'
  | 'emerald'
  | 'orange'
  | 'gold'
  | 'neutral';

export interface MetricTileProps {
  readonly label: string;
  readonly value: ReactNode;
  readonly secondary?: ReactNode | undefined;
  readonly tone?: MetricTileTone | undefined;
  readonly trend?: 'up' | 'down' | 'steady' | 'unknown' | undefined;
  readonly icon?: ReactNode | undefined;
  readonly className?: string | undefined;
  readonly ariaLabel?: string | undefined;
  readonly emphasis?: 'standard' | 'strong' | undefined;
}

const styles = `
  .qcq-metric-tile {
    --qcq-metric-accent: #20ddff;
    --qcq-metric-accent-rgb: 32 221 255;
    position: relative;
    isolation: isolate;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto 1fr auto;
    gap: 0.32rem 0.65rem;
    min-width: 0;
    min-height: 6.6rem;
    padding: clamp(0.75rem, 1.5cqi, 1rem);
    overflow: hidden;
    border: 1px solid rgb(var(--qcq-metric-accent-rgb) / 38%);
    border-radius: 0.78rem;
    color: #f7fbff;
    background:
      linear-gradient(180deg, rgb(255 255 255 / 6%), transparent 30%),
      linear-gradient(135deg, rgb(var(--qcq-metric-accent-rgb) / 14%), transparent 52%),
      rgb(3 9 22 / 92%);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 10%),
      inset 0 -0.35rem 0.8rem rgb(0 0 0 / 32%),
      inset 0 0 1.1rem rgb(var(--qcq-metric-accent-rgb) / 7%),
      0 0.42rem 1.1rem rgb(0 0 0 / 28%);
  }

  .qcq-metric-tile::after {
    position: absolute;
    inset: auto 0 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--qcq-metric-accent), transparent);
    box-shadow: 0 0 0.65rem var(--qcq-metric-accent);
    content: "";
    opacity: 0.72;
  }

  .qcq-metric-tile[data-tone="violet"] { --qcq-metric-accent: #b17aff; --qcq-metric-accent-rgb: 177 122 255; }
  .qcq-metric-tile[data-tone="emerald"] { --qcq-metric-accent: #27e6a1; --qcq-metric-accent-rgb: 39 230 161; }
  .qcq-metric-tile[data-tone="orange"] { --qcq-metric-accent: #ff9a35; --qcq-metric-accent-rgb: 255 154 53; }
  .qcq-metric-tile[data-tone="gold"] { --qcq-metric-accent: #ffe05d; --qcq-metric-accent-rgb: 255 224 93; }
  .qcq-metric-tile[data-tone="neutral"] { --qcq-metric-accent: #a8bfd4; --qcq-metric-accent-rgb: 168 191 212; }

  .qcq-metric-tile__label {
    min-width: 0;
    color: rgb(190 220 242 / 80%);
    font-size: clamp(0.58rem, 1.25cqi, 0.7rem);
    font-weight: 900;
    letter-spacing: 0.12em;
    overflow-wrap: anywhere;
    text-transform: uppercase;
  }

  .qcq-metric-tile__icon {
    grid-column: 2;
    grid-row: 1 / span 2;
    display: grid;
    width: 2rem;
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid rgb(var(--qcq-metric-accent-rgb) / 34%);
    border-radius: 50%;
    color: var(--qcq-metric-accent);
    background: rgb(var(--qcq-metric-accent-rgb) / 7%);
    box-shadow: inset 0 0 0.7rem rgb(var(--qcq-metric-accent-rgb) / 9%);
  }

  .qcq-metric-tile__value {
    align-self: center;
    min-width: 0;
    color: #fff;
    font-family: "Arial Black", Inter, system-ui, sans-serif;
    font-size: clamp(1.25rem, 3.3cqi, 2.15rem);
    font-weight: 950;
    font-variant-numeric: tabular-nums;
    line-height: 1.05;
    overflow-wrap: anywhere;
    text-shadow:
      0 -0.04em 0 rgb(255 255 255 / 48%),
      0 0.08em 0 rgb(0 0 0 / 88%),
      0 0 0.72rem rgb(var(--qcq-metric-accent-rgb) / 32%);
  }

  .qcq-metric-tile[data-emphasis="strong"] .qcq-metric-tile__value {
    font-size: clamp(1.48rem, 3.8cqi, 2.5rem);
  }

  .qcq-metric-tile__secondary {
    min-width: 0;
    color: rgb(176 205 227 / 72%);
    font-size: clamp(0.62rem, 1.28cqi, 0.76rem);
    font-weight: 750;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .qcq-metric-tile__trend {
    color: var(--qcq-metric-accent);
    font-size: 0.72rem;
    font-weight: 950;
  }

  @media (forced-colors: active) {
    .qcq-metric-tile {
      border: 1px solid CanvasText;
      color: CanvasText;
      background: Canvas;
      box-shadow: none;
    }
    .qcq-metric-tile__value,
    .qcq-metric-tile__label,
    .qcq-metric-tile__secondary,
    .qcq-metric-tile__trend,
    .qcq-metric-tile__icon { color: CanvasText; text-shadow: none; }
  }
`;

const TREND_GLYPHS = Object.freeze({
  up: '▲',
  down: '▼',
  steady: '◆',
  unknown: '—',
});

export function MetricTile({
  label,
  value,
  secondary,
  tone = 'cyan',
  trend,
  icon,
  className,
  ariaLabel,
  emphasis = 'standard',
}: MetricTileProps) {
  if (!label.trim()) throw new Error('MetricTile requires a non-empty label.');
  const classes = ['qcq-metric-tile', className].filter(Boolean).join(' ');
  return (
    <>
      <style>{styles}</style>
      <article
        className={classes}
        data-tone={tone}
        data-emphasis={emphasis}
        aria-label={ariaLabel ?? label}
      >
        <span className="qcq-metric-tile__label">{label}</span>
        {icon ? <span className="qcq-metric-tile__icon" aria-hidden="true">{icon}</span> : null}
        <strong className="qcq-metric-tile__value">{value}</strong>
        {secondary !== undefined ? (
          <span className="qcq-metric-tile__secondary">{secondary}</span>
        ) : <span />}
        {trend ? (
          <span
            className="qcq-metric-tile__trend"
            aria-label={`Trend ${trend}`}
            title={`Trend ${trend}`}
          >
            {TREND_GLYPHS[trend]}
          </span>
        ) : null}
      </article>
    </>
  );
}
