export const SceneEvents = Object.freeze({
  ANSWER_SELECTED: 'quiz:answer-selected',
  ANSWER_CORRECT: 'quiz:answer-correct',
  ANSWER_INCORRECT: 'quiz:answer-incorrect',
  QUESTION_CHANGED: 'quiz:question-changed',
  STREAK_CHANGED: 'quiz:streak-changed',
  EXAM_STARTED: 'quiz:exam-started',
  EXAM_PAUSED: 'quiz:exam-paused',
  EXAM_RESUMED: 'quiz:exam-resumed',
  EXAM_COMPLETED: 'quiz:exam-completed',
  SESSION_RESTORED: 'quiz:session-restored',
  SCORE_REVEAL: 'quiz:score-reveal',
  DATASET_LOADED: 'quiz:dataset-loaded',
  DATASET_REJECTED: 'quiz:dataset-rejected',
  DASHBOARD_NAVIGATED: 'dashboard:navigated',
  SETTINGS_CHANGED: 'settings:changed',
  AUDIO_ENABLED: 'audio:enabled',
  AUDIO_MUTED: 'audio:muted',
  PLACARD_HOVERED: 'profile:placard-hovered',
  PLACARD_FOCUSED: 'profile:placard-focused',
  PLACARD_ACTIVATED: 'profile:placard-activated',
  BUSINESS_CARD_OPENED: 'profile:business-card-opened',
  BUSINESS_CARD_CLOSED: 'profile:business-card-closed',
  SOCIAL_LINK_ACTIVATED: 'profile:social-link-activated',
  VISIBILITY_CHANGED: 'scene:visibility-changed',
});

export function dispatchSceneEvent(target, eventName, detail = {}) {
  if (!target?.dispatchEvent || !eventName) return false;

  const CustomEventConstructor = target.ownerDocument?.defaultView?.CustomEvent
    ?? globalThis.CustomEvent;

  if (typeof CustomEventConstructor !== 'function') return false;

  return target.dispatchEvent(new CustomEventConstructor(eventName, {
    bubbles: true,
    composed: true,
    detail,
  }));
}
