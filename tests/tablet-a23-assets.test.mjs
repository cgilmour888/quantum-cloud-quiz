import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const assetNames = [
  'tablet-shadow.webp',
  'tablet-rear-shell.webp',
  'tablet-screen-surface.webp',
  'tablet-foreground-bezel.webp',
  'tablet-reflection.webp',
  'tablet-background-restoration.webp',
  'tablet-mask.png',
  'tablet-content-mask.svg',
];

test('A2.3 derivative assets and intelligence manifests physically exist', async () => {
  for (const name of assetNames) {
    await access(new URL(`../public/assets/tablet/a2.3/${name}`, import.meta.url));
  }
  await access(new URL('../reports/A2.3-TABLET-INTELLIGENCE.json', import.meta.url));
  await access(new URL('../reports/A2.3-TABLET-INTELLIGENCE.md', import.meta.url));
});

test('A2.3 never changes the protected MASTER checksum', async () => {
  const bytes = await readFile(new URL('../public/images/master/MASTER.png', import.meta.url));
  const digest = createHash('sha256').update(bytes).digest('hex');
  assert.equal(digest, '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c');
});

test('A2.3 intelligence manifest records Mode D and native 4K dimensions', async () => {
  const manifest = JSON.parse(await readFile(new URL('../reports/A2.3-TABLET-INTELLIGENCE.json', import.meta.url), 'utf8'));
  assert.equal(manifest.compositionMode, 'D');
  assert.equal(manifest.master.width, 3840);
  assert.equal(manifest.master.height, 2160);
  assert.equal(manifest.master.sha256, '5c98bd5ef760bdc04c85ca461336064b24d44456029906632474e843b6c3495c');
  assert.equal(Object.keys(manifest.assets).length, 9);
});
