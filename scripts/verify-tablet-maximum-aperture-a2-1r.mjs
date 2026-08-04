import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  TABLET_A21R_AREA_REPORT,
  TABLET_CANONICAL_ASSET_ZONES,
  TABLET_HARD_CLIP_POLYGON,
  TABLET_MAXIMUM_APERTURE_POLYGON,
  TABLET_VISIBLE_INNER_EDGE_POLYGON,
  masterToTabletLocal,
  polygonContainsPolygon,
  tabletLocalToMaster,
} from '../src/components/quiz/tabletMaximumApertureGeometry.js';

const expected = new Map([
  ['public/images/master/MASTER.png', '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c'],
  ['src/components/scene/engines/BorderFrameEngine.js', 'fd3aec264ad3bcb10ce84897a929b06a7fdf7b4b76fee1b5ef31643b72592429'],
  ['src/components/scene/engines/border/BorderFrameRenderer.js', '66f2346fbd3cfd62a227a5a0016e57f8b3cd1cffe2b72e0c0d1ac41bb9880172'],
  ['src/components/scene/engines/border/borderFrameConfig.js', 'f2e1ed8271549d86c73b1e77c39f1baba98a561971cdcbf4c2c3f379737af372'],
]);

for (const [path, checksum] of expected) {
  const digest = createHash('sha256').update(await readFile(path)).digest('hex');
  assert.equal(digest, checksum, `${path} protection checksum`);
}

assert.ok(TABLET_A21R_AREA_REPORT.maximumApertureRetention >= 0.995);
assert.ok(TABLET_A21R_AREA_REPORT.hardClipRetention >= 0.99);
assert.equal(polygonContainsPolygon(TABLET_VISIBLE_INNER_EDGE_POLYGON, TABLET_MAXIMUM_APERTURE_POLYGON), true);
assert.equal(polygonContainsPolygon(TABLET_MAXIMUM_APERTURE_POLYGON, TABLET_HARD_CLIP_POLYGON), true);
assert.equal(polygonContainsPolygon(TABLET_HARD_CLIP_POLYGON, TABLET_CANONICAL_ASSET_ZONES.questionHost), true);

for (const polygon of TABLET_CANONICAL_ASSET_ZONES.nativeAnswerEnvelopes) {
  assert.equal(polygonContainsPolygon(TABLET_HARD_CLIP_POLYGON, polygon), true);
}

for (const sample of [[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0.5]]) {
  const recovered = masterToTabletLocal(tabletLocalToMaster(sample));
  assert.ok(Math.hypot(recovered[0] - sample[0], recovered[1] - sample[1]) < 1e-9);
}

console.log('A2.1R MAXIMUM-APERTURE VERIFICATION: PASSED');
console.log(`Maximum aperture retention: ${(TABLET_A21R_AREA_REPORT.maximumApertureRetention * 100).toFixed(3)}%`);
console.log(`Hard clip retention: ${(TABLET_A21R_AREA_REPORT.hardClipRetention * 100).toFixed(3)}%`);
console.log('MASTER: UNCHANGED');
console.log('BorderFrameEngine R5.5.3: UNCHANGED');
console.log('Production quiz layout: NOT REPLACED');
console.log('Animation: NOT STARTED');
