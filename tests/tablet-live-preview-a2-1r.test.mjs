import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('live tablet proof mode preserves the operating scene engine', async () => {
  const scene = await read('src/components/scene/Scene.jsx');
  assert.match(scene, /useSceneEngine\s*\(/);
  assert.match(scene, /TabletMaximumApertureProofLayer/);
  assert.doesNotMatch(scene, /pause|stop\(\)|destroy\(\)/i);
});

test('live overlay omits the replacement MASTER and is pointer-pass-through', async () => {
  const layer = await read('src/components/scene/debug/TabletMaximumApertureProofLayer.jsx');
  const css = await read('src/styles/global.css');
  assert.match(layer, /qcq-tablet-a21r-live/);
  assert.match(layer, /!isLive\s*&&\s*\(/);
  assert.match(css, /data-presentation='live'[\s\S]*background:\s*transparent/);
  assert.match(css, /pointer-events:\s*none/);
});

test('static A2.1R proof routes remain available for frozen comparison', async () => {
  const layer = await read('src/components/scene/debug/TabletMaximumApertureProofLayer.jsx');
  assert.match(layer, /qcq-tablet-a21r'/);
  assert.match(layer, /presentation\s*=\s*'static'/);
  assert.match(layer, /tablet-a21r-proof-layer__master/);
});

test('live route supports opacity and HUD controls without modifying geometry', async () => {
  const layer = await read('src/components/scene/debug/TabletMaximumApertureProofLayer.jsx');
  assert.match(layer, /qcq-tablet-opacity/);
  assert.match(layer, /qcq-tablet-hud/);
  assert.match(layer, /TABLET_MAXIMUM_APERTURE_POLYGON/);
  assert.match(layer, /TABLET_CANONICAL_ASSET_ZONES/);
});
