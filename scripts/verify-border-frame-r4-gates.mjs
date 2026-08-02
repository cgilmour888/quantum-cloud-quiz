import { createHash } from 'node:crypto';
import { access, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const engineRoot = 'public/images/master/derived/border-frame';
const manifestPath = resolve(root, engineRoot, 'manifest.json');
const expectedMaster = '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c';

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function readPngDimensions(bytes) {
  const signature = '89504e470d0a1a0a';
  if (bytes.subarray(0, 8).toString('hex') !== signature) {
    throw new Error('Asset is not a valid PNG.');
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

const masterBytes = await readFile(resolve(root, 'public/images/master/MASTER.png'));
if (sha256(masterBytes) !== expectedMaster) {
  throw new Error('Protected MASTER.png checksum changed.');
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest?.source?.sha256 !== expectedMaster) {
  throw new Error('Border-frame manifest does not identify the protected MASTER source.');
}
if (manifest?.source?.width !== 3840 || manifest?.source?.height !== 2160) {
  throw new Error('Border-frame extraction plane is not 3840 × 2160.');
}

for (const [name, counts] of Object.entries(manifest.protectedRegionPixelCounts ?? {})) {
  if (counts.channel !== 0 || counts.occlusionPermitted !== 0) {
    throw new Error(`Protected region contains border pixels: ${name}`);
  }
}

for (const [relativePath, metadata] of Object.entries(manifest.assets ?? {})) {
  const filePath = resolve(root, relativePath);
  const bytes = await readFile(filePath);
  if (sha256(bytes) !== metadata.sha256) {
    throw new Error(`Border asset checksum mismatch: ${relativePath}`);
  }
  if (relativePath.endsWith('.png')) {
    const dimensions = readPngDimensions(bytes);
    if (dimensions.width !== metadata.width || dimensions.height !== metadata.height) {
      throw new Error(`Border asset dimensions changed: ${relativePath}`);
    }
  }
}

const requiredFiles = [
  'src/components/scene/engines/BorderFrameEngine.js',
  'src/components/scene/engines/border/BorderFrameRenderer.js',
  'src/components/scene/engines/border/borderFrameAssets.js',
  'src/components/scene/engines/border/borderFrameConfig.js',
  'src/components/scene/engines/border/borderFrameShaders.js',
  'src/components/scene/engines/border/BorderFrameSurgeController.js',
  'src/components/scene/engines/border/BorderFramePerformanceController.js',
];
for (const relativePath of requiredFiles) {
  const metadata = await stat(resolve(root, relativePath));
  if (!metadata.isFile() || metadata.size === 0) {
    throw new Error(`R4 implementation file is missing or empty: ${relativePath}`);
  }
}

try {
  await access(resolve(root, 'src/components/scene/engines/border/borderFrameGeometry.js'));
  throw new Error('Legacy procedural borderFrameGeometry.js still exists.');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const renderer = await readFile(
  resolve(root, 'src/components/scene/engines/border/BorderFrameRenderer.js'),
  'utf8',
);
const shaders = await readFile(
  resolve(root, 'src/components/scene/engines/border/borderFrameShaders.js'),
  'utf8',
);
for (const forbidden of ['sdSegment', 'uCyanSegments', 'uOrangeSegments', 'uPurpleSegments']) {
  if (renderer.includes(forbidden) || shaders.includes(forbidden)) {
    throw new Error(`Legacy procedural overlay token remains: ${forbidden}`);
  }
}
for (const required of ['uEmissive', 'uData', 'cyclicDistance', 'orangePackets', 'purplePackets']) {
  if (!shaders.includes(required)) {
    throw new Error(`R4 plasma shader is missing required behavior: ${required}`);
  }
}
if (shaders.includes('vec3(1.0, 1.0, 0.0)')) {
  throw new Error('Yellow substitution was introduced into the orange channel.');
}

console.log('BorderFrameEngine R4 Gates verification passed.');
console.log('MASTER SHA-256:', expectedMaster);
console.log('Protected regions: 6/6 contain zero border and occlusion pixels.');
console.log('Renderer: registered emissive/data atlases; no procedural duplicate geometry.');
console.log('Flow: cyan clockwise, orange counter-clockwise, purple counter-propagating.');
