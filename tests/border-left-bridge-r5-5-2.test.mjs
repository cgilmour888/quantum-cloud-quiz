import test from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';

const rootUrl = new URL('../', import.meta.url);
const readText = async (relative) => readFile(new URL(relative, rootUrl), 'utf8');
const read = async (relative) => readFile(new URL(relative, rootUrl));

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
  assert.ok(buffer.subarray(0, 8).equals(signature));
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

const manifest = JSON.parse(await readText(
  'public/images/master/derived/border-frame/placard-left-bridge-r5.5.2.json'));
const mask = decodeRgbaPng(await read(
  'public/images/master/derived/border-frame/source/purple-border-production-r5.5.2.png'));
const phase = decodeRgbaPng(await read(
  'public/images/master/derived/border-frame/source/purple-flow-phase-r5.5.2.png'));
const assets = await readText('src/components/scene/engines/border/borderFrameAssets.js');
const renderer = await readText('src/components/scene/engines/border/BorderFrameRenderer.js');
const shader = await readText('src/components/scene/engines/border/borderFrameShaders.js');
const engine = await readText('src/components/scene/engines/BorderFrameEngine.js');
const placard = await readText('src/components/scene/placard/PlacardControl.jsx');
const proof = await readText('src/components/scene/debug/BorderFrameProofLayer.jsx');

const valueAt = (decoded, x, y) => decoded.pixels[(y * decoded.width + x) * 4];

function componentTouchesBoth() {
  const x0 = 1030; const y0 = 1928; const x1 = 1471; const y1 = 2160;
  const width = x1 - x0;
  const height = y1 - y0;
  const visited = new Uint8Array(width * height);
  const queueX = new Int32Array(width * height);
  const queueY = new Int32Array(width * height);
  const index = (x, y) => (y - y0) * width + (x - x0);

  for (let sy = 1950; sy < 2160; sy += 1) {
    for (let sx = 1030; sx < 1340; sx += 1) {
      if (valueAt(mask, sx, sy) === 0 || visited[index(sx, sy)]) continue;
      let head = 0; let tail = 0; let touchesPlacard = false;
      queueX[tail] = sx; queueY[tail] = sy; tail += 1;
      visited[index(sx, sy)] = 1;
      while (head < tail) {
        const x = queueX[head]; const y = queueY[head]; head += 1;
        if (x >= 1380 && x < 1461 && y >= 1930 && y < 2159) touchesPlacard = true;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx; const ny = y + dy;
            if (nx < x0 || nx >= x1 || ny < y0 || ny >= y1) continue;
            const i = index(nx, ny);
            if (visited[i] || valueAt(mask, nx, ny) === 0) continue;
            visited[i] = 1;
            queueX[tail] = nx; queueY[tail] = ny; tail += 1;
          }
        }
      }
      if (touchesPlacard) return true;
    }
  }
  return false;
}

test('R5.5.2 restores a connected artwork-native left bridge', () => {
  assert.equal(manifest.revision, '5.5.2');
  assert.ok(manifest.metrics.leftBridgeActivePixels > 30000);
  assert.ok(manifest.metrics.addedArtworkEdgePixels > 0);
  assert.ok(manifest.metrics.strengthenedLeftBridgePixels > 4000);
  assert.equal(componentTouchesBoth(), true);
});

test('dedicated purple phase is continuous across the left bridge', () => {
  assert.deepEqual({ width: phase.width, height: phase.height }, { width: 3840, height: 2160 });
  assert.ok(manifest.metrics.leftBridgePhaseMaximum > manifest.metrics.leftBridgePhaseMinimum);
  assert.ok(manifest.metrics.leftBridgePhaseMaximum - manifest.metrics.leftBridgePhaseMinimum >= 7);
  const bins = manifest.metrics.phaseBinMedians;
  assert.equal(bins.length, 22);
  for (let i = 1; i < bins.length; i += 1) assert.ok(bins[i] <= bins[i - 1]);
  assert.ok((shader.match(/purpleCyanClonePackets\(purplePhase, timeValue\)/g) ?? []).length >= 2);
  assert.match(shader, /purpleCyanTracer\(purplePhase, timeValue\)/);
});

test('production and diagnostics preserve the R5.5.2 contract under R5.5.3', () => {
  assert.match(assets, /purple-border-production-r5\.5\.(?:2|3)\.png/);
  assert.match(assets, /purple-flow-phase-r5\.5\.(?:2|3)\.png/);
  assert.match(renderer, /uPurplePhase/);
  assert.match(renderer, /purplePhaseTexture/);
  assert.match(shader, /uniform sampler2D uPurplePhase;/);
  assert.ok((shader.match(/purplePathMask\(vUv\)/g) ?? []).length >= 3);
  assert.match(engine, /production-purple-r5\.5\.(?:2|3)/);
  assert.match(engine, /dedicated-left-(?:bridge-r5\.5\.2|microbridge-r5\.5\.3)/);
});

test('placard activation remains finite without decorative trim illumination', () => {
  assert.doesNotMatch(placard, /qcq-placard-trim-overlay/);
  assert.doesNotMatch(placard, /<svg|<polyline/);
  assert.match(placard, /SceneEvents\.PLACARD_HOVER_ENTER/);
  assert.match(placard, /SceneEvents\.PLACARD_HOVER_LEAVE/);
  assert.match(placard, /SceneEvents\.PLACARD_FOCUS_ENTER/);
  assert.match(placard, /SceneEvents\.PLACARD_FOCUS_LEAVE/);
  assert.match(placard, /SceneEvents\.PLACARD_ACTIVATED/);
  assert.match(engine, /placardActivationGain = 1/);
  assert.match(engine, /placardActivationGain - lastDelta \/ 0\.85/);
});

test('R5.5.2 retains hard containment and all-channel production', () => {
  assert.equal(manifest.metrics.innerFaceActivePixels, 0);
  assert.equal(manifest.metrics.ringStarAltarActivePixels, 0);
  assert.equal(manifest.runtime.normalAndDiagnosticsShareMask, true);
  assert.equal(manifest.runtime.normalAndDiagnosticsSharePhase, true);
  assert.equal(manifest.runtime.activationTrimPersistentWhenCardOpen, false);
  assert.equal(manifest.runtime.finiteActivationSurge, true);
  assert.match(engine, /const channelMode = readChannelMode\(\)/);
});

test('cache-busted left-bridge proof routes are installed', () => {
  assert.match(proof, /'placard-left-bridge-isolated'/);
  assert.match(proof, /placard-left-bridge-isolated-r5\.5\.2\.png/);
  assert.match(proof, /'placard-left-bridge-registration'/);
  assert.match(proof, /placard-left-bridge-registration-r5\.5\.2\.png/);
  assert.match(proof, /'placard-left-bridge-phase'/);
  assert.match(proof, /placard-left-bridge-phase-r5\.5\.2\.png/);
});
