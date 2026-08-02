import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { normalizeQuizDataset } from '../src/components/quiz/datasetNormalizer.js';
import { paginateOptions } from '../src/components/quiz/quizViewModel.js';
import {
  DASHBOARD_CONTROLS,
  METRIC_FIELDS,
  TABLET_REGIONS,
  validateGeometryRegion,
} from '../src/components/quiz/tabletGeometry.js';

const root = process.cwd();
const expectedMasterSha = '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c';
const requiredFiles = [
  'src/components/quiz/QuizInterface.jsx',
  'src/components/quiz/dashboardModels.js',
  'src/components/quiz/quizViewModel.js',
  'src/components/quiz/tabletGeometry.js',
  'src/hooks/useQuizController.js',
  'src/styles/quiz-interface.css',
  'tests/quiz-view-model.test.mjs',
  'tests/tablet-geometry.test.mjs',
  'tests/dashboard-models.test.mjs',
];

for (const relativePath of requiredFiles) {
  const metadata = await stat(resolve(root, relativePath));
  if (!metadata.isFile() || metadata.size === 0) {
    throw new Error(`R2 Gates file is missing or empty: ${relativePath}`);
  }
}

const master = await readFile(resolve(root, 'public/images/master/MASTER.png'));
const masterSha = createHash('sha256').update(master).digest('hex');
if (masterSha !== expectedMasterSha) {
  throw new Error(`MASTER integrity mismatch: ${masterSha}`);
}

const scene = await readFile(resolve(root, 'src/components/scene/Scene.jsx'), 'utf8');
if (!scene.includes('<QuizInterface eventTargetRef={stageRef} />')) {
  throw new Error('Scene.jsx does not mount the corrected live QuizInterface.');
}
if (!scene.includes('scene-layer--border-frame')) {
  throw new Error('The validated dedicated border-frame canvas was removed.');
}

const css = await readFile(resolve(root, 'src/styles/quiz-interface.css'), 'utf8');
const requiredCssTokens = [
  '.qcq-tablet-surface',
  '.qcq-answer-veil',
  '.qcq-dashboard-hit',
  '.qcq-metric-value',
  "data-calibration='true'",
];
for (const token of requiredCssTokens) {
  if (!css.includes(token)) throw new Error(`Corrected R2 stylesheet is missing ${token}.`);
}
for (const forbidden of ['.quiz-tablet {', 'border-radius: 999px', 'ui-sans-serif']) {
  if (css.includes(forbidden)) throw new Error(`Rejected R2 visual pattern remains: ${forbidden}`);
}

const surfaceRule = css.match(/\.qcq-tablet-surface\s*,[\s\S]*?\{([\s\S]*?)\}/)?.[1] ?? '';
if (/background\s*:|border\s*:|box-shadow\s*:/.test(surfaceRule)) {
  throw new Error('The tablet surface paints a replacement panel instead of localized veils.');
}

const geometryRegions = [
  TABLET_REGIONS.title,
  TABLET_REGIONS.prompt,
  TABLET_REGIONS.progress,
  TABLET_REGIONS.pager,
  ...TABLET_REGIONS.rows.flatMap((row) => [row.hit, row.text, row.badge]),
  ...METRIC_FIELDS.map((field) => field.rect),
  ...DASHBOARD_CONTROLS.map((control) => control.rect),
];
if (geometryRegions.some((region) => !validateGeometryRegion(region))) {
  throw new Error('One or more R2 geometry regions leave the MASTER coordinate plane.');
}

const rawDataset = JSON.parse(await readFile(resolve(root, 'public/data/aws-cloud-practitioner.exams.json'), 'utf8'));
const dataset = normalizeQuizDataset(rawDataset, { source: 'verification' });
const fiveOptionQuestions = dataset.exams
  .flatMap((exam) => exam.questions)
  .filter((question) => question.options.length === 5);
if (fiveOptionQuestions.length !== 264) {
  throw new Error(`Expected 264 five-option questions; found ${fiveOptionQuestions.length}.`);
}
for (const question of fiveOptionQuestions) {
  const first = paginateOptions(question.options, 0);
  const second = paginateOptions(question.options, 1);
  if (first.visible.length !== 4 || second.visible.length !== 1 || second.visible[0].key !== 'E') {
    throw new Error(`Option pagination failed for ${question.id}.`);
  }
}

console.log('Gameplay Restoration R2 Gates 1–6 verification passed.');
console.log(`MASTER SHA-256: ${masterSha}`);
console.log(`Tablet rows: ${TABLET_REGIONS.rows.length}`);
console.log(`Dashboard controls: ${DASHBOARD_CONTROLS.length}`);
console.log(`Metric fields: ${METRIC_FIELDS.length}`);
console.log(`Five-option questions preserved: ${fiveOptionQuestions.length}`);
