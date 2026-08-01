import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const expected = '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c';
const file = new URL('../public/images/master/MASTER.png', import.meta.url);
const buffer = await readFile(file);
const actual = createHash('sha256').update(buffer).digest('hex');

if (actual !== expected) {
  console.error('MASTER integrity verification failed.');
  console.error(`Expected: ${expected}`);
  console.error(`Actual:   ${actual}`);
  process.exit(1);
}

console.log(`MASTER integrity verified: ${actual}`);
