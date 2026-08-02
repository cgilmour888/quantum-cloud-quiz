import { useEffect, useRef } from 'react';
import { SceneEngine } from '../components/scene/SceneEngine.js';
import { createMasterCompositorEngine } from '../components/scene/engines/MasterCompositorEngine.js';
import { createBorderFrameEngine } from '../components/scene/engines/BorderFrameEngine.js';
import { assetPath } from '../utils/assetPath.js';

export function useSceneEngine({ stageRef, compositorCanvasRef }) {
  const engineRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const compositorCanvas = compositorCanvasRef.current;

    if (!stage || !compositorCanvas) return undefined;

    const scene = new SceneEngine({ quality: 'high' });
    engineRef.current = scene;

    const compositorEngine = createMasterCompositorEngine({
      canvas: compositorCanvas,
      stage,
      sources: [
        assetPath('images/master/MASTER.webp'),
        assetPath('images/master/MASTER.png'),
      ],
    });

    scene.register(compositorEngine);
    scene.register(
      createBorderFrameEngine({
        compositorEngine,
        stage,
      }),
    );

    const resizeScene = () => {
      const { width, height } = stage.getBoundingClientRect();
      scene.resize(width, height, globalThis.devicePixelRatio || 1);
    };

    const resizeObserver = new ResizeObserver(resizeScene);
    resizeObserver.observe(stage);

    resizeScene();
    scene.start();

    return () => {
      resizeObserver.disconnect();
      scene.destroy();
      engineRef.current = null;
    };
  }, [stageRef, compositorCanvasRef]);

  return engineRef;
}
