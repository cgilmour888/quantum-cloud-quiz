import { BORDER_FRAME_CHANNELS } from './borderFrameConfig.js';

function glslFloat(value) {
  return Number(value).toFixed(6);
}

function glslVec3(values) {
  return `vec3(${values.map(glslFloat).join(', ')})`;
}

const CYAN_CHANNEL = BORDER_FRAME_CHANNELS.cyan;
const ORANGE_CHANNEL = BORDER_FRAME_CHANNELS.orange;
const PURPLE_CHANNEL = BORDER_FRAME_CHANNELS.purple;

export const BORDER_VERTEX_SHADER = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  vec2 position;
  vec2 uv;
  if (gl_VertexID == 0) {
    position = vec2(-1.0, -1.0);
    uv = vec2(0.0, 0.0);
  } else if (gl_VertexID == 1) {
    position = vec2(3.0, -1.0);
    uv = vec2(2.0, 0.0);
  } else {
    position = vec2(-1.0, 3.0);
    uv = vec2(0.0, 2.0);
  }
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const BORDER_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uEmissive;
uniform sampler2D uData;
uniform float uTime;
uniform vec3 uEventGain;
uniform vec3 uChannelEnable;
uniform float uSpeedGain;
uniform float uJunctionGain;
uniform float uReducedMotion;
uniform float uQuality;
uniform float uBloomStrength;
uniform int uProofMode;

in vec2 vUv;
out vec4 outColor;

const float TAU = 6.28318530718;
const vec3 CYAN = ${glslVec3(CYAN_CHANNEL.color)};
const vec3 ORANGE = ${glslVec3(ORANGE_CHANNEL.color)};
const vec3 ORANGE_HOT = ${glslVec3(ORANGE_CHANNEL.hotColor)};
const vec3 PURPLE = ${glslVec3(PURPLE_CHANNEL.color)};

const float CYAN_SPEED = ${glslFloat(CYAN_CHANNEL.speed)};
const float CYAN_BASE = ${glslFloat(CYAN_CHANNEL.baseCurrent)};
const float CYAN_WIDTH = ${glslFloat(CYAN_CHANNEL.pulseWidth)};
const float CYAN_VOLTAGE_HZ = ${glslFloat(CYAN_CHANNEL.voltageFrequency)};
const float CYAN_JUNCTION = ${glslFloat(CYAN_CHANNEL.junctionGain)};
const float CYAN_MAXIMUM = ${glslFloat(CYAN_CHANNEL.maximumIntensity)};

const float ORANGE_SPEED = ${glslFloat(ORANGE_CHANNEL.speed)};
const float ORANGE_BASE = ${glslFloat(ORANGE_CHANNEL.baseCurrent)};
const float ORANGE_CARRIER_FLOOR = ${glslFloat(ORANGE_CHANNEL.carrierFloor)};
const float ORANGE_CARRIER_WAVE = ${glslFloat(ORANGE_CHANNEL.carrierWaveGain)};
const float ORANGE_PACKET_GAIN = ${glslFloat(ORANGE_CHANNEL.packetGain)};
const float ORANGE_TRAIL_GAIN = ${glslFloat(ORANGE_CHANNEL.trailGain)};
const float ORANGE_WIDTH = ${glslFloat(ORANGE_CHANNEL.pulseWidth)};
const float ORANGE_VOLTAGE_HZ = ${glslFloat(ORANGE_CHANNEL.voltageFrequency)};
const float ORANGE_VOLTAGE_FLOOR = ${glslFloat(ORANGE_CHANNEL.voltageFloor)};
const float ORANGE_VOLTAGE_SWING = ${glslFloat(ORANGE_CHANNEL.voltageSwing)};
const float ORANGE_JUNCTION = ${glslFloat(ORANGE_CHANNEL.junctionGain)};
const float ORANGE_BLOOM = ${glslFloat(ORANGE_CHANNEL.bloomGain)};
const float ORANGE_HALO = ${glslFloat(ORANGE_CHANNEL.haloGain)};
const float ORANGE_MAXIMUM = ${glslFloat(ORANGE_CHANNEL.maximumIntensity)};

const float PURPLE_PRIMARY_SPEED = ${glslFloat(PURPLE_CHANNEL.primarySpeed)};
const float PURPLE_SECONDARY_SPEED = ${glslFloat(PURPLE_CHANNEL.secondarySpeed)};
const float PURPLE_BASE = ${glslFloat(PURPLE_CHANNEL.baseCurrent)};
const float PURPLE_WIDTH = ${glslFloat(PURPLE_CHANNEL.pulseWidth)};
const float PURPLE_VOLTAGE_HZ = ${glslFloat(PURPLE_CHANNEL.voltageFrequency)};
const float PURPLE_JUNCTION = ${glslFloat(PURPLE_CHANNEL.junctionGain)};
const float PURPLE_MAXIMUM = ${glslFloat(PURPLE_CHANNEL.maximumIntensity)};

float cyclicDistance(float left, float right) {
  return abs(fract(left - right + 0.5) - 0.5);
}

float pulse(float phase, float position, float width) {
  float distanceToPulse = cyclicDistance(phase, position);
  return 1.0 - smoothstep(width * 0.30, width, distanceToPulse);
}

float cyanPackets(float phase, float timeValue) {
  float position = fract(timeValue * (CYAN_SPEED + uSpeedGain * 0.022));
  return max(
    pulse(phase, position, CYAN_WIDTH),
    max(
      pulse(phase, fract(position + 0.347), 0.034),
      pulse(phase, fract(position + 0.701), 0.027)
    )
  );
}

vec3 orangeTransport(float phase, float timeValue) {
  // Counter-clockwise travel: increasing time moves toward decreasing route phase.
  float position = fract(1.0 - timeValue * (ORANGE_SPEED + uSpeedGain * 0.030));
  float head = pulse(phase, position, ORANGE_WIDTH);
  float packetTwo = pulse(phase, fract(position + 0.247), ORANGE_WIDTH * 0.82);
  float packetThree = pulse(phase, fract(position + 0.517), ORANGE_WIDTH * 0.68);
  float packetFour = pulse(phase, fract(position + 0.779), ORANGE_WIDTH * 0.54);
  float packets = max(max(head, packetTwo), max(packetThree, packetFour));

  // Long pressure tails keep the conduit alive between packet heads.
  float trailOne = pulse(phase, fract(position + 0.050), ORANGE_WIDTH * 2.65);
  float trailTwo = pulse(phase, fract(position + 0.310), ORANGE_WIDTH * 2.15);
  float trails = max(trailOne, trailTwo);

  // A continuous counter-clockwise carrier wave moves through every orange route.
  float carrier = 0.5 + 0.5 * sin(TAU * (phase * 6.0 + timeValue * ORANGE_SPEED * 6.0));
  carrier = carrier * carrier;
  return vec3(packets, trails, carrier);
}

float purplePackets(float phase, float timeValue) {
  float clockwise = fract(timeValue * (PURPLE_PRIMARY_SPEED + uSpeedGain * 0.006));
  float counter = fract(1.0 - timeValue * (PURPLE_SECONDARY_SPEED + uSpeedGain * 0.005));
  return max(
    pulse(phase, clockwise, PURPLE_WIDTH),
    pulse(phase, counter, 0.082)
  );
}

vec3 phaseColor(float phase) {
  return 0.55 + 0.45 * cos(TAU * (phase + vec3(0.0, 0.33, 0.67)));
}

float orangeHaloMask(vec2 uv, vec2 texel) {
  float center = texture(uEmissive, uv).g;
  float nearMask = max(
    max(texture(uEmissive, uv + vec2(texel.x * 2.5, 0.0)).g,
        texture(uEmissive, uv - vec2(texel.x * 2.5, 0.0)).g),
    max(texture(uEmissive, uv + vec2(0.0, texel.y * 2.5)).g,
        texture(uEmissive, uv - vec2(0.0, texel.y * 2.5)).g)
  );
  float farMask = max(
    max(texture(uEmissive, uv + vec2(texel.x * 5.0, 0.0)).g,
        texture(uEmissive, uv - vec2(texel.x * 5.0, 0.0)).g),
    max(texture(uEmissive, uv + vec2(0.0, texel.y * 5.0)).g,
        texture(uEmissive, uv - vec2(0.0, texel.y * 5.0)).g)
  );
  return max(center, max(nearMask * 0.72, farMask * 0.36));
}

void main() {
  vec4 emissive = texture(uEmissive, vUv);
  vec4 data = texture(uData, vUv);
  float combinedMask = max(emissive.r, max(emissive.g, emissive.b));

  if (uProofMode == 2) {
    vec3 proof = CYAN * emissive.r + ORANGE * emissive.g + PURPLE * emissive.b;
    outColor = vec4(proof, 1.0);
    return;
  }

  if (uProofMode == 3) {
    vec3 proof = phaseColor(data.r) * combinedMask;
    outColor = vec4(proof, 1.0);
    return;
  }

  if (uProofMode == 4) {
    vec3 proof = mix(vec3(0.16, 0.0, 0.0), vec3(0.0, 0.82, 0.32), data.a);
    proof *= max(combinedMask, 0.08);
    outColor = vec4(proof, 1.0);
    return;
  }

  float timeValue = mix(uTime * 0.08, uTime, 1.0 - uReducedMotion);
  float noise = data.b;
  float cyanVoltage = 0.62 + 0.38 * sin(uTime * TAU * CYAN_VOLTAGE_HZ + noise * TAU);
  float orangeVoltage = ORANGE_VOLTAGE_FLOOR
    + ORANGE_VOLTAGE_SWING * sin(uTime * TAU * ORANGE_VOLTAGE_HZ + noise * 5.9 + 1.7);
  float purpleVoltage = 0.68 + 0.32 * sin(uTime * TAU * PURPLE_VOLTAGE_HZ + noise * 4.1 + 0.8);

  float cyanFlow = cyanPackets(data.r, timeValue);
  vec3 orangeState = orangeTransport(data.r, timeValue);
  float orangePackets = orangeState.x;
  float orangeTrails = orangeState.y;
  float orangeCarrierWave = orangeState.z;
  float purpleFlow = purplePackets(data.r, timeValue);
  float junction = data.g * (0.48 + uJunctionGain * 0.52);

  // Cyan remains byte-for-byte equivalent in visual behavior to the approved channel.
  float cyanIntensity = emissive.r * data.a * uChannelEnable.r * min(
    CYAN_MAXIMUM,
    CYAN_BASE + cyanFlow * (0.47 + cyanVoltage * 0.23)
      + junction * cyanFlow * CYAN_JUNCTION + uEventGain.r
  );

  // Persistent orange carrier: it never depends on a temporary gameplay event.
  float orangeCarrier = ORANGE_BASE + ORANGE_CARRIER_FLOOR
    + ORANGE_CARRIER_WAVE * orangeCarrierWave * orangeVoltage;
  float orangeBody = orangePackets * ORANGE_PACKET_GAIN * (0.72 + orangeVoltage * 0.28);
  float orangeTail = orangeTrails * ORANGE_TRAIL_GAIN * (0.78 + orangeVoltage * 0.22);
  float orangeJunction = junction * max(orangePackets, orangeTrails * 0.62) * ORANGE_JUNCTION;
  float orangeIntensity = emissive.g * data.a * uChannelEnable.g * min(
    ORANGE_MAXIMUM,
    orangeCarrier + orangeBody + orangeTail + orangeJunction + uEventGain.g
  );

  float purpleIntensity = emissive.b * data.a * uChannelEnable.b * min(
    PURPLE_MAXIMUM,
    PURPLE_BASE + purpleFlow * (0.30 + purpleVoltage * 0.18)
      + junction * purpleFlow * PURPLE_JUNCTION + uEventGain.b
  );

  float orangeCoreHeat = smoothstep(0.42, ORANGE_MAXIMUM, orangeIntensity)
    * max(orangePackets, orangeCarrierWave * 0.55);
  vec3 orangePlasmaColor = mix(ORANGE, ORANGE_HOT, orangeCoreHeat * 0.46);
  vec3 core = CYAN * cyanIntensity + orangePlasmaColor * orangeIntensity + PURPLE * purpleIntensity;
  float aggregate = max(cyanIntensity, max(orangeIntensity, purpleIntensity));
  vec3 glowColor = normalize(core + vec3(0.0001));

  // Quality controls micro-detail only; it may never extinguish the carrier current.
  float detailQuality = mix(0.72, 1.0, clamp(uQuality, 0.0, 1.0));
  float bloomFloor = max(uBloomStrength, 0.68);
  float glow = emissive.a * aggregate * (0.10 + 0.25 * bloomFloor) * detailQuality;

  vec2 texel = 1.0 / vec2(textureSize(uEmissive, 0));
  float orangeHaloSupport = orangeHaloMask(vUv, texel) * data.a * uChannelEnable.g;
  float orangeHaloEnergy = orangeHaloSupport
    * (0.22 + orangeCarrierWave * 0.30 + orangePackets * 0.48)
    * ORANGE_HALO * bloomFloor;
  vec3 orangeBloom = ORANGE * (
    emissive.g * orangeIntensity * (0.10 + ORANGE_BLOOM * 0.22)
    + orangeHaloEnergy * 0.42
  ) * detailQuality;

  vec3 color = core + glowColor * glow + orangeBloom;
  color = color / (1.0 + color * 0.27);
  color = min(color, vec3(0.94));

  if (uProofMode == 1) {
    vec3 proof = CYAN * emissive.r + ORANGE * emissive.g + PURPLE * emissive.b;
    outColor = vec4(min(proof, vec3(1.0)), 0.72);
    return;
  }

  float alpha = max(max(color.r, max(color.g, color.b)), orangeHaloEnergy * 0.58);
  outColor = vec4(color, clamp(alpha, 0.0, 0.94));
}
`;
