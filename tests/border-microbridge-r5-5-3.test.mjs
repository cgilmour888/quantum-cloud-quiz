import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const readText = async (relative) => readFile(new URL(relative, root), 'utf8');
const manifest = JSON.parse(await readText('public/images/master/derived/border-frame/placard-left-microbridge-r5.5.3.json'));
const assets = await readText('src/components/scene/engines/border/borderFrameAssets.js');
const renderer = await readText('src/components/scene/engines/border/BorderFrameRenderer.js');
const shader = await readText('src/components/scene/engines/border/borderFrameShaders.js');
const engine = await readText('src/components/scene/engines/BorderFrameEngine.js');
const placard = await readText('src/components/scene/placard/PlacardControl.jsx');
const events = await readText('src/components/scene/sceneEvents.js');
const css = await readText('src/styles/quiz-interface.css');
const proof = await readText('src/components/scene/debug/BorderFrameProofLayer.jsx');


test('R5.5.3 micro-bridge is MASTER-derived, connected, and protected', () => {
  assert.equal(manifest.revision, '5.5.3');
  assert.ok(manifest.metrics.addedMasterDerivedPixels > 0);
  assert.ok(manifest.metrics.strengthenedExistingPixels > 0);
  assert.ok(manifest.metrics.microBridgeActivePixels > 20000);
  assert.equal(manifest.metrics.microBridgeConnected, true);
  assert.ok(manifest.metrics.microBridgeConnectedArea > 20000);
  assert.equal(manifest.metrics.innerFaceActivePixels, 0);
  assert.equal(manifest.metrics.ringStarAltarActivePixels, 0);
});

test('R5.5.3 phase is monotonic across the final micro-bridge', () => {
  assert.ok(manifest.metrics.microBridgePhaseMaximum > manifest.metrics.microBridgePhaseMinimum);
  assert.ok(manifest.metrics.microBridgePhaseMaximum - manifest.metrics.microBridgePhaseMinimum >= 8);
  const bins = manifest.metrics.phaseBinMedians;
  assert.ok(bins.length >= 20);
  for (let i = 1; i < bins.length; i += 1) {
    assert.ok(bins[i] <= bins[i - 1], `phase increased at bin ${i}`);
  }
});

test('normal and diagnostic purple share R5.5.3 mask and phase', () => {
  assert.match(assets, /purple-border-production-r5\.5\.3\.png/);
  assert.match(assets, /purple-flow-phase-r5\.5\.3\.png/);
  assert.match(assets, /placard-interaction-mask-r5\.5\.3\.png/);
  assert.match(renderer, /uPurpleTrueMask/);
  assert.match(renderer, /uPurplePhase/);
  assert.match(shader, /purpleCyanClonePackets\(purplePhase, timeValue\)/);
  assert.match(shader, /purpleCyanTracer\(purplePhase, timeValue\)/);
  assert.match(engine, /production-purple-r5\.5\.3/);
  assert.match(engine, /dedicated-left-microbridge-r5\.5\.3/);
});

test('placard control is semantic and draws no decorative trim', () => {
  assert.doesNotMatch(placard, /<svg|<polyline|qcq-placard-trim-overlay/);
  assert.match(placard, /data-visual-owner="border-frame-engine"/);
  assert.match(placard, /SceneEvents\.PLACARD_HOVER_ENTER/);
  assert.match(placard, /SceneEvents\.PLACARD_HOVER_LEAVE/);
  assert.match(placard, /SceneEvents\.PLACARD_FOCUS_ENTER/);
  assert.match(placard, /SceneEvents\.PLACARD_FOCUS_LEAVE/);
  assert.match(placard, /SceneEvents\.PLACARD_ACTIVATED/);
  assert.doesNotMatch(css, /qcq-placard-trim-overlay/);
});

test('BorderFrameEngine owns localized hover, focus, and activation visuals', () => {
  assert.match(events, /PLACARD_HOVER_ENTER/);
  assert.match(events, /PLACARD_HOVER_LEAVE/);
  assert.match(events, /PLACARD_FOCUS_ENTER/);
  assert.match(events, /PLACARD_FOCUS_LEAVE/);
  assert.match(engine, /placardHoverActive/);
  assert.match(engine, /placardFocusActive/);
  assert.match(engine, /placardActivationGain = 1/);
  assert.match(engine, /placardActivationGain - lastDelta \/ 0\.85/);
  assert.match(renderer, /uPlacardInteractionMask/);
  assert.match(renderer, /uPlacardInteraction/);
  assert.match(shader, /placardInteractionPath/);
  assert.match(shader, /uPlacardInteraction\.x \* 0\.16/);
  assert.match(shader, /uPlacardInteraction\.y \* 0\.22/);
  assert.match(shader, /uPlacardInteraction\.z \* 0\.58/);
});

test('card-open state cannot force persistent placard illumination', () => {
  assert.doesNotMatch(placard, /active \|\| hovered \|\| focused/);
  assert.doesNotMatch(placard, /data-illuminated/);
  assert.doesNotMatch(engine, /\[SceneEvents\.BUSINESS_CARD_OPENED\][\s\S]{0,300}placard(?:Hover|Focus|Activation)Gain\s*=\s*1/);
  assert.equal(manifest.runtime.placardControlDrawsDecorativeTrim, false);
  assert.equal(manifest.runtime.hoverFocusActivationOwnedByBorderFrameEngine, true);
});

test('R5.5.3 proof routes are cache-busted and explicit', () => {
  assert.match(proof, /placard-left-microbridge-isolated-r5\.5\.3\.png/);
  assert.match(proof, /placard-left-microbridge-registration-r5\.5\.3\.png/);
  assert.match(proof, /placard-left-microbridge-phase-r5\.5\.3\.png/);
  assert.match(proof, /placard-interaction-mask-r5\.5\.3\.png/);
});

test('temporary business-card ownership remains outside BorderFrameEngine', async () => {
  const quiz = await readText('src/components/quiz/QuizInterface.jsx');
  const profile = await readText('src/components/profile/ProfileCardSurface.jsx');
  assert.match(quiz, /activePanel === 'profile'/);
  assert.match(quiz, /quizStatePreserved: true/);
  assert.match(profile, /data-preserves-quiz-state="true"/);
  assert.doesNotMatch(engine, /ProfileCardSurface|activePanel/);
});
