export const BORDER_FRAME_CHANNELS = Object.freeze({
  cyan: Object.freeze({
    direction: 1,
    speed: 0.055,
    baseCurrent: 0.10,
    pulseWidth: 0.042,
    packetCount: 3,
    voltageFrequency: 0.72,
    junctionGain: 0.48,
    bloomGain: 0.34,
    maximumIntensity: 0.82,
    color: Object.freeze([0.04, 0.84, 1.0]),
  }),
  orange: Object.freeze({
    direction: -1,
    speed: 0.082,
    baseCurrent: 0.16,
    carrierFloor: 0.14,
    carrierWaveGain: 0.24,
    packetGain: 0.50,
    trailGain: 0.28,
    pulseWidth: 0.072,
    packetCount: 4,
    voltageFrequency: 0.74,
    voltageFloor: 0.72,
    voltageSwing: 0.28,
    junctionGain: 0.84,
    bloomGain: 0.64,
    haloGain: 0.44,
    maximumIntensity: 0.94,
    color: Object.freeze([1.0, 0.17, 0.012]),
    hotColor: Object.freeze([1.0, 0.245, 0.028]),
  }),
  purple: Object.freeze({
    primaryDirection: 1,
    secondaryDirection: -1,
    primarySpeed: 0.018,
    secondarySpeed: 0.014,
    baseCurrent: 0.065,
    pulseWidth: 0.095,
    packetCount: 2,
    voltageFrequency: 0.21,
    junctionGain: 0.30,
    bloomGain: 0.27,
    maximumIntensity: 0.62,
    color: Object.freeze([0.67, 0.12, 1.0]),
  }),
});

export const BORDER_FRAME_CHANNEL_MODES = Object.freeze({
  cyan: Object.freeze([1, 0, 0]),
  orange: Object.freeze([0, 1, 0]),
  dual: Object.freeze([1, 1, 0]),
  all: Object.freeze([1, 1, 1]),
});

export function resolveBorderFrameChannelMode(value) {
  const key = typeof value === 'string' ? value.toLowerCase() : '';
  return Object.hasOwn(BORDER_FRAME_CHANNEL_MODES, key) ? key : 'dual';
}

export const BORDER_FRAME_QUALITY = Object.freeze({
  conservative: Object.freeze({
    shaderQuality: 0.62,
    voltageDetail: 0.42,
    bloomStrength: 0.68,
  }),
  balanced: Object.freeze({
    shaderQuality: 0.82,
    voltageDetail: 0.72,
    bloomStrength: 0.84,
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
  normalBloomCeiling: 0.44,
  completionBloomCeiling: 0.56,
});

export function wrapPhase(value) {
  return ((value % 1) + 1) % 1;
}

export function cyclicDistance(left, right) {
  return Math.abs(wrapPhase(left - right + 0.5) - 0.5);
}
