export const MASTER_GEOMETRY = Object.freeze({
  sourceWidth: 1672,
  sourceHeight: 941,
  productionWidth: 3840,
  productionHeight: 2160,
  aspectRatio: 16 / 9,
});

// Geometry is normalized to a 0..1 coordinate space. These values are initial
// calibration regions only; each engine must pass a static alignment review
// before animation is activated.
export const SCENE_GEOMETRY = Object.freeze({
  borderFrame: { x: 0.0, y: 0.0, width: 1.0, height: 1.0 },
  leftDashboard: { x: 0.075, y: 0.13, width: 0.195, height: 0.655 },
  rightDashboard: { x: 0.735, y: 0.13, width: 0.195, height: 0.655 },
  tablet: { x: 0.31, y: 0.225, width: 0.405, height: 0.505 },
  holyAltar: { x: 0.235, y: 0.705, width: 0.53, height: 0.21 },
  rainCloud: { x: 0.31, y: 0.01, width: 0.39, height: 0.25 },
  musicIcon: { x: 0.805, y: 0.79, width: 0.07, height: 0.12 },
  placard: { x: 0.38, y: 0.89, width: 0.24, height: 0.095 },
});
