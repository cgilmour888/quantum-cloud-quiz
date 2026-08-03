const MASTER_WIDTH = 3840;
const MASTER_HEIGHT = 2160;

export const PLACARD_MASTER_PLANE = Object.freeze({
  width: MASTER_WIDTH,
  height: MASTER_HEIGHT,
});

/**
 * R5.5 physical authority.
 *
 * This polyline is sampled directly from the lowest continuous purple trim
 * that belongs to the placard itself. It is deliberately independent of both
 * the stage midpoint and the optical center of the CARL GILMOUR lettering.
 */
export const PLACARD_LOWER_TRIM_PATH = Object.freeze([
  Object.freeze([1380, 2077]),
  Object.freeze([1400, 2079]),
  Object.freeze([1420, 2090]),
  Object.freeze([1440, 2111]),
  Object.freeze([1460, 2132]),
  Object.freeze([1480, 2135]),
  Object.freeze([1500, 2141]),
  Object.freeze([1520, 2146]),
  Object.freeze([1540, 2149]),
  Object.freeze([1560, 2148]),
  Object.freeze([1580, 2135]),
  Object.freeze([1600, 2146]),
  Object.freeze([1620, 2143]),
  Object.freeze([1640, 2143]),
  Object.freeze([1660, 2144]),
  Object.freeze([1680, 2143]),
  Object.freeze([1700, 2142]),
  Object.freeze([1720, 2142]),
  Object.freeze([1740, 2142]),
  Object.freeze([1760, 2142]),
  Object.freeze([1780, 2146]),
  Object.freeze([1800, 2146]),
  Object.freeze([1820, 2142]),
  Object.freeze([1840, 2141]),
  Object.freeze([1860, 2145]),
  Object.freeze([1880, 2145]),
  Object.freeze([1900, 2148]),
  Object.freeze([1920, 2148]),
  Object.freeze([1940, 2148]),
  Object.freeze([1960, 2148]),
  Object.freeze([1980, 2140]),
  Object.freeze([2000, 2148]),
  Object.freeze([2020, 2148]),
  Object.freeze([2040, 2146]),
  Object.freeze([2060, 2144]),
  Object.freeze([2080, 2145]),
  Object.freeze([2100, 2145]),
  Object.freeze([2120, 2145]),
  Object.freeze([2140, 2146]),
  Object.freeze([2160, 2147]),
  Object.freeze([2180, 2146]),
  Object.freeze([2200, 2144]),
  Object.freeze([2220, 2148]),
  Object.freeze([2240, 2146]),
  Object.freeze([2260, 2146]),
  Object.freeze([2280, 2145]),
  Object.freeze([2300, 2145]),
  Object.freeze([2320, 2149]),
  Object.freeze([2340, 2150]),
  Object.freeze([2360, 2150]),
  Object.freeze([2380, 2143]),
  Object.freeze([2400, 2141]),
  Object.freeze([2420, 2140]),
  Object.freeze([2440, 2136]),
  Object.freeze([2460, 2130]),
  Object.freeze([2480, 2114])
]);

export const PLACARD_PHYSICAL_POLYGON = Object.freeze([
  Object.freeze([1380, 2077]),
  Object.freeze([1390, 2008]),
  Object.freeze([1470, 1930]),
  Object.freeze([2385, 1930]),
  Object.freeze([2470, 2005]),
  Object.freeze([2480, 2114]),
  Object.freeze([2400, 2158]),
  Object.freeze([1450, 2158])
]);

export const PLACARD_FACE_POLYGON = Object.freeze([
  Object.freeze([1460, 1992]),
  Object.freeze([2378, 1992]),
  Object.freeze([2435, 2028]),
  Object.freeze([2435, 2075]),
  Object.freeze([2378, 2108]),
  Object.freeze([1460, 2108]),
  Object.freeze([1405, 2075]),
  Object.freeze([1405, 2028])
]);

function boundsOf(points) {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);
  return Object.freeze({
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    right,
    bottom,
  });
}

export const PLACARD_PHYSICAL_BOUNDS = boundsOf(PLACARD_PHYSICAL_POLYGON);

export const PLACARD_TRIM_TERMINAL_CENTER = Object.freeze([
  (PLACARD_LOWER_TRIM_PATH[0][0] + PLACARD_LOWER_TRIM_PATH.at(-1)[0]) / 2,
  (PLACARD_LOWER_TRIM_PATH[0][1] + PLACARD_LOWER_TRIM_PATH.at(-1)[1]) / 2,
]);

// The focus viewport is derived from the physical trim terminals and placard
// bounds. It is intentionally independent of the 3840-plane midpoint and the
// optical spacing of the baked name.
export const PLACARD_FOCUS_VIEWBOX = Object.freeze({
  x: PLACARD_PHYSICAL_BOUNDS.x - 170,
  y: 1860,
  width: PLACARD_PHYSICAL_BOUNDS.width + 340,
  height: 300,
});


export function formatPoints(points) {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

export function formatViewBox(viewBox = PLACARD_FOCUS_VIEWBOX) {
  return `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;
}

export function placardHitStyle() {
  const bounds = PLACARD_PHYSICAL_BOUNDS;
  const localPolygon = PLACARD_PHYSICAL_POLYGON.map(([x, y]) => {
    const localX = ((x - bounds.x) / bounds.width) * 100;
    const localY = ((y - bounds.y) / bounds.height) * 100;
    return `${localX.toFixed(3)}% ${localY.toFixed(3)}%`;
  }).join(', ');

  return Object.freeze({
    left: `${(bounds.x / MASTER_WIDTH) * 100}%`,
    top: `${(bounds.y / MASTER_HEIGHT) * 100}%`,
    width: `${(bounds.width / MASTER_WIDTH) * 100}%`,
    height: `${(bounds.height / MASTER_HEIGHT) * 100}%`,
    clipPath: `polygon(${localPolygon})`,
  });
}

export function computePolylineMidpoint(points = PLACARD_LOWER_TRIM_PATH) {
  if (points.length < 2) return points[0] ?? [0, 0];

  const lengths = [];
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    const [x1, y1] = points[index - 1];
    const [x2, y2] = points[index];
    const length = Math.hypot(x2 - x1, y2 - y1);
    lengths.push(length);
    total += length;
  }

  const target = total / 2;
  let traveled = 0;
  for (let index = 0; index < lengths.length; index += 1) {
    const next = traveled + lengths[index];
    if (next >= target) {
      const ratio = (target - traveled) / lengths[index];
      const [x1, y1] = points[index];
      const [x2, y2] = points[index + 1];
      return [
        x1 + (x2 - x1) * ratio,
        y1 + (y2 - y1) * ratio,
      ];
    }
    traveled = next;
  }

  return points.at(-1);
}

export const PLACARD_TRIM_ARC_MIDPOINT = Object.freeze(
  computePolylineMidpoint(PLACARD_LOWER_TRIM_PATH),
);
