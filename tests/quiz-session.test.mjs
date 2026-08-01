import assert from 'node:assert/strict';
import test from 'node:test';
import { QuizSession } from '../src/components/quiz/QuizSession.js';

function question(id, answers, topic = 'Cloud Concepts') {
  return {
    id,
    prompt: `Question ${id}`,
    options: ['A', 'B', 'C', 'D'].map((key) => ({ key, text: key })),
    answers,
    selectionType: answers.length > 1 ? 'multiple' : 'single',
    selectionCount: answers.length,
    topic,
    explanation: '',
  };
}

test('tracks score, accuracy, attempts, streaks and semantic events', () => {
  let now = 1_000;
  const events = [];
  const session = new QuizSession({
    questions: [question('q1', ['B']), question('q2', ['A', 'C'])],
    shuffleQuestions: false,
    clock: () => now,
    idFactory: () => 'session-1',
    emit: (eventName, detail) => events.push({ eventName, detail }),
  });

  session.start();
  assert.equal(session.status, 'active');

  assert.equal(session.submit(['B']).correct, true);
  assert.equal(session.currentStreak, 1);
  session.next();

  assert.equal(session.submit(['C', 'A']).correct, true);
  assert.equal(session.currentStreak, 2);
  assert.equal(session.bestStreak, 2);
  now += 2_000;
  session.next();

  const summary = session.summary();
  assert.equal(summary.status, 'completed');
  assert.equal(summary.correct, 2);
  assert.equal(summary.incorrect, 0);
  assert.equal(summary.attempts, 2);
  assert.equal(summary.score, 100);
  assert.equal(summary.accuracy, 100);
  assert.equal(summary.bestStreak, 2);
  assert.ok(events.some(({ eventName }) => eventName === 'quiz:answer-correct'));
  assert.ok(events.some(({ eventName }) => eventName === 'quiz:streak-changed'));
  assert.ok(events.some(({ eventName }) => eventName === 'quiz:exam-completed'));
});

test('resets streak after an incorrect answer and rejects duplicate submissions', () => {
  const session = new QuizSession({
    questions: [question('q1', ['A']), question('q2', ['B'])],
    shuffleQuestions: false,
    idFactory: () => 'session-2',
  });

  session.start();
  session.submit(['A']);
  assert.throws(() => session.submit(['A']), /already been answered/);
  session.next();
  session.submit(['D']);

  assert.equal(session.currentStreak, 0);
  assert.equal(session.bestStreak, 1);
  assert.equal(session.accuracy, 50);
});

test('subtracts paused time from elapsed time', () => {
  let now = 10_000;
  const session = new QuizSession({
    questions: [question('q1', ['A'])],
    shuffleQuestions: false,
    clock: () => now,
    idFactory: () => 'session-3',
  });

  session.start();
  now += 1_000;
  session.pause();
  now += 5_000;
  session.resume();
  now += 2_000;

  assert.equal(session.elapsedMilliseconds, 3_000);
});

test('restores a serializable active-session snapshot', () => {
  let now = 1_000;
  const original = new QuizSession({
    questions: [question('q1', ['A']), question('q2', ['B'])],
    shuffleQuestions: false,
    clock: () => now,
    idFactory: () => 'restorable',
  });

  original.start();
  original.submit(['A']);
  original.next();
  const snapshot = original.snapshot();

  now = 5_000;
  const restored = QuizSession.restore(snapshot, { clock: () => now });
  assert.equal(restored.id, 'restorable');
  assert.equal(restored.index, 1);
  assert.equal(restored.correctCount, 1);
  assert.equal(restored.status, 'active');
});
