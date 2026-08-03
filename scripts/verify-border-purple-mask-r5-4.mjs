import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const sha = async (relative) => createHash('sha256')
  .update(await readFile(path.join(root, relative)))
  .digest('hex');

const immutableCyan = Object.freeze({
  'public/images/master/MASTER.png': '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c',
  'public/images/master/derived/border-frame/source/border-cyan-emissive.png': '31f562f7dc9136fdfbc0a8e563ba55a1c5896a6e370948d45e4807c6272c3337',
  'public/images/master/derived/border-frame/source/border-flow-phase.png': '8413b3e5c32a8eeb0fb8d824d91ab171dc7470970f3a67083c0f230fddafc195',
});
for (const [relative, expected] of Object.entries(immutableCyan)) {
  assert.equal(await sha(relative), expected, `Approved cyan control changed: ${relative}`);
}

const required = [
  'public/images/master/derived/border-frame/source/border-purple-emissive-r5.4.png',
  'public/images/master/derived/border-frame/runtime/1080/purple-true-mask-r5.4.png',
  'public/images/master/derived/border-frame/runtime/1440/purple-true-mask-r5.4.png',
  'public/images/master/derived/border-frame/runtime/2160/purple-true-mask-r5.4.png',
  'public/images/master/derived/border-frame/proofs/static-4k/purple-true-mask-4k.png',
  'public/images/master/derived/border-frame/proofs/static-4k/purple-lower-center-boundary-4k.png',
  'public/images/master/derived/border-frame/proofs/static-4k/purple-lower-center-focus-4k.png',
  'public/images/master/derived/border-frame/purple-mask-r5.4.json',
  'src/components/scene/engines/border/borderFrameAssets.js',
  'src/components/scene/engines/border/BorderFrameRenderer.js',
  'src/components/scene/engines/border/borderFrameShaders.js',
  'src/components/scene/engines/BorderFrameEngine.js',
  'src/components/scene/debug/BorderFrameProofLayer.jsx',
];
for (const relative of required) {
  const metadata = await stat(path.join(root, relative));
  assert.ok(metadata.isFile() && metadata.size > 0, `Missing R5.4 file: ${relative}`);
}

const manifest = JSON.parse(await readFile(
  path.join(root, 'public/images/master/derived/border-frame/purple-mask-r5.4.json'),
  'utf8',
));
assert.equal(manifest.schemaVersion, '5.4.0');
assert.equal(manifest.direction, 'counter-clockwise');
assert.match(manifest.phaseSource, /approved cyan phase/i);
assert.ok(manifest.pixelCount > 250000, 'True purple mask is unexpectedly sparse.');
assert.ok(manifest.regions.top > 3000, 'Top purple route coverage is missing.');
assert.ok(manifest.regions.bottom > 200000, 'Bottom purple route coverage is missing.');
assert.ok(manifest.regions.left > 10000, 'Left purple route coverage is missing.');
assert.ok(manifest.regions.right > 10000, 'Right purple route coverage is missing.');
assert.ok(manifest.regions.lowerCenter > 200000, 'Lower-center circuit extensions are missing.');

for (const asset of manifest.assets) {
  assert.equal(await sha(asset.path), asset.sha256, `R5.4 asset checksum mismatch: ${asset.path}`);
}

const engine = await readFile(path.join(root, 'src/components/scene/engines/BorderFrameEngine.js'), 'utf8');
const renderer = await readFile(path.join(root, 'src/components/scene/engines/border/BorderFrameRenderer.js'), 'utf8');
const shader = await readFile(path.join(root, 'src/components/scene/engines/border/borderFrameShaders.js'), 'utf8');
const assets = await readFile(path.join(root, 'src/components/scene/engines/border/borderFrameAssets.js'), 'utf8');
const proofLayer = await readFile(path.join(root, 'src/components/scene/debug/BorderFrameProofLayer.jsx'), 'utf8');

for (const token of [
  "'purple-mask-cyan-phase': 3",
  "'purple-mask-tracer': 4",
  "'purple-true-mask': 5",
  "'purple-lower-center-boundary': 6",
  "'purple-lower-center-focus': 7",
  'physical-face-excluded-lower-center-circuit-active',
]) assert.ok(engine.includes(token), `Engine missing ${token}`);

assert.ok(assets.includes('purpleTrueMask:'), 'Asset registry missing purpleTrueMask');
assert.match(assets, /purple-border-production-r5\.5\.(?:2|3)\.png/,
  'Asset registry missing approved R5.5.2/R5.5.3 purple production mask');

for (const token of [
  'uPurpleTrueMask',
  'uPurplePhase',
  'purpleTrueMaskTexture',
  'purplePhaseTexture',
  'gl.TEXTURE3',
  'gl.TEXTURE4',
]) assert.ok(renderer.includes(token), `Renderer missing ${token}`);

for (const token of [
  'uniform sampler2D uPurpleTrueMask;',
  'if (uDiagnosticMode == 3)',
  'if (uDiagnosticMode == 4)',
  'float purplePathMask(vec2 uv)',
  'texture(uPurpleTrueMask, uv).r',
  'float flow = purpleCyanClonePackets(purplePhase, timeValue);',
  'vec2 tracer = purpleCyanTracer(purplePhase, timeValue);',
]) assert.ok(shader.includes(token), `Shader missing ${token}`);
assert.ok(!/texture\(uPurpleTrueMask, vUv\)\.r\s*\*\s*data\.a/.test(shader),
  'True purple mask is still suppressed by the legacy placard occlusion atlas.');

for (const token of [
  "'purple-true-mask'",
  "'purple-lower-center-boundary'",
  "'purple-lower-center-focus'",
]) assert.ok(proofLayer.includes(token), `Proof layer missing ${token}`);

console.log('R5.4 true-purple mask parity verification passed.');
console.log('Approved cyan immutable files: 4/4 checksum-identical.');
console.log(`True-purple pixels: ${manifest.pixelCount}`);
console.log(`Lower-center circuit-extension pixels: ${manifest.regions.lowerCenter}`);
console.log('Live phase source: approved cyan phase; direction: counter-clockwise.');
