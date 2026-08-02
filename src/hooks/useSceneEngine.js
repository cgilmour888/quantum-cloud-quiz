import { useEffect, useRef } from 'react';
import { SceneEngine } from '../components/scene/SceneEngine.js';
import { SceneEvents } from '../components/scene/sceneEvents.js';
import { createMasterCompositorEngine } from '../components/scene/engines/MasterCompositorEngine.js';
import { createBorderFrameEngine } from '../components/scene/engines/BorderFrameEngine.js';
import { assetPath } from '../utils/assetPath.js';

export function useSceneEngine({ stageRef, compositorCanvasRef }) {
  const engineRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    const compositorCanvas = compositorCanvasRef.current;
    if (!stage || !compositorCanvas) return undefined;

    // Medium caps the unified backing store at DPR 1.25, the balanced target for
    // the 2017 MacBook Air. The renderer may still reduce shader detail itself.
    const scene = new SceneEngine({ quality: 'medium' });
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
    scene.register(createBorderFrameEngine({ compositorEngine, stage }));

    // Quiz/profile components dispatch semantic DOM events on the stage. Bridge
    // them once into SceneEngine so renderers never query React or the DOM per frame.
    const unbindEvents = Object.values(SceneEvents).map((eventName) => {
      const listener = (event) => scene.emit(eventName, event.detail ?? {});
      stage.addEventListener(eventName, listener);
      return () => stage.removeEventListener(eventName, listener);
    });

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
      for (const unbind of unbindEvents) unbind();
      scene.destroy();
      engineRef.current = null;
    };
  }, [stageRef, compositorCanvasRef]);

  return engineRef;
}
