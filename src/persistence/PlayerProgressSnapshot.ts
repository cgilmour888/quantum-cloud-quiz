/**
 * Artifact ID: QCQ-PER-010
 * Artifact Name: PlayerProgressSnapshot
 * Repository Path: QCQ/frontend/src/persistence/PlayerProgressSnapshot.ts
 */

import type {
  PlayerProfile,
  SaveGamePayload,
} from './PersistenceTypes';

export interface PlayerProgressSnapshot {
  readonly schemaVersion: '1.0.0';
  readonly profileId: string;
  readonly displayName: string;
  readonly certificationId: string;
  readonly datasetId: string;
  readonly sessionId: string;
  readonly sessionStatus: SaveGamePayload['session']['status'];
  readonly currentQuestionIndex: number;
  readonly questionCount: number;
  readonly questionsAnswered: number;
  readonly accuracy: number | null;
  readonly score: number;
  readonly maximumScore: number;
  readonly totalXP: number;
  readonly sessionXP: number;
  readonly level: number;
  readonly levelTitle: string;
  readonly unlockedAchievementCount: number;
  readonly elapsedMilliseconds: number;
  readonly updatedAt: string;
}

export function createPlayerProgressSnapshot(
  profile: PlayerProfile,
  save: SaveGamePayload,
): PlayerProgressSnapshot {
  if (profile.profileId !== save.profileId) {
    throw new Error('Player profile and save game belong to different profiles.');
  }

  const answered = save.answers.length;
  const correct = save.answers.filter((answer) => answer.isCorrect).length;
  return Object.freeze({
    schemaVersion: '1.0.0',
    profileId: profile.profileId,
    displayName: profile.displayName,
    certificationId: save.dataset.certificationId,
    datasetId: save.dataset.datasetId,
    sessionId: save.session.sessionId,
    sessionStatus: save.session.status,
    currentQuestionIndex: save.session.currentQuestionIndex,
    questionCount: save.session.questionIds.length,
    questionsAnswered: answered,
    accuracy: answered === 0 ? null : correct / answered,
    score: save.metrics.score,
    maximumScore: save.metrics.maximumScore,
    totalXP: save.player.totalXP,
    sessionXP: save.player.sessionXP,
    level: save.player.level,
    levelTitle: save.player.levelTitle,
    unlockedAchievementCount:
      save.achievements.unlockedAchievementIds.length,
    elapsedMilliseconds: save.timer.elapsedMilliseconds,
    updatedAt: save.updatedAt,
  });
}
