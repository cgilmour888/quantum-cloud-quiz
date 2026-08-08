/**
 * Artifact ID: QCQ-TBL-005
 * Artifact Name: OuterFrameRenderer
 * Repository Path: QCQ/frontend/src/frame/OuterFrameRenderer.tsx
 */

import { useId } from 'react';

export interface OuterFrameRendererProps {
  readonly active?: boolean | undefined;
  readonly className?: string | undefined;
}

const outerFrameStyles = `
  .qcq-outer-frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .qcq-outer-frame__primary {
    stroke-dasharray: 1;
    stroke-dashoffset: 0;
    filter: url("#qcq-unused");
  }

  .qcq-outer-frame__circuit {
    opacity: 0.68;
    stroke-dasharray: 8 13 2 9;
    animation: qcq-outer-frame-flow 8s linear infinite;
  }

  .qcq-outer-frame__spark {
    opacity: 0.88;
    animation: qcq-outer-frame-pulse 2.8s ease-in-out infinite;
  }

  .qcq-outer-frame[data-active="false"] .qcq-outer-frame__circuit,
  .qcq-outer-frame[data-active="false"] .qcq-outer-frame__spark {
    animation-play-state: paused;
    opacity: 0.28;
  }

  @keyframes qcq-outer-frame-flow {
    to {
      stroke-dashoffset: -120;
    }
  }

  @keyframes qcq-outer-frame-pulse {
    0%,
    100% {
      opacity: 0.35;
    }

    50% {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .qcq-outer-frame__circuit,
    .qcq-outer-frame__spark {
      animation: none;
    }
  }
`;

function safeSvgId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function OuterFrameRenderer({
  active = true,
  className,
}: OuterFrameRendererProps) {
  const id = safeSvgId(useId());
  const cyanGradient = `qcq-outer-cyan-${id}`;
  const violetGradient = `qcq-outer-violet-${id}`;
  const orangeGradient = `qcq-outer-orange-${id}`;
  const glowFilter = `qcq-outer-glow-${id}`;

  const classes = ['qcq-outer-frame', className]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <style>{outerFrameStyles}</style>
      <svg
        className={classes}
        data-active={String(active)}
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={cyanGradient} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#173f9c" />
            <stop offset="0.28" stopColor="#20ddff" />
            <stop offset="0.62" stopColor="#3978ff" />
            <stop offset="1" stopColor="#a970ff" />
          </linearGradient>

          <linearGradient id={violetGradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#be7cff" />
            <stop offset="0.5" stopColor="#6644ff" />
            <stop offset="1" stopColor="#20ddff" />
          </linearGradient>

          <linearGradient id={orangeGradient} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffce57" />
            <stop offset="0.48" stopColor="#ff7a14" />
            <stop offset="1" stopColor="#ed3c0c" />
          </linearGradient>

          <filter
            id={glowFilter}
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d="M78 14H330L356 39H620L645 16H955L980 39H1244L1270 14H1522L1586 78V822L1522 886H1270L1244 861H980L955 884H645L620 861H356L330 886H78L14 822V78Z"
          fill="none"
          stroke="#0b1730"
          strokeWidth="34"
          vectorEffect="non-scaling-stroke"
        />

        <path
          d="M78 14H330L356 39H620L645 16H955L980 39H1244L1270 14H1522L1586 78V822L1522 886H1270L1244 861H980L955 884H645L620 861H356L330 886H78L14 822V78Z"
          fill="none"
          stroke={`url(#${cyanGradient})`}
          strokeWidth="8"
          vectorEffect="non-scaling-stroke"
          filter={`url(#${glowFilter})`}
        />

        <path
          d="M93 38H314L346 66H634L656 43H944L967 66H1255L1286 38H1507L1562 93V807L1507 862H1286L1255 834H967L944 858H656L634 834H346L314 862H93L38 807V93Z"
          fill="none"
          stroke={`url(#${violetGradient})`}
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
          opacity="0.84"
        />

        <path
          className="qcq-outer-frame__circuit"
          d="M38 174H78L105 147H218L246 119H392M1208 119H1354L1382 147H1495L1522 174H1562M38 726H78L105 753H218L246 781H392M1208 781H1354L1382 753H1495L1522 726H1562"
          fill="none"
          stroke={`url(#${orangeGradient})`}
          strokeWidth="4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          filter={`url(#${glowFilter})`}
        />

        <path
          className="qcq-outer-frame__circuit"
          d="M174 38V76L147 104V218L119 246V358M1426 38V76L1453 104V218L1481 246V358M174 862V824L147 796V682L119 654V542M1426 862V824L1453 796V682L1481 654V542"
          fill="none"
          stroke={`url(#${cyanGradient})`}
          strokeWidth="4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          filter={`url(#${glowFilter})`}
        />

        <g fill="#dffbff" filter={`url(#${glowFilter})`}>
          <circle className="qcq-outer-frame__spark" cx="356" cy="39" r="4" />
          <circle
            className="qcq-outer-frame__spark"
            cx="645"
            cy="16"
            r="3"
            style={{ animationDelay: '0.4s' }}
          />
          <circle
            className="qcq-outer-frame__spark"
            cx="980"
            cy="39"
            r="4"
            style={{ animationDelay: '0.8s' }}
          />
          <circle
            className="qcq-outer-frame__spark"
            cx="1244"
            cy="861"
            r="4"
            style={{ animationDelay: '1.2s' }}
          />
          <circle
            className="qcq-outer-frame__spark"
            cx="620"
            cy="861"
            r="4"
            style={{ animationDelay: '1.6s' }}
          />
        </g>
      </svg>
    </>
  );
}
