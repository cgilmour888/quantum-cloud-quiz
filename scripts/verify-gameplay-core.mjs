import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeQuizDataset, summarizeDataset } from '../src/components/quiz/datasetNormalizer.js';
import { validateNormalizedDataset } from '../src/components/quiz/datasetSchema.js';
import { QuizSession } from '../src/components/quiz/QuizSession.js';

const source = new URL('../public/data/aws-cloud-practitioner.exams.json', import.meta.url);
const raw = JSON.parse(await readFile(source, 'utf8'));
const dataset = normalizeQuizDataset(raw, { source: source.pathname });
const validation = validateNormalizedDataset(dataset);

assert.equal(validation.valid, true, validation.errors.join('\n'));

const summary = summarizeDataset(dataset);
assert.deepEqual(
  {
    examCount: summary.examCount,
    questionCount: summary.questionCount,
    singleSelectQuestions: summary.singleSelectQuestions,
    multipleSelectQuestions: summary.multipleSelectQuestions,
  },
  {
    examCount: 23,
    questionCount: 1142,
    singleSelectQuestions: 875,
    multipleSelectQuestions: 267,
  },
);

let now = 1_000;
const emitted = [];
const exam = dataset.exams[0];
const session = new QuizSession({
  questions: exam.questions.slice(0, 2),
  title: exam.title,
  shuffleQuestions: false,
  clock: () => now,
  idFactory: () => 'verification-session',
  emit: (eventName) => emitted.push(eventName),
});

session.start();
session.submit(session.current.answers);
now += 500;
session.next();
session.submit(session.current.answers);
now += 500;
session.next();

assert.equal(session.status, 'completed');
assert.equal(session.correctCount, 2);
assert.equal(session.bestStreak, 2);
assert.equal(session.summary().score, 100);
assert.ok(emitted.includes('quiz:exam-started'));
assert.ok(emitted.includes('quiz:exam-completed'));

console.log('Gameplay core verification passed.');
console.log(`Exam banks: ${summary.examCount}`);
console.log(`Questions: ${summary.questionCount}`);
console.log(`Single-select: ${summary.singleSelectQuestions}`);
console.log(`Multiple-select: ${summary.multipleSelectQuestions}`);
console.log(`Topics: ${summary.topicCount}`);
