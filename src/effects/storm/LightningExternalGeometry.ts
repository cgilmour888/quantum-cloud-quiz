/**
 * Owner Authority: QCQ-TBL-031 LightningLayer
 * Purpose: Pure external-event lightning geometry for stochastic storm commands.
 *
 * Subordinate implementation only. This file deliberately carries no permanent
 * Artifact ID and exports no React component.
 */

import {
  clampGlow,
  type GlowQuality,
} from '../GlowEngine';
import type {
  StormElectricalEvent,
} from './StormOrchestration.types';

export interface ExternalLightningPath {
  readonly d: string;
  readonly opacity: number;
  readonly width: number;
}

export interface ExternalLightningStrike {
  readonly id: string;
  readonly sequence: number;
  readonly timestamp: number;
  readonly intensity: number;
  readonly originX: number;
  readonly terminalX: number;
  readonly main: ExternalLightningPath;
  readonly branches: readonly ExternalLightningPath[];
}

interface Point {
  readonly x: number;
  readonly y: number;
}

function hashSeed(
  seed: string,
): number {
  let hash = 2166136261;

  for (
    const character
    of seed
  ) {
    hash ^=
      character
        .codePointAt(0)
      ?? 0;

    hash =
      Math.imul(
        hash,
        16777619,
      );
  }

  return hash >>> 0;
}

function createRandom(
  seed: number,
): () => number {
  let state =
    seed >>> 0;

  return () => {
    state +=
      0x6d2b79f5;

    let value =
      state;

    value =
      Math.imul(
        value
        ^ (
          value >>> 15
        ),
        value | 1,
      );

    value ^=
      value
      + Math.imul(
        value
        ^ (
          value >>> 7
        ),
        value | 61,
      );

    return (
      (
        value
        ^ (
          value >>> 14
        )
      ) >>> 0
    ) / 4294967296;
  };
}

function segmentCount(
  quality: GlowQuality,
): number {
  switch (
    quality
  ) {
    case 'cinematic':
      return 18;

    case 'balanced':
      return 14;

    case 'performance':
      return 10;

    case 'off':
      return 0;
  }
}

function maximumBranches(
  quality: GlowQuality,
): number {
  switch (
    quality
  ) {
    case 'cinematic':
      return 8;

    case 'balanced':
      return 5;

    case 'performance':
      return 2;

    case 'off':
      return 0;
  }
}

function pointsToPath(
  points:
    readonly Point[],
): string {
  const first =
    points[0];

  if (
    first === undefined
  ) {
    return '';
  }

  return points
    .slice(1)
    .reduce(
      (
        path,
        point,
      ) =>
        `${path} L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
      `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`,
    );
}

function createBranch(
  source: Point,
  random: () => number,
  direction: number,
  intensity: number,
): ExternalLightningPath {
  const points:
    Point[] = [
      source,
    ];

  const count =
    3
    + Math.floor(
      random()
      * 4,
    );

  let x =
    source.x;
  let y =
    source.y;

  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    x +=
      direction
      * (
        30
        + random()
          * 75
      )
      + (
        random()
        - 0.5
      )
        * 24;

    y +=
      28
      + random()
        * 74;

    points.push({
      x:
        Math.min(
          990,
          Math.max(
            10,
            x,
          ),
        ),
      y:
        Math.min(
          990,
          y,
        ),
    });
  }

  return Object.freeze({
    d:
      pointsToPath(
        points,
      ),
    opacity:
      0.34
      + intensity
        * 0.42,
    width:
      0.55
      + intensity
        * 0.72,
  });
}

export function createLightningStrikeFromElectricalEvent(
  event:
    StormElectricalEvent,
  quality:
    GlowQuality,
  branchProbability:
    number,
): ExternalLightningStrike | null {
  if (
    event.discharge
    === 'in-cloud-flicker'
  ) {
    return null;
  }

  const intensity =
    clampGlow(
      event.intensity,
    );

  const random =
    createRandom(
      hashSeed(
        `${event.id}:external`,
      ),
    );

  const count =
    Math.max(
      6,
      segmentCount(
        quality,
      ),
    );

  const startX =
    clampGlow(
      event.originX,
    )
    * 1000;

  const requestedEndX =
    clampGlow(
      event.terminalX,
    )
    * 1000;

  const startY =
    event.depth
      === 'background'
      ? 110
      : 145;

  const endY =
    event.discharge
      === 'cloud-to-cloud'
      ? 350
      : event.discharge
          === 'in-cloud-discharge'
        ? 610
        : 1035;

  const points:
    Point[] = [
      {
        x:
          startX,
        y:
          startY,
      },
    ];

  const branches:
    ExternalLightningPath[] = [];

  const branchLimit =
    Math.min(
      maximumBranches(
        quality,
      ),
      Math.max(
        0,
        Math.round(
          event.branchBudget,
        ),
      ),
    );

  let x =
    startX;

  for (
    let index = 1;
    index <= count;
    index += 1
  ) {
    const progress =
      index / count;

    const targetX =
      startX
      + (
        requestedEndX
        - startX
      )
        * progress;

    const jitterScale =
      event.discharge
        === 'cloud-to-cloud'
        ? 48
        : 72
          - progress
            * 34;

    x =
      Math.min(
        985,
        Math.max(
          15,
          targetX
          + (
            random()
            - 0.5
          )
            * jitterScale,
        ),
      );

    const y =
      startY
      + (
        endY
        - startY
      )
        * progress
      + (
        random()
        - 0.5
      )
        * (
          event.discharge
            === 'cloud-to-cloud'
            ? 42
            : 24
        );

    const point =
      {
        x,
        y,
      };

    points.push(
      point,
    );

    if (
      branches.length
        < branchLimit
      && index > 1
      && index
        < count - 1
      && random()
        < branchProbability
    ) {
      branches.push(
        createBranch(
          point,
          random,
          random() < 0.5
            ? -1
            : 1,
          intensity,
        ),
      );
    }
  }

  return Object.freeze({
    id:
      event.id,
    sequence:
      event.sequence,
    timestamp:
      event.scheduledAt,
    intensity,
    originX:
      startX,
    terminalX:
      x,
    main:
      Object.freeze({
        d:
          pointsToPath(
            points,
          ),
        opacity:
          1,
        width:
          1.05
          + intensity
            * 1.35,
      }),
    branches:
      Object.freeze(
        branches,
      ),
  });
}
