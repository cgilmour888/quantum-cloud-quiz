/**
 * Artifact ID: QCQ-AUD-008
 * Artifact Name: AudioEvents
 * Repository Path: QCQ/frontend/src/audio/AudioEvents.ts
 */

export const AUDIO_EVENTS = {
  ambientStart:
    'music.ambient.quantum-cloud',

  stormRumble:
    'environment.storm.rumble',

  thunderDistant:
    'environment.thunder.distant',

  thunderClose:
    'environment.thunder.close',

  lightningCrack:
    'environment.lightning.crack',

  cloudFlicker:
    'environment.cloud.flicker',

  buttonHover:
    'interface.button.hover',

  buttonSelect:
    'interface.button.select',

  panelOpen:
    'interface.panel.open',

  panelClose:
    'interface.panel.close',

  answerLock:
    'gameplay.answer.lock',

  answerCorrect:
    'gameplay.answer.correct',

  answerIncorrect:
    'gameplay.answer.incorrect',

  questionAdvance:
    'gameplay.question.advance',

  timerWarning:
    'gameplay.timer.warning',

  xpGain:
    'achievements.xp.gain',

  levelUp:
    'achievements.level.up',

  achievementUnlock:
    'achievements.unlock',
} as const;

export type AudioEventName =
  keyof typeof AUDIO_EVENTS;

export type AudioEventAssetId =
  (typeof AUDIO_EVENTS)[
    AudioEventName
  ];

export function resolveAudioEvent(
  event:
    AudioEventName,
): AudioEventAssetId {
  return AUDIO_EVENTS[
    event
  ];
}
