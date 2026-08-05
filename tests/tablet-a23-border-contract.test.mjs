import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const verifierPaths = [
  'scripts/verify-border-containment-r5-5-1.mjs',
  'scripts/verify-border-left-bridge-r5-5-2.mjs',
  'scripts/verify-border-microbridge-r5-5-3.mjs',
];

const frozenQuizHash = 'e10221c2c482bfec4e7022d2e357fe8bc9f459a8fb5db7dd8a02b0ec442f74b0';

for (const verifierPath of verifierPaths) {
  test(`A2.3 ${verifierPath} protects placard behavior semantically`, async () => {
    const source = await readFile(verifierPath, 'utf8');
    assert.doesNotMatch(source, new RegExp(frozenQuizHash));
    assert.match(source, /Independent placard semantic contract changed/);
    assert.match(source, /SceneEvents\\\.BUSINESS_CARD_OPENED/);
    assert.match(source, /SceneEvents\\\.BUSINESS_CARD_CLOSED/);
    assert.match(source, /geometryAuthority:\\s\*'lower-purple-trim'/);
    assert.match(source, /<PlacardControl/);
    assert.match(source, /<ProfileCardSurface/);
  });
}
