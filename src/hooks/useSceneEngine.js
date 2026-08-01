import { useEffect, useRef } from 'react';
import { SceneEngine } from '../components/scene/SceneEngine.js';

export function useSceneEngine(stageRef) {
  const engineRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const scene = new SceneEngine({ quality: 'high' });
    engineRef.current = scene;

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      scene.resize(width, height);
    });

    resizeObserver.observe(stage);
    scene.start();

    return () => {
      resizeObserver.disconnect();
      scene.destroy();
      engineRef.current = null;
    };
  }, [stageRef]);

  return engineRef;
}
