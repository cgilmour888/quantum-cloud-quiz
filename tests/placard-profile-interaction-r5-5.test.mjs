import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  PLACARD_LOWER_TRIM_PATH,
  PLACARD_PHYSICAL_BOUNDS,
  PLACARD_PHYSICAL_POLYGON,
  placardHitStyle,
} from '../src/components/scene/placard/placardGeometry.js';

const placardControl = await readFile(
  new URL('../src/components/scene/placard/PlacardControl.jsx', import.meta.url),
  'utf8',
);
const quizInterface = await readFile(
  new URL('../src/components/quiz/QuizInterface.jsx', import.meta.url),
  'utf8',
);
const profileSurface = await readFile(
  new URL('../src/components/profile/ProfileCardSurface.jsx', import.meta.url),
  'utf8',
);

test('placard hit zone is derived from the traced physical trim geometry', () => {
  assert.ok(PLACARD_LOWER_TRIM_PATH.length > 40);
  assert.equal(PLACARD_PHYSICAL_POLYGON[0][0], PLACARD_LOWER_TRIM_PATH[0][0]);
  assert.equal(PLACARD_PHYSICAL_POLYGON[5][0], PLACARD_LOWER_TRIM_PATH.at(-1)[0]);
  assert.ok(PLACARD_PHYSICAL_BOUNDS.width > 1000);
  const style = placardHitStyle();
  assert.match(style.clipPath, /^polygon\(/);
});

test('placard is an accessible independent control', () => {
  assert.match(placardControl, /aria-label="Open Carl Gilmour business card on the tablet"/);
  assert.match(placardControl, /data-geometry-authority="lower-purple-trim"/);
  assert.match(placardControl, /SceneEvents\.PLACARD_ACTIVATED/);
});

test('business card temporarily replaces only the tablet surface', () => {
  assert.match(quizInterface, /activePanel === 'profile'/);
  assert.match(quizInterface, /<ProfileCardSurface/);
  assert.match(quizInterface, /priorPanelRef\.current/);
  assert.match(quizInterface, /quizStatePreserved: true/);
  assert.match(profileSurface, /data-preserves-quiz-state="true"/);
});

test('placard activation and card open-close emit scene events', () => {
  assert.match(quizInterface, /SceneEvents\.BUSINESS_CARD_OPENED/);
  assert.match(quizInterface, /SceneEvents\.BUSINESS_CARD_CLOSED/);
  assert.match(placardControl, /SceneEvents\.PLACARD_HOVER_ENTER/);
  assert.match(placardControl, /SceneEvents\.PLACARD_HOVER_LEAVE/);
  assert.match(placardControl, /SceneEvents\.PLACARD_FOCUS_ENTER/);
  assert.match(placardControl, /SceneEvents\.PLACARD_FOCUS_LEAVE/);
});
