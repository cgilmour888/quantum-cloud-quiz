import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sha = async (relative) => createHash('sha256')
  .update(await readFile(path.join(root, relative))).digest('hex');
assert.equal(await sha('public/images/master/MASTER.png'),
  '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c');

const legacy = JSON.parse(await readFile(path.join(root,
  'public/images/master/derived/border-frame/nameplate-mapping-r5.4.3.json'), 'utf8'));
assert.equal(legacy.revision, '5.4.3');
assert.equal(legacy.alignment.separateFocusRasterRetired, true);

const trim = JSON.parse(await readFile(path.join(root,
  'public/images/master/derived/border-frame/placard-trim-mapping-r5.5.json'), 'utf8'));
assert.equal(trim.revision, '5.5');
assert.equal(trim.stageCenterUsedForPlacardGeometry, false);
assert.equal(trim.textCenterUsedForGeometry, false);
assert.ok(trim.lowerTrimPath.length > 40);

const proof = await readFile(path.join(root,
  'src/components/scene/debug/BorderFrameProofLayer.jsx'), 'utf8');
assert.match(proof, /data-placard-authority="lower-most-purple-trim"/);
assert.match(proof, /maskUnits="userSpaceOnUse"/);
assert.doesNotMatch(proof, /purple-lower-center-focus-4k\.png/);

console.log('R5.4.3 canonical-plane safeguard passed with R5.5 trim authority.');
