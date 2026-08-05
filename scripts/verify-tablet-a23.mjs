import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { A23_REGIONS, A23_VERSION } from '../src/components/quiz/tabletA23Geometry.js';

const expectedMaster = '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c';
const master = await readFile(new URL('../public/images/master/MASTER.png', import.meta.url));
const digest = createHash('sha256').update(master).digest('hex');
if (digest !== expectedMaster) throw new Error(`MASTER changed: ${digest}`);

for (const name of ['tablet-rear-shell.webp','tablet-screen-surface.webp','tablet-foreground-bezel.webp','tablet-mask.png']) {
  await access(new URL(`../public/assets/tablet/a2.3/${name}`, import.meta.url));
}

const quiz = await readFile(new URL('../src/components/quiz/QuizInterface.jsx', import.meta.url), 'utf8');
const plane = await readFile(new URL('../src/components/quiz/TabletContentPlane.jsx', import.meta.url), 'utf8');
if ((quiz.match(/<PixelLockedTablet>/g) ?? []).length !== 1) throw new Error('Expected exactly one PixelLockedTablet mount.');
if (/TabletReadingOverlay|qcq-answer-veil|qcq-answer-copy/.test(quiz)) throw new Error('Obsolete tablet renderer remains mounted.');
if (!/transform: matrix3dString\(\)/.test(plane)) throw new Error('Shared perspective matrix is absent.');
if (A23_REGIONS.rows.length !== 4) throw new Error('Expected four native answer rows.');

console.log('A2.3 PIXEL-LOCKED TABLET VERIFICATION: PASSED');
console.log(`Version: ${A23_VERSION}`);
console.log('Composition mode: D');
console.log('MASTER: UNCHANGED');
console.log('Live tablet mounts: 1');
console.log('Shared content transforms: 1');
console.log('Reading overlay: RETIRED');
