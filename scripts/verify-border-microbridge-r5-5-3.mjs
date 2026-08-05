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
  'public/images/master/MASTER_SOURCE_1672x941.png': '2794895be5d868cfb029d1c52a60b73186ea8481924369d8fb9ba7c4da2f4b89',
  'public/images/master/MASTER.png': '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c',
  'public/images/master/MASTER.webp': '9f17dd151b2abb706ef5633e298cb0d6d67327b6f14f734e274794451f739a5d',
  'public/images/master/derived/border-frame/source/border-cyan-emissive.png': '31f562f7dc9136fdfbc0a8e563ba55a1c5896a6e370948d45e4807c6272c3337',
  'public/images/master/derived/border-frame/source/border-flow-phase.png': '8413b3e5c32a8eeb0fb8d824d91ab171dc7470970f3a67083c0f230fddafc195',
  'src/components/scene/placard/placardGeometry.js': '599925c29b91a2e8c513ba6e83131896d4574c94e8bf63cee5b15ef2357893ef',
  'src/components/profile/ProfileCardSurface.jsx': '9834dfa397aa447e43d6cce7473314db6f826df2c4cf169ef4f034c5f2f0a778',
};
for (const [relative, expected] of Object.entries(protectedAssets)) {
  assert.equal(await sha(relative), expected, `Protected baseline changed: ${relative}`);
}


// Preserve the placard/business-card contract semantically so later tablet
// presentation phases can evolve without weakening the protected interaction.
const quizInterface = await readText('src/components/quiz/QuizInterface.jsx');
for (const invariant of [
  /import \{ PlacardControl \} from '\.\.\/scene\/placard\/PlacardControl\.jsx';/,
  /import \{ ProfileCardSurface \} from '\.\.\/profile\/ProfileCardSurface\.jsx';/,
  /SceneEvents\.BUSINESS_CARD_OPENED/,
  /SceneEvents\.BUSINESS_CARD_CLOSED/,
  /geometryAuthority:\s*'lower-purple-trim'/,
  /<PlacardControl[\s\S]*?eventTargetRef=\{eventTargetRef\}[\s\S]*?onActivate=\{openBusinessCard\}/,
  /<ProfileCardSurface[\s\S]*?eventTargetRef=\{eventTargetRef\}[\s\S]*?onClose=\{closeBusinessCard\}/,
]) {
  assert.match(quizInterface, invariant, `Independent placard semantic contract changed: ${invariant}`);
}

const requiredAssets = [
  'public/images/master/derived/border-frame/source/purple-border-production-r5.5.3.png',
  'public/images/master/derived/border-frame/source/purple-flow-phase-r5.5.3.png',
  'public/images/master/derived/border-frame/source/placard-interaction-mask-r5.5.3.png',
  'public/images/master/derived/border-frame/runtime/1080/purple-border-production-r5.5.3.png',
  'public/images/master/derived/border-frame/runtime/1080/purple-flow-phase-r5.5.3.png',
  'public/images/master/derived/border-frame/runtime/1080/placard-interaction-mask-r5.5.3.png',
  'public/images/master/derived/border-frame/runtime/1440/purple-border-production-r5.5.3.png',
  'public/images/master/derived/border-frame/runtime/1440/purple-flow-phase-r5.5.3.png',
  'public/images/master/derived/border-frame/runtime/1440/placard-interaction-mask-r5.5.3.png',
  'public/images/master/derived/border-frame/runtime/2160/purple-border-production-r5.5.3.png',
  'public/images/master/derived/border-frame/runtime/2160/purple-flow-phase-r5.5.3.png',
  'public/images/master/derived/border-frame/runtime/2160/placard-interaction-mask-r5.5.3.png',
  'public/images/master/derived/border-frame/proofs/static-4k/placard-left-microbridge-isolated-r5.5.3.png',
  'public/images/master/derived/border-frame/proofs/static-4k/placard-left-microbridge-registration-r5.5.3.png',
  'public/images/master/derived/border-frame/proofs/static-4k/placard-left-microbridge-phase-r5.5.3.png',
  'public/images/master/derived/border-frame/proofs/static-4k/placard-interaction-mask-r5.5.3.png',
  'public/images/master/derived/border-frame/placard-left-microbridge-r5.5.3.json',
];
for (const relative of requiredAssets) {
  assert.ok((await stat(filePath(relative))).size > 0, `Missing or empty R5.5.3 asset: ${relative}`);
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
  'public/images/master/derived/border-frame/placard-left-microbridge-r5.5.3.json'));
assert.equal(manifest.revision, '5.5.3');
assert.equal(manifest.runtime.normalAndDiagnosticsShareMask, true);
assert.equal(manifest.runtime.normalAndDiagnosticsSharePhase, true);
assert.equal(manifest.runtime.placardControlDrawsDecorativeTrim, false);
assert.equal(manifest.runtime.hoverFocusActivationOwnedByBorderFrameEngine, true);

const mask = decodeRgbaPng(await read(
  'public/images/master/derived/border-frame/source/purple-border-production-r5.5.3.png'));
const phase = decodeRgbaPng(await read(
  'public/images/master/derived/border-frame/source/purple-flow-phase-r5.5.3.png'));
const interaction = decodeRgbaPng(await read(
  'public/images/master/derived/border-frame/source/placard-interaction-mask-r5.5.3.png'));
for (const image of [mask, phase, interaction]) {
  assert.deepEqual({ width: image.width, height: image.height }, { width: 3840, height: 2160 });
}
const at = (image, x, y) => image.pixels[(y * image.width + x) * 4];
let total = 0;
let faceActive = 0;
let protectedActive = 0;
let microActive = 0;
let interactionActive = 0;
let interactionOutsideProduction = 0;
let phaseMin = 255;
let phaseMax = 0;
const [minX, maxX, minY, maxY] = [1215, 1512, 1898, 2159];
const localWidth = maxX - minX + 1;
const localHeight = maxY - minY + 1;
const local = new Uint8Array(localWidth * localHeight);
for (let y = 0; y < mask.height; y += 1) {
  for (let x = 0; x < mask.width; x += 1) {
    const active = at(mask, x, y) > 0;
    const interact = at(interaction, x, y) > 0;
    if (active) {
      total += 1;
      if (insidePolygon(x + 0.5, y + 0.5, manifest.physicalFacePolygon)) faceActive += 1;
      if (x >= 850 && x < 3000 && y >= 1600 && y < 1930) protectedActive += 1;
      if (insidePolygon(x + 0.5, y + 0.5, manifest.microBridgePolygon)) {
        microActive += 1;
        const value = at(phase, x, y);
        phaseMin = Math.min(phaseMin, value);
        phaseMax = Math.max(phaseMax, value);
      }
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        local[(y - minY) * localWidth + (x - minX)] = 1;
      }
    }
    if (interact) {
      interactionActive += 1;
      if (!active) interactionOutsideProduction += 1;
    }
  }
}
assert.equal(total, manifest.metrics.totalActivePixels);
assert.equal(faceActive, manifest.metrics.innerFaceActivePixels);
assert.equal(protectedActive, manifest.metrics.ringStarAltarActivePixels);
assert.ok(Math.abs(microActive - manifest.metrics.microBridgeActivePixels) <= 250);
assert.equal(interactionActive, manifest.metrics.placardInteractionPixels);
assert.equal(interactionOutsideProduction, 0);
assert.equal(faceActive, 0);
assert.equal(protectedActive, 0);
assert.equal(phaseMin, manifest.metrics.microBridgePhaseMinimum);
assert.equal(phaseMax, manifest.metrics.microBridgePhaseMaximum);

// Independent local connectivity check between incoming route and placard terminal.
const queue = [];
const visited = new Uint8Array(local.length);
for (let y = 2000; y <= 2145; y += 1) {
  for (let x = 1215; x <= 1305; x += 1) {
    const index = (y - minY) * localWidth + (x - minX);
    if (local[index]) { queue.push(index); visited[index] = 1; }
  }
}
let reachesTerminal = false;
for (let head = 0; head < queue.length; head += 1) {
  const index = queue[head];
  const lx = index % localWidth;
  const ly = Math.floor(index / localWidth);
  const x = lx + minX;
  const y = ly + minY;
  if (x >= 1380 && x <= 1512 && y >= 1900) reachesTerminal = true;
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const nx = lx + dx;
      const ny = ly + dy;
      if (nx < 0 || ny < 0 || nx >= localWidth || ny >= localHeight) continue;
      const ni = ny * localWidth + nx;
      if (local[ni] && !visited[ni]) { visited[ni] = 1; queue.push(ni); }
    }
  }
}
assert.equal(reachesTerminal, true, 'Micro-bridge does not connect incoming route to placard terminal');

const bins = manifest.metrics.phaseBinMedians;
for (let index = 1; index < bins.length; index += 1) {
  assert.ok(bins[index] <= bins[index - 1], 'Micro-bridge phase is not monotonic');
}

const assets = await readText('src/components/scene/engines/border/borderFrameAssets.js');
const renderer = await readText('src/components/scene/engines/border/BorderFrameRenderer.js');
const shader = await readText('src/components/scene/engines/border/borderFrameShaders.js');
const engine = await readText('src/components/scene/engines/BorderFrameEngine.js');
const placard = await readText('src/components/scene/placard/PlacardControl.jsx');
const events = await readText('src/components/scene/sceneEvents.js');
const css = await readText('src/styles/quiz-interface.css');
const proof = await readText('src/components/scene/debug/BorderFrameProofLayer.jsx');

assert.match(assets, /purple-border-production-r5\.5\.3\.png/);
assert.match(assets, /purple-flow-phase-r5\.5\.3\.png/);
assert.match(assets, /placard-interaction-mask-r5\.5\.3\.png/);
assert.match(renderer, /uPlacardInteractionMask/);
assert.match(renderer, /uPlacardInteraction/);
assert.match(shader, /uniform sampler2D uPlacardInteractionMask;/);
assert.match(shader, /uniform vec3 uPlacardInteraction;/);
assert.match(shader, /placardInteractionPath/);
assert.match(engine, /production-purple-r5\.5\.3/);
assert.match(engine, /dedicated-left-microbridge-r5\.5\.3/);
assert.match(engine, /placardActivationGain = 1/);
assert.match(engine, /placardActivationGain - lastDelta \/ 0\.85/);
assert.doesNotMatch(placard, /<svg|<polyline|qcq-placard-trim-overlay|data-illuminated/);
assert.doesNotMatch(css, /qcq-placard-trim-overlay/);
for (const name of ['PLACARD_HOVER_ENTER', 'PLACARD_HOVER_LEAVE', 'PLACARD_FOCUS_ENTER', 'PLACARD_FOCUS_LEAVE']) {
  assert.match(events, new RegExp(name));
  assert.match(placard, new RegExp(`SceneEvents\\.${name}`));
}
assert.match(proof, /placard-left-microbridge-isolated-r5\.5\.3\.png/);
assert.match(proof, /placard-left-microbridge-registration-r5\.5\.3\.png/);
assert.match(proof, /placard-left-microbridge-phase-r5\.5\.3\.png/);
assert.match(proof, /placard-interaction-mask-r5\.5\.3\.png/);
assert.equal(resolveBorderFrameChannelMode(undefined), 'all');
assert.deepEqual(BORDER_FRAME_CHANNEL_MODES.all, [1, 1, 1]);

console.log('R5.5.3 micro-bridge and modular placard interaction verification passed.');
console.log(`Total active purple pixels: ${total}`);
console.log(`Micro-bridge active pixels: ${microActive}`);
console.log(`Micro-bridge phase range: ${phaseMin}-${phaseMax}`);
console.log(`Placard interaction pixels: ${interactionActive}`);
console.log(`Placard face active pixels: ${faceActive}`);
console.log(`Ring/Star/altar active pixels: ${protectedActive}`);
console.log('Visible DOM/SVG hover line: removed.');
console.log('Hover, focus, activation visual owner: BorderFrameEngine.');
