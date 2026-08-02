import assert from 'node:assert/strict';
import test from 'node:test';
import { createDashboardPanel } from '../src/components/quiz/dashboardModels.js';

test('settings panel exposes one working settings controller', () => {
  let toggled = false;
  const panel = createDashboardPanel('settings', {
    settings: { thunderEnabled: true, animationsPaused: false, reducedMotion: false },
    actions: { toggleThunder: () => { toggled = true; } },
  });

  assert.equal(panel.title, 'SETTINGS');
  assert.equal(panel.rows[0].detail, 'ENABLED');
  panel.rows[0].action();
  assert.equal(toggled, true);
});

test('history panel uses completed local results without foreign dashboard markup', () => {
  const panel = createDashboardPanel('history', {
    progress: {
      results: [{ id: 'one', title: 'Exam One', accuracy: 90, elapsedMilliseconds: 61_000 }],
    },
  });

  assert.equal(panel.title, 'SESSION HISTORY');
  assert.equal(panel.rows[0].text, 'Exam One');
  assert.equal(panel.rows[0].detail, '90% · 00:01:01');
});
