import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { BORDER_FRAME_CHANNELS } from '../src/components/scene/engines/border/borderFrameConfig.js';

const root = process.cwd();
const sha = async (relative) => createHash('sha256')
  .update(await readFile(path.join(root, relative))).digest('hex');

const immutable = {
  'public/images/master/MASTER.png': '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c',
  'public/images/master/derived/border-frame/source/border-cyan-emissive.png': '31f562f7dc9136fdfbc0a8e563ba55a1c5896a6e370948d45e4807c6272c3337',
  'public/images/master/derived/border-frame/source/border-flow-phase.png': '8413b3e5c32a8eeb0fb8d824d91ab171dc7470970f3a67083c0f230fddafc195',
};
for (const [relative, expected] of Object.entries(immutable)) {
  assert.equal(await sha(relative), expected, `Cyan control asset changed: ${relative}`);
}
assert.deepEqual(BORDER_FRAME_CHANNELS.cyan, {
  direction: 1, speed: 0.055, baseCurrent: 0.10, pulseWidth: 0.042,
  packetCount: 3, voltageFrequency: 0.72, junctionGain: 0.48,
  bloomGain: 0.34, maximumIntensity: 0.82, color: [0.04, 0.84, 1.0],
});

const engine = await readFile(path.join(root, 'src/components/scene/engines/BorderFrameEngine.js'), 'utf8');
const renderer = await readFile(path.join(root, 'src/components/scene/engines/border/BorderFrameRenderer.js'), 'utf8');
const shader = await readFile(path.join(root, 'src/components/scene/engines/border/borderFrameShaders.js'), 'utf8');

for (const token of ["'purple-cyan-clone': 1", "'purple-cyan-tracer': 2", 'diagnosticMode: diagnosticCode']) {
  assert.ok(engine.includes(token), `Engine missing ${token}`);
}
for (const token of ["'uDiagnosticMode'", 'gl.uniform1i(uniforms.uDiagnosticMode, diagnosticMode)']) {
  assert.ok(renderer.includes(token), `Renderer missing ${token}`);
}
const cyanPackets = `float cyanPackets(float phase, float timeValue) {
  float position = fract(timeValue * (CYAN_SPEED + uSpeedGain * 0.022));`;
assert.ok(shader.includes(cyanPackets), 'Approved cyan packet equation changed.');
assert.match(shader, /float cyanIntensity = emissive\.r \* data\.a \* uChannelEnable\.r/);

console.log('R5.3 channel-parity diagnostic verification passed.');
console.log('Cyan source assets and approved equations remain unchanged.');
