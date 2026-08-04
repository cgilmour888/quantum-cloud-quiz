/**
 * TabletQuestionAnswerEngine — Phase A2.1R
 * Maximum-aperture tablet registration derived from immutable 3840×2160 MASTER.
 *
 * This module establishes the complete tablet-local coordinate world and
 * proposed canonical asset zones. It does not replace the production quiz UI,
 * animate the tablet, or alter BorderFrameEngine.
 */

export const TABLET_A21R_GEOMETRY_VERSION = 'A2.1R-maximum-aperture-v1.1.0';

export const TABLET_MASTER_PLANE = Object.freeze({
  width: 3840,
  height: 2160,
  aspectRatio: 16 / 9,
});

const freezePoint = ([x, y]) => Object.freeze([x, y]);
const freezePolygon = (points) => Object.freeze(points.map(freezePoint));

export const TABLET_OUTER_REFERENCE_POLYGON = freezePolygon([
  [1220, 470], [1510, 470], [1540, 495], [2350, 495],
  [2380, 470], [2630, 470], [2795, 620], [2795, 1450],
  [2635, 1620], [2385, 1620], [2355, 1592], [1510, 1592],
  [1480, 1620], [1215, 1620], [1075, 1460], [1075, 620],
]);

/** Exact proposed visible inner edge. No global layout margin is encoded here. */
export const TABLET_VISIBLE_INNER_EDGE_POLYGON = freezePolygon([
  [1405, 575], [1490, 575], [1518, 598], [2375, 598],
  [2402, 575], [2525, 575], [2640, 688], [2648, 830],
  [2672, 855], [2670, 1365], [2645, 1392], [2645, 1445],
  [2585, 1485], [2522, 1502], [2400, 1502], [2372, 1522],
  [1490, 1522], [1460, 1502], [1355, 1502], [1315, 1485],
  [1235, 1375], [1245, 705], [1360, 598],
]);

/** Largest credible tablet face aperture; 99.65% of visible-inner-edge area. */
export const TABLET_MAXIMUM_APERTURE_POLYGON = freezePolygon([
  [1405.24, 576], [1360.58, 598.83], [1245.99, 705.44],
  [1236, 1374.68], [1315.65, 1484.19], [1355.2, 1501],
  [1460.3, 1501], [1490.3, 1521], [2371.68, 1521],
  [2399.68, 1501], [2521.87, 1501], [2584.58, 1484.08],
  [2644, 1444.46], [2644, 1391.61], [2669, 1364.61],
  [2671, 855.4], [2647.02, 830.43], [2639.02, 688.44],
  [2524.59, 576], [2402.37, 576], [2375.37, 599],
  [1517.64, 599], [1489.64, 576],
]);

/** Micro-inset clip. Retains more than 99% of maximum-aperture area. */
export const TABLET_HARD_CLIP_POLYGON = freezePolygon([
  [1405.6, 577.5], [1361.45, 600.07], [1247.48, 706.1],
  [1237.51, 1374.2], [1316.61, 1482.97], [1355.51, 1499.5],
  [1460.76, 1499.5], [1490.76, 1519.5], [2371.2, 1519.5],
  [2399.2, 1499.5], [2521.67, 1499.5], [2583.95, 1482.69],
  [2642.5, 1443.66], [2642.5, 1391.02], [2667.5, 1364.02],
  [2669.5, 856], [2645.56, 831.06], [2637.56, 689.11],
  [2523.98, 577.5], [2402.92, 577.5], [2375.92, 600.5],
  [1517.1, 600.5], [1489.1, 577.5],
]);

/** Advisory comfort guide only. It is not the parent clip for tablet content. */
export const TABLET_BEVEL_SAFE_ADVISORY_POLYGON = freezePolygon([
  [1407.41, 585], [1365.79, 606.27], [1254.94, 709.42],
  [1245.05, 1371.82], [1321.46, 1476.88], [1357.04, 1492],
  [1463.03, 1492], [1493.03, 1512], [2368.8, 1512],
  [2396.8, 1492], [2520.67, 1492], [2580.81, 1475.77],
  [2635, 1439.65], [2635, 1388.08], [2660.02, 1361.06],
  [2661.98, 859.01], [2638.22, 834.26], [2630.23, 692.42],
  [2520.91, 585], [2405.68, 585], [2378.68, 608],
  [1514.42, 608], [1486.42, 585],
]);

/**
 * Full-face virtual plane. Its corners intentionally extend into the chamfered
 * corners; the maximum-aperture polygon performs exact clipping instead of
 * shrinking the whole coordinate world.
 */
export const TABLET_HOMOGRAPHY_DESTINATION_QUAD = freezePolygon([
  [1235, 575],
  [2640, 575],
  [2670, 1515],
  [1235, 1515],
]);

export const TABLET_LOCAL_SOURCE_QUAD = freezePolygon([
  [0, 0], [1, 0], [1, 1], [0, 1],
]);

function assertFinitePoint(point, label = 'point') {
  if (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite)) {
    throw new TypeError(`${label} must be a finite [x, y] tuple.`);
  }
}

function solveLinearSystem(matrix, vector) {
  const size = vector.length;
  const augmented = matrix.map((row, index) => [...row, vector[index]]);

  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }

    if (Math.abs(augmented[pivot][column]) < 1e-12) {
      throw new Error('Homography control points produce a singular system.');
    }

    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    const pivotValue = augmented[column][column];
    for (let index = column; index <= size; index += 1) augmented[column][index] /= pivotValue;

    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let index = column; index <= size; index += 1) {
        augmented[row][index] -= factor * augmented[column][index];
      }
    }
  }

  return augmented.map((row) => row[size]);
}

export function computeHomography(sourceQuad, destinationQuad) {
  if (sourceQuad.length !== 4 || destinationQuad.length !== 4) {
    throw new RangeError('Homography requires four source and destination points.');
  }

  const matrix = [];
  const vector = [];
  for (let index = 0; index < 4; index += 1) {
    const [x, y] = sourceQuad[index];
    const [u, v] = destinationQuad[index];
    assertFinitePoint(sourceQuad[index], `sourceQuad[${index}]`);
    assertFinitePoint(destinationQuad[index], `destinationQuad[${index}]`);
    matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    vector.push(u);
    matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    vector.push(v);
  }

  const [h11, h12, h13, h21, h22, h23, h31, h32] = solveLinearSystem(matrix, vector);
  return Object.freeze([
    Object.freeze([h11, h12, h13]),
    Object.freeze([h21, h22, h23]),
    Object.freeze([h31, h32, 1]),
  ]);
}

export function determinant3x3(matrix) {
  const [[a, b, c], [d, e, f], [g, h, i]] = matrix;
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

export function invert3x3(matrix) {
  const [[a, b, c], [d, e, f], [g, h, i]] = matrix;
  const determinant = determinant3x3(matrix);
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-12) {
    throw new Error('Homography matrix is singular.');
  }
  const k = 1 / determinant;
  return Object.freeze([
    Object.freeze([(e * i - f * h) * k, (c * h - b * i) * k, (b * f - c * e) * k]),
    Object.freeze([(f * g - d * i) * k, (a * i - c * g) * k, (c * d - a * f) * k]),
    Object.freeze([(d * h - e * g) * k, (b * g - a * h) * k, (a * e - b * d) * k]),
  ]);
}

export function applyHomography(matrix, point) {
  assertFinitePoint(point);
  const [x, y] = point;
  const denominator = matrix[2][0] * x + matrix[2][1] * y + matrix[2][2];
  if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-12) {
    throw new Error('Homography mapped the point to infinity.');
  }
  return [
    (matrix[0][0] * x + matrix[0][1] * y + matrix[0][2]) / denominator,
    (matrix[1][0] * x + matrix[1][1] * y + matrix[1][2]) / denominator,
  ];
}

export const TABLET_LOCAL_TO_MASTER_HOMOGRAPHY = computeHomography(
  TABLET_LOCAL_SOURCE_QUAD,
  TABLET_HOMOGRAPHY_DESTINATION_QUAD,
);

export const MASTER_TO_TABLET_LOCAL_HOMOGRAPHY = invert3x3(
  TABLET_LOCAL_TO_MASTER_HOMOGRAPHY,
);

export const tabletLocalToMaster = (point) => applyHomography(TABLET_LOCAL_TO_MASTER_HOMOGRAPHY, point);
export const masterToTabletLocal = (point) => applyHomography(MASTER_TO_TABLET_LOCAL_HOMOGRAPHY, point);
export const masterToNormalized = ([x, y]) => [x / TABLET_MASTER_PLANE.width, y / TABLET_MASTER_PLANE.height];
export const normalizedToMaster = ([x, y]) => [x * TABLET_MASTER_PLANE.width, y * TABLET_MASTER_PLANE.height];

export function masterToRenderedStage([x, y], stage) {
  const scaleX = stage.width / TABLET_MASTER_PLANE.width;
  const scaleY = stage.height / TABLET_MASTER_PLANE.height;
  return [stage.left + x * scaleX, stage.top + y * scaleY];
}

export function renderedStageToMaster([x, y], stage) {
  return [
    (x - stage.left) * TABLET_MASTER_PLANE.width / stage.width,
    (y - stage.top) * TABLET_MASTER_PLANE.height / stage.height,
  ];
}

export function polygonArea(polygon) {
  let twiceArea = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const [x1, y1] = polygon[index];
    const [x2, y2] = polygon[(index + 1) % polygon.length];
    twiceArea += x1 * y2 - x2 * y1;
  }
  return twiceArea / 2;
}

export function pointOnPolygonBoundary(point, polygon, tolerance = 1e-6) {
  const [px, py] = point;
  for (let index = 0; index < polygon.length; index += 1) {
    const [x1, y1] = polygon[index];
    const [x2, y2] = polygon[(index + 1) % polygon.length];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const cross = Math.abs(dx * (py - y1) - dy * (px - x1));
    const length = Math.hypot(dx, dy);
    if (length === 0 || cross / length > tolerance) continue;
    const dot = (px - x1) * dx + (py - y1) * dy;
    if (dot >= -tolerance && dot <= dx * dx + dy * dy + tolerance) return true;
  }
  return false;
}

export function pointInPolygon(point, polygon) {
  if (pointOnPolygonBoundary(point, polygon)) return true;
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

export function polygonContainsPolygon(container, candidate) {
  return candidate.every((point) => pointInPolygon(point, container));
}

export function polygonHasSelfIntersection(polygon) {
  function orientation(a, b, c) {
    const value = (b[1] - a[1]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[1] - b[1]);
    if (Math.abs(value) < 1e-9) return 0;
    return value > 0 ? 1 : 2;
  }
  function intersects(a, b, c, d) {
    return orientation(a, b, c) !== orientation(a, b, d)
      && orientation(c, d, a) !== orientation(c, d, b);
  }
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    for (let j = i + 1; j < polygon.length; j += 1) {
      if (j === i || (j + 1) % polygon.length === i || (i + 1) % polygon.length === j) continue;
      const c = polygon[j];
      const d = polygon[(j + 1) % polygon.length];
      if (intersects(a, b, c, d)) return true;
    }
  }
  return false;
}

function localRectPolygon(x0, y0, x1, y1) {
  return freezePolygon([
    tabletLocalToMaster([x0, y0]), tabletLocalToMaster([x1, y0]),
    tabletLocalToMaster([x1, y1]), tabletLocalToMaster([x0, y1]),
  ]);
}

const nativeAnswerA = freezePolygon([
  [1358.5, 883.7], [2553.8, 883.7], [2572.2, 913.8], [2559.9, 1016.8],
  [2545.2, 1042.1], [1357.2, 1042.1], [1341.2, 1008.9], [1341.2, 913.8],
]);
const nativeAnswerB = freezePolygon([
  [1349.3, 1030.6], [2559.4, 1030.6], [2576.8, 1062.3], [2564.4, 1163.7],
  [2549.5, 1189], [1349.3, 1189], [1334.4, 1155.8], [1334.4, 1059.2],
]);
const nativeAnswerC = freezePolygon([
  [1342.5, 1179.9], [2566.1, 1179.9], [2583.7, 1211.5], [2571.2, 1312.9],
  [2556.1, 1338.2], [1342.5, 1338.2], [1327.5, 1305], [1327.5, 1208.4],
]);
const nativeAnswerD = freezePolygon([
  [1335.8, 1329.1], [2572.8, 1329.1], [2590.6, 1360.7], [2577.9, 1462.1],
  [2562.7, 1487.4], [1335.8, 1487.4], [1320.6, 1454.2], [1320.6, 1357.6],
]);

/* Non-overlapping content/hit hosts nested inside the native button envelopes. */
const answerA = freezePolygon([
  [1358.5, 886], [2553.8, 886], [2570, 914], [2558, 1000],
  [2545, 1022], [1357, 1022], [1343, 998], [1343, 914],
]);
const answerB = freezePolygon([
  [1349, 1041], [2559, 1041], [2574, 1063], [2562, 1155],
  [2549, 1177], [1349, 1177], [1336, 1154], [1336, 1061],
]);
const answerC = freezePolygon([
  [1343, 1192], [2566, 1192], [2581, 1212], [2569, 1303],
  [2556, 1325], [1343, 1325], [1330, 1303], [1330, 1210],
]);
const answerD = freezePolygon([
  [1336, 1342], [2572, 1342], [2588, 1361], [2575, 1459],
  [2562, 1484], [1336, 1484], [1323, 1452], [1323, 1360],
]);

export const TABLET_CANONICAL_ASSET_ZONES = Object.freeze({
  fullSurfaceHost: TABLET_MAXIMUM_APERTURE_POLYGON,
  interactiveSafeBounds: TABLET_HARD_CLIP_POLYGON,
  questionHost: freezePolygon([
    [1520, 604], [2370, 604], [2480, 695], [2480, 875], [1385, 875], [1385, 700], [1480, 604],
  ]),
  questionTitle: freezePolygon([[1550.2, 589.9], [2331.1, 589.9], [2331.1, 713.9], [1550.2, 713.9]]),
  questionPrompt: freezePolygon([[1401, 702.4], [2480.4, 702.4], [2480.4, 879.1], [1401, 879.1]]),
  nativeAnswerEnvelopes: Object.freeze([nativeAnswerA, nativeAnswerB, nativeAnswerC, nativeAnswerD]),
  answerButtons: Object.freeze([answerA, answerB, answerC, answerD]),
  dashboardPresentationHost: localRectPolygon(0.07, 0.08, 0.94, 0.94),
  businessCardPresentationHost: localRectPolygon(0.13, 0.12, 0.87, 0.88),
  fifthOptionStrategy: 'paginate-through-four-native-answer-buttons',
});

export const TABLET_A21R_AREA_REPORT = Object.freeze({
  visibleInnerEdgeArea: Math.abs(polygonArea(TABLET_VISIBLE_INNER_EDGE_POLYGON)),
  maximumApertureArea: Math.abs(polygonArea(TABLET_MAXIMUM_APERTURE_POLYGON)),
  hardClipArea: Math.abs(polygonArea(TABLET_HARD_CLIP_POLYGON)),
  bevelSafeAdvisoryArea: Math.abs(polygonArea(TABLET_BEVEL_SAFE_ADVISORY_POLYGON)),
  maximumApertureRetention: Math.abs(polygonArea(TABLET_MAXIMUM_APERTURE_POLYGON))
    / Math.abs(polygonArea(TABLET_VISIBLE_INNER_EDGE_POLYGON)),
  hardClipRetention: Math.abs(polygonArea(TABLET_HARD_CLIP_POLYGON))
    / Math.abs(polygonArea(TABLET_MAXIMUM_APERTURE_POLYGON)),
});
