import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  BORDER_FRAME_CHANNEL_MODES,
  resolveBorderFrameChannelMode,
} from '../src/components/scene/engines/border/borderFrameConfig.js';

const shader = await readFile(
  new URL('../src/components/scene/engines/border/borderFrameShaders.js', import.meta.url),
  'utf8',
);
const assets = await readFile(
  new URL('../src/components/scene/engines/border/borderFrameAssets.js', import.meta.url),
  'utf8',
);
const engine = await readFile(
  new URL('../src/components/scene/engines/BorderFrameEngine.js', import.meta.url),
  'utf8',
);

test('normal product enables all three approved border channels', () => {
  assert.equal(resolveBorderFrameChannelMode(undefined), 'all');
  assert.deepEqual(BORDER_FRAME_CHANNEL_MODES.all, [1, 1, 1]);
});

test('normal purple samples the R5.5 production mask', () => {
  assert.match(assets, /purple-border-production-r5\.5(?:\.[123])?\.png/);
  assert.match(shader, /float purplePermitted = (?:texture\(uPurpleTrueMask, vUv\)\.r|purplePathMask\(vUv\));/);
  assert.match(shader, /float purpleIntensity = purplePermitted \* uChannelEnable\.b/);
  assert.doesNotMatch(shader, /float purpleIntensity = emissive\.b \* data\.a/);
});

test('production and diagnostic purple share the proven counter-clockwise transport', () => {
  const uses = shader.match(/purpleCyanClonePackets\((?:data\.r|purplePhase), timeValue\)/g) ?? [];
  assert.ok(uses.length >= 2, 'diagnostic and production must share the approved transport');
  assert.match(shader, /R5\.5(?:\.[123])? (?:production promotion|containment correction|uses a dedicated purple phase texture|micro-bridge containment mask)/);
});

test('normal engine identifies R5.5 production purple geometry', () => {
  assert.match(engine, /production-purple-r5\.5(?:\.[123])?/);
});
