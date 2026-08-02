import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DASHBOARD_CONTROLS,
  METRIC_FIELDS,
  TABLET_REGIONS,
  geometryStyle,
  validateGeometryRegion,
} from '../src/components/quiz/tabletGeometry.js';

test('all gate geometry remains inside the immutable MASTER coordinate plane', () => {
  const regions = [
    TABLET_REGIONS.title,
    TABLET_REGIONS.prompt,
    TABLET_REGIONS.progress,
    TABLET_REGIONS.pager,
    ...TABLET_REGIONS.rows.flatMap((row) => [row.hit, row.text, row.badge]),
    ...METRIC_FIELDS.map((field) => field.rect),
    ...DASHBOARD_CONTROLS.map((control) => control.rect),
  ];

  for (const region of regions) assert.equal(validateGeometryRegion(region), true);
});

test('geometry conversion produces full-stage percentage coordinates', () => {
  const style = geometryStyle({ x: 836, y: 470.5, width: 167.2, height: 94.1 });
  assert.equal(style.left, '50%');
  assert.equal(style.top, '50%');
  assert.equal(style.width, '10%');
  assert.equal(style.height, '10%');
});

test('four original answer rows and all dashboard controls are mapped', () => {
  assert.deepEqual(TABLET_REGIONS.rows.map((row) => row.bakedKey), ['A', 'B', 'C', 'D']);
  assert.equal(DASHBOARD_CONTROLS.length, 8);
  assert.equal(METRIC_FIELDS.length, 7);
});
