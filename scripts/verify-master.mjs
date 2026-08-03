import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const protectedAssets = Object.freeze({
  'MASTER_SOURCE_1672x941.png': '2794895be5d868cfb029d1c52a60b73186ea8481924369d8fb9ba7c4da2f4b89',
  'MASTER.png': '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c',
  'MASTER.webp': '9f17dd151b2abb706ef5633e298cb0d6d67327b6f14f734e274794451f739a5d',
});

for (const [name, expected] of Object.entries(protectedAssets)) {
  const file = new URL(`../public/images/master/${name}`, import.meta.url);
  const buffer = await readFile(file);
  const actual = createHash('sha256').update(buffer).digest('hex');

  if (actual !== expected) {
    console.error(`MASTER integrity verification failed: ${name}`);
    console.error(`Expected: ${expected}`);
    console.error(`Actual:   ${actual}`);
    process.exit(1);
  }

  console.log(`MASTER integrity verified: ${name} ${actual}`);
}
