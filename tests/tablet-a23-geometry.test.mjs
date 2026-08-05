import test from 'node:test';
import assert from 'node:assert/strict';
import {
  A23_CONTENT_MATRIX3D,
  A23_LOCAL_PLANE,
  A23_REGIONS,
  A23_VERSION,
} from '../src/components/quiz/tabletA23Geometry.js';

function inside(rect) {
  return rect.x >= 0 && rect.y >= 0 && rect.width > 0 && rect.height > 0
    && rect.x + rect.width <= A23_LOCAL_PLANE.width + 0.01
    && rect.y + rect.height <= A23_LOCAL_PLANE.height + 0.01;
}

function overlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x
    && a.y < b.y + b.height && a.y + a.height > b.y;
}

test('A2.3 defines one stable 1000×1000 content plane and one matrix3d', () => {
  assert.equal(A23_VERSION, 'A2.3-pixel-locked-modular-tablet-v1.0.1');
  assert.deepEqual(A23_LOCAL_PLANE, { width: 1000, height: 1000 });
  assert.equal(A23_CONTENT_MATRIX3D.length, 16);
  assert.ok(A23_CONTENT_MATRIX3D.every(Number.isFinite));
});

test('A2.3 question, answer, and footer hosts remain inside the local plane', () => {
  assert.ok(inside(A23_REGIONS.title));
  assert.ok(inside(A23_REGIONS.prompt));
  assert.ok(inside(A23_REGIONS.progress));
  assert.ok(inside(A23_REGIONS.pager));
  for (const row of A23_REGIONS.rows) {
    assert.ok(inside(row.hit));
    assert.ok(inside(row.text));
    assert.ok(inside(row.badge));
  }
});

test('A2.3 answer text hosts never collide and question stays above Answer A', () => {
  assert.equal(overlap(A23_REGIONS.prompt, A23_REGIONS.rows[0].hit), false);
  for (let index = 0; index < A23_REGIONS.rows.length - 1; index += 1) {
    assert.equal(overlap(A23_REGIONS.rows[index].text, A23_REGIONS.rows[index + 1].text), false);
    assert.equal(overlap(A23_REGIONS.rows[index].hit, A23_REGIONS.rows[index + 1].hit), false);
  }
  assert.equal(overlap(A23_REGIONS.rows[3].hit, A23_REGIONS.progress), false);
});
