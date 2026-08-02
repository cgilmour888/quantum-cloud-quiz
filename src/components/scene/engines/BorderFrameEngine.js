/**
 * Unified-compositor BorderFrameEngine foundation.
 *
 * The border no longer owns a separately scaled canvas. All future border
 * rendering will use the MASTER texture and the WebGL context exposed by the
 * MasterCompositorEngine. This permanently removes image/canvas transform
 * drift, double vision, and registration echoes from the rendering model.
 *
 * Motion remains disabled until the border-only static proof is approved.
 */
export function createBorderFrameEngine({ compositorEngine, stage }) {
  if (!compositorEngine?.getSharedContext) {
    throw new TypeError('BorderFrameEngine requires the shared MASTER compositor.');
  }

  if (!(stage instanceof HTMLElement)) {
    throw new TypeError('BorderFrameEngine requires the scene-stage element.');
  }

  let destroyed = false;

  return {
    id: 'border-frame-engine',
    priority: 100,
    enabled: false,

    init() {
      stage.dataset.borderEngineState = 'awaiting-static-proof';
      stage.dataset.borderRenderingPlane = 'shared-master-compositor';
    },

    resize() {
      // The border inherits the compositor's exact backing store and UV plane.
    },

    update() {
      // Motion remains prohibited until the border-only proof is approved.
    },

    render() {
      if (destroyed) return;
      // Future renderer obtains the exact shared context below:
      // compositorEngine.getSharedContext()
      // No second canvas, CSS transform, or separately positioned image exists.
    },

    handleEvent() {
      // Gameplay reactions begin after static mask approval.
    },

    destroy() {
      destroyed = true;
      delete stage.dataset.borderEngineState;
      delete stage.dataset.borderRenderingPlane;
    },
  };
}
