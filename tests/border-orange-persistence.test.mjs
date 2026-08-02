import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  BORDER_FRAME_CHANNELS,
  BORDER_FRAME_CHANNEL_MODES,
  resolveBorderFrameChannelMode,
} from '../src/components/scene/engines/border/borderFrameConfig.js';
import { BORDER_FRAGMENT_SHADER } from '../src/components/scene/engines/border/borderFrameShaders.js';

const rendererSource = fs.readFileSync(
  new URL('../src/components/scene/engines/border/BorderFrameRenderer.js', import.meta.url),
  'utf8',
);

test('approved cyan channel remains unchanged in R4.4', () => {
  assert.deepEqual(BORDER_FRAME_CHANNELS.cyan, {
    direction: 1,
    speed: 0.055,
    baseCurrent: 0.10,
    pulseWidth: 0.042,
    packetCount: 3,
    voltageFrequency: 0.72,
    junctionGain: 0.48,
    bloomGain: 0.34,
    maximumIntensity: 0.82,
    color: [0.04, 0.84, 1.0],
  });
});

test('orange is a persistent, faster, counter-clockwise carrier', () => {
  const { cyan, orange } = BORDER_FRAME_CHANNELS;
  assert.equal(orange.direction, -1);
  assert.ok(orange.speed > cyan.speed);
  assert.ok(orange.baseCurrent >= 0.16);
  assert.ok(orange.carrierFloor >= 0.14);
  assert.ok(orange.carrierWaveGain >= 0.24);
  assert.ok(orange.packetGain >= 0.50);
  assert.ok(orange.trailGain >= 0.28);
  assert.ok(orange.haloGain >= 0.44);
  assert.equal(orange.packetCount, 4);
  assert.equal(orange.maximumIntensity, 0.94);
  assert.ok(orange.color[1] < 0.20, 'orange must remain deep orange, not yellow');
});

test('orange remains enabled by default while purple remains staged', () => {
  assert.equal(resolveBorderFrameChannelMode(undefined), 'dual');
  assert.deepEqual(BORDER_FRAME_CHANNEL_MODES.dual, [1, 1, 0]);
  assert.deepEqual(BORDER_FRAME_CHANNEL_MODES.orange, [0, 1, 0]);
});

test('shader contains a permanent carrier, moving tails, and local halo', () => {
  assert.match(BORDER_FRAGMENT_SHADER, /Persistent orange carrier/);
  assert.match(BORDER_FRAGMENT_SHADER, /ORANGE_CARRIER_FLOOR/);
  assert.match(BORDER_FRAGMENT_SHADER, /orangeCarrierWave/);
  assert.match(BORDER_FRAGMENT_SHADER, /orangeTrails/);
  assert.match(BORDER_FRAGMENT_SHADER, /orangeHaloMask/);
  assert.match(BORDER_FRAGMENT_SHADER, /Quality controls micro-detail only/);
  assert.match(BORDER_FRAGMENT_SHADER, /1\.0 - timeValue \* \(ORANGE_SPEED/);
});

test('Canvas 2D fallback cannot fade the orange current to zero', () => {
  assert.match(rendererSource, /const orangeCarrier = 0\.58 \+ 0\.14/);
  assert.match(rendererSource, /orangeCarrier \+ orangeSurge/);
});
