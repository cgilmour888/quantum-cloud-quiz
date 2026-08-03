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
const manifest = JSON.parse(await readFile(
  new URL('../public/images/master/derived/border-frame/purple-mask-r5.4.json', import.meta.url),
  'utf8',
));

test('true purple mask uses the approved cyan phase', () => {
  assert.match(shader, /float flow = purpleCyanClonePackets\(data\.r, timeValue\);/);
  assert.match(shader, /float permitted = (?:texture\(uPurpleTrueMask, vUv\)\.r|purplePathMask\(vUv\));/);
  assert.match(shader, /float purplePathMask\(vec2 uv\)[\s\S]*texture\(uPurpleTrueMask, uv\)\.r/);
});

test('true purple tracer remains counter-clockwise', () => {
  assert.match(shader, /vec2 tracer = purpleCyanTracer\(data\.r, timeValue\);/);
  assert.match(shader, /fract\(1\.0 - timeValue \* \(CYAN_SPEED \+ 0\.020\)\)/);
});

test('legacy placard occlusion does not suppress lower-center circuit extensions', () => {
  assert.doesNotMatch(shader, /texture\(uPurpleTrueMask, vUv\)\.r\s*\*\s*data\.a/);
  assert.ok(manifest.regions.lowerCenter > 200000);
});

test('R5.4 modes remain isolated from normal channels', () => {
  assert.match(engine, /'purple-mask-cyan-phase': 3/);
  assert.match(engine, /'purple-mask-tracer': 4/);
  assert.match(engine, /diagnosticCode > 0[\s\S]*BORDER_FRAME_CHANNEL_MODES\.cyan\.map\(\(\) => 0\)/);
});
