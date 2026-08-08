/**
 * Artifact ID: QCQ-TBL-007
 * Artifact Name: CornerNodeRenderer
 * Repository Path: QCQ/frontend/src/frame/CornerNodeRenderer.tsx
 */

import { useId, type CSSProperties } from 'react';

export type CornerNodePosition =
  | 'north-west'
  | 'north-east'
  | 'south-east'
  | 'south-west';

export interface CornerNodeRendererProps {
  readonly position: CornerNodePosition;
  readonly active?: boolean | undefined;
  readonly intensity?: number | undefined;
  readonly className?: string | undefined;
}

type CornerNodeStyle = CSSProperties &
  Record<'--qcq-corner-intensity', string>;

const cornerNodeStyles = `
  .qcq-corner-node {
    position: absolute;
    z-index: 4;
    width: clamp(3.4rem, 5.4vw, 6rem);
    aspect-ratio: 1;
    pointer-events: none;
    opacity: calc(0.4 + var(--qcq-corner-intensity) * 0.6);
    filter:
      drop-shadow(0 0 0.45rem rgb(32 221 255 / 65%))
      drop-shadow(0 0 0.9rem rgb(115 74 255 / 35%));
  }

  .qcq-corner-node[data-position="north-west"] {
    top: clamp(0.55rem, 1vw, 1rem);
    left: clamp(0.55rem, 1vw, 1rem);
  }

  .qcq-corner-node[data-position="north-east"] {
    top: clamp(0.55rem, 1vw, 1rem);
    right: clamp(0.55rem, 1vw, 1rem);
  }

  .qcq-corner-node[data-position="south-east"] {
    right: clamp(0.55rem, 1vw, 1rem);
    bottom: clamp(0.55rem, 1vw, 1rem);
  }

  .qcq-corner-node[data-position="south-west"] {
    bottom: clamp(0.55rem, 1vw, 1rem);
    left: clamp(0.55rem, 1vw, 1rem);
  }

  .qcq-corner-node__rotor {
    transform-origin: 50% 50%;
    animation: qcq-corner-node-rotate 14s linear infinite;
  }

  .qcq-corner-node__rotor--reverse {
    animation-direction: reverse;
    animation-duration: 8s;
  }

  .qcq-corner-node__core {
    animation: qcq-corner-node-core 2.4s ease-in-out infinite;
  }

  .qcq-corner-node[data-active="false"] .qcq-corner-node__rotor,
  .qcq-corner-node[data-active="false"] .qcq-corner-node__core {
    animation-play-state: paused;
  }

  @keyframes qcq-corner-node-rotate {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes qcq-corner-node-core {
    0%,
    100% {
      opacity: 0.45;
      transform: scale(0.92);
    }

    50% {
      opacity: 1;
      transform: scale(1.08);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .qcq-corner-node__rotor,
    .qcq-corner-node__core {
      animation: none;
    }
  }
`;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function safeSvgId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function CornerNodeRenderer({
  position,
  active = true,
  intensity = 0.9,
  className,
}: CornerNodeRendererProps) {
  const id = safeSvgId(useId());
  const gradientId = `qcq-corner-gradient-${id}`;
  const classes = ['qcq-corner-node', className]
    .filter(Boolean)
    .join(' ');

  const style: CornerNodeStyle = {
    '--qcq-corner-intensity': String(clamp(intensity, 0, 1)),
  };

  return (
    <>
      <style>{cornerNodeStyles}</style>
      <svg
        className={classes}
        style={style}
        data-position={position}
        data-active={String(active)}
        viewBox="0 0 120 120"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id={gradientId}>
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.12" stopColor="#20ddff" />
            <stop offset="0.38" stopColor="#4f53ff" />
            <stop offset="0.7" stopColor="#a970ff" stopOpacity="0.68" />
            <stop offset="1" stopColor="#081226" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle
          cx="60"
          cy="60"
          r="55"
          fill="rgb(2 6 18 / 0.86)"
          stroke="#153c7d"
          strokeWidth="4"
        />

        <g className="qcq-corner-node__rotor">
          <circle
            cx="60"
            cy="60"
            r="46"
            fill="none"
            stroke="#20ddff"
            strokeWidth="2.5"
            strokeDasharray="4 10 16 7"
          />
          <path
            d="M60 8V22M60 98V112M8 60H22M98 60H112"
            stroke="#ff8a1f"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        <g className="qcq-corner-node__rotor qcq-corner-node__rotor--reverse">
          <circle
            cx="60"
            cy="60"
            r="35"
            fill="none"
            stroke="#a970ff"
            strokeWidth="3"
            strokeDasharray="18 7 3 6"
          />
          <path
            d="M35 35L44 44M85 35L76 44M35 85L44 76M85 85L76 76"
            stroke="#20ddff"
            strokeWidth="2"
          />
        </g>

        <circle
          className="qcq-corner-node__core"
          cx="60"
          cy="60"
          r="22"
          fill={`url(#${gradientId})`}
        />

        <circle
          cx="60"
          cy="60"
          r="8"
          fill="#ffffff"
          stroke="#20ddff"
          strokeWidth="2"
        />
      </svg>
    </>
  );
}
