/**
 * Artifact ID: QCQ-TBL-008
 * Artifact Name: EdgeEnergyRail
 * Repository Path: QCQ/frontend/src/frame/EdgeEnergyRail.tsx
 */

import { useId } from 'react';

export type EdgeEnergyRailPosition = 'top' | 'right' | 'bottom' | 'left';

export interface EdgeEnergyRailProps {
  readonly edge: EdgeEnergyRailPosition;
  readonly active?: boolean | undefined;
  readonly className?: string | undefined;
}

const edgeRailStyles = `
  .qcq-edge-energy-rail {
    position: absolute;
    z-index: 3;
    pointer-events: none;
    overflow: visible;
    opacity: 0.9;
  }

  .qcq-edge-energy-rail[data-edge="top"],
  .qcq-edge-energy-rail[data-edge="bottom"] {
    right: 7%;
    left: 7%;
    width: 86%;
    height: clamp(0.7rem, 1.2vw, 1.15rem);
  }

  .qcq-edge-energy-rail[data-edge="top"] {
    top: clamp(0.85rem, 1.5vw, 1.45rem);
  }

  .qcq-edge-energy-rail[data-edge="bottom"] {
    bottom: clamp(0.85rem, 1.5vw, 1.45rem);
    transform: scaleX(-1);
  }

  .qcq-edge-energy-rail[data-edge="left"],
  .qcq-edge-energy-rail[data-edge="right"] {
    top: 8%;
    bottom: 8%;
    width: clamp(0.7rem, 1.2vw, 1.15rem);
    height: 84%;
  }

  .qcq-edge-energy-rail[data-edge="left"] {
    left: clamp(0.85rem, 1.5vw, 1.45rem);
  }

  .qcq-edge-energy-rail[data-edge="right"] {
    right: clamp(0.85rem, 1.5vw, 1.45rem);
    transform: scaleY(-1);
  }

  .qcq-edge-energy-rail__flow {
    stroke-dasharray: 28 18 5 12;
    animation: qcq-edge-energy-flow 5.5s linear infinite;
  }

  .qcq-edge-energy-rail__pulse {
    animation: qcq-edge-energy-pulse 2.2s ease-in-out infinite;
  }

  .qcq-edge-energy-rail[data-active="false"] .qcq-edge-energy-rail__flow,
  .qcq-edge-energy-rail[data-active="false"] .qcq-edge-energy-rail__pulse {
    animation-play-state: paused;
    opacity: 0.2;
  }

  @keyframes qcq-edge-energy-flow {
    to {
      stroke-dashoffset: -126;
    }
  }

  @keyframes qcq-edge-energy-pulse {
    0%,
    100% {
      opacity: 0.2;
    }

    50% {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .qcq-edge-energy-rail__flow,
    .qcq-edge-energy-rail__pulse {
      animation: none;
    }
  }
`;

function safeSvgId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function EdgeEnergyRail({
  edge,
  active = true,
  className,
}: EdgeEnergyRailProps) {
  const id = safeSvgId(useId());
  const gradientId = `qcq-edge-gradient-${id}`;
  const glowId = `qcq-edge-glow-${id}`;
  const vertical = edge === 'left' || edge === 'right';
  const classes = ['qcq-edge-energy-rail', className]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <style>{edgeRailStyles}</style>
      <svg
        className={classes}
        data-edge={edge}
        data-active={String(active)}
        viewBox={vertical ? '0 0 24 900' : '0 0 1600 24'}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0"
            x2={vertical ? '0' : '1'}
            y2={vertical ? '1' : '0'}
          >
            <stop offset="0" stopColor="#20ddff" stopOpacity="0" />
            <stop offset="0.18" stopColor="#20ddff" />
            <stop offset="0.48" stopColor="#3978ff" />
            <stop offset="0.72" stopColor="#a970ff" />
            <stop offset="0.9" stopColor="#ff8a1f" />
            <stop offset="1" stopColor="#ff8a1f" stopOpacity="0" />
          </linearGradient>

          <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={vertical ? 'M12 0V900' : 'M0 12H1600'}
          stroke="#0c2856"
          strokeWidth="7"
          vectorEffect="non-scaling-stroke"
        />

        <path
          className="qcq-edge-energy-rail__flow"
          d={vertical ? 'M12 0V900' : 'M0 12H1600'}
          stroke={`url(#${gradientId})`}
          strokeWidth="3"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          filter={`url(#${glowId})`}
        />

        <circle
          className="qcq-edge-energy-rail__pulse"
          cx={vertical ? 12 : 800}
          cy={vertical ? 450 : 12}
          r="5"
          fill="#ffffff"
          filter={`url(#${glowId})`}
        />
      </svg>
    </>
  );
}
