import {
  PLACARD_FACE_POLYGON,
  PLACARD_FOCUS_VIEWBOX,
  PLACARD_LOWER_TRIM_PATH,
  PLACARD_MASTER_PLANE,
  PLACARD_PHYSICAL_BOUNDS,
  PLACARD_PHYSICAL_POLYGON,
  PLACARD_TRIM_ARC_MIDPOINT,
  PLACARD_TRIM_TERMINAL_CENTER,
  formatPoints,
  formatViewBox as formatPlacardViewBox,
} from '../placard/placardGeometry.js';

export const MASTER_PLANE = Object.freeze({
  x: 0,
  y: 0,
  width: PLACARD_MASTER_PLANE.width,
  height: PLACARD_MASTER_PLANE.height,
  centerX: PLACARD_MASTER_PLANE.width / 2,
  centerY: PLACARD_MASTER_PLANE.height / 2,
});

// Backward-compatible names retained for historical verification scripts.
// R5.5 no longer treats this face center as the universal placard authority.
export const NAMEPLATE_FACE_POLYGON = PLACARD_FACE_POLYGON;
export const NAMEPLATE_FACE_BOUNDS = Object.freeze({
  x: Math.min(...PLACARD_FACE_POLYGON.map(([x]) => x)),
  y: Math.min(...PLACARD_FACE_POLYGON.map(([, y]) => y)),
  width: Math.max(...PLACARD_FACE_POLYGON.map(([x]) => x))
    - Math.min(...PLACARD_FACE_POLYGON.map(([x]) => x)),
  height: Math.max(...PLACARD_FACE_POLYGON.map(([, y]) => y))
    - Math.min(...PLACARD_FACE_POLYGON.map(([, y]) => y)),
  centerX: PLACARD_TRIM_TERMINAL_CENTER[0],
  centerY: PLACARD_PHYSICAL_BOUNDS.y + PLACARD_PHYSICAL_BOUNDS.height / 2,
});

export const LOWER_CENTER_FOCUS_VIEWBOX = Object.freeze({
  ...PLACARD_FOCUS_VIEWBOX,
  centerX: PLACARD_FOCUS_VIEWBOX.x + PLACARD_FOCUS_VIEWBOX.width / 2,
  centerY: PLACARD_FOCUS_VIEWBOX.y + PLACARD_FOCUS_VIEWBOX.height / 2,
});

export const BORDER_PROOF_ASSETS = Object.freeze({
  master: 'images/master/MASTER.png',
  purpleMask: 'images/master/derived/border-frame/source/purple-border-production-r5.5.2.png',
});

export const PLACARD_PROOF_GEOMETRY = Object.freeze({
  trimPath: PLACARD_LOWER_TRIM_PATH,
  trimMidpoint: PLACARD_TRIM_ARC_MIDPOINT,
  trimTerminalCenter: PLACARD_TRIM_TERMINAL_CENTER,
  physicalPolygon: PLACARD_PHYSICAL_POLYGON,
  physicalBounds: PLACARD_PHYSICAL_BOUNDS,
  facePolygon: PLACARD_FACE_POLYGON,
});

export function formatViewBox(viewBox) {
  return formatPlacardViewBox(viewBox);
}

export function formatPolygon(points = NAMEPLATE_FACE_POLYGON) {
  return formatPoints(points);
}
