import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(path, 'utf8');
const digest = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');

const protectedFiles = new Map([
  ['public/images/master/MASTER.png', '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c'],
  ['src/hooks/useSceneEngine.js', '271210ca708defc6e97636db48407ba2f8bb22d260d408f0d9fde3d2976e9e29'],
  ['src/components/scene/engines/BorderFrameEngine.js', 'fd3aec264ad3bcb10ce84897a929b06a7fdf7b4b76fee1b5ef31643b72592429'],
]);

for (const [path, expected] of protectedFiles) {
  assert.equal(await digest(path), expected, `${path} protection checksum`);
}

const scene = await read('src/components/scene/Scene.jsx');
const layer = await read('src/components/scene/debug/TabletMaximumApertureProofLayer.jsx');
const css = await read('src/styles/global.css');
const packageJson = JSON.parse(await read('package.json'));

assert.match(scene, /useSceneEngine\s*\(/, 'normal SceneEngine lifecycle remains mounted');
assert.match(scene, /readTabletA21RProofConfig/, 'live/static proof configuration is mounted');
assert.match(layer, /qcq-tablet-a21r-live/, 'live query parameter is supported');
assert.match(layer, /!isLive\s*&&\s*\(/, 'replacement MASTER is omitted in live mode');
assert.match(layer, /pointer|registered animations remain active/i, 'live-state declaration is visible');
assert.match(css, /data-presentation='live'[\s\S]*background:\s*transparent/, 'live overlay is transparent');
assert.match(css, /pointer-events:\s*none/, 'proof overlay cannot intercept controls');
assert.doesNotMatch(css, /data-tablet-a21r-presentation='live'[\s\S]*animation-play-state:\s*paused/, 'live mode never pauses CSS animation');
assert.equal(packageJson.scripts['dev:tablet-live'], 'vite --host 127.0.0.1');
assert.ok(packageJson.scripts.build.includes('verify:tablet-a21r-live'));

console.log('A2.1R LIVE ANIMATED PREVIEW VERIFICATION: PASSED');
console.log('MASTER: UNCHANGED');
console.log('useSceneEngine: UNCHANGED');
console.log('BorderFrameEngine R5.5.3: UNCHANGED');
console.log('Live proof overlay: TRANSPARENT / POINTER-PASS-THROUGH');
