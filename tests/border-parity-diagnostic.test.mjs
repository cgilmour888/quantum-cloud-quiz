import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const shader = await readFile(
  new URL('../src/components/scene/engines/border/borderFrameShaders.js', import.meta.url),
  'utf8',
);
const engine = await readFile(
  new URL('../src/components/scene/engines/BorderFrameEngine.js', import.meta.url),
  'utf8',
);

test('purple clone uses the approved cyan mask and route inputs', () => {
  assert.match(shader, /float flow = purpleCyanClonePackets\(data\.r, timeValue\);/);
  assert.match(shader, /float intensity = emissive\.r \* data\.a/);
});

test('purple clone reverses the cyan route direction', () => {
  assert.match(shader, /fract\(1\.0 - timeValue \* \(CYAN_SPEED \+ uSpeedGain \* 0\.022\)\)/);
});

test('diagnostic modes isolate all normal color channels', () => {
  assert.match(engine, /diagnosticCode > 0[\s\S]*BORDER_FRAME_CHANNEL_MODES\.cyan\.map\(\(\) => 0\)/);
});
