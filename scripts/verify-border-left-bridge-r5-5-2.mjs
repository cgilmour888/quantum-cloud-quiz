import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  BORDER_FRAME_CHANNEL_MODES,
  resolveBorderFrameChannelMode,
} from '../src/components/scene/engines/border/borderFrameConfig.js';

const root = process.cwd();
const filePath = (relative) => path.join(root, relative);
const read = (relative) => readFile(filePath(relative));
const readText = async (relative) => (await read(relative)).toString('utf8');
const sha = async (relative) => createHash('sha256').update(await read(relative)).digest('hex');

const protectedAssets = {
  'public/images/master/MASTER.png': '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c',
  'public/images/master/derived/border-frame/source/border-cyan-emissive.png': '31f562f7dc9136fdfbc0a8e563ba55a1c5896a6e370948d45e4807c6272c3337',
  'public/images/master/derived/border-frame/source/border-flow-phase.png': '8413b3e5c32a8eeb0fb8d824d91ab171dc7470970f3a67083c0f230fddafc195',
};
for (const [relative, expected] of Object.entries(protectedAssets)) {
  assert.equal(await sha(relative), expected, `Protected asset changed: ${relative}`);
}

const interactionAssets = {
  'src/components/scene/placard/placardGeometry.js': '599925c29b91a2e8c513ba6e83131896d4574c94e8bf63cee5b15ef2357893ef',
  'src/components/quiz/QuizInterface.jsx': 'e10221c2c482bfec4e7022d2e357fe8bc9f459a8fb5db7dd8a02b0ec442f74b0',
  'src/components/profile/ProfileCardSurface.jsx': '9834dfa397aa447e43d6cce7473314db6f826df2c4cf169ef4f034c5f2f0a778',
};
for (const [relative, expected] of Object.entries(interactionAssets)) {
  assert.equal(await sha(relative), expected, `Business-card placeholder changed: ${relative}`);
}

const revisionAssets = {
  'public/images/master/derived/border-frame/source/purple-border-production-r5.5.2.png':
    'afcf969ec7454036d2e1dd9b00a6e8fe9353ea4c0345c1dd9f86863a131c1072',
  'public/images/master/derived/border-frame/source/purple-flow-phase-r5.5.2.png':
    'f20a334e1dac7379d7a32ce25cbda97f5d1d2cbbf3759fa6623afdf37662bfc4',
  'public/images/master/derived/border-frame/runtime/1080/purple-border-production-r5.5.2.png':
    '82fc23acce96065be0c7e2928ba0f09375d1b68adac73b7607531fc70081505d',
  'public/images/master/derived/border-frame/runtime/1080/purple-flow-phase-r5.5.2.png':
    '8aeb85e0393debe69f2e19319f95641c978b44d59477e7595ecde7b884a7c56e',
  'public/images/master/derived/border-frame/runtime/1440/purple-border-production-r5.5.2.png':
    'caaa8417ba45cb13de81a17383083587282a932151aff3c63c445fb89528befe',
  'public/images/master/derived/border-frame/runtime/1440/purple-flow-phase-r5.5.2.png':
    '0dcac39ebb2e4613ef2cc527eedf85eeb6cb19be3373e2e92db05edd731d47c6',
  'public/images/master/derived/border-frame/runtime/2160/purple-border-production-r5.5.2.png':
    'afcf969ec7454036d2e1dd9b00a6e8fe9353ea4c0345c1dd9f86863a131c1072',
  'public/images/master/derived/border-frame/runtime/2160/purple-flow-phase-r5.5.2.png':
    'f20a334e1dac7379d7a32ce25cbda97f5d1d2cbbf3759fa6623afdf37662bfc4',
  'public/images/master/derived/border-frame/proofs/static-4k/placard-left-bridge-isolated-r5.5.2.png':
    'bd29ef88593c4a048b3604055255dabfc8989c471ebf261bfa9407a5a9002270',
  'public/images/master/derived/border-frame/proofs/static-4k/placard-left-bridge-registration-r5.5.2.png':
    '90336755e40ef5644d9477236279653f2d5a5210da237ebcab409979cf2d6354',
  'public/images/master/derived/border-frame/proofs/static-4k/placard-left-bridge-phase-r5.5.2.png':
    'fc1078d79253b9ba9728aae9d1f8e11919a8641f170306eb77a16a274593195a',
  'public/images/master/derived/border-frame/placard-left-bridge-r5.5.2.json':
    '8b3a8f15e2509d104420e374fb74c7840e1b398837c4664588a5845c8539b51f',
};
for (const [relative, expected] of Object.entries(revisionAssets)) {
  assert.equal(await sha(relative), expected, `R5.5.2 asset changed: ${relative}`);
  assert.ok((await stat(filePath(relative))).size > 0, `Empty asset: ${relative}`);
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

function decodeRgbaPng(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(buffer.subarray(0, 8).equals(signature), 'Invalid PNG signature');
  let offset = 8;
  let width = 0;
  let height = 0;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset); offset += 4;
    const type = buffer.toString('ascii', offset, offset + 4); offset += 4;
    const data = buffer.subarray(offset, offset + length); offset += length + 4;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assert.equal(data[8], 8);
      assert.equal(data[9], 6);
      assert.equal(data[12], 0);
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  let source = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[source]; source += 1;
    for (let x = 0; x < stride; x += 1) {
      const row = y * stride;
      const left = x >= 4 ? pixels[row + x - 4] : 0;
      const up = y > 0 ? pixels[row - stride + x] : 0;
      const upperLeft = y > 0 && x >= 4 ? pixels[row - stride + x - 4] : 0;
      const value = raw[source]; source += 1;
      let reconstructed = value;
      if (filter === 1) reconstructed += left;
      else if (filter === 2) reconstructed += up;
      else if (filter === 3) reconstructed += Math.floor((left + up) / 2);
      else if (filter === 4) reconstructed += paeth(left, up, upperLeft);
      else if (filter !== 0) throw new Error(`Unsupported PNG filter ${filter}`);
      pixels[row + x] = reconstructed & 255;
    }
  }
  return { width, height, pixels };
}

function insidePolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const crosses = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (crosses) inside = !inside;
  }
  return inside;
}

const manifest = JSON.parse(await readText(
  'public/images/master/derived/border-frame/placard-left-bridge-r5.5.2.json'));
assert.equal(manifest.revision, '5.5.2');
assert.equal(manifest.runtime.normalAndDiagnosticsShareMask, true);
assert.equal(manifest.runtime.normalAndDiagnosticsSharePhase, true);
assert.equal(manifest.runtime.activationTrimPersistentWhenCardOpen, false);
assert.equal(manifest.runtime.finiteActivationSurge, true);

const mask = decodeRgbaPng(await read(
  'public/images/master/derived/border-frame/source/purple-border-production-r5.5.2.png'));
const phase = decodeRgbaPng(await read(
  'public/images/master/derived/border-frame/source/purple-flow-phase-r5.5.2.png'));
assert.deepEqual({ width: mask.width, height: mask.height }, { width: 3840, height: 2160 });
assert.deepEqual({ width: phase.width, height: phase.height }, { width: 3840, height: 2160 });

const maskAt = (x, y) => mask.pixels[(y * mask.width + x) * 4];
const phaseAt = (x, y) => phase.pixels[(y * phase.width + x) * 4];
let total = 0;
let faceActive = 0;
let protectedActive = 0;
let bridgeActive = 0;
let bridgePhaseMin = 255;
let bridgePhaseMax = 0;
for (let y = 0; y < mask.height; y += 1) {
  for (let x = 0; x < mask.width; x += 1) {
    if (maskAt(x, y) === 0) continue;
    total += 1;
    if (insidePolygon(x + 0.5, y + 0.5, manifest.physicalFacePolygon)) faceActive += 1;
    if (x >= 1100 && x < 2740 && y >= 1530 && y < 1930) protectedActive += 1;
    if (insidePolygon(x + 0.5, y + 0.5, manifest.leftBridgePolygon)) {
      bridgeActive += 1;
      const value = phaseAt(x, y);
      bridgePhaseMin = Math.min(bridgePhaseMin, value);
      bridgePhaseMax = Math.max(bridgePhaseMax, value);
    }
  }
}
assert.equal(total, manifest.metrics.totalActivePixels);
assert.equal(faceActive, manifest.metrics.innerFaceActivePixels);
assert.equal(protectedActive, manifest.metrics.ringStarAltarActivePixels);
assert.ok(Math.abs(bridgeActive - manifest.metrics.leftBridgeActivePixels) <= 200,
  'Left bridge polygon count differs beyond boundary-raster tolerance');
assert.equal(bridgePhaseMin, manifest.metrics.leftBridgePhaseMinimum);
assert.equal(bridgePhaseMax, manifest.metrics.leftBridgePhaseMaximum);
assert.equal(faceActive, 0, 'Placard face contains active purple pixels');
assert.equal(protectedActive, 0, 'Ring/Star/altar protection region contains active purple pixels');
assert.ok(bridgeActive > 30000, 'Left bridge is unexpectedly sparse');
assert.ok(bridgePhaseMax - bridgePhaseMin >= 7, 'Left bridge phase range is too narrow');
for (let index = 1; index < manifest.metrics.phaseBinMedians.length; index += 1) {
  assert.ok(manifest.metrics.phaseBinMedians[index] <= manifest.metrics.phaseBinMedians[index - 1],
    'Dedicated purple phase is not monotonic through the left bridge');
}

const assets = await readText('src/components/scene/engines/border/borderFrameAssets.js');
const renderer = await readText('src/components/scene/engines/border/BorderFrameRenderer.js');
const shader = await readText('src/components/scene/engines/border/borderFrameShaders.js');
const engine = await readText('src/components/scene/engines/BorderFrameEngine.js');
const placard = await readText('src/components/scene/placard/PlacardControl.jsx');
const proof = await readText('src/components/scene/debug/BorderFrameProofLayer.jsx');

assert.match(assets, /purple-border-production-r5\.5\.(?:2|3)\.png/);
assert.match(assets, /purple-flow-phase-r5\.5\.(?:2|3)\.png/);
assert.match(renderer, /uPurplePhase/);
assert.match(renderer, /purplePhaseTexture/);
assert.match(shader, /uniform sampler2D uPurplePhase;/);
assert.match(shader, /float purplePhase = texture\(uPurplePhase, vUv\)\.r;/);
assert.ok((shader.match(/purpleCyanClonePackets\(purplePhase, timeValue\)/g) ?? []).length >= 2);
assert.match(shader, /purpleCyanTracer\(purplePhase, timeValue\)/);
assert.ok((shader.match(/purplePathMask\(vUv\)/g) ?? []).length >= 3);
assert.doesNotMatch(shader, /float purpleIntensity = emissive\.b \* data\.a/);
assert.match(engine, /production-purple-r5\.5\.(?:2|3)/);
assert.match(engine, /dedicated-left-(?:bridge-r5\.5\.2|microbridge-r5\.5\.3)/);
if (placard.includes('const illuminated = hovered || focused;')) {
  assert.doesNotMatch(placard, /const illuminated = active \|\| hovered \|\| focused;/);
} else {
  assert.doesNotMatch(placard, /<svg|<polyline|qcq-placard-trim-overlay|data-illuminated/);
  assert.match(placard, /SceneEvents\.PLACARD_HOVER_ENTER/);
  assert.match(placard, /SceneEvents\.PLACARD_FOCUS_ENTER/);
  assert.match(engine, /placardActivationGain = 1/);
}
assert.match(engine, /attack: 0\.06, hold: 0\.26, decay: 1\.35/);
assert.equal(resolveBorderFrameChannelMode(undefined), 'all');
assert.deepEqual(BORDER_FRAME_CHANNEL_MODES.all, [1, 1, 1]);
assert.match(proof, /placard-left-bridge-isolated-r5\.5\.2\.png/);
assert.match(proof, /placard-left-bridge-registration-r5\.5\.2\.png/);
assert.match(proof, /placard-left-bridge-phase-r5\.5\.2\.png/);

console.log('R5.5.2 left-bridge and activation-decay verification passed.');
console.log(`Total active purple pixels: ${total}`);
console.log(`Left bridge active pixels: ${bridgeActive}`);
console.log(`Left bridge phase range: ${bridgePhaseMin}-${bridgePhaseMax}`);
console.log(`Placard face active pixels: ${faceActive}`);
console.log(`Ring/Star/altar active pixels: ${protectedActive}`);
console.log('Persistent card-open trim illumination: disabled.');
console.log('Finite PLACARD_ACTIVATED surge: retained.');
