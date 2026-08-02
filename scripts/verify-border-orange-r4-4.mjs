import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BORDER_FRAME_CHANNELS } from '../src/components/scene/engines/border/borderFrameConfig.js';
import { BORDER_FRAGMENT_SHADER } from '../src/components/scene/engines/border/borderFrameShaders.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'src/components/scene/engines/BorderFrameEngine.js',
  'src/components/scene/engines/border/BorderFrameRenderer.js',
  'src/components/scene/engines/border/borderFrameConfig.js',
  'src/components/scene/engines/border/borderFrameShaders.js',
  'scripts/verify-border-orange-r4-4.mjs',
  'tests/border-orange-persistence.test.mjs',
];

for (const relative of required) {
  assert.ok(fs.existsSync(path.join(root, relative)), `Missing R4.4 file: ${relative}`);
}

const masterPath = path.join(root, 'public/images/master/MASTER.png');
const masterHash = crypto.createHash('sha256').update(fs.readFileSync(masterPath)).digest('hex');
assert.equal(
  masterHash,
  '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c',
  'Protected MASTER.png changed',
);

const { cyan, orange } = BORDER_FRAME_CHANNELS;
assert.equal(orange.direction, -1);
assert.ok(orange.speed > cyan.speed);
assert.ok(orange.baseCurrent + orange.carrierFloor >= 0.30);
assert.ok(orange.voltageFloor - orange.voltageSwing >= 0.40);
assert.ok(orange.haloGain >= 0.44);
assert.equal(orange.maximumIntensity, 0.94);
assert.ok(orange.color[1] < 0.20);

assert.match(BORDER_FRAGMENT_SHADER, /float orangeCarrier = ORANGE_BASE \+ ORANGE_CARRIER_FLOOR/);
assert.match(BORDER_FRAGMENT_SHADER, /float orangeBody = orangePackets \* ORANGE_PACKET_GAIN/);
assert.match(BORDER_FRAGMENT_SHADER, /float orangeTail = orangeTrails \* ORANGE_TRAIL_GAIN/);
assert.match(BORDER_FRAGMENT_SHADER, /float orangeHaloSupport = orangeHaloMask/);
assert.match(BORDER_FRAGMENT_SHADER, /float bloomFloor = max\(uBloomStrength, 0\.68\)/);

const oldFiles = [
  'scripts/verify-border-orange-r4-3.mjs',
  'tests/border-orange-channel.test.mjs',
  'BORDER-FRAME-ORANGE-R4.3.md',
];
for (const relative of oldFiles) {
  assert.ok(!fs.existsSync(path.join(root, relative)), `Legacy R4.3 file was not pruned: ${relative}`);
}

console.log('BorderFrameEngine R4.4 persistent orange verification passed.');
console.log(`Orange direction: counter-clockwise (${orange.direction})`);
console.log(`Orange speed: ${orange.speed.toFixed(3)} route cycles/second`);
console.log(`Persistent current floor: ${(orange.baseCurrent + orange.carrierFloor).toFixed(2)}`);
console.log(`Voltage minimum: ${(orange.voltageFloor - orange.voltageSwing).toFixed(2)}`);
console.log(`Maximum intensity: ${orange.maximumIntensity.toFixed(2)}`);
