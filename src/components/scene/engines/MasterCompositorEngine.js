import { MasterSceneCompositor } from '../compositor/MasterSceneCompositor.js';

export function createMasterCompositorEngine({
  canvas,
  stage,
  sources,
}) {
  let compositor = null;
  let elapsed = 0;

  const engine = {
    id: 'master-compositor-engine',
    priority: -1000,
    enabled: true,

    init({ quality = 'high' } = {}) {
      compositor = new MasterSceneCompositor({
        canvas,
        stage,
        sources,
        quality,
      });

      void compositor.init().catch((error) => {
        console.error('[MasterCompositorEngine] initialization failed', error);
      });
    },

    resize(geometry) {
      compositor?.resize(geometry);
    },

    update(_delta, nextElapsed) {
      elapsed = nextElapsed;
    },

    render() {
      void elapsed;
      compositor?.render();
    },

    getCompositor() {
      return compositor;
    },

    getSharedContext() {
      return compositor?.getSharedContext() ?? null;
    },

    destroy() {
      compositor?.destroy();
      compositor = null;
    },
  };

  return engine;
}
