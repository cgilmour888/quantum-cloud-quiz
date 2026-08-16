/* QCQ F1E40 — normalized live socket atlas for approved raster monitor authorities. */
(function (global) {
  'use strict';
  global.QCQ_F1E40_SOCKET_ATLAS = Object.freeze({
    version: 'F1E40.1',
    sourceCrop: Object.freeze({ x: 420, y: 140, width: 840, height: 580, sourceWidth: 1672, sourceHeight: 941 }),
    L1: Object.freeze({
      authority: 'dashboard-authority.webp',
      sockets: Object.freeze({
        topic: [6.2, 26.7, 43.8, 59.5], score: [56.0, 29.0, 31.5, 15.0],
        accuracy: [55.0, 61.0, 17.0, 9.0], streak: [78.0, 61.0, 10.2, 9.0],
        rank: [55.0, 79.0, 21.8, 8.5], correct: [78.0, 79.0, 10.0, 8.5],
        return: [26.0, 89.0, 47.0, 9.5]
      })
    }),
    L2: Object.freeze({
      authority: 'leaderboard-authority.webp',
      sockets: Object.freeze({
        player: [7.0, 27.0, 31.0, 9.5], rank: [42.0, 27.0, 20.0, 9.5], score: [70.0, 26.0, 20.0, 11.5],
        rows: [6.0, 48.5, 89.0, 38.0]
      })
    }),
    L3: Object.freeze({
      authority: 'achievements-authority.webp',
      sockets: Object.freeze({
        answered: [18.0, 34.0, 12.0, 10.0], correct: [49.0, 34.0, 12.0, 10.0],
        streak: [70.5, 44.0, 23.0, 8.5], accuracy: [17.0, 68.0, 16.0, 9.5],
        rank: [36.5, 73.0, 27.5, 10.0], return: [26.0, 89.0, 47.0, 9.5]
      })
    }),
    L4: Object.freeze({
      authority: 'dataset-authority.webp',
      sockets: Object.freeze({
        current: [18.5, 23.0, 64.0, 10.0], choose: [35.5, 34.5, 53.0, 17.0],
        validate: [6.0, 77.0, 25.0, 18.0], replace: [31.5, 77.0, 31.0, 18.0], ready: [63.0, 77.0, 31.0, 18.0]
      })
    }),
    L5: Object.freeze({
      authority: 'analytics-authority.webp',
      sockets: Object.freeze({
        topic: [6.0, 25.0, 49.5, 41.5], accuracy: [72.0, 25.0, 19.0, 9.0],
        strongest: [70.0, 39.5, 22.0, 9.0], weakest: [70.0, 54.0, 22.0, 9.0],
        response: [71.0, 71.0, 17.0, 8.0], total: [74.0, 86.0, 12.0, 8.0]
      })
    }),
    L6: Object.freeze({
      authority: 'settings-authority.webp',
      sockets: Object.freeze({
        soundtrack: [34.0, 26.0, 13.5, 9.5], masterValue: [43.0, 43.0, 7.5, 6.0],
        effectsValue: [43.0, 59.0, 7.5, 6.0], dataset: [17.5, 86.0, 49.0, 8.0],
        masterHit: [13.0, 42.0, 29.0, 8.0], effectsHit: [13.0, 58.0, 29.0, 8.0],
        intensityHit: [55.0, 58.0, 37.0, 9.0], resetHit: [55.0, 42.0, 37.0, 9.0]
      })
    })
  });
}(window));
