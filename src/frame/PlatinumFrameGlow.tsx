/**
 * Artifact ID: QCQ-TBL-009
 * Artifact Name: PlatinumFrameGlow
 * Repository Path: QCQ/frontend/src/frame/PlatinumFrameGlow.tsx
 */

import { useId, type CSSProperties } from 'react';

export interface PlatinumFrameGlowProps {
  readonly active?: boolean | undefined;
  readonly intensity?: number | undefined;
  readonly className?: string | undefined;
}

type PlatinumGlowStyle = CSSProperties &
  Record<'--qcq-platinum-intensity', string>;

const platinumGlowStyles = `
  .qcq-platinum-frame-glow {
    position: absolute;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    opacity: var(--qcq-platinum-intensity);
    mix-blend-mode: screen;
  }

  .qcq-platinum-frame-glow__breath {
    transform-origin: 50% 50%;
    animation: qcq-platinum-breath 4.8s ease-in-out infinite;
  }

  .qcq-platinum-frame-glow[data-active="false"]
    .qcq-platinum-frame-glow__breath {
    animation-play-state: paused;
    opacity: 0.25;
  }

  @keyframes qcq-platinum-breath {
    0%,
    100% {
      opacity: 0.28;
    }

    50% {
      opacity: 0.82;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .qcq-platinum-frame-glow__breath {
      animation: none;
    }
  }

  @media (forced-colors: active) {
    .qcq-platinum-frame-glow {
      display: none;
    }
  }
`;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function safeSvgId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function PlatinumFrameGlow({
  active = true,
  intensity = 0.84,
  className,
}: PlatinumFrameGlowProps) {
  const id = safeSvgId(useId());
  const gradientId = `qcq-platinum-gradient-${id}`;
  const blurId = `qcq-platinum-blur-${id}`;
  const classes = ['qcq-platinum-frame-glow', className]
    .filter(Boolean)
    .join(' ');

  const style: PlatinumGlowStyle = {
    '--qcq-platinum-intensity': String(clamp(intensity, 0, 1)),
  };

  return (
    <>
      <style>{platinumGlowStyles}</style>
      <svg
        className={classes}
        style={style}
        data-active={String(active)}
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#dff9ff" />
            <stop offset="0.2" stopColor="#20ddff" />
            <stop offset="0.48" stopColor="#5878ff" />
            <stop offset="0.72" stopColor="#bc7cff" />
            <stop offset="0.9" stopColor="#ffb54b" />
            <stop offset="1" stopColor="#dff9ff" />
          </linearGradient>
          <filter id={blurId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>

        <path
          className="qcq-platinum-frame-glow__breath"
          d="M82 18H326L354 44H622L647 20H953L978 44H1246L1274 18H1518L1582 82V818L1518 882H1274L1246 856H978L953 880H647L622 856H354L326 882H82L18 818V82Z"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="18"
          filter={`url(#${blurId})`}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </>
  );
}
