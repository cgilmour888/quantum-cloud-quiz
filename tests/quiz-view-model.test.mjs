import assert from 'node:assert/strict';
import test from 'node:test';
import {
  compactTopicLabel,
  createQuizMetrics,
  formatElapsed,
  getOptionState,
  paginateOptions,
} from '../src/components/quiz/quizViewModel.js';

test('formats elapsed time as an artwork-compatible fixed clock', () => {
  assert.equal(formatElapsed(0), '00:00:00');
  assert.equal(formatElapsed(3_723_000), '01:02:03');
});

test('creates compact non-duplicative dashboard metrics', () => {
  const metrics = createQuizMetrics({
    correct: 4,
    bestStreak: 2,
    currentStreak: 1,
    accuracy: 80,
    answered: 5,
    attempts: 5,
    elapsedMilliseconds: 62_000,
    responses: [
      { topic: 'Security & Compliance', correct: true },
      { topic: 'Security & Compliance', correct: true },
      { topic: 'Cloud Concepts', correct: false },
    ],
  });

  assert.equal(metrics.experience, '420');
  assert.equal(metrics.accuracy, '80.0%');
  assert.equal(metrics.questions, '5');
  assert.equal(metrics.elapsed, '00:01:02');
  assert.equal(metrics.bestCategory, 'Security');
});

test('paginates a five-option question without losing option E', () => {
  const options = ['A', 'B', 'C', 'D', 'E'].map((key) => ({ key, text: key }));
  const first = paginateOptions(options, 0);
  const second = paginateOptions(options, 1);

  assert.deepEqual(first.visible.map((option) => option.key), ['A', 'B', 'C', 'D']);
  assert.deepEqual(second.visible.map((option) => option.key), ['E']);
  assert.equal(first.pageCount, 2);
});

test('reveals selected, correct and incorrect option states', () => {
  assert.equal(getOptionState({ optionKey: 'B', selected: ['B'] }), 'selected');
  const response = { selected: ['A'], expected: ['B'] };
  assert.equal(getOptionState({ optionKey: 'A', response }), 'incorrect-selected');
  assert.equal(getOptionState({ optionKey: 'B', response }), 'correct-answer');
});

test('compacts long topic labels for the original metric field', () => {
  assert.equal(compactTopicLabel('Networking & Content Delivery'), 'Networking');
  assert.ok(compactTopicLabel('A Very Long Category Name Without Delimiters').length <= 13);
});
