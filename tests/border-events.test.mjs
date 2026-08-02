import test from 'node:test';
import assert from 'node:assert/strict';
import { BorderFrameSurgeController } from '../src/components/scene/engines/border/BorderFrameSurgeController.js';

test('surge controller applies and decays channel-specific impulses', () => {
  const controller = new BorderFrameSurgeController(8);
  controller.trigger({
    channel: 'orange', attack: 0.01, hold: 0.01, decay: 0.10,
    amplitude: 0.75, speedMultiplier: 0.5, junctionMultiplier: 0.8,
  });
  let state = controller.update(0.02);
  assert.ok(state.channels[1] > 0.7);
  assert.equal(state.channels[0], 0);
  assert.equal(state.channels[2], 0);
  state = controller.update(0.2);
  assert.equal(state.activeCount, 0);
});

test('surge controller never allocates beyond its fixed pool', () => {
  const controller = new BorderFrameSurgeController(3);
  for (let index = 0; index < 20; index += 1) {
    controller.trigger({ channel: index % 2 ? 'cyan' : 'purple', amplitude: 0.2 });
  }
  assert.ok(controller.snapshot().activeCount <= 3);
});
