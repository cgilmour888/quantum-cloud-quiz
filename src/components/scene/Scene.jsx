import { useRef } from 'react';
import { QuizInterface } from '../quiz/QuizInterface.jsx';
import { useSceneEngine } from '../../hooks/useSceneEngine.js';
import { assetPath } from '../../utils/assetPath.js';
import {
  BorderFrameProofLayer,
  readBorderFrameProofMode,
} from './debug/BorderFrameProofLayer.jsx';
import {
  TabletMaximumApertureProofLayer,
  readTabletA21RProofConfig,
} from './debug/TabletMaximumApertureProofLayer.jsx';

export function Scene() {
  const stageRef = useRef(null);
  const compositorCanvasRef = useRef(null);
  const borderProofMode = readBorderFrameProofMode();
  const tabletA21RProof = readTabletA21RProofConfig();

  // The normal SceneEngine lifecycle remains authoritative in static and live
  // tablet proof modes. Live proof mode is only a transparent SVG overlay.
  useSceneEngine({
    stageRef,
    compositorCanvasRef,
  });

  return (
    <section
      className="scene-shell"
      aria-label="Quantum Cloud Quiz training environment"
    >
      <div
        ref={stageRef}
        className="scene-stage"
        data-compositor-ready="false"
        data-border-proof-mode={borderProofMode ?? 'live'}
        data-tablet-a21r-proof-mode={tabletA21RProof?.mode ?? 'live'}
        data-tablet-a21r-presentation={tabletA21RProof?.presentation ?? 'none'}
      >
        <picture className="scene-artwork scene-artwork--fallback" aria-hidden="true">
          <source
            srcSet={assetPath('images/master/MASTER.webp')}
            type="image/webp"
          />
          <img
            className="scene-master"
            src={assetPath('images/master/MASTER.png')}
            alt=""
            draggable={false}
          />
        </picture>

        <canvas
          ref={compositorCanvasRef}
          className="scene-layer scene-layer--compositor"
          data-scene-engine="master-compositor"
          aria-hidden="true"
        />

        <canvas
          className="scene-layer scene-layer--atmosphere"
          aria-hidden="true"
          hidden
        />

        <svg
          className="scene-layer scene-layer--geometry"
          aria-hidden="true"
          hidden
        />

        <QuizInterface eventTargetRef={stageRef} />
        <BorderFrameProofLayer mode={borderProofMode} />
        <TabletMaximumApertureProofLayer {...(tabletA21RProof ?? {})} />
      </div>
    </section>
  );
}
