const MASTER_WIDTH = 1672;
const MASTER_HEIGHT = 941;

function freezeRect(x, y, width, height, clipPath = null) {
  return Object.freeze({ x, y, width, height, clipPath });
}

function freezeControl(id, label, tone, rect, panel) {
  return Object.freeze({ id, label, tone, rect, panel });
}

export const TABLET_MASTER_GEOMETRY = Object.freeze({
  width: MASTER_WIDTH,
  height: MASTER_HEIGHT,
});

/*
 * All values are measured directly against MASTER_SOURCE_1672x941.png.
 * They intentionally target only baked text/value areas. The original frame,
 * answer borders, badges, circuitry, and dashboard labels remain uncovered.
 */
export const TABLET_REGIONS = Object.freeze({
  title: freezeRect(675, 257, 340, 54),
  prompt: freezeRect(610, 306, 470, 77),
  progress: freezeRect(608, 645, 115, 24),
  pager: freezeRect(930, 643, 178, 28),
  rows: Object.freeze([
    Object.freeze({
      slot: 0,
      bakedKey: 'A',
      hit: freezeRect(584, 385, 536, 69, 'polygon(1.4% 0, 98.5% 0, 100% 19%, 99% 84%, 97.8% 100%, 1.3% 100%, 0 79%, 0 19%)'),
      text: freezeRect(650, 389, 460, 62, 'polygon(0.5% 0, 99% 0, 100% 18%, 99% 84%, 98% 100%, 0 100%)'),
      badge: freezeRect(590, 391, 70, 58, 'polygon(14% 0, 88% 0, 100% 18%, 90% 91%, 78% 100%, 8% 100%, 0 78%, 3% 17%)'),
    }),
    Object.freeze({
      slot: 1,
      bakedKey: 'B',
      hit: freezeRect(581, 449, 541, 69, 'polygon(1.2% 0, 98.6% 0, 100% 20%, 99% 84%, 97.8% 100%, 1.2% 100%, 0 79%, 0 18%)'),
      text: freezeRect(650, 453, 463, 62, 'polygon(0.5% 0, 99% 0, 100% 18%, 99% 84%, 98% 100%, 0 100%)'),
      badge: freezeRect(586, 455, 72, 59, 'polygon(14% 0, 88% 0, 100% 18%, 90% 91%, 78% 100%, 8% 100%, 0 78%, 3% 17%)'),
    }),
    Object.freeze({
      slot: 2,
      bakedKey: 'C',
      hit: freezeRect(578, 514, 547, 69, 'polygon(1.2% 0, 98.6% 0, 100% 20%, 99% 84%, 97.8% 100%, 1.2% 100%, 0 79%, 0 18%)'),
      text: freezeRect(650, 518, 468, 62, 'polygon(0.5% 0, 99% 0, 100% 18%, 99% 84%, 98% 100%, 0 100%)'),
      badge: freezeRect(583, 520, 73, 59, 'polygon(14% 0, 88% 0, 100% 18%, 90% 91%, 78% 100%, 8% 100%, 0 78%, 3% 17%)'),
    }),
    Object.freeze({
      slot: 3,
      bakedKey: 'D',
      hit: freezeRect(575, 579, 553, 69, 'polygon(1.2% 0, 98.6% 0, 100% 20%, 99% 84%, 97.8% 100%, 1.2% 100%, 0 79%, 0 18%)'),
      text: freezeRect(650, 583, 473, 62, 'polygon(0.5% 0, 99% 0, 100% 18%, 99% 84%, 98% 100%, 0 100%)'),
      badge: freezeRect(579, 585, 75, 59, 'polygon(14% 0, 88% 0, 100% 18%, 90% 91%, 78% 100%, 8% 100%, 0 78%, 3% 17%)'),
    }),
  ]),
});

export const METRIC_FIELDS = Object.freeze([
  Object.freeze({ id: 'experience', label: 'Score experience', tone: 'magenta', rect: freezeRect(1394, 244, 84, 42) }),
  Object.freeze({ id: 'accuracy', label: 'Accuracy', tone: 'cyan', rect: freezeRect(1394, 302, 84, 43) }),
  Object.freeze({ id: 'streak', label: 'Current streak', tone: 'orange', rect: freezeRect(1394, 361, 84, 43) }),
  Object.freeze({ id: 'elapsed', label: 'Time played', tone: 'emerald', rect: freezeRect(1386, 420, 92, 43) }),
  Object.freeze({ id: 'questions', label: 'Questions answered', tone: 'violet', rect: freezeRect(1394, 479, 84, 43) }),
  Object.freeze({ id: 'bestCategory', label: 'Best category', tone: 'cyan', rect: freezeRect(1384, 538, 94, 43) }),
  Object.freeze({ id: 'rank', label: 'Current rank', tone: 'orange', rect: freezeRect(1390, 597, 88, 43) }),
]);

export const DASHBOARD_CONTROLS = Object.freeze([
  freezeControl('dashboard', 'Dashboard', 'cyan', freezeRect(158, 219, 249, 76, 'polygon(1.8% 6%, 95% 0, 100% 17%, 98% 88%, 94% 100%, 1.5% 95%, 0 77%, 0 19%)'), 'quiz'),
  freezeControl('leaderboard', 'Leaderboard', 'magenta', freezeRect(158, 291, 249, 76, 'polygon(1.8% 6%, 95% 0, 100% 17%, 98% 88%, 94% 100%, 1.5% 95%, 0 77%, 0 19%)'), 'leaderboard'),
  freezeControl('achievements', 'Achievements', 'orange', freezeRect(158, 363, 250, 76, 'polygon(1.8% 6%, 95% 0, 100% 17%, 98% 88%, 94% 100%, 1.5% 95%, 0 77%, 0 19%)'), 'achievements'),
  freezeControl('history', 'History', 'cyan', freezeRect(157, 435, 251, 77, 'polygon(1.8% 6%, 95% 0, 100% 17%, 98% 88%, 94% 100%, 1.5% 95%, 0 77%, 0 19%)'), 'history'),
  freezeControl('analytics', 'Analytics', 'emerald', freezeRect(156, 507, 252, 78, 'polygon(1.8% 6%, 95% 0, 100% 17%, 98% 88%, 94% 100%, 1.5% 95%, 0 77%, 0 19%)'), 'analytics'),
  freezeControl('settings', 'Settings', 'magenta', freezeRect(155, 580, 253, 77, 'polygon(1.8% 6%, 95% 0, 100% 17%, 98% 88%, 94% 100%, 1.5% 95%, 0 77%, 0 19%)'), 'settings'),
  freezeControl('logout', 'Logout and local-session controls', 'orange', freezeRect(154, 652, 254, 78, 'polygon(1.8% 6%, 95% 0, 100% 17%, 98% 88%, 94% 100%, 1.5% 95%, 0 77%, 0 19%)'), 'session'),
  freezeControl('detailed-analytics', 'View detailed analytics', 'magenta', freezeRect(1260, 646, 231, 62, 'polygon(2% 10%, 96% 0, 100% 20%, 98% 88%, 94% 100%, 2% 92%, 0 75%, 0 20%)'), 'analytics'),
]);

export function geometryStyle(region) {
  if (!region) return {};
  const style = {
    left: `${(region.x / MASTER_WIDTH) * 100}%`,
    top: `${(region.y / MASTER_HEIGHT) * 100}%`,
    width: `${(region.width / MASTER_WIDTH) * 100}%`,
    height: `${(region.height / MASTER_HEIGHT) * 100}%`,
  };

  if (region.clipPath) style.clipPath = region.clipPath;
  return style;
}

export function validateGeometryRegion(region) {
  if (!region) return false;
  return region.x >= 0
    && region.y >= 0
    && region.width > 0
    && region.height > 0
    && region.x + region.width <= MASTER_WIDTH
    && region.y + region.height <= MASTER_HEIGHT;
}
