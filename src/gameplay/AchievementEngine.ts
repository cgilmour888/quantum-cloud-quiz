/**
 * Artifact ID: QCQ-TBL-025
 * Artifact Name: AchievementEngine
 * Repository Path: QCQ/frontend/src/gameplay/AchievementEngine.ts
 */

import type { GameplayEvidenceEvent } from './GameplayStore';
import type { LevelProgressSnapshot } from './LevelEngine';
import type { ScoreSnapshot } from './ScoreEngine';
import type { XPSnapshot } from './XPManager';

export type AchievementScope = 'session' | 'dataset' | 'profile' | 'global';

export type AchievementCriterion =
  | {
      readonly kind: 'stat-threshold';
      readonly metric:
        | 'correct-count'
        | 'answered-count'
        | 'best-streak'
        | 'completed-sessions'
        | 'total-xp'
        | 'level';
      readonly threshold: number;
    }
  | {
      readonly kind: 'perfect-session';
      readonly minimumQuestions: number;
    }
  | {
      readonly kind: 'topic-accuracy';
      readonly topic: string;
      readonly minimumAttempts: number;
      readonly threshold: number;
    };

export interface AchievementDefinition {
  readonly id: string;
  readonly version: string;
  readonly title: string;
  readonly description: string;
  readonly scope: AchievementScope;
  readonly criterion: AchievementCriterion;
}

export interface AchievementEvaluationContext {
  readonly score: ScoreSnapshot;
  readonly xp: XPSnapshot;
  readonly level: LevelProgressSnapshot;
  readonly evidence: readonly GameplayEvidenceEvent[];
  readonly completedSessions: number;
}

export interface AchievementUnlock {
  readonly unlockId: string;
  readonly achievementId: string;
  readonly achievementVersion: string;
  readonly scope: AchievementScope;
  readonly scopeId: string;
  readonly title: string;
  readonly description: string;
  readonly unlockedAt: string;
  readonly evidence: Readonly<Record<string, string | number | boolean | null>>;
}

export interface AchievementEvaluationResult {
  readonly unlocked: readonly AchievementUnlock[];
  readonly alreadyUnlocked: readonly string[];
  readonly notEligible: readonly string[];
  readonly evaluatedAt: string;
}

type AchievementListener = (unlock: AchievementUnlock) => void;

function validateDefinition(definition: AchievementDefinition): void {
  if (!definition.id.trim() || !definition.version.trim()) {
    throw new Error('Achievement definitions require stable non-empty id and version values.');
  }
  if (!definition.title.trim() || !definition.description.trim()) {
    throw new Error(`Achievement "${definition.id}" requires a title and description.`);
  }
  const criterion = definition.criterion;
  if (criterion.kind === 'stat-threshold') {
    if (!Number.isFinite(criterion.threshold) || criterion.threshold < 0) {
      throw new Error(`Achievement "${definition.id}" has an invalid stat threshold.`);
    }
  } else if (criterion.kind === 'perfect-session') {
    if (!Number.isInteger(criterion.minimumQuestions) || criterion.minimumQuestions < 1) {
      throw new Error(`Achievement "${definition.id}" has an invalid minimumQuestions value.`);
    }
  } else {
    if (!criterion.topic.trim()) {
      throw new Error(`Achievement "${definition.id}" requires a topic.`);
    }
    if (!Number.isInteger(criterion.minimumAttempts) || criterion.minimumAttempts < 1) {
      throw new Error(`Achievement "${definition.id}" has an invalid minimumAttempts value.`);
    }
    if (!Number.isFinite(criterion.threshold) || criterion.threshold < 0 || criterion.threshold > 1) {
      throw new Error(`Achievement "${definition.id}" has an invalid accuracy threshold.`);
    }
  }
}

function freezeUnlock(unlock: AchievementUnlock): AchievementUnlock {
  return Object.freeze({
    ...unlock,
    evidence: Object.freeze({ ...unlock.evidence }),
  });
}

function criterionValue(
  definition: AchievementDefinition,
  context: AchievementEvaluationContext,
): { readonly eligible: boolean; readonly evidence: Readonly<Record<string, string | number | boolean | null>> } {
  const criterion = definition.criterion;
  if (criterion.kind === 'stat-threshold') {
    const value =
      criterion.metric === 'correct-count'
        ? context.score.correctCount
        : criterion.metric === 'answered-count'
          ? context.score.answeredCount
          : criterion.metric === 'best-streak'
            ? context.score.bestStreak
            : criterion.metric === 'completed-sessions'
              ? context.completedSessions
              : criterion.metric === 'total-xp'
                ? context.xp.totalXP
                : context.level.level;
    return {
      eligible: value >= criterion.threshold,
      evidence: Object.freeze({
        metric: criterion.metric,
        value,
        threshold: criterion.threshold,
      }),
    };
  }

  if (criterion.kind === 'perfect-session') {
    const eligible =
      context.score.completed &&
      context.score.answeredCount >= criterion.minimumQuestions &&
      context.score.incorrectCount === 0 &&
      context.score.unansweredCount === 0;
    return {
      eligible,
      evidence: Object.freeze({
        answeredCount: context.score.answeredCount,
        incorrectCount: context.score.incorrectCount,
        unansweredCount: context.score.unansweredCount,
        minimumQuestions: criterion.minimumQuestions,
      }),
    };
  }

  const topicGrades = context.evidence.filter(
    (
      event,
    ): event is Extract<GameplayEvidenceEvent, { readonly type: 'answer-graded' }> =>
      event.type === 'answer-graded' && event.topic === criterion.topic,
  );
  const uniqueGrades = new Map(
    topicGrades.map((event) => [event.questionId, event]),
  );
  const attempts = uniqueGrades.size;
  const correct = [...uniqueGrades.values()].filter(
    (event) => event.result.isCorrect,
  ).length;
  const accuracy = attempts > 0 ? correct / attempts : 0;
  return {
    eligible:
      attempts >= criterion.minimumAttempts && accuracy >= criterion.threshold,
    evidence: Object.freeze({
      topic: criterion.topic,
      attempts,
      correct,
      accuracy,
      minimumAttempts: criterion.minimumAttempts,
      threshold: criterion.threshold,
    }),
  };
}

export class AchievementEngine {
  private definitions = new Map<string, AchievementDefinition>();
  private unlocks = new Map<string, AchievementUnlock>();
  private listeners = new Set<AchievementListener>();

  public constructor(definitions: readonly AchievementDefinition[] = []) {
    this.registerDefinitions(definitions);
  }

  public registerDefinitions(definitions: readonly AchievementDefinition[]): void {
    for (const definition of definitions) {
      validateDefinition(definition);
      const key = `${definition.id}@${definition.version}`;
      if (this.definitions.has(key)) {
        throw new Error(`Duplicate achievement definition "${key}".`);
      }
      this.definitions.set(
        key,
        Object.freeze({
          ...definition,
          criterion: Object.freeze({ ...definition.criterion }),
        }),
      );
    }
  }

  public evaluate(
    context: AchievementEvaluationContext,
    scopeIds: Readonly<Record<AchievementScope, string>>,
    evaluatedAt = new Date().toISOString(),
  ): AchievementEvaluationResult {
    if (!Number.isFinite(Date.parse(evaluatedAt))) {
      throw new Error('Achievement evaluation time must be ISO-compatible.');
    }
    const unlocked: AchievementUnlock[] = [];
    const alreadyUnlocked: string[] = [];
    const notEligible: string[] = [];

    for (const definition of this.definitions.values()) {
      const scopeId = scopeIds[definition.scope]?.trim();
      if (!scopeId) {
        throw new Error(
          `Missing scope ID for achievement scope "${definition.scope}".`,
        );
      }
      const unlockId = `${definition.id}@${definition.version}:${definition.scope}:${scopeId}`;
      if (this.unlocks.has(unlockId)) {
        alreadyUnlocked.push(definition.id);
        continue;
      }
      const evaluation = criterionValue(definition, context);
      if (!evaluation.eligible) {
        notEligible.push(definition.id);
        continue;
      }
      const unlock = freezeUnlock({
        unlockId,
        achievementId: definition.id,
        achievementVersion: definition.version,
        scope: definition.scope,
        scopeId,
        title: definition.title,
        description: definition.description,
        unlockedAt: evaluatedAt,
        evidence: evaluation.evidence,
      });
      this.unlocks.set(unlockId, unlock);
      unlocked.push(unlock);
      for (const listener of this.listeners) listener(unlock);
    }

    return Object.freeze({
      unlocked: Object.freeze(unlocked),
      alreadyUnlocked: Object.freeze(alreadyUnlocked),
      notEligible: Object.freeze(notEligible),
      evaluatedAt,
    });
  }

  public listUnlocks(): readonly AchievementUnlock[] {
    return Object.freeze([...this.unlocks.values()]);
  }

  public restore(unlocks: readonly AchievementUnlock[]): void {
    const next = new Map<string, AchievementUnlock>();
    for (const unlock of unlocks) {
      if (next.has(unlock.unlockId)) {
        throw new Error(`Duplicate achievement unlock ID "${unlock.unlockId}".`);
      }
      next.set(unlock.unlockId, freezeUnlock(unlock));
    }
    this.unlocks = next;
  }

  public readonly subscribe = (listener: AchievementListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
}
