/**
 * Artifact ID: QCQ-TBL-022
 * Artifact Name: ScoreEngine
 * Repository Path: QCQ/frontend/src/gameplay/ScoreEngine.ts
 */

import type {
  GameplayEvidenceEvent,
  GameplayStoreSnapshot,
} from './GameplayStore';

export type ScoreOutcome = 'correct' | 'incorrect' | 'unanswered';
export type ScorePassingStatus =
  | 'passed'
  | 'failed'
  | 'not-applicable'
  | 'in-progress';

export interface ScorePolicy {
  readonly scoringContractVersion: string;
  readonly questionPoints: number;
  readonly passingThreshold: number | null;
}

export interface ScoreEntry {
  readonly questionId: string;
  readonly submissionId: string | null;
  readonly outcome: ScoreOutcome;
  readonly earnedPoints: number;
  readonly maximumPoints: number;
  readonly attemptNumber: number | null;
  readonly gradedAt: string | null;
  readonly topic: string | null;
}

export interface ScoreSnapshot {
  readonly schemaVersion: '1.0.0';
  readonly scoringContractVersion: string;
  readonly sessionId: string | null;
  readonly rawScore: number;
  readonly maximumScore: number;
  readonly accuracy: number | null;
  readonly answeredCount: number;
  readonly correctCount: number;
  readonly incorrectCount: number;
  readonly unansweredCount: number;
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly passingThreshold: number | null;
  readonly passingStatus: ScorePassingStatus;
  readonly completed: boolean;
  readonly entries: readonly ScoreEntry[];
  readonly calculatedAt: string;
}

export interface ScoreCalculationInput {
  readonly evidence: readonly GameplayEvidenceEvent[];
  readonly questionIds: readonly string[];
  readonly completed: boolean;
  readonly sessionId?: string | null | undefined;
  readonly policy?: Partial<ScorePolicy> | undefined;
  readonly calculatedAt?: string | undefined;
}

const DEFAULT_SCORE_POLICY: ScorePolicy = Object.freeze({
  scoringContractVersion: 'qcq-binary-exact-set-v1.0.0',
  questionPoints: 1,
  passingThreshold: null,
});

function resolvePolicy(policy: Partial<ScorePolicy> | undefined): ScorePolicy {
  const resolved: ScorePolicy = {
    scoringContractVersion:
      policy?.scoringContractVersion?.trim() ||
      DEFAULT_SCORE_POLICY.scoringContractVersion,
    questionPoints: policy?.questionPoints ?? DEFAULT_SCORE_POLICY.questionPoints,
    passingThreshold:
      policy?.passingThreshold === undefined
        ? DEFAULT_SCORE_POLICY.passingThreshold
        : policy.passingThreshold,
  };
  if (!Number.isFinite(resolved.questionPoints) || resolved.questionPoints <= 0) {
    throw new Error('ScorePolicy questionPoints must be a positive finite number.');
  }
  if (
    resolved.passingThreshold !== null &&
    (!Number.isFinite(resolved.passingThreshold) ||
      resolved.passingThreshold < 0 ||
      resolved.passingThreshold > 1)
  ) {
    throw new Error('ScorePolicy passingThreshold must be null or a value from 0 through 1.');
  }
  return Object.freeze(resolved);
}

function freezeEntry(entry: ScoreEntry): ScoreEntry {
  return Object.freeze({ ...entry });
}

export class ScoreEngine {
  public static readonly defaultPolicy = DEFAULT_SCORE_POLICY;

  public calculate(input: ScoreCalculationInput): ScoreSnapshot {
    const policy = resolvePolicy(input.policy);
    if (input.questionIds.length === 0) {
      throw new Error('ScoreEngine requires at least one scored question.');
    }
    if (new Set(input.questionIds).size !== input.questionIds.length) {
      throw new Error('ScoreEngine questionIds contain duplicates.');
    }

    const questionSet = new Set(input.questionIds);
    const gradeByQuestion = new Map<
      string,
      Extract<GameplayEvidenceEvent, { readonly type: 'answer-graded' }>
    >();
    const seenSubmissions = new Set<string>();

    const orderedEvidence = [...input.evidence].sort(
      (left, right) => left.sequence - right.sequence,
    );
    for (const event of orderedEvidence) {
      if (event.type !== 'answer-graded' || !questionSet.has(event.questionId)) {
        continue;
      }
      if (seenSubmissions.has(event.submissionId)) {
        continue;
      }
      seenSubmissions.add(event.submissionId);
      if (!gradeByQuestion.has(event.questionId)) {
        gradeByQuestion.set(event.questionId, event);
      }
    }

    let rawScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    const entries: ScoreEntry[] = [];

    for (const questionId of input.questionIds) {
      const grade = gradeByQuestion.get(questionId);
      if (!grade) {
        entries.push(
          freezeEntry({
            questionId,
            submissionId: null,
            outcome: 'unanswered',
            earnedPoints: 0,
            maximumPoints: policy.questionPoints,
            attemptNumber: null,
            gradedAt: null,
            topic: null,
          }),
        );
        continue;
      }

      const isCorrect = grade.result.isCorrect;
      if (isCorrect) {
        correctCount += 1;
        rawScore += policy.questionPoints;
        currentStreak += 1;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        incorrectCount += 1;
        currentStreak = 0;
      }
      entries.push(
        freezeEntry({
          questionId,
          submissionId: grade.submissionId,
          outcome: isCorrect ? 'correct' : 'incorrect',
          earnedPoints: isCorrect ? policy.questionPoints : 0,
          maximumPoints: policy.questionPoints,
          attemptNumber: grade.result.attemptNumber,
          gradedAt: grade.result.gradedAt,
          topic: grade.topic,
        }),
      );
    }

    const maximumScore = input.questionIds.length * policy.questionPoints;
    const answeredCount = correctCount + incorrectCount;
    const unansweredCount = input.questionIds.length - answeredCount;
    const accuracy = maximumScore > 0 ? rawScore / maximumScore : null;
    const passingStatus: ScorePassingStatus = !input.completed
      ? 'in-progress'
      : policy.passingThreshold === null
        ? 'not-applicable'
        : (accuracy ?? 0) >= policy.passingThreshold
          ? 'passed'
          : 'failed';
    const calculatedAt = input.calculatedAt ?? new Date().toISOString();
    if (!Number.isFinite(Date.parse(calculatedAt))) {
      throw new Error('ScoreEngine calculatedAt must be an ISO-compatible date-time.');
    }

    return Object.freeze({
      schemaVersion: '1.0.0',
      scoringContractVersion: policy.scoringContractVersion,
      sessionId: input.sessionId ?? null,
      rawScore,
      maximumScore,
      accuracy,
      answeredCount,
      correctCount,
      incorrectCount,
      unansweredCount,
      currentStreak,
      bestStreak,
      passingThreshold: policy.passingThreshold,
      passingStatus,
      completed: input.completed,
      entries: Object.freeze(entries),
      calculatedAt,
    });
  }

  public fromGameplay(
    gameplay: GameplayStoreSnapshot,
    policy?: Partial<ScorePolicy>,
  ): ScoreSnapshot {
    const session = gameplay.session;
    if (!session) {
      return Object.freeze({
        schemaVersion: '1.0.0',
        scoringContractVersion:
          policy?.scoringContractVersion?.trim() ||
          DEFAULT_SCORE_POLICY.scoringContractVersion,
        sessionId: null,
        rawScore: 0,
        maximumScore: 0,
        accuracy: null,
        answeredCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: 0,
        currentStreak: 0,
        bestStreak: 0,
        passingThreshold:
          policy?.passingThreshold === undefined
            ? DEFAULT_SCORE_POLICY.passingThreshold
            : policy.passingThreshold,
        passingStatus: 'in-progress',
        completed: false,
        entries: Object.freeze([]),
        calculatedAt: gameplay.updatedAt,
      });
    }
    return this.calculate({
      evidence: gameplay.evidence,
      questionIds: session.questionIds,
      completed: gameplay.phase === 'completed',
      sessionId: session.sessionId,
      policy,
      calculatedAt: gameplay.updatedAt,
    });
  }
}
