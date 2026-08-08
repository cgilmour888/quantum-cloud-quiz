/**
 * Artifact ID: QCQ-TBL-006
 * Artifact Name: InnerFrameRenderer
 * Repository Path: QCQ/frontend/src/frame/InnerFrameRenderer.tsx
 */

import { useId } from 'react';

export interface InnerFrameRendererProps {
  readonly active?: boolean | undefined;
  readonly className?: string | undefined;
  readonly inset?: 'shell' | 'tablet' | undefined;
}

const innerFrameStyles = `
  .qcq-inner-frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .qcq-inner-frame__scan {
    stroke-dasharray: 34 420;
    animation: qcq-inner-frame-scan 7s linear infinite;
  }

  .qcq-inner-frame[data-active="false"] .qcq-inner-frame__scan {
    animation-play-state: paused;
    opacity: 0.18;
  }

  @keyframes qcq-inner-frame-scan {
    to {
      stroke-dashoffset: -908;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .qcq-inner-frame__scan {
      animation: none;
    }
  }
`;

function safeSvgId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function InnerFrameRenderer({
  active = true,
  className,
  inset = 'shell',
}: InnerFrameRendererProps) {
  const id = safeSvgId(useId());
  const gradientId = `qcq-inner-gradient-${id}`;
  const glowId = `qcq-inner-glow-${id}`;
  const isTablet = inset === 'tablet';

  const classes = ['qcq-inner-frame', className]
    .filter(Boolean)
    .join(' ');

  const outerPath = isTablet
    ? 'M88 24H1512L1576 88V812L1512 876H88L24 812V88Z'
    : 'M122 73H1478L1527 122V778L1478 827H122L73 778V122Z';

  const innerPath = isTablet
    ? 'M112 52H1488L1548 112V788L1488 848H112L52 788V112Z'
    : 'M146 98H1454L1502 146V754L1454 802H146L98 754V146Z';

  return (
    <>
      <style>{innerFrameStyles}</style>
      <svg
        className={classes}
        data-active={String(active)}
        data-inset={inset}
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#20ddff" />
            <stop offset="0.3" stopColor="#2a64ef" />
            <stop offset="0.62" stopColor="#a970ff" />
            <stop offset="0.82" stopColor="#ff8a1f" />
            <stop offset="1" stopColor="#20ddff" />
          </linearGradient>
          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={outerPath}
          fill="none"
          stroke="#10264d"
          strokeWidth={isTablet ? 24 : 10}
          vectorEffect="non-scaling-stroke"
        />

        <path
          d={outerPath}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={isTablet ? 5 : 3}
          vectorEffect="non-scaling-stroke"
          filter={`url(#${glowId})`}
        />

        <path
          d={innerPath}
          fill="none"
          stroke="rgb(208 235 255 / 0.36)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        <path
          className="qcq-inner-frame__scan"
          d={innerPath}
          fill="none"
          stroke="#f4fbff"
          strokeWidth="4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          filter={`url(#${glowId})`}
        />

        <g
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
          opacity="0.7"
        >
          <path d="M190 98H430L455 122H650" />
          <path d="M950 122H1145L1170 98H1410" />
          <path d="M190 802H430L455 778H650" />
          <path d="M950 778H1145L1170 802H1410" />
        </g>
      </svg>
    </>
  );
}
