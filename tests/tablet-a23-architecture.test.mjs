import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('A2.3 mounts exactly one PixelLockedTablet and retires the reading overlay', async () => {
  const source = await read('../src/components/quiz/QuizInterface.jsx');
  assert.equal((source.match(/<PixelLockedTablet>/g) ?? []).length, 1);
  assert.equal(source.includes('TabletReadingOverlay'), false);
  assert.equal(source.includes('qcq-answer-veil'), false);
  assert.equal(source.includes('qcq-answer-copy'), false);
});

test('A2.3 applies perspective only at the shared content plane', async () => {
  const plane = await read('../src/components/quiz/TabletContentPlane.jsx');
  const answer = await read('../src/components/quiz/TabletAnswerOption.jsx');
  const question = await read('../src/components/quiz/TabletQuestionRegion.jsx');
  assert.match(plane, /transform: matrix3dString\(\)/);
  assert.equal(answer.includes('matrix3d'), false);
  assert.equal(question.includes('matrix3d'), false);
});

test('A2.3 answer copy has explicit paint authority above its neutralizer', async () => {
  const css = await read('../src/styles/quiz-interface.css');
  assert.match(css, /\.qcq-a23-answer-neutralizer[\s\S]*z-index:\s*10/);
  assert.match(css, /\.qcq-a23-answer-copy[\s\S]*z-index:\s*14/);
  assert.match(css, /\.qcq-a23-answer-copy[\s\S]*opacity:\s*1/);
  assert.match(css, /\.qcq-a23-answer-copy[\s\S]*visibility:\s*visible/);
  assert.match(css, /mix-blend-mode:\s*normal/);
});

test('A2.3 contains no dwell, hover expansion, or full-tablet reading state', async () => {
  const files = await Promise.all([
    read('../src/components/quiz/PixelLockedTablet.jsx'),
    read('../src/components/quiz/TabletContentPlane.jsx'),
    read('../src/components/quiz/TabletAnswerOption.jsx'),
    read('../src/components/quiz/TabletQuestionRegion.jsx'),
  ]);
  const joined = files.join('\n');
  assert.equal(/dwell|press-and-hold|reading-overlay|TabletReadingOverlay/i.test(joined), false);
});
