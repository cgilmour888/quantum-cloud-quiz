/**
 * Artifact ID: QCQ-TBL-004
 * Artifact Name: BorderFrameEngine
 * Repository Path: QCQ/frontend/src/frame/BorderFrameEngine.tsx
 */

import { type CSSProperties } from 'react';

import { CornerNodeRenderer } from './CornerNodeRenderer';
import { EdgeEnergyRail } from './EdgeEnergyRail';
import { InnerFrameRenderer } from './InnerFrameRenderer';
import { OuterFrameRenderer } from './OuterFrameRenderer';
import { PlatinumFrameGlow } from './PlatinumFrameGlow';

export type BorderFrameQuality = 'minimal' | 'balanced' | 'ultra';

export interface BorderFrameEngineProps {
  readonly active?: boolean | undefined;
  readonly quality?: BorderFrameQuality | undefined;
  readonly intensity?: number | undefined;
  readonly className?: string | undefined;
}

type FrameEngineStyle = CSSProperties &
  Record<
    '--qcq-frame-intensity' | '--qcq-frame-detail-opacity',
    string
  >;

const frameEngineStyles = `
  .qcq-border-frame-engine {
    position: absolute;
    inset: 0;
    z-index: 6;
    overflow: visible;
    pointer-events: none;
    opacity: var(--qcq-frame-intensity);
  }

  .qcq-border-frame-engine__detail {
    opacity: var(--qcq-frame-detail-opacity);
  }

  .qcq-border-frame-engine[data-quality="minimal"]
    .qcq-border-frame-engine__detail {
    display: none;
  }

  .qcq-border-frame-engine[data-quality="balanced"]
    .qcq-border-frame-engine__ultra {
    display: none;
  }

  @media (forced-colors: active) {
    .qcq-border-frame-engine {
      display: none;
    }
  }
`;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function BorderFrameEngine({
  active = true,
  quality = 'ultra',
  intensity = 0.95,
  className,
}: BorderFrameEngineProps) {
  const normalizedIntensity = clamp(intensity, 0, 1);
  const detailOpacity =
    quality === 'ultra' ? 1 : quality === 'balanced' ? 0.72 : 0.35;

  const style: FrameEngineStyle = {
    '--qcq-frame-intensity': String(normalizedIntensity),
    '--qcq-frame-detail-opacity': String(detailOpacity),
  };

  const classes = ['qcq-border-frame-engine', className]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <style>{frameEngineStyles}</style>
      <div
        className={classes}
        style={style}
        data-active={String(active)}
        data-quality={quality}
        aria-hidden="true"
      >
        <PlatinumFrameGlow
          active={active}
          intensity={normalizedIntensity}
        />

        <OuterFrameRenderer active={active} />
        <InnerFrameRenderer active={active} inset="shell" />

        <div className="qcq-border-frame-engine__detail">
          <EdgeEnergyRail edge="top" active={active} />
          <EdgeEnergyRail edge="right" active={active} />
          <EdgeEnergyRail edge="bottom" active={active} />
          <EdgeEnergyRail edge="left" active={active} />
        </div>

        <div className="qcq-border-frame-engine__ultra">
          <CornerNodeRenderer
            position="north-west"
            active={active}
            intensity={normalizedIntensity}
          />
          <CornerNodeRenderer
            position="north-east"
            active={active}
            intensity={normalizedIntensity}
          />
          <CornerNodeRenderer
            position="south-east"
            active={active}
            intensity={normalizedIntensity}
          />
          <CornerNodeRenderer
            position="south-west"
            active={active}
            intensity={normalizedIntensity}
          />
        </div>
      </div>
    </>
  );
}
