import test from 'node:test';
import assert from 'node:assert/strict';
import { BorderFramePerformanceController } from '../src/components/scene/engines/border/BorderFramePerformanceController.js';

test('performance controller defaults to balanced for the MacBook target', () => {
  const controller = new BorderFramePerformanceController();
  assert.equal(controller.state.tier, 'balanced');
});

test('performance controller falls quickly under sustained slow frames', () => {
  const controller = new BorderFramePerformanceController({ initial: 'high' });
  for (let index = 0; index < 100; index += 1) controller.record(0.032);
  assert.equal(controller.state.tier, 'conservative');
});

test('reduced motion locks the conservative shader tier', () => {
  const controller = new BorderFramePerformanceController({ initial: 'high', reducedMotion: true });
  assert.equal(controller.state.tier, 'conservative');
});
