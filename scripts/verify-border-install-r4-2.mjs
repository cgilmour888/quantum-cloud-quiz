import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const required = [
  'src/components/scene/engines/BorderFrameEngine.js',
  'src/components/scene/engines/border/borderFrameAssets.js',
  'src/components/scene/engines/border/BorderFrameRenderer.js',
  'src/components/scene/engines/border/BorderFramePerformanceController.js',
  'src/components/scene/engines/border/BorderFrameSurgeController.js',
  'src/components/scene/engines/border/borderFrameConfig.js',
  'src/components/scene/engines/border/borderFrameShaders.js',
  'src/components/scene/debug/BorderFrameProofLayer.jsx',
  'src/components/scene/compositor/MasterSceneCompositor.js',
  'src/components/scene/engines/MasterCompositorEngine.js',
  'src/components/scene/Scene.jsx',
  'src/components/scene/SceneEngine.js',
  'src/components/scene/sceneEvents.js',
  'src/components/scene/sceneGeometry.js',
  'src/hooks/useSceneEngine.js',
  'scripts/verify-border-frame-r4-gates.mjs',
  'scripts/verify-border-proof-r4-1-gates.mjs',
  'public/images/master/derived/border-frame/manifest.json',
  'public/images/master/derived/border-frame/runtime/1080/border-data-atlas.png',
  'public/images/master/derived/border-frame/runtime/1080/border-emissive-atlas.png',
  'public/images/master/derived/border-frame/runtime/1440/border-data-atlas.png',
  'public/images/master/derived/border-frame/runtime/1440/border-emissive-atlas.png',
  'public/images/master/derived/border-frame/runtime/2160/border-data-atlas.png',
  'public/images/master/derived/border-frame/runtime/2160/border-emissive-atlas.png',
  'public/images/master/derived/border-frame/proofs/static-4k/master-4k.png',
  'public/images/master/derived/border-frame/proofs/static-4k/border-overlay-4k.png',
  'public/images/master/derived/border-frame/proofs/static-4k/border-isolated-4k.png',
  'public/images/master/derived/border-frame/proofs/static-4k/border-phase-4k.png',
  'public/images/master/derived/border-frame/proofs/static-4k/border-occlusion-4k.png',
];

const missing = [];
for (const relative of required) {
  try {
    await access(path.join(root, relative));
  } catch {
    missing.push(relative);
  }
}
if (missing.length) {
  throw new Error(`R4.2 installation is incomplete. Missing:\n${missing.map((item) => ` - ${item}`).join('\n')}`);
}

const enginePath = path.join(root, 'src/components/scene/engines/BorderFrameEngine.js');
const engine = await readFile(enginePath, 'utf8');
const relativeImports = [...engine.matchAll(/from\s+['"](\.\/[^'"]+)['"]/g)].map((match) => match[1]);
for (const specifier of relativeImports) {
  const resolved = path.resolve(path.dirname(enginePath), specifier);
  try {
    await access(resolved);
  } catch {
    throw new Error(`BorderFrameEngine import cannot be resolved: ${specifier} -> ${resolved}`);
  }
}

const scene = await readFile(path.join(root, 'src/components/scene/Scene.jsx'), 'utf8');
if (!scene.includes('BorderFrameProofLayer')) {
  throw new Error('Scene.jsx is missing BorderFrameProofLayer.');
}

const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
for (const script of ['verify:border-r4', 'verify:border-proof-r4-1', 'verify:border-install-r4-2']) {
  if (!packageJson.scripts?.[script]) throw new Error(`package.json is missing ${script}.`);
}

console.log('BorderFrameEngine R4.2 complete-install verification passed.');
console.log(`Required files: ${required.length}/${required.length}.`);
console.log(`BorderFrameEngine relative imports: ${relativeImports.length}/${relativeImports.length} resolved.`);
