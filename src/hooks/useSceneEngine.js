import { useEffect, useRef } from 'react';
import { SceneEngine } from '../components/scene/SceneEngine.js';
import { createBorderFrameEngine } from '../components/scene/engines/BorderFrameEngine.js';

export function useSceneEngine({ stageRef, borderFrameCanvasRef }) {
  const engineRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const borderFrameCanvas = borderFrameCanvasRef.current;

    if (!stage || !borderFrameCanvas) return undefined;

    const scene = new SceneEngine({ quality: 'high' });
    engineRef.current = scene;

    scene.register(
      createBorderFrameEngine({
        canvas: borderFrameCanvas,
        stage,
      }),
    );

    const resizeScene = () => {
      const { width, height } = stage.getBoundingClientRect();
      scene.resize(width, height, window.devicePixelRatio || 1);
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
  }, [stageRef, borderFrameCanvasRef]);

  return engineRef;
}
