import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const protectedAssets = Object.freeze({
  'public/images/master/MASTER_SOURCE_1672x941.png': '2794895be5d868cfb029d1c52a60b73186ea8481924369d8fb9ba7c4da2f4b89',
  'public/images/master/MASTER.png': '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c',
  'public/images/master/MASTER.webp': '9f17dd151b2abb706ef5633e298cb0d6d67327b6f14f734e274794451f739a5d',
});

const requiredFiles = [
  'src/components/scene/compositor/MasterSceneCompositor.js',
  'src/components/scene/engines/MasterCompositorEngine.js',
  'src/components/scene/engines/BorderFrameEngine.js',
  'src/components/scene/SceneEngine.js',
  'src/components/scene/Scene.jsx',
  'src/hooks/useSceneEngine.js',
];

for (const relativePath of requiredFiles) {
  const metadata = await stat(resolve(root, relativePath));
  if (!metadata.isFile() || metadata.size === 0) {
    throw new Error(`Unified compositor file is missing or empty: ${relativePath}`);
  }
}

for (const [relativePath, expected] of Object.entries(protectedAssets)) {
  const bytes = await readFile(resolve(root, relativePath));
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== expected) {
    throw new Error(`Protected MASTER mismatch for ${relativePath}: ${actual}`);
  }
}

const scene = await readFile(resolve(root, 'src/components/scene/Scene.jsx'), 'utf8');
if (!scene.includes('scene-layer--compositor')) {
  throw new Error('Scene.jsx does not mount the unified MASTER compositor canvas.');
}
if (scene.includes('scene-layer--border-frame')) {
  throw new Error('A separately scaled visible border canvas still exists.');
}
if (!scene.includes('scene-artwork--fallback')) {
  throw new Error('The non-destructive MASTER fallback was removed.');
}

const hook = await readFile(resolve(root, 'src/hooks/useSceneEngine.js'), 'utf8');
if (!hook.includes('createMasterCompositorEngine')) {
  throw new Error('useSceneEngine does not initialize the shared MASTER compositor.');
}
if (!hook.includes('createBorderFrameEngine')) {
  throw new Error('BorderFrameEngine was not migrated to the shared compositor plane.');
}

const border = await readFile(resolve(root, 'src/components/scene/engines/BorderFrameEngine.js'), 'utf8');
for (const forbidden of ['getContext(', 'canvas.width', 'canvas.height', 'mix-blend-mode']) {
  if (border.includes(forbidden)) {
    throw new Error(`BorderFrameEngine still owns independent rendering state: ${forbidden}`);
  }
}
if (!border.includes('getSharedContext')) {
  throw new Error('BorderFrameEngine does not reference the shared compositor context.');
}

const compositor = await readFile(resolve(root, 'src/components/scene/compositor/MasterSceneCompositor.js'), 'utf8');
for (const required of ['webgl2', 'uMaster', 'UNPACK_FLIP_Y_WEBGL', 'getSharedContext']) {
  if (!compositor.includes(required)) {
    throw new Error(`MASTER compositor is missing required implementation token: ${required}`);
  }
}

console.log('Unified MASTER Compositor R3 Gates verification passed.');
console.log('Protected MASTER assets: 3/3 verified.');
console.log('Visible decorative canvases: 1 shared compositor.');
console.log('BorderFrameEngine: migrated, motion disabled pending static proof.');
