import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  BORDER_FRAME_CHANNELS,
  BORDER_FRAME_CHANNEL_MODES,
  resolveBorderFrameChannelMode,
} from '../src/components/scene/engines/border/borderFrameConfig.js';
import {
  PLACARD_LOWER_TRIM_PATH,
  PLACARD_PHYSICAL_POLYGON,
  PLACARD_PHYSICAL_BOUNDS,
  PLACARD_FOCUS_VIEWBOX,
} from '../src/components/scene/placard/placardGeometry.js';

const root = process.cwd();
const sha = async (relative) => createHash('sha256')
  .update(await readFile(path.join(root, relative))).digest('hex');
const read = (relative) => readFile(path.join(root, relative), 'utf8');

const protectedAssets = {
  'public/images/master/MASTER.png': '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c',
  'public/images/master/derived/border-frame/source/border-cyan-emissive.png': '31f562f7dc9136fdfbc0a8e563ba55a1c5896a6e370948d45e4807c6272c3337',
  'public/images/master/derived/border-frame/source/border-flow-phase.png': '8413b3e5c32a8eeb0fb8d824d91ab171dc7470970f3a67083c0f230fddafc195',
};
for (const [relative, expected] of Object.entries(protectedAssets)) {
  assert.equal(await sha(relative), expected, `Protected asset changed: ${relative}`);
}

assert.deepEqual(BORDER_FRAME_CHANNELS.cyan, {
  direction: 1, speed: 0.055, baseCurrent: 0.10, pulseWidth: 0.042,
  packetCount: 3, voltageFrequency: 0.72, junctionGain: 0.48,
  bloomGain: 0.34, maximumIntensity: 0.82, color: [0.04, 0.84, 1.0],
});
assert.equal(resolveBorderFrameChannelMode(undefined), 'all');
assert.deepEqual(BORDER_FRAME_CHANNEL_MODES.all, [1, 1, 1]);

const productionAssets = {
  'public/images/master/derived/border-frame/source/purple-border-production-r5.5.png':
    'a05334b5d0439c04152bf4051f5fc9c9dee99a005e5851ef50d169831acb0bd3',
  'public/images/master/derived/border-frame/runtime/1080/purple-border-production-r5.5.png':
    '318558c97fcf79dc6c069b25fdb4a21242f5170bb0fadad7ab3952b7ba150481',
  'public/images/master/derived/border-frame/runtime/1440/purple-border-production-r5.5.png':
    '54dad7f9c5a022ef339150cd4c2b439ff055c4903b33e6585ff326ee0ddf9b1d',
  'public/images/master/derived/border-frame/runtime/2160/purple-border-production-r5.5.png':
    'a05334b5d0439c04152bf4051f5fc9c9dee99a005e5851ef50d169831acb0bd3',
  'public/images/master/derived/border-frame/proofs/static-4k/placard-trim-registration-r5.5.png':
    '5b7ead473dff064fd59f6f86f9ceb31081f0a725aef1bd5c302b2ead3cff3374',
  'public/images/profile/carl-gilmour-business-card.webp':
    '076c2615e4d5709706603026793411739cd5cfc32f7e3fa8456f5dd8f85fedf4',
};
for (const [relative, expected] of Object.entries(productionAssets)) {
  assert.equal(await sha(relative), expected, `R5.5 production asset changed: ${relative}`);
  assert.ok((await stat(path.join(root, relative))).size > 0);
}

const mapping = JSON.parse(await read(
  'public/images/master/derived/border-frame/placard-trim-mapping-r5.5.json'));
assert.equal(mapping.revision, '5.5');
assert.equal(mapping.authority,
  'lower-most continuous purple trim physically outlining the placard');
assert.equal(mapping.stageCenterUsedForPlacardGeometry, false);
assert.equal(mapping.textCenterUsedForGeometry, false);
assert.deepEqual(mapping.productionIntegration.defaultChannels, ['cyan', 'orange', 'purple']);
assert.equal(mapping.productionIntegration.placardIndependent, true);
assert.ok(PLACARD_LOWER_TRIM_PATH.length > 40);
assert.equal(PLACARD_PHYSICAL_POLYGON[0][0], PLACARD_LOWER_TRIM_PATH[0][0]);
assert.equal(PLACARD_PHYSICAL_POLYGON[5][0], PLACARD_LOWER_TRIM_PATH.at(-1)[0]);
assert.ok(PLACARD_FOCUS_VIEWBOX.x <= PLACARD_PHYSICAL_BOUNDS.x);
assert.ok(PLACARD_FOCUS_VIEWBOX.x + PLACARD_FOCUS_VIEWBOX.width >= PLACARD_PHYSICAL_BOUNDS.right);

const assets = await read('src/components/scene/engines/border/borderFrameAssets.js');
const shader = await read('src/components/scene/engines/border/borderFrameShaders.js');
const engine = await read('src/components/scene/engines/BorderFrameEngine.js');
const placard = await read('src/components/scene/placard/PlacardControl.jsx');
const quiz = await read('src/components/quiz/QuizInterface.jsx');
const profile = await read('src/components/profile/ProfileCardSurface.jsx');
const proof = await read('src/components/scene/debug/BorderFrameProofLayer.jsx');

assert.match(assets, /purple-border-production-r5\.5(?:\.[123])?\.png/);
assert.match(shader, /float purplePermitted = (?:texture\(uPurpleTrueMask, vUv\)\.r|purplePathMask\(vUv\));/);
assert.match(shader, /float purpleIntensity = purplePermitted \* uChannelEnable\.b/);
assert.doesNotMatch(shader, /float purpleIntensity = emissive\.b \* data\.a/);
assert.ok((shader.match(/purpleCyanClonePackets\((?:data\.r|purplePhase), timeValue\)/g) ?? []).length >= 2);
assert.match(engine, /production-purple-r5\.5(?:\.[123])?/);

assert.match(placard, /data-geometry-authority="lower-purple-trim"/);
assert.match(placard, /SceneEvents\.PLACARD_ACTIVATED/);
assert.match(quiz, /SceneEvents\.BUSINESS_CARD_OPENED/);
assert.match(quiz, /SceneEvents\.BUSINESS_CARD_CLOSED/);
assert.match(quiz, /priorPanelRef\.current/);
assert.match(profile, /data-preserves-quiz-state="true"/);
assert.match(proof, /data-placard-authority="lower-most-purple-trim"/);
assert.doesNotMatch(proof, /purple-lower-center-focus-4k\.png/);

console.log('R5.5 production promotion and independent placard verification passed.');
console.log('Default channels: cyan + orange + purple.');
console.log('Production purple: promoted true mask + approved counter-clockwise transport.');
console.log('Placard authority: traced lower-most purple trim; stage/text centers excluded.');
console.log('Business card: tablet presentation mode with quiz state preserved.');
