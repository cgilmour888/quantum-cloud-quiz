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
uniform float uSpeedGain;
uniform float uJunctionGain;
uniform float uReducedMotion;
uniform float uQuality;
uniform float uBloomStrength;
uniform int uProofMode;

in vec2 vUv;
out vec4 outColor;

const vec3 CYAN = vec3(0.04, 0.84, 1.0);
const vec3 ORANGE = vec3(1.0, 0.28, 0.035);
const vec3 PURPLE = vec3(0.67, 0.12, 1.0);

float cyclicDistance(float left, float right) {
  return abs(fract(left - right + 0.5) - 0.5);
}

float pulse(float phase, float position, float width) {
  float distanceToPulse = cyclicDistance(phase, position);
  return 1.0 - smoothstep(width * 0.30, width, distanceToPulse);
}

float cyanPackets(float phase, float timeValue) {
  float position = fract(timeValue * (0.055 + uSpeedGain * 0.022));
  return max(
    pulse(phase, position, 0.042),
    max(
      pulse(phase, fract(position + 0.347), 0.034),
      pulse(phase, fract(position + 0.701), 0.027)
    )
  );
}

float orangePackets(float phase, float timeValue) {
  float position = fract(1.0 - timeValue * (0.038 + uSpeedGain * 0.016));
  return max(
    pulse(phase, position, 0.058),
    pulse(phase, fract(position + 0.515), 0.046)
  );
}

float purplePackets(float phase, float timeValue) {
  float clockwise = fract(timeValue * (0.018 + uSpeedGain * 0.006));
  float counter = fract(1.0 - timeValue * (0.014 + uSpeedGain * 0.005));
  return max(
    pulse(phase, clockwise, 0.095),
    pulse(phase, counter, 0.082)
  );
}

vec3 phaseColor(float phase) {
  return 0.55 + 0.45 * cos(6.2831853 * (phase + vec3(0.0, 0.33, 0.67)));
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
  float cyanVoltage = 0.62 + 0.38 * sin(uTime * 4.52 + noise * 6.2831853);
  float orangeVoltage = 0.56 + 0.44 * sin(uTime * 2.89 + noise * 5.4 + 1.7);
  float purpleVoltage = 0.68 + 0.32 * sin(uTime * 1.32 + noise * 4.1 + 0.8);

  float cyanFlow = cyanPackets(data.r, timeValue);
  float orangeFlow = orangePackets(data.r, timeValue);
  float purpleFlow = purplePackets(data.r, timeValue);
  float junction = data.g * (0.48 + uJunctionGain * 0.52);

  float cyanIntensity = emissive.r * data.a * min(
    0.82,
    0.10 + cyanFlow * (0.47 + cyanVoltage * 0.23) + junction * cyanFlow * 0.48 + uEventGain.r
  );
  float orangeIntensity = emissive.g * data.a * min(
    0.86,
    0.075 + orangeFlow * (0.43 + orangeVoltage * 0.27) + junction * orangeFlow * 0.62 + uEventGain.g
  );
  float purpleIntensity = emissive.b * data.a * min(
    0.62,
    0.065 + purpleFlow * (0.30 + purpleVoltage * 0.18) + junction * purpleFlow * 0.30 + uEventGain.b
  );

  vec3 core = CYAN * cyanIntensity + ORANGE * orangeIntensity + PURPLE * purpleIntensity;
  float aggregate = max(cyanIntensity, max(orangeIntensity, purpleIntensity));
  vec3 glowColor = normalize(core + vec3(0.0001));
  float glow = emissive.a * aggregate * (0.09 + 0.26 * uBloomStrength) * uQuality;
  vec3 color = core + glowColor * glow;
  color = color / (1.0 + color * 0.32);
  color = min(color, vec3(0.94));

  if (uProofMode == 1) {
    vec3 proof = CYAN * emissive.r + ORANGE * emissive.g + PURPLE * emissive.b;
    outColor = vec4(min(proof, vec3(1.0)), 0.72);
    return;
  }

  outColor = vec4(color, clamp(max(color.r, max(color.g, color.b)), 0.0, 0.92));
}
`;
