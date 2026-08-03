import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sha = async (relative) => createHash('sha256')
  .update(await readFile(path.join(root, relative))).digest('hex');
for (const [relative, expected] of Object.entries({
  'public/images/master/MASTER.png': '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c',
  'public/images/master/derived/border-frame/source/border-cyan-emissive.png': '31f562f7dc9136fdfbc0a8e563ba55a1c5896a6e370948d45e4807c6272c3337',
  'public/images/master/derived/border-frame/source/border-flow-phase.png': '8413b3e5c32a8eeb0fb8d824d91ab171dc7470970f3a67083c0f230fddafc195',
})) assert.equal(await sha(relative), expected, `Protected asset changed: ${relative}`);

const legacyProof = 'public/images/master/derived/border-frame/proofs/static-4k/purple-lower-center-boundary-r5.4.1.png';
assert.ok((await stat(path.join(root, legacyProof))).isFile());
const manifest = JSON.parse(await readFile(
  path.join(root, 'public/images/master/derived/border-frame/purple-mask-r5.4.json'), 'utf8'));
assert.equal(manifest.schemaVersion, '5.4.0');
assert.equal(manifest.cleanup.remainingDisconnectedLowerCenterIslands, 0);
assert.ok(manifest.cleanup.removedDisconnectedPixels > 10000);
assert.ok(manifest.regions.lowerCenter > 215000);

const proofLayer = await readFile(
  path.join(root, 'src/components/scene/debug/BorderFrameProofLayer.jsx'), 'utf8');
assert.match(proofLayer, /canonical: 'boundary'/);
assert.match(proofLayer, /R5\.5 TRIM-ANCHORED BOUNDARY/);

console.log('R5.4.1 historical boundary safeguards passed under R5.5.');
