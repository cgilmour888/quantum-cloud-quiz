import assert from 'node:assert/strict';
import test from 'node:test';
import { LocalProgressRepository, MemoryProgressRepository } from '../src/components/quiz/progressRepository.js';

class FakeStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

test('memory repository stores results, missed questions and active sessions', async () => {
  const repository = new MemoryProgressRepository();
  await repository.saveResult({ id: 'result-1', score: 80 });
  await repository.saveMissed(['q1', 'q1', 'q2']);
  await repository.saveActiveSession({ version: 1, session: { id: 'active' } });

  const snapshot = await repository.getSnapshot();
  assert.equal(snapshot.results.length, 1);
  assert.deepEqual(snapshot.missed, ['q1', 'q2']);
  assert.equal(snapshot.activeSession.session.id, 'active');
});

test('local repository persists through the injected storage interface', async () => {
  const storage = new FakeStorage();
  const first = new LocalProgressRepository(storage);
  await first.saveSettings({ thunderEnabled: true });
  await first.saveResult({ id: 'result-1', score: 90 });

  const second = new LocalProgressRepository(storage);
  const snapshot = await second.getSnapshot();
  assert.equal(snapshot.settings.thunderEnabled, true);
  assert.equal(snapshot.results[0].score, 90);
});
