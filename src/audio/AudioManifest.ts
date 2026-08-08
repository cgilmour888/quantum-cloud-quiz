/**
 * Artifact ID: QCQ-AUD-002
 * Artifact Name: AudioManifest
 * Repository Path: QCQ/frontend/src/audio/AudioManifest.ts
 */

import type {
  AudioAssetDefinition,
} from './audio.types';

export const AUDIO_MANIFEST = [
  {
    id: 'music.ambient.quantum-cloud',
    bus: 'music',
    availability: 'ready',
    sources: [
      {
        path: '/audio/music/QCQ-AUD-MUSIC-STUDY-PRIMARY-LOOP-v1.0.0.ogg',
        format: 'audio/ogg',
      },
      {
        path: '/audio/music/QCQ-AUD-MUSIC-STUDY-PRIMARY-LOOP-v1.0.0.mp3',
        format: 'audio/mpeg',
      },
    ],
    loop: true,
    preload: 'metadata',
    defaultGain: 0.35,
    maxVoices: 1,
    cooldownMs: 0,
  },
  {
    id: 'environment.storm.rumble',
    bus: 'environment',
    availability: 'pending',
    sources: [
      {
        path: '/audio/environment/storm-rumble-loop.mp3',
        format: 'audio/mpeg',
      },
    ],
    loop: true,
    preload: 'metadata',
    defaultGain: 0.35,
    maxVoices: 1,
    cooldownMs: 0,
  },
  {
    id: 'environment.thunder.distant',
    bus: 'environment',
    availability: 'pending',
    sources: [
      {
        path: '/audio/environment/thunder-distant-01.mp3',
        format: 'audio/mpeg',
      },
    ],
    loop: false,
    preload: 'metadata',
    defaultGain: 0.6,
    maxVoices: 2,
    cooldownMs: 1200,
  },
  {
    id: 'environment.thunder.close',
    bus: 'environment',
    availability: 'pending',
    sources: [
      {
        path: '/audio/environment/thunder-close-01.mp3',
        format: 'audio/mpeg',
      },
    ],
    loop: false,
    preload: 'metadata',
    defaultGain: 0.8,
    maxVoices: 2,
    cooldownMs: 800,
  },
  {
    id: 'environment.lightning.crack',
    bus: 'environment',
    availability: 'pending',
    sources: [
      {
        path: '/audio/environment/lightning-crack-01.mp3',
        format: 'audio/mpeg',
      },
    ],
    loop: false,
    preload: 'metadata',
    defaultGain: 0.72,
    maxVoices: 3,
    cooldownMs: 300,
  },
  {
    id: 'environment.cloud.flicker',
    bus: 'environment',
    availability: 'pending',
    sources: [
      {
        path: '/audio/environment/cloud-flicker-01.mp3',
        format: 'audio/mpeg',
      },
    ],
    loop: false,
    preload: 'metadata',
    defaultGain: 0.4,
    maxVoices: 3,
    cooldownMs: 120,
  },
  {
    id: 'interface.button.hover',
    bus: 'interface',
    availability: 'pending',
    sources: [
      {
        path: '/audio/interface/button-hover-01.mp3',
        format: 'audio/mpeg',
      },
    ],
    loop: false,
    preload: 'metadata',
    defaultGain: 0.3,
    maxVoices: 4,
    cooldownMs: 60,
  },
  {
    id: 'interface.button.select',
    bus: 'interface',
    availability: 'pending',
    sources: [
      {
        path: '/audio/interface/button-select-01.mp3',
        format: 'audio/mpeg',
      },
    ],
    loop: false,
    preload: 'metadata',
    defaultGain: 0.45,
    maxVoices: 6,
    cooldownMs: 40,
  },
  {
    id: 'interface.panel.open',
    bus: 'interface',
    availability: 'pending',
    sources: [
      {
        path: '/audio/interface/panel-open-01.mp3',
        format: 'audio/mpeg',
      },
    ],
    loop: false,
    preload: 'metadata',
    defaultGain: 0.38,
    maxVoices: 3,
    cooldownMs: 100,
  },
  {
    id: 'interface.panel.close',
    bus: 'interface',
    availability: 'pending',
    sources: [
      {
        path: '/audio/interface/panel-close-01.mp3',
        format: 'audio/mpeg',
      },
    ],
    loop: false,
    preload: 'metadata',
    defaultGain: 0.38,
    maxVoices: 3,
    cooldownMs: 100,
  },
  {
    id: 'gameplay.answer.lock',
    bus: 'gameplay',
    availability: 'pending',
    sources: [
      {
        path: '/audio/gameplay/answer-lock-01.mp3',
        format: 'audio/mpeg',
      },
    ],
    loop: false,
    preload: 'metadata',
    defaultGain: 0.5,
    maxVoices: 3,
    cooldownMs: 100,
  },
  {
    id: 'gameplay.answer.correct',
    bus: 'gameplay',
    availability: 'pending',
    sources: [
      {
        path: '/audio/gameplay/answer-correct-01.mp3',
        format: 'audio/mpeg',
      },
    ],
    loop: false,
    preload: 'metadata',
    defaultGain: 0.65,
    maxVoices: 2,
    cooldownMs: 150,
  },
  {
    id: 'gameplay.answer.incorrect',
    bus: 'gameplay',
    availability: 'pending',
    sources: [
      {
        path: '/audio/gameplay/answer-incorrect-01.mp3',
        format: 'audio/mpeg',
      },
    ],
    loop: false,
    preload: 'metadata',
    defaultGain: 0.58,
    maxVoices: 2,
    cooldownMs: 150,
  },
  {
    id: 'gameplay.question.advance',
    bus: 'gameplay',
    availability: 'pending',
    sources: [
      {
        path: '/audio/gameplay/question-advance-01.mp3',
        format: 'audio/mpeg',
      },
    ],
    loop: false,
    preload: 'metadata',
    defaultGain: 0.45,
    maxVoices: 2,
    cooldownMs: 100,
  },
  {
    id: 'gameplay.timer.warning',
    bus: 'gameplay',
    availability: 'pending',
    sources: [
      {
        path: '/audio/gameplay/timer-warning-01.mp3',
        format: 'audio/mpeg',
      },
    ],
    loop: false,
    preload: 'metadata',
    defaultGain: 0.55,
    maxVoices: 1,
    cooldownMs: 900,
  },
  {
    id: 'achievements.xp.gain',
    bus: 'achievements',
    availability: 'pending',
    sources: [
      {
        path: '/audio/achievements/xp-gain-01.mp3',
        format: 'audio/mpeg',
      },
    ],
    loop: false,
    preload: 'metadata',
    defaultGain: 0.58,
    maxVoices: 3,
    cooldownMs: 100,
  },
  {
    id: 'achievements.level.up',
    bus: 'achievements',
    availability: 'pending',
    sources: [
      {
        path: '/audio/achievements/level-up-01.mp3',
        format: 'audio/mpeg',
      },
    ],
    loop: false,
    preload: 'metadata',
    defaultGain: 0.72,
    maxVoices: 1,
    cooldownMs: 500,
  },
  {
    id: 'achievements.unlock',
    bus: 'achievements',
    availability: 'pending',
    sources: [
      {
        path: '/audio/achievements/achievement-unlock-01.mp3',
        format: 'audio/mpeg',
      },
    ],
    loop: false,
    preload: 'metadata',
    defaultGain: 0.7,
    maxVoices: 2,
    cooldownMs: 400,
  },
] as const satisfies readonly AudioAssetDefinition[];
