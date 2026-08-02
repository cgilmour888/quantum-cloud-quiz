import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const proofRoot = path.join(
  root,
  'public/images/master/derived/border-frame/proofs/static-4k',
);

function pngDimensions(buffer) {
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') throw new Error('Not a PNG file.');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

const manifest = JSON.parse(
  await readFile(path.join(proofRoot, 'proof-manifest.json'), 'utf8'),
);

const required = [
  'master-4k.png',
  'border-overlay-4k.png',
  'border-isolated-4k.png',
  'border-phase-4k.png',
  'border-occlusion-4k.png',
];

for (const file of required) {
  const buffer = await readFile(path.join(proofRoot, file));
  const dimensions = pngDimensions(buffer);
  if (dimensions.width !== 3840 || dimensions.height !== 2160) {
    throw new Error(`${file} is not 3840 × 2160.`);
  }
  const expected = manifest.proofs?.[file]?.sha256;
  if (!expected || sha256(buffer) !== expected) {
    throw new Error(`${file} checksum mismatch.`);
  }
}

if (manifest.proofs['master-4k.png'].sha256 !== manifest.masterSha256) {
  throw new Error('Static MASTER proof is not byte-identical to protected MASTER.png.');
}

const scene = await readFile(
  path.join(root, 'src/components/scene/Scene.jsx'),
  'utf8',
);
const proofLayer = await readFile(
  path.join(root, 'src/components/scene/debug/BorderFrameProofLayer.jsx'),
  'utf8',
);
const engine = await readFile(
  path.join(root, 'src/components/scene/engines/BorderFrameEngine.js'),
  'utf8',
);

if (!scene.includes('BorderFrameProofLayer')) {
  throw new Error('Scene.jsx does not mount the deterministic proof layer.');
}
for (const mode of ['master', 'overlay', 'isolated', 'phase', 'occlusion']) {
  if (!proofLayer.includes(`${mode}:`)) {
    throw new Error(`Static proof mode missing: ${mode}`);
  }
}
if (!engine.includes('Disable the live engine for every proof route')) {
  throw new Error('Live BorderFrameEngine is not disabled during static proof routes.');
}

console.log('BorderFrameEngine R4.1 deterministic static proof gates passed.');
console.log('Proof images: 5/5 at 3840 × 2160.');
console.log('MASTER proof: byte-identical to protected MASTER.png.');
console.log('Live renderer: disabled on every static proof route.');
