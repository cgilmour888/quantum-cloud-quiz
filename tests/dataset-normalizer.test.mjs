import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { normalizeQuizDataset, summarizeDataset } from '../src/components/quiz/datasetNormalizer.js';
import { validateNormalizedDataset, validateQuizDataset } from '../src/components/quiz/datasetSchema.js';

const sourceUrl = new URL('../public/data/aws-cloud-practitioner.exams.json', import.meta.url);
const raw = JSON.parse(await readFile(sourceUrl, 'utf8'));

test('normalizes and validates the complete AWS collection', () => {
  const dataset = normalizeQuizDataset(raw, { source: 'test' });
  const validation = validateNormalizedDataset(dataset);
  const summary = summarizeDataset(dataset);

  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(summary.examCount, 23);
  assert.equal(summary.questionCount, 1142);
  assert.equal(summary.singleSelectQuestions, 875);
  assert.equal(summary.multipleSelectQuestions, 267);
  assert.equal(summary.topicCount, 12);
});

test('accepts the former single-exam starter schema', () => {
  const result = validateQuizDataset({
    exam: {
      id: 'starter',
      title: 'Starter',
      questions: [{
        id: 'q1',
        question: 'Choose the correct answer.',
        options: [
          { id: 'A', text: 'Wrong' },
          { id: 'B', text: 'Correct' },
        ],
        correctAnswer: 'B',
      }],
    },
  });

  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.deepEqual(result.dataset.exams[0].questions[0].answers, ['B']);
});
