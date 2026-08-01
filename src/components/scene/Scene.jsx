import { useRef } from 'react';
import { useSceneEngine } from '../../hooks/useSceneEngine.js';
import { assetPath } from '../../utils/assetPath.js';

export function Scene() {
  const stageRef = useRef(null);
  useSceneEngine(stageRef);

  return (
    <section
      className="scene-shell"
      aria-label="Quantum Cloud Quiz training environment"
    >
      {/*
       * Atmospheric viewport-filling extension.
       * This copy is decorative only and is never used for animation geometry.
       */}
      

      {/*
       * Protected 16:9 MASTER stage.
       * The MASTER and every future animation layer share these dimensions.
       */}
      <div ref={stageRef} className="scene-stage">
        <picture className="scene-artwork">
          <source
            srcSet={assetPath('images/master/MASTER.webp')}
            type="image/webp"
          />
          <img
            className="scene-master"
            src={assetPath('images/master/MASTER.png')}
            alt="Quantum Cloud Quiz cyberpunk training interface"
            draggable={false}
          />
        </picture>

        <canvas
          className="scene-layer scene-layer--atmosphere"
          aria-hidden="true"
        />

        <svg
          className="scene-layer scene-layer--geometry"
          aria-hidden="true"
        />

        <div
          className="scene-layer scene-layer--interface"
          aria-hidden="true"
        />

        <div
          className="scene-layer scene-layer--controls"
          aria-label="Interactive controls layer"
        />
      </div>
    </section>
  );
}
