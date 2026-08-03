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

const interactionBaseline = {
  'src/components/scene/placard/PlacardControl.jsx': new Set([
    '3c0b4a0009b84abf4510927cc525c65826bfd5cb3bf5f7b091fed5ace1af4b06',
    'b6792a06c2eda132ae68ae2897b0691eb191f993739d283ab350a17928447223',
    'a6610df2977fdfe745d5bbab7e5270087db49d813659256acc2ac4619766a9e9',
  ]),
  'src/components/scene/placard/placardGeometry.js': '599925c29b91a2e8c513ba6e83131896d4574c94e8bf63cee5b15ef2357893ef',
  'src/components/quiz/QuizInterface.jsx': 'e10221c2c482bfec4e7022d2e357fe8bc9f459a8fb5db7dd8a02b0ec442f74b0',
  'src/components/profile/ProfileCardSurface.jsx': '9834dfa397aa447e43d6cce7473314db6f826df2c4cf169ef4f034c5f2f0a778',
};
for (const [relative, expected] of Object.entries(interactionBaseline)) {
  const actual = await sha(relative);
  if (expected instanceof Set) {
    assert.ok(expected.has(actual), `Independent placard interaction changed: ${relative}`);
  } else {
    assert.equal(actual, expected, `Independent placard interaction changed: ${relative}`);
  }
}

const containmentAssets = {
  'public/images/master/derived/border-frame/source/purple-border-production-r5.5.1.png':
    '9340556f7925cb7851cc14510f0940508469ceb84294489ea72deae2511355fb',
  'public/images/master/derived/border-frame/runtime/1080/purple-border-production-r5.5.1.png':
    'e8c77fae9eeffb5d8096ddb03f63130c7881a172330c63873e052bc0b0c4c2a5',
  'public/images/master/derived/border-frame/runtime/1440/purple-border-production-r5.5.1.png':
    '434a74f25b2cdf096378d7398516beb7d1d490e65dfc5396bcdca421600b3609',
  'public/images/master/derived/border-frame/runtime/2160/purple-border-production-r5.5.1.png':
    '9340556f7925cb7851cc14510f0940508469ceb84294489ea72deae2511355fb',
  'public/images/master/derived/border-frame/proofs/static-4k/placard-circuit-registration-r5.5.1.png':
    '5e7b0bc797e5f40ea4623dd43482e07847364b8deebf34d2046e85aa2a4ed8a3',
  'public/images/master/derived/border-frame/proofs/static-4k/placard-circuit-isolated-r5.5.1.png':
    'beda479437d0cdab2a6139b6d073212a3a51d797bbaa014097861a6887b1c202',
  'public/images/master/derived/border-frame/placard-circuit-containment-r5.5.1.json':
    'da2b6569d712bdd4cddf307b1f16eb683cc8d365699e17dc2ecbb3ecfb76ce3e',
};
for (const [relative, expected] of Object.entries(containmentAssets)) {
  assert.equal(await sha(relative), expected, `R5.5.1 asset changed: ${relative}`);
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
    const data = buffer.subarray(offset, offset + length); offset += length;
    offset += 4; // CRC
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assert.equal(data[8], 8, 'PNG must be 8-bit');
      assert.equal(data[9], 6, 'PNG must be RGBA');
      assert.equal(data[12], 0, 'PNG must be non-interlaced');
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }
  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = width * bpp;
  const pixels = Buffer.alloc(stride * height);
  let source = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[source]; source += 1;
    const row = y * stride;
    const prior = row - stride;
    for (let x = 0; x < stride; x += 1) {
      const value = raw[source]; source += 1;
      const left = x >= bpp ? pixels[row + x - bpp] : 0;
      const up = y > 0 ? pixels[prior + x] : 0;
      const upperLeft = y > 0 && x >= bpp ? pixels[prior + x - bpp] : 0;
      let reconstructed;
      if (filter === 0) reconstructed = value;
      else if (filter === 1) reconstructed = value + left;
      else if (filter === 2) reconstructed = value + up;
      else if (filter === 3) reconstructed = value + Math.floor((left + up) / 2);
      else if (filter === 4) reconstructed = value + paeth(left, up, upperLeft);
      else throw new Error(`Unsupported PNG filter ${filter}`);
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
  'public/images/master/derived/border-frame/placard-circuit-containment-r5.5.1.json'));
assert.equal(manifest.revision, '5.5.1');
assert.equal(manifest.runtime.normalAndDiagnosticsShareMask, true);
assert.equal(manifest.runtime.allPurpleTermsHardClipped, true);
assert.deepEqual(manifest.runtime.defaultChannels, ['cyan', 'orange', 'purple']);
assert.equal(manifest.animationAuthority.pathSource,
  'purple pixels traced directly from immutable MASTER.png');

const decoded = decodeRgbaPng(await read(
  'public/images/master/derived/border-frame/source/purple-border-production-r5.5.1.png'));
assert.equal(decoded.width, 3840);
assert.equal(decoded.height, 2160);

const isActive = (x, y) => decoded.pixels[(y * decoded.width + x) * 4] > 0;
let total = 0;
let faceActive = 0;
let physicalActive = 0;
let ringStarActive = 0;
for (let y = 0; y < decoded.height; y += 1) {
  for (let x = 0; x < decoded.width; x += 1) {
    if (!isActive(x, y)) continue;
    total += 1;
    if (insidePolygon(x + 0.5, y + 0.5, manifest.physicalFacePolygon)) faceActive += 1;
    if (insidePolygon(x + 0.5, y + 0.5, manifest.physicalPlacardPolygon)) physicalActive += 1;
    const rect = manifest.ringStarProtectionRect;
    if (x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height) {
      ringStarActive += 1;
    }
  }
}
assert.equal(total, manifest.metrics.totalActivePixels);
assert.equal(faceActive, 0, 'Placard face contains active purple pixels');
assert.equal(ringStarActive, 0, 'Ring/Star/altar protection zone contains active purple pixels');
assert.ok(physicalActive > 40000, 'Original placard frame was not restored');

const countRect = (x0, y0, x1, y1) => {
  let count = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) if (isActive(x, y)) count += 1;
  }
  return count;
};
assert.ok(countRect(1380, 1930, 2481, 1992) > 50000, 'Top placard circuit path missing');
assert.ok(countRect(1380, 2108, 2481, 2160) > 30000, 'Bottom placard circuit path missing');
assert.ok(countRect(1380, 1930, 1461, 2159) > 3000, 'Left placard circuit path missing');
assert.ok(countRect(2378, 1930, 2481, 2159) > 9000, 'Right placard circuit path missing');

assert.equal(resolveBorderFrameChannelMode(undefined), 'all');
assert.deepEqual(BORDER_FRAME_CHANNEL_MODES.all, [1, 1, 1]);

const assets = await readText('src/components/scene/engines/border/borderFrameAssets.js');
const shader = await readText('src/components/scene/engines/border/borderFrameShaders.js');
const engine = await readText('src/components/scene/engines/BorderFrameEngine.js');
const proof = await readText('src/components/scene/debug/BorderFrameProofLayer.jsx');

const placardControl = await readText('src/components/scene/placard/PlacardControl.jsx');
if (placardControl.includes('const illuminated = hovered || focused;')) {
  assert.doesNotMatch(placardControl, /const illuminated = active \|\| hovered \|\| focused;/);
} else {
  assert.doesNotMatch(placardControl, /<svg|<polyline|qcq-placard-trim-overlay|data-illuminated/);
  assert.match(placardControl, /SceneEvents\.PLACARD_HOVER_ENTER/);
  assert.match(placardControl, /SceneEvents\.PLACARD_FOCUS_ENTER/);
}

assert.match(assets, /purple-border-production-r5\.5\.(?:1|2|3)\.png/);
assert.doesNotMatch(assets, /purple-border-production-r5\.5\.png/);
assert.match(shader, /float purplePathMask\(vec2 uv\)/);
assert.match(shader, /smoothstep\(0\.080, 0\.220, sampled\)/);
assert.match(shader, /float purplePermitted = purplePathMask\(vUv\);/);
assert.match(shader, /float purpleIntensity = purplePermitted \* uChannelEnable\.b/);
assert.doesNotMatch(shader, /float purpleIntensity = emissive\.b \* data\.a/);
assert.ok((shader.match(/purplePathMask\(vUv\)/g) ?? []).length >= 3,
  'Production and diagnostic paths must share the hard containment function');
assert.match(engine, /production-purple-r5\.5\.(?:1|2|3)/);
assert.match(proof, /placard-circuit-registration-r5\.5\.1\.png/);
assert.match(proof, /placard-circuit-isolated-r5\.5\.1\.png/);

console.log('R5.5.1 placard-circuit containment verification passed.');
console.log(`Total active purple pixels: ${total}`);
console.log(`Restored physical placard-frame pixels: ${physicalActive}`);
console.log(`Placard face active pixels: ${faceActive}`);
console.log(`Ring/Star/altar protection active pixels: ${ringStarActive}`);
console.log('Normal production and diagnostics share the hard-clipped R5.5.1 mask.');
console.log('Independent placard business-card interaction: checksum-preserved.');
