import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MASTER_TO_TABLET_LOCAL_HOMOGRAPHY,
  TABLET_A21R_AREA_REPORT,
  TABLET_BEVEL_SAFE_ADVISORY_POLYGON,
  TABLET_CANONICAL_ASSET_ZONES,
  TABLET_HARD_CLIP_POLYGON,
  TABLET_HOMOGRAPHY_DESTINATION_QUAD,
  TABLET_LOCAL_TO_MASTER_HOMOGRAPHY,
  TABLET_MASTER_PLANE,
  TABLET_MAXIMUM_APERTURE_POLYGON,
  TABLET_OUTER_REFERENCE_POLYGON,
  TABLET_VISIBLE_INNER_EDGE_POLYGON,
  applyHomography,
  determinant3x3,
  masterToRenderedStage,
  masterToTabletLocal,
  pointInPolygon,
  polygonArea,
  polygonContainsPolygon,
  polygonHasSelfIntersection,
  renderedStageToMaster,
  tabletLocalToMaster,
} from '../src/components/quiz/tabletMaximumApertureGeometry.js';

const polygons = [
  TABLET_OUTER_REFERENCE_POLYGON,
  TABLET_VISIBLE_INNER_EDGE_POLYGON,
  TABLET_MAXIMUM_APERTURE_POLYGON,
  TABLET_HARD_CLIP_POLYGON,
  TABLET_BEVEL_SAFE_ADVISORY_POLYGON,
];

function orientation(a, b, c) {
  const value = (b[1] - a[1]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[1] - b[1]);
  if (Math.abs(value) < 1e-8) return 0;
  return value > 0 ? 1 : 2;
}

function segmentsIntersect(a, b, c, d) {
  return orientation(a, b, c) !== orientation(a, b, d)
    && orientation(c, d, a) !== orientation(c, d, b);
}

function polygonsOverlap(a, b) {
  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b.length; j += 1) {
      if (segmentsIntersect(a[i], a[(i + 1) % a.length], b[j], b[(j + 1) % b.length])) return true;
    }
  }
  return pointInPolygon(a[0], b) || pointInPolygon(b[0], a);
}

test('A2.1R polygons remain valid inside immutable MASTER plane', () => {
  for (const polygon of polygons) {
    assert.ok(polygon.length >= 4);
    assert.equal(polygonHasSelfIntersection(polygon), false);
    assert.ok(Math.abs(polygonArea(polygon)) > 0);
    for (const [x, y] of polygon) {
      assert.ok(Number.isFinite(x) && Number.isFinite(y));
      assert.ok(x >= 0 && x <= TABLET_MASTER_PLANE.width);
      assert.ok(y >= 0 && y <= TABLET_MASTER_PLANE.height);
    }
  }
});

test('nested geometry preserves maximum tablet real estate', () => {
  assert.equal(polygonContainsPolygon(TABLET_OUTER_REFERENCE_POLYGON, TABLET_VISIBLE_INNER_EDGE_POLYGON), true);
  assert.equal(polygonContainsPolygon(TABLET_VISIBLE_INNER_EDGE_POLYGON, TABLET_MAXIMUM_APERTURE_POLYGON), true);
  assert.equal(polygonContainsPolygon(TABLET_MAXIMUM_APERTURE_POLYGON, TABLET_HARD_CLIP_POLYGON), true);
  assert.equal(polygonContainsPolygon(TABLET_HARD_CLIP_POLYGON, TABLET_BEVEL_SAFE_ADVISORY_POLYGON), true);
  assert.ok(TABLET_A21R_AREA_REPORT.maximumApertureRetention >= 0.995);
  assert.ok(TABLET_A21R_AREA_REPORT.hardClipRetention >= 0.99);
  assert.ok(TABLET_A21R_AREA_REPORT.bevelSafeAdvisoryArea < TABLET_A21R_AREA_REPORT.hardClipArea);
});

test('full-face homography is finite, invertible, and round-trips', () => {
  assert.ok(Math.abs(determinant3x3(TABLET_LOCAL_TO_MASTER_HOMOGRAPHY)) > 1e-8);
  assert.ok(Math.abs(determinant3x3(MASTER_TO_TABLET_LOCAL_HOMOGRAPHY)) > 1e-12);
  const samples = [[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0.5], [0.12, 0.77], [0.91, 0.24]];
  for (const local of samples) {
    const master = tabletLocalToMaster(local);
    const recovered = masterToTabletLocal(master);
    assert.ok(Math.hypot(recovered[0] - local[0], recovered[1] - local[1]) < 1e-9);
  }
  for (let index = 0; index < 4; index += 1) {
    const mapped = applyHomography(TABLET_LOCAL_TO_MASTER_HOMOGRAPHY, [[0, 0], [1, 0], [1, 1], [0, 1]][index]);
    assert.ok(Math.hypot(mapped[0] - TABLET_HOMOGRAPHY_DESTINATION_QUAD[index][0], mapped[1] - TABLET_HOMOGRAPHY_DESTINATION_QUAD[index][1]) < 1e-7);
  }
});

test('stage conversions preserve MASTER registration under arbitrary viewport dimensions', () => {
  const stages = [
    { left: 0, top: 0, width: 1920, height: 1080 },
    { left: 13, top: 27, width: 1440, height: 900 },
    { left: 0, top: 0, width: 3440, height: 1440 },
  ];
  const points = [[0, 0], [3840, 2160], [1950, 1040], [1320, 1484]];
  for (const stage of stages) {
    for (const master of points) {
      const rendered = masterToRenderedStage(master, stage);
      const recovered = renderedStageToMaster(rendered, stage);
      assert.ok(Math.hypot(recovered[0] - master[0], recovered[1] - master[1]) < 1e-8);
    }
  }
});

test('question and native answer assets fit inside hard clip', () => {
  assert.equal(polygonContainsPolygon(TABLET_HARD_CLIP_POLYGON, TABLET_CANONICAL_ASSET_ZONES.questionHost), true);
  for (const polygon of TABLET_CANONICAL_ASSET_ZONES.nativeAnswerEnvelopes) {
    assert.equal(polygonContainsPolygon(TABLET_HARD_CLIP_POLYGON, polygon), true);
  }
  for (const polygon of TABLET_CANONICAL_ASSET_ZONES.answerButtons) {
    assert.equal(polygonContainsPolygon(TABLET_HARD_CLIP_POLYGON, polygon), true);
  }
});

test('canonical answer hosts do not overlap their neighbors', () => {
  const buttons = TABLET_CANONICAL_ASSET_ZONES.answerButtons;
  assert.equal(buttons.length, 4);
  for (let i = 0; i < buttons.length; i += 1) {
    for (let j = i + 1; j < buttons.length; j += 1) {
      assert.equal(polygonsOverlap(buttons[i], buttons[j]), false, `answer ${i} overlaps answer ${j}`);
    }
  }
  assert.equal(TABLET_CANONICAL_ASSET_ZONES.fifthOptionStrategy, 'paginate-through-four-native-answer-buttons');
});

test('dashboard and business-card hosts remain inside tablet aperture', () => {
  assert.equal(polygonContainsPolygon(TABLET_MAXIMUM_APERTURE_POLYGON, TABLET_CANONICAL_ASSET_ZONES.dashboardPresentationHost), true);
  assert.equal(polygonContainsPolygon(TABLET_MAXIMUM_APERTURE_POLYGON, TABLET_CANONICAL_ASSET_ZONES.businessCardPresentationHost), true);
});
