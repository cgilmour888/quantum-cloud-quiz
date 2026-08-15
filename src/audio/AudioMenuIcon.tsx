/**
 * Artifact ID: QCQ-AUD-110
 * Artifact Name: AudioMenuIcon
 * Artifact Purpose: Web-native SVG audio-menu icon preserving the original note silhouette with wet-black 3D treatment and neon reflective response.
 * Artifact Layer: Audio / Integration
 * Artifact Dependencies: QCQ-AUD-111 AudioMenuIcon.module.css
 * Artifact Dependents: QCQ-AUD-112 AudioMenuButton
 * Repository Path: QCQ/frontend/src/audio
 * Source File: AudioMenuIcon.tsx
 */

import {
  useId,
} from 'react';

import styles from './AudioMenuIcon.module.css';

export interface AudioMenuIconProps {
  readonly paused?: boolean;
  readonly active?: boolean;
  readonly muted?: boolean;
  readonly unavailable?: boolean;
  readonly className?: string;
}

function joinClassNames(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(' ');
}

export function AudioMenuIcon({
  paused = false,
  active = false,
  muted = false,
  unavailable = false,
  className,
}: AudioMenuIconProps) {
  const instanceId = useId().replace(/:/gu, '');
  const bodyGradientId = `qcq-audio-body-${instanceId}`;
  const edgeGradientId = `qcq-audio-edge-${instanceId}`;
  const neonGradientId = `qcq-audio-neon-${instanceId}`;
  const specularId = `qcq-audio-specular-${instanceId}`;

  return (
    <span
      className={styles.iconStage}
      data-paused={paused ? 'true' : 'false'}
      data-active={active ? 'true' : 'false'}
      data-muted={muted ? 'true' : 'false'}
      data-unavailable={unavailable ? 'true' : 'false'}
      aria-hidden="true"
    >
      <svg
        className={joinClassNames(styles.icon, className)}
        viewBox="0 0 128 160"
        role="presentation"
        focusable="false"
      >
        <defs>
          <linearGradient
            id={bodyGradientId}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" stopColor="#020305" />
            <stop offset="22%" stopColor="#000000" />
            <stop offset="51%" stopColor="#070a10" />
            <stop offset="78%" stopColor="#000000" />
            <stop offset="100%" stopColor="#11131a" />
          </linearGradient>

          <linearGradient
            id={edgeGradientId}
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop offset="0%" stopColor="#30e8ff" />
            <stop offset="24%" stopColor="#2586ff" />
            <stop offset="49%" stopColor="#8d4dff" />
            <stop offset="69%" stopColor="#ff4ad8" />
            <stop offset="86%" stopColor="#ff8a16" />
            <stop offset="100%" stopColor="#21f2a2" />
          </linearGradient>

          <radialGradient
            id={neonGradientId}
            cx="32%"
            cy="24%"
            r="78%"
          >
            <stop offset="0%" stopColor="#ecfbff" stopOpacity="0.95" />
            <stop offset="11%" stopColor="#4be9ff" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#276fff" stopOpacity="0.42" />
            <stop offset="52%" stopColor="#924dff" stopOpacity="0.24" />
            <stop offset="73%" stopColor="#ff7b19" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <filter
            id={specularId}
            x="-45%"
            y="-45%"
            width="190%"
            height="190%"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="1.35"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1.2 0 0 0 0
                0 1.2 0 0 0
                0 0 1.2 0 0
                0 0 0 0.9 0
              "
              result="bloom"
            />
            <feMerge>
              <feMergeNode in="bloom" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className={styles.thickness} transform="translate(2.8 2.4)">
          <ellipse
            cx="40"
            cy="125"
            rx="27"
            ry="20"
            transform="rotate(-19 40 125)"
            fill="#000000"
            stroke="#080910"
            strokeWidth="4"
          />
          <rect
            x="62"
            y="26"
            width="11"
            height="101"
            rx="5.5"
            fill="#000000"
          />
          <path
            d="M69 27 C79 42 99 49 105 65 C111 81 101 93 92 101 C97 86 95 75 87 67 C80 60 74 56 69 51 Z"
            fill="#000000"
          />
          <path
            d="M69 58 C81 72 101 80 106 96 C111 111 103 124 94 132 C99 116 96 105 87 96 C80 89 74 85 69 80 Z"
            fill="#000000"
          />
        </g>

        <g className={styles.rotatingBody}>
          <ellipse
            className={styles.noteHead}
            cx="38"
            cy="122"
            rx="27"
            ry="20"
            transform="rotate(-19 38 122)"
            fill={`url(#${bodyGradientId})`}
            stroke={`url(#${edgeGradientId})`}
            strokeWidth="2.1"
            filter={`url(#${specularId})`}
          />
          <ellipse
            className={styles.noteHeadHighlight}
            cx="31"
            cy="115"
            rx="16"
            ry="8"
            transform="rotate(-23 31 115)"
            fill={`url(#${neonGradientId})`}
          />

          <rect
            className={styles.stem}
            x="61"
            y="23"
            width="11"
            height="101"
            rx="5.5"
            fill={`url(#${bodyGradientId})`}
            stroke={`url(#${edgeGradientId})`}
            strokeWidth="1.65"
          />

          <path
            className={styles.stemSpecular}
            d="M64.4 27 V116"
            fill="none"
            stroke="#c8f8ff"
            strokeOpacity="0.72"
            strokeWidth="1.15"
            strokeLinecap="round"
          />

          <g className={styles.flagGroup}>
            <path
              className={styles.flagUpper}
              d="M68 25 C78 41 99 48 105 65 C111 81 101 93 92 101 C97 86 95 75 87 67 C79 59 73 55 68 50 Z"
              fill={`url(#${bodyGradientId})`}
              stroke={`url(#${edgeGradientId})`}
              strokeWidth="1.7"
              filter={`url(#${specularId})`}
            />
            <path
              className={styles.flagLower}
              d="M68 56 C81 71 101 79 106 95 C111 111 103 124 94 132 C99 116 96 105 87 96 C80 89 74 85 68 79 Z"
              fill={`url(#${bodyGradientId})`}
              stroke={`url(#${edgeGradientId})`}
              strokeWidth="1.7"
              filter={`url(#${specularId})`}
            />
            <path
              className={styles.flagHighlight}
              d="M73 32 C83 45 97 50 101 63 M73 64 C84 77 98 83 102 95"
              fill="none"
              stroke={`url(#${edgeGradientId})`}
              strokeWidth="2"
              strokeLinecap="round"
              strokeOpacity="0.92"
            />
          </g>

          <path
            className={styles.travelHighlight}
            d="M20 115 C33 99 52 102 63 112 M66 32 V104 M73 32 C91 47 104 54 102 74"
            fill="none"
            stroke={`url(#${edgeGradientId})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeOpacity="0.78"
          />
        </g>
      </svg>
    </span>
  );
}

export default AudioMenuIcon;
