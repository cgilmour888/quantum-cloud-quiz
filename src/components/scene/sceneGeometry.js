export const MASTER_GEOMETRY = Object.freeze({
  sourceWidth: 1672,
  sourceHeight: 941,
  productionWidth: 3840,
  productionHeight: 2160,
  aspectRatio: 16 / 9,
});

const box = (x, y, width, height) => Object.freeze({ x, y, width, height });

export const SCENE_GEOMETRY = Object.freeze({
  borderFrame: Object.freeze({
    corridors: Object.freeze({
      top: box(0, 0, 1, 142 / 941),
      right: box(1517 / 1672, 0, 155 / 1672, 1),
      bottom: box(0, 768 / 941, 1, 173 / 941),
      left: box(0, 0, 155 / 1672, 1),
    }),
    exclusions: Object.freeze({
      upperLeftGyroscope: box(20 / 1672, 17 / 941, 123 / 1672, 118 / 941),
      upperRightGyroscope: box(1529 / 1672, 17 / 941, 123 / 1672, 118 / 941),
      lowerLeftGyroscope: box(20 / 1672, 774 / 941, 123 / 1672, 155 / 941),
      lowerRightGyroscope: box(1529 / 1672, 774 / 941, 123 / 1672, 155 / 941),
      placard: box(622 / 1672, 824 / 941, 434 / 1672, 110 / 941),
      musicIcon: box(1346 / 1672, 733 / 941, 114 / 1672, 146 / 941),
    }),
  }),
  leftDashboard: box(0.075, 0.13, 0.195, 0.655),
  rightDashboard: box(0.735, 0.13, 0.195, 0.655),
  tablet: box(0.31, 0.225, 0.405, 0.505),
  holyAltar: box(0.235, 0.705, 0.53, 0.21),
  rainCloud: box(0.31, 0.01, 0.39, 0.25),
  musicIcon: box(0.805, 0.79, 0.07, 0.12),
  placard: box(0.372, 0.876, 0.26, 0.117),
});
