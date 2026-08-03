import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(
  new URL('../public/images/master/derived/border-frame/placard-circuit-containment-r5.5.1.json', import.meta.url),
  'utf8',
));
const assets = await readFile(
  new URL('../src/components/scene/engines/border/borderFrameAssets.js', import.meta.url),
  'utf8',
);
const shader = await readFile(
  new URL('../src/components/scene/engines/border/borderFrameShaders.js', import.meta.url),
  'utf8',
);
const engine = await readFile(
  new URL('../src/components/scene/engines/BorderFrameEngine.js', import.meta.url),
  'utf8',
);
const proof = await readFile(
  new URL('../src/components/scene/debug/BorderFrameProofLayer.jsx', import.meta.url),
  'utf8',
);

test('R5.5.1 restores all four original placard-adjacent circuit zones', () => {
  assert.ok(manifest.metrics.top > 50000);
  assert.ok(manifest.metrics.bottom > 30000);
  assert.ok(manifest.metrics.left > 3000);
  assert.ok(manifest.metrics.right > 9000);
  assert.ok(manifest.metrics.addedPlacardFramePixels > 100000);
});

test('R5.5.1 hard-protects the placard face and ring/star/altar background', () => {
  assert.equal(manifest.metrics.innerFaceActivePixels, 0);
  assert.equal(manifest.metrics.ringStarProtectionActivePixels, 0);
  assert.equal(manifest.runtime.allPurpleTermsHardClipped, true);
});

test('normal production and diagnostics share the corrected mask', () => {
  assert.match(assets, /purple-border-production-r5\.5\.(?:1|2|3)\.png/);
  assert.doesNotMatch(assets, /purple-border-production-r5\.5\.png/);
  assert.match(shader, /float purplePathMask\(vec2 uv\)/);
  assert.ok((shader.match(/purplePathMask\(vUv\)/g) ?? []).length >= 3);
  assert.match(engine, /production-purple-r5\.5\.(?:1|2|3)/);
});

test('containment proof routes are cache-busted and explicit', () => {
  assert.match(proof, /'placard-circuit-containment'/);
  assert.match(proof, /placard-circuit-registration-r5\.5\.1\.png/);
  assert.match(proof, /'placard-circuit-isolated'/);
  assert.match(proof, /placard-circuit-isolated-r5\.5\.1\.png/);
});
