import {
  TABLET_MASTER_PLANE,
  TABLET_HARD_CLIP_POLYGON,
  masterToTabletLocal,
} from './tabletMaximumApertureGeometry.js';

export const A23_VERSION = 'A2.3-pixel-locked-modular-tablet-v1.0.1';
export const A23_LOCAL_PLANE = Object.freeze({ width: 1000, height: 1000 });
export const A23_MASTER_CROP = Object.freeze({ x: 1000, y: 400, width: 1900, height: 1300 });
export const A23_CONTENT_QUAD = Object.freeze([
  Object.freeze([1235, 575]),
  Object.freeze([2640, 575]),
  Object.freeze([2670, 1515]),
  Object.freeze([1235, 1515]),
]);

// Source local plane (0..1000) mapped once to the approved master-space quad.
export const A23_CONTENT_MATRIX3D = Object.freeze([
  1.405, 0, 0, 0,
  -0.025818815331010457, 0.9083275261324042, 0, -0.000020905923344947736,
  0, 0, 1, 0,
  1235, 575, 0, 1,
]);

function masterRectToLocal({ x, y, width, height }) {
  const corners = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
  ].map((point) => masterToTabletLocal(point).map((value) => value * 1000));
  const xs = corners.map(([cx]) => cx);
  const ys = corners.map(([, cy]) => cy);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  return Object.freeze({
    x: left,
    y: top,
    width: Math.max(...xs) - left,
    height: Math.max(...ys) - top,
  });
}

const SOURCE_W = 1672;
const SOURCE_H = 941;
const scaleRect = (x, y, width, height) => ({
  x: x * TABLET_MASTER_PLANE.width / SOURCE_W,
  y: y * TABLET_MASTER_PLANE.height / SOURCE_H,
  width: width * TABLET_MASTER_PLANE.width / SOURCE_W,
  height: height * TABLET_MASTER_PLANE.height / SOURCE_H,
});

const row = (slot, bakedKey, hit, text, badge, safeHit = null) => Object.freeze({
  slot,
  bakedKey,
  hit: safeHit ? Object.freeze(safeHit) : masterRectToLocal(scaleRect(...hit)),
  text: masterRectToLocal(scaleRect(...text)),
  badge: masterRectToLocal(scaleRect(...badge)),
});

export const A23_REGIONS = Object.freeze({
  title: masterRectToLocal(scaleRect(675, 257, 340, 54)),
  prompt: masterRectToLocal(scaleRect(610, 306, 470, 77)),
  progress: Object.freeze({ x: 112.4, y: 956, width: 184.33, height: 38 }),
  pager: Object.freeze({ x: 627.44, y: 954, width: 286.03, height: 42 }),
  rows: Object.freeze([
    row(0, 'A', [584, 385, 536, 69], [650, 389, 460, 62], [590, 391, 70, 58], { x: 74.82, y: 333.12, width: 870.33, height: 154 }),
    row(1, 'B', [581, 449, 541, 69], [650, 453, 463, 62], [586, 455, 72, 59], { x: 69.74, y: 492, width: 875.52, height: 152 }),
    row(2, 'C', [578, 514, 547, 69], [650, 518, 468, 62], [583, 520, 73, 59], { x: 64.69, y: 648, width: 882.25, height: 150 }),
    row(3, 'D', [575, 579, 553, 69], [650, 583, 473, 62], [579, 585, 75, 59], { x: 59.67, y: 804, width: 888.94, height: 150 }),
  ]),
});

export const A23_HARD_CLIP_LOCAL = Object.freeze(TABLET_HARD_CLIP_POLYGON.map((point) => (
  Object.freeze(masterToTabletLocal(point).map((value) => value * 1000))
)));

export const A23_HARD_CLIP_CSS = `polygon(${A23_HARD_CLIP_LOCAL
  .map(([x, y]) => `${(x / 10).toFixed(4)}% ${(y / 10).toFixed(4)}%`)
  .join(', ')})`;

export const localGeometryStyle = (rect) => ({
  left: `${rect.x}px`,
  top: `${rect.y}px`,
  width: `${rect.width}px`,
  height: `${rect.height}px`,
});

export const matrix3dString = () => `matrix3d(${A23_CONTENT_MATRIX3D.join(',')})`;
