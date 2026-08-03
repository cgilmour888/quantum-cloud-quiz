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

test('R5.4.1 removes disconnected purple islands without changing live equations', () => {
  assert.ok(['5.4.1', '5.4.2'].includes(manifest.revision));
  assert.equal(manifest.cleanup.liveAnimationEquationsChanged, false);
  assert.ok(manifest.cleanup.removedDisconnectedPixels > 10000);
  assert.ok(manifest.regions.lowerCenter > 215000);
});

test('boundary proof paints a dedicated red physical-face classification', () => {
  assert.equal(manifest.boundaryProof.physicalNameplateFace, 'solid red with white outline');
  assert.ok(manifest.boundaryProof.redPixelCount > 100000);
});

test('boundary proof uses either the approved legacy raster or canonical R5.4.3 mapping', () => {
  assert.ok(
    /purple-lower-center-boundary-r5\.4\.[12]\.png/.test(proofLayer)
      || /canonical: 'boundary'/.test(proofLayer),
  );
  assert.equal(manifest.boundaryProof.cacheBusted, true);
});
