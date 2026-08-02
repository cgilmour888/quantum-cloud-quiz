import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BORDER_FRAME_CHANNELS,
  cyclicDistance,
  wrapPhase,
} from '../src/components/scene/engines/border/borderFrameConfig.js';

test('border channels preserve the approved opposing directions', () => {
  assert.equal(BORDER_FRAME_CHANNELS.cyan.direction, 1);
  assert.equal(BORDER_FRAME_CHANNELS.orange.direction, -1);
  assert.equal(BORDER_FRAME_CHANNELS.purple.primaryDirection, 1);
  assert.equal(BORDER_FRAME_CHANNELS.purple.secondaryDirection, -1);
});

test('phase helpers wrap continuously across the hidden placard route', () => {
  assert.equal(wrapPhase(1.2), 0.19999999999999996);
  assert.equal(wrapPhase(-0.2), 0.8);
  assert.ok(cyclicDistance(0.99, 0.01) < 0.03);
});
