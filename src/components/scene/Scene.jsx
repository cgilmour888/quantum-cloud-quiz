import { useRef } from 'react';
import { QuizInterface } from '../quiz/QuizInterface.jsx';
import { useSceneEngine } from '../../hooks/useSceneEngine.js';
import { assetPath } from '../../utils/assetPath.js';

export function Scene() {
  const stageRef = useRef(null);
  const borderFrameCanvasRef = useRef(null);

  useSceneEngine({
    stageRef,
    borderFrameCanvasRef,
  });

  return (
    <section
      className="scene-shell"
      aria-label="Quantum Cloud Quiz training environment"
    >
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
          ref={borderFrameCanvasRef}
          className="scene-layer scene-layer--border-frame"
          data-scene-engine="border-frame"
          aria-hidden="true"
        />

        <canvas
          className="scene-layer scene-layer--atmosphere"
          aria-hidden="true"
        />

        <svg
          className="scene-layer scene-layer--geometry"
          aria-hidden="true"
        />

        <QuizInterface eventTargetRef={stageRef} />
      </div>
    </section>
  );
}
