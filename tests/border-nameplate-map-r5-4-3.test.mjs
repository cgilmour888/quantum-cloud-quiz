import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  LOWER_CENTER_FOCUS_VIEWBOX,
  MASTER_PLANE,
  PLACARD_PROOF_GEOMETRY,
} from '../src/components/scene/debug/borderFrameProofGeometry.js';

const mapping = JSON.parse(await readFile(
  new URL('../public/images/master/derived/border-frame/placard-trim-mapping-r5.5.json', import.meta.url),
  'utf8',
));
const proofLayer = await readFile(
  new URL('../src/components/scene/debug/BorderFrameProofLayer.jsx', import.meta.url),
  'utf8',
);

test('R5.5 focus viewport follows the traced placard rather than the stage midpoint', () => {
  assert.equal(MASTER_PLANE.centerX, 1920);
  assert.equal(LOWER_CENTER_FOCUS_VIEWBOX.centerX, 1930);
  assert.notEqual(LOWER_CENTER_FOCUS_VIEWBOX.centerX, MASTER_PLANE.centerX);
  assert.equal(mapping.stageCenterUsedForPlacardGeometry, false);
  assert.equal(mapping.textCenterUsedForGeometry, false);
});

test('focus viewport contains the complete physical placard and lower trim', () => {
  const bounds = PLACARD_PROOF_GEOMETRY.physicalBounds;
  assert.ok(LOWER_CENTER_FOCUS_VIEWBOX.x <= bounds.x);
  assert.ok(LOWER_CENTER_FOCUS_VIEWBOX.y <= bounds.y);
  assert.ok(LOWER_CENTER_FOCUS_VIEWBOX.x + LOWER_CENTER_FOCUS_VIEWBOX.width >= bounds.right);
  assert.ok(LOWER_CENTER_FOCUS_VIEWBOX.y + LOWER_CENTER_FOCUS_VIEWBOX.height >= bounds.bottom);
  assert.ok(PLACARD_PROOF_GEOMETRY.trimPath.length > 40);
});

test('focus and registration views sample the production purple mask in canonical coordinates', () => {
  assert.match(proofLayer, /BORDER_PROOF_ASSETS\.purpleMask/);
  assert.match(proofLayer, /maskUnits="userSpaceOnUse"/);
  assert.match(proofLayer, /data-placard-authority="lower-most-purple-trim"/);
  assert.match(proofLayer, /data-stage-center-used="false"/);
  assert.match(proofLayer, /data-text-center-used="false"/);
});

test('legacy separately rasterized focus proof remains inert', () => {
  assert.doesNotMatch(proofLayer, /purple-lower-center-focus-4k\.png/);
});

test('trim registration proof exposes the physical hit zone and traced lower trim', () => {
  assert.match(proofLayer, /data-proof-role="placard-hit-zone"/);
  assert.match(proofLayer, /data-proof-role="lower-purple-trim-authority"/);
  assert.equal(mapping.authority,
    'lower-most continuous purple trim physically outlining the placard');
});
