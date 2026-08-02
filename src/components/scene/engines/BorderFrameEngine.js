import { SceneEvents } from '../sceneEvents.js';
import {
  getBorderFrameAssetUrls,
  selectBorderAtlasVariant,
} from './border/borderFrameAssets.js';
import { createBorderFrameRenderer } from './border/BorderFrameRenderer.js';
import { BorderFramePerformanceController } from './border/BorderFramePerformanceController.js';
import { BorderFrameSurgeController } from './border/BorderFrameSurgeController.js';
import { BORDER_FRAME_LIMITS } from './border/borderFrameConfig.js';

const EVENT_PROFILES = Object.freeze({
  [SceneEvents.EXAM_STARTED]: Object.freeze({
    channel: 'purple', attack: 0.12, hold: 0.42, decay: 1.8,
    amplitude: 0.46, speedMultiplier: 0.60, junctionMultiplier: 0.72,
  }),
  [SceneEvents.QUESTION_CHANGED]: Object.freeze({
    channel: 'cyan', attack: 0.05, hold: 0.08, decay: 0.65,
    amplitude: 0.30, speedMultiplier: 0.42, junctionMultiplier: 0.35,
  }),
  [SceneEvents.ANSWER_SELECTED]: Object.freeze({
    channel: 'purple', attack: 0.04, hold: 0.06, decay: 0.52,
    amplitude: 0.22, speedMultiplier: 0.24, junctionMultiplier: 0.25,
  }),
  [SceneEvents.ANSWER_CORRECT]: Object.freeze({
    channel: 'cyan', attack: 0.045, hold: 0.16, decay: 0.90,
    amplitude: 0.66, speedMultiplier: 0.96, junctionMultiplier: 1.0,
  }),
  [SceneEvents.ANSWER_INCORRECT]: Object.freeze({
    channel: 'orange', attack: 0.035, hold: 0.12, decay: 0.82,
    amplitude: 0.58, speedMultiplier: 0.72, junctionMultiplier: 0.88,
  }),
  [SceneEvents.STREAK_CHANGED]: Object.freeze({
    channel: 'cyan', attack: 0.04, hold: 0.10, decay: 0.76,
    amplitude: 0.38, speedMultiplier: 0.48, junctionMultiplier: 0.55,
  }),
  [SceneEvents.EXAM_COMPLETED]: Object.freeze({
    channel: 'purple', attack: 0.10, hold: 0.55, decay: 2.4,
    amplitude: 0.74, speedMultiplier: 0.82, junctionMultiplier: 1.0,
  }),
  [SceneEvents.PLACARD_HOVERED]: Object.freeze({
    channel: 'purple', attack: 0.08, hold: 0.08, decay: 0.58,
    amplitude: 0.18, speedMultiplier: 0.12, junctionMultiplier: 0.18,
  }),
  [SceneEvents.PLACARD_FOCUSED]: Object.freeze({
    channel: 'purple', attack: 0.08, hold: 0.12, decay: 0.72,
    amplitude: 0.22, speedMultiplier: 0.16, junctionMultiplier: 0.24,
  }),
  [SceneEvents.PLACARD_ACTIVATED]: Object.freeze({
    channel: 'purple', attack: 0.06, hold: 0.26, decay: 1.35,
    amplitude: 0.58, speedMultiplier: 0.55, junctionMultiplier: 0.72,
  }),
  [SceneEvents.BUSINESS_CARD_OPENED]: Object.freeze({
    channel: 'purple', attack: 0.12, hold: 0.24, decay: 1.5,
    amplitude: 0.34, speedMultiplier: 0.24, junctionMultiplier: 0.36,
  }),
  [SceneEvents.BUSINESS_CARD_CLOSED]: Object.freeze({
    channel: 'cyan', attack: 0.06, hold: 0.12, decay: 0.86,
    amplitude: 0.36, speedMultiplier: 0.34, junctionMultiplier: 0.42,
  }),
});

const PROOF_MODES = Object.freeze({
  overlay: 1,
  isolated: 2,
  phase: 3,
  occlusion: 4,
});

function prefersReducedMotion() {
  return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
}

function readProofMode() {
  const value = new URLSearchParams(globalThis.location?.search ?? '')
    .get('qcq-border-proof');

  // R4.1 static proofs are deterministic 4K images rendered by
  // BorderFrameProofLayer. Disable the live engine for every proof route so
  // renderer or asset initialization failures can never masquerade as a
  // successful proof by leaving the MASTER visible underneath.
  if (value === 'master' || Object.hasOwn(PROOF_MODES, value)) return -1;
  return 0;
}

export function createBorderFrameEngine({ compositorEngine, stage }) {
  if (!compositorEngine?.getSharedContext) {
    throw new TypeError('BorderFrameEngine requires the shared MASTER compositor.');
  }
  if (!(stage instanceof HTMLElement)) {
    throw new TypeError('BorderFrameEngine requires the scene-stage element.');
  }

  const reducedMotion = prefersReducedMotion();
  const proofMode = readProofMode();
  const surges = new BorderFrameSurgeController(BORDER_FRAME_LIMITS.maximumActiveImpulses);
  const performance = new BorderFramePerformanceController({
    initial: 'balanced',
    reducedMotion,
  });

  let renderer = null;
  let rendererKey = '';
  let rendererPromise = null;
  let destroyed = false;
  let time = 0;
  let lastDelta = 1 / 60;
  let surgeState = surges.snapshot();

  function destroyRenderer() {
    renderer?.destroy?.();
    renderer = null;
    rendererPromise = null;
    rendererKey = '';
  }

  function ensureRenderer() {
    const sharedContext = compositorEngine.getSharedContext();
    if (!sharedContext || proofMode === -1) return null;

    const variant = selectBorderAtlasVariant(sharedContext.width, sharedContext.height);
    const contextIdentity = sharedContext.type === 'webgl2'
      ? `webgl2:${String(sharedContext.gl)}`
      : `canvas2d:${String(sharedContext.context)}`;
    const nextKey = `${contextIdentity}:${variant}`;

    if (renderer && rendererKey === nextKey) return sharedContext;
    if (rendererPromise && rendererKey === nextKey) return sharedContext;

    destroyRenderer();
    rendererKey = nextKey;
    renderer = createBorderFrameRenderer(
      sharedContext,
      getBorderFrameAssetUrls(variant),
    );

    if (!renderer) {
      stage.dataset.borderEngineState = 'unsupported';
      return sharedContext;
    }

    stage.dataset.borderEngineState = 'loading';
    stage.dataset.borderAtlasVariant = variant;
    stage.dataset.borderRenderer = renderer.type;

    rendererPromise = renderer.init()
      .then(() => {
        if (destroyed) return;
        stage.dataset.borderEngineState = 'active';
      })
      .catch((error) => {
        stage.dataset.borderEngineState = 'error';
        console.error('[BorderFrameEngine] asset or renderer initialization failed', error);
      });

    return sharedContext;
  }

  return {
    id: 'border-frame-engine',
    priority: 100,
    enabled: proofMode !== -1,

    init() {
      stage.dataset.borderEngineState = proofMode === -1 ? 'master-proof' : 'waiting-for-compositor';
      stage.dataset.borderRenderingPlane = 'shared-master-compositor';
      stage.dataset.borderPlacardMode = 'fully-excluded-independent-button';
      stage.dataset.borderProofMode = String(proofMode);
    },

    resize() {
      // Registered atlases use the compositor's exact backing store and UV plane.
    },

    update(delta, elapsed) {
      if (destroyed) return;
      lastDelta = Math.max(0, Number(delta) || 0);
      time = elapsed;
      surgeState = surges.update(lastDelta);
      performance.record(lastDelta);
      const quality = performance.state;
      stage.dataset.borderQuality = quality.tier;
      stage.dataset.borderFrameMs = quality.averageFrameMs.toFixed(2);
    },

    render() {
      if (destroyed || proofMode === -1) return;
      const sharedContext = ensureRenderer();
      if (!sharedContext || !renderer?.ready) return;

      renderer.render({
        time,
        width: sharedContext.width,
        height: sharedContext.height,
        proofMode,
        reducedMotion,
        quality: performance.state,
        eventChannels: surgeState.channels,
        speedGain: surgeState.speedGain,
        junctionGain: surgeState.junctionGain,
      });
    },

    handleEvent(eventName, detail = {}) {
      const profile = EVENT_PROFILES[eventName];
      if (!profile) return;

      const multiplier = eventName === SceneEvents.STREAK_CHANGED
        ? Math.min(1.55, 0.72 + (Number(detail?.streak) || 0) * 0.035)
        : 1;

      surges.trigger({
        ...profile,
        amplitude: profile.amplitude * multiplier,
      });
    },

    destroy() {
      destroyed = true;
      surges.reset();
      destroyRenderer();
      delete stage.dataset.borderEngineState;
      delete stage.dataset.borderRenderingPlane;
      delete stage.dataset.borderPlacardMode;
      delete stage.dataset.borderProofMode;
      delete stage.dataset.borderAtlasVariant;
      delete stage.dataset.borderRenderer;
      delete stage.dataset.borderQuality;
      delete stage.dataset.borderFrameMs;
    },
  };
}
