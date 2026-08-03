import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sha = async (relative) => createHash('sha256')
  .update(await readFile(path.join(root, relative))).digest('hex');
assert.equal(await sha('public/images/master/MASTER.png'),
  '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c');
assert.ok((await stat(path.join(root,
  'public/images/master/derived/border-frame/proofs/static-4k/purple-lower-center-boundary-r5.4.2.png'))).isFile());

const manifest = JSON.parse(await readFile(
  path.join(root, 'public/images/master/derived/border-frame/purple-mask-r5.4.json'), 'utf8'));
assert.equal(manifest.revision, '5.4.2');
assert.equal(manifest.nameplateOcclusion.liveMaskPixelsInsideFace, 0);
assert.equal(manifest.nameplateOcclusion.upperCrownBranchesPreserved, true);
assert.equal(manifest.nameplateOcclusion.leftPlacardAdjacentThreadsPreserved, true);
assert.equal(manifest.nameplateOcclusion.rightPlacardAdjacentThreadsPreserved, true);
assert.equal(manifest.cleanup.remainingDisconnectedLowerCenterIslands, 0);

const proofLayer = await readFile(
  path.join(root, 'src/components/scene/debug/BorderFrameProofLayer.jsx'), 'utf8');
assert.match(proofLayer, /canonical: 'boundary'/);
assert.match(proofLayer, /NAMEPLATE_FACE_POLYGON/);
assert.match(proofLayer, /R5\.5 TRIM-ANCHORED BOUNDARY/);

console.log('R5.4.2 precise-occlusion safeguards passed under R5.5.');
