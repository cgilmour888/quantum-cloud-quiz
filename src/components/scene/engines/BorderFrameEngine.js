const DPR_LIMITS = Object.freeze({
  low: 1,
  medium: 1.5,
  high: 2,
  ultra: 2.5,
});

/**
 * Phase 2 BorderFrameEngine foundation.
 *
 * This controller owns the dedicated transparent canvas and keeps its backing
 * buffer synchronized with the exact scene-stage dimensions. It intentionally
 * performs no drawing. Production masks and shader rendering are introduced
 * only after the static alignment proof is approved.
 */
export function createBorderFrameEngine({ canvas, stage }) {
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new TypeError('BorderFrameEngine requires a canvas element.');
  }

  if (!(stage instanceof HTMLElement)) {
    throw new TypeError('BorderFrameEngine requires the scene-stage element.');
  }

  let quality = 'high';
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let destroyed = false;

  function clearBackingStore() {
    // Resetting width clears the canvas without acquiring a rendering context.
    // This keeps Phase 2 compatible with the future WebGL2 renderer.
    if (canvas.width > 0) {
      const currentWidth = canvas.width;
      canvas.width = currentWidth;
    }
  }

  return {
    id: 'border-frame-engine',
    enabled: false,

    init({ quality: requestedQuality = 'high' } = {}) {
      quality = DPR_LIMITS[requestedQuality] ? requestedQuality : 'high';
      canvas.dataset.engineState = 'canvas-ready';
      canvas.dataset.renderingMode = 'uninitialized';
      canvas.setAttribute('role', 'presentation');
    },

    resize({
      width: nextWidth,
      height: nextHeight,
      devicePixelRatio = 1,
    }) {
      if (destroyed) return;

      const safeWidth = Math.max(1, Math.round(nextWidth));
      const safeHeight = Math.max(1, Math.round(nextHeight));
      const dprLimit = DPR_LIMITS[quality] ?? DPR_LIMITS.high;
      const safeDpr = Math.max(1, Math.min(devicePixelRatio, dprLimit));

      const backingWidth = Math.max(1, Math.round(safeWidth * safeDpr));
      const backingHeight = Math.max(1, Math.round(safeHeight * safeDpr));

      width = safeWidth;
      height = safeHeight;
      pixelRatio = safeDpr;

      if (canvas.width !== backingWidth) canvas.width = backingWidth;
      if (canvas.height !== backingHeight) canvas.height = backingHeight;

      canvas.dataset.stageWidth = String(width);
      canvas.dataset.stageHeight = String(height);
      canvas.dataset.pixelRatio = String(pixelRatio);
    },

    update() {
      // No motion is permitted during Phase 2.
    },

    render() {
      // No rendering context is acquired and no pixels are drawn in Phase 2.
    },

    handleEvent() {
      // Event reactions begin only after the animated engine is approved.
    },

    destroy() {
      destroyed = true;
      clearBackingStore();
      delete canvas.dataset.engineState;
      delete canvas.dataset.renderingMode;
      delete canvas.dataset.stageWidth;
      delete canvas.dataset.stageHeight;
      delete canvas.dataset.pixelRatio;
    },
  };
}
