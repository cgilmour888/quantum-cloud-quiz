import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(
  new URL('../public/images/master/derived/border-frame/purple-mask-r5.4.json', import.meta.url),
  'utf8',
));
const proofLayer = await readFile(
  new URL('../src/components/scene/debug/BorderFrameProofLayer.jsx', import.meta.url),
  'utf8',
);

test('R5.4.2 limits occlusion to the physical inner nameplate face', () => {
  assert.equal(manifest.revision, '5.4.2');
  assert.equal(manifest.nameplateOcclusion.classification, 'inner physical nameplate face only');
  assert.equal(manifest.nameplateOcclusion.liveMaskPixelsInsideFace, 0);
  assert.ok(manifest.boundaryProof.redPixelCount < 130000);
});

test('R5.4.2 preserves upper and side purple circuitry', () => {
  assert.equal(manifest.nameplateOcclusion.upperCrownBranchesPreserved, true);
  assert.equal(manifest.nameplateOcclusion.leftPlacardAdjacentThreadsPreserved, true);
  assert.equal(manifest.nameplateOcclusion.rightPlacardAdjacentThreadsPreserved, true);
  assert.ok(manifest.regions.lowerCenter > 215000);
});

test('R5.4.2 removes only the residual face-region island', () => {
  assert.equal(manifest.cleanup.residualFaceFragmentPixelsRemoved, 44);
  assert.equal(manifest.cleanup.remainingDisconnectedLowerCenterIslands, 0);
  assert.equal(manifest.cleanup.liveAnimationEquationsChanged, false);
});

test('R5.4.2 proof route remains protected under the canonical R5.4.3 renderer', () => {
  assert.match(proofLayer, /canonical: 'boundary'/);
  assert.match(proofLayer, /R5\.5 TRIM-ANCHORED BOUNDARY/);
});
