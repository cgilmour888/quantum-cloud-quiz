export const BORDER_FRAME_CHANNELS = Object.freeze({
  cyan: Object.freeze({
    direction: 1,
    speed: 0.055,
    baseCurrent: 0.10,
    pulseWidth: 0.042,
    voltageFrequency: 0.72,
    junctionGain: 0.48,
    bloomGain: 0.34,
    maximumIntensity: 0.82,
    color: Object.freeze([0.04, 0.84, 1.0]),
  }),
  orange: Object.freeze({
    direction: -1,
    speed: 0.038,
    baseCurrent: 0.075,
    pulseWidth: 0.058,
    voltageFrequency: 0.46,
    junctionGain: 0.62,
    bloomGain: 0.38,
    maximumIntensity: 0.86,
    color: Object.freeze([1.0, 0.28, 0.035]),
  }),
  purple: Object.freeze({
    primaryDirection: 1,
    secondaryDirection: -1,
    primarySpeed: 0.018,
    secondarySpeed: 0.014,
    baseCurrent: 0.065,
    pulseWidth: 0.095,
    voltageFrequency: 0.21,
    junctionGain: 0.30,
    bloomGain: 0.27,
    maximumIntensity: 0.62,
    color: Object.freeze([0.67, 0.12, 1.0]),
  }),
});

export const BORDER_FRAME_QUALITY = Object.freeze({
  conservative: Object.freeze({
    shaderQuality: 0.48,
    voltageDetail: 0.45,
    bloomStrength: 0.45,
  }),
  balanced: Object.freeze({
    shaderQuality: 0.72,
    voltageDetail: 0.72,
    bloomStrength: 0.72,
  }),
  high: Object.freeze({
    shaderQuality: 1.0,
    voltageDetail: 1.0,
    bloomStrength: 1.0,
  }),
});

export const BORDER_FRAME_LIMITS = Object.freeze({
  maximumActiveImpulses: 8,
  maximumCombinedEmission: 0.94,
  normalBloomCeiling: 0.35,
  completionBloomCeiling: 0.52,
});

export function wrapPhase(value) {
  return ((value % 1) + 1) % 1;
}

export function cyclicDistance(left, right) {
  return Math.abs(wrapPhase(left - right + 0.5) - 0.5);
}
