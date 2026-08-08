/**
 * Artifact ID: QCQ-TBL-026
 * Artifact Name: MetricsStore
 * Repository Path: QCQ/frontend/src/metrics/MetricsStore.ts
 */

import type { GameplayEvidenceEvent, GameplayStoreSnapshot } from '../gameplay/GameplayStore';
import type { LevelProgressSnapshot } from '../gameplay/LevelEngine';
import type { ScoreSnapshot } from '../gameplay/ScoreEngine';
import type { XPSnapshot } from '../gameplay/XPManager';

export interface TopicMetric {
  readonly topic: string;
  readonly attempts: number;
  readonly correct: number;
  readonly incorrect: number;
  readonly accuracy: number | null;
  readonly averageResponseTimeMilliseconds: number | null;
}

export interface EvidenceAwareEstimate {
  readonly status: 'available' | 'insufficient-evidence';
  readonly value: number | null;
  readonly sampleSize: number;
  readonly explanation: string;
  readonly nonAuthoritative: true;
}

export interface RecentImprovementMetric {
  readonly status: 'available' | 'insufficient-evidence';
  readonly percentagePointChange: number | null;
  readonly earlierAccuracy: number | null;
  readonly recentAccuracy: number | null;
  readonly sampleSize: number;
}

export interface MetricsSnapshot {
  readonly schemaVersion: '1.0.0';
  readonly revision: number;
  readonly scope: 'current-session';
  readonly scopeId: string | null;
  readonly score: number;
  readonly maximumScore: number;
  readonly accuracy: number | null;
  readonly questionsAnswered: number;
  readonly questionsRemaining: number;
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly elapsedStudyTimeMilliseconds: number;
  readonly averageResponseTimeMilliseconds: number | null;
  readonly topicMetrics: readonly TopicMetric[];
  readonly missedQuestionRecurrence: number;
  readonly recentImprovement: RecentImprovementMetric;
  readonly strongestTopic: string | null;
  readonly weakestTopic: string | null;
  readonly readinessEstimate: EvidenceAwareEstimate;
  readonly completedSessions: number;
  readonly bookmarkedQuestionCount: number;
  readonly totalXP: number;
  readonly sessionXP: number;
  readonly level: number;
  readonly levelTitle: string;
  readonly levelProgress: number;
  readonly updatedAt: string;
}

export interface MetricsSupplementalEvidence {
  readonly priorCompletedSessions?: number | undefined;
}

type MetricsListener = (snapshot: MetricsSnapshot) => void;

function emptyMetrics(): MetricsSnapshot {
  return Object.freeze({
    schemaVersion: '1.0.0',
    revision: 0,
    scope: 'current-session',
    scopeId: null,
    score: 0,
    maximumScore: 0,
    accuracy: null,
    questionsAnswered: 0,
    questionsRemaining: 0,
    currentStreak: 0,
    bestStreak: 0,
    elapsedStudyTimeMilliseconds: 0,
    averageResponseTimeMilliseconds: null,
    topicMetrics: Object.freeze([]),
    missedQuestionRecurrence: 0,
    recentImprovement: Object.freeze({
      status: 'insufficient-evidence',
      percentagePointChange: null,
      earlierAccuracy: null,
      recentAccuracy: null,
      sampleSize: 0,
    }),
    strongestTopic: null,
    weakestTopic: null,
    readinessEstimate: Object.freeze({
      status: 'insufficient-evidence',
      value: null,
      sampleSize: 0,
      explanation: 'No graded evidence is available.',
      nonAuthoritative: true,
    }),
    completedSessions: 0,
    bookmarkedQuestionCount: 0,
    totalXP: 0,
    sessionXP: 0,
    level: 1,
    levelTitle: 'Initiate',
    levelProgress: 0,
    updatedAt: new Date().toISOString(),
  });
}

function uniqueGrades(
  evidence: readonly GameplayEvidenceEvent[],
): readonly Extract<GameplayEvidenceEvent, { readonly type: 'answer-graded' }>[] {
  const byQuestion = new Map<
    string,
    Extract<GameplayEvidenceEvent, { readonly type: 'answer-graded' }>
  >();
  for (const event of [...evidence].sort((left, right) => left.sequence - right.sequence)) {
    if (event.type === 'answer-graded' && !byQuestion.has(event.questionId)) {
      byQuestion.set(event.questionId, event);
    }
  }
  return Object.freeze([...byQuestion.values()]);
}

function deriveElapsedMilliseconds(
  gameplay: GameplayStoreSnapshot,
): number {
  if (!gameplay.startedAt) return 0;
  const started = Date.parse(gameplay.startedAt);
  const ended = Date.parse(gameplay.completedAt ?? gameplay.updatedAt);
  if (!Number.isFinite(started) || !Number.isFinite(ended) || ended < started) return 0;

  let pausedAt: number | null = null;
  let pausedDuration = 0;
  for (const event of gameplay.evidence) {
    const timestamp = Date.parse(event.occurredAt);
    if (!Number.isFinite(timestamp)) continue;
    if (event.type === 'session-paused' && pausedAt === null) {
      pausedAt = timestamp;
    } else if (event.type === 'session-resumed' && pausedAt !== null) {
      pausedDuration += Math.max(0, timestamp - pausedAt);
      pausedAt = null;
    }
  }
  if (pausedAt !== null) pausedDuration += Math.max(0, ended - pausedAt);
  return Math.max(0, ended - started - pausedDuration);
}

function deriveTopicMetrics(
  grades: readonly Extract<GameplayEvidenceEvent, { readonly type: 'answer-graded' }>[],
): readonly TopicMetric[] {
  const buckets = new Map<
    string,
    { attempts: number; correct: number; incorrect: number; responseTimes: number[] }
  >();
  for (const grade of grades) {
    const bucket = buckets.get(grade.topic) ?? {
      attempts: 0,
      correct: 0,
      incorrect: 0,
      responseTimes: [],
    };
    bucket.attempts += 1;
    if (grade.result.isCorrect) bucket.correct += 1;
    else bucket.incorrect += 1;
    if (grade.responseTimeMilliseconds !== null) {
      bucket.responseTimes.push(grade.responseTimeMilliseconds);
    }
    buckets.set(grade.topic, bucket);
  }
  return Object.freeze(
    [...buckets.entries()]
      .map(([topic, bucket]) =>
        Object.freeze({
          topic,
          attempts: bucket.attempts,
          correct: bucket.correct,
          incorrect: bucket.incorrect,
          accuracy:
            bucket.attempts > 0 ? bucket.correct / bucket.attempts : null,
          averageResponseTimeMilliseconds:
            bucket.responseTimes.length > 0
              ? bucket.responseTimes.reduce((sum, value) => sum + value, 0) /
                bucket.responseTimes.length
              : null,
        }),
      )
      .sort((left, right) => left.topic.localeCompare(right.topic)),
  );
}

function deriveRecentImprovement(
  grades: readonly Extract<GameplayEvidenceEvent, { readonly type: 'answer-graded' }>[],
): RecentImprovementMetric {
  if (grades.length < 10) {
    return Object.freeze({
      status: 'insufficient-evidence',
      percentagePointChange: null,
      earlierAccuracy: null,
      recentAccuracy: null,
      sampleSize: grades.length,
    });
  }
  const midpoint = Math.floor(grades.length / 2);
  const earlier = grades.slice(0, midpoint);
  const recent = grades.slice(midpoint);
  const earlierAccuracy =
    earlier.filter((grade) => grade.result.isCorrect).length / earlier.length;
  const recentAccuracy =
    recent.filter((grade) => grade.result.isCorrect).length / recent.length;
  return Object.freeze({
    status: 'available',
    percentagePointChange: (recentAccuracy - earlierAccuracy) * 100,
    earlierAccuracy,
    recentAccuracy,
    sampleSize: grades.length,
  });
}

function deriveReadiness(
  score: ScoreSnapshot,
  topicMetrics: readonly TopicMetric[],
  improvement: RecentImprovementMetric,
): EvidenceAwareEstimate {
  const eligibleTopics = topicMetrics.filter((topic) => topic.attempts >= 3);
  if (score.answeredCount < 20 || eligibleTopics.length < 3 || score.accuracy === null) {
    return Object.freeze({
      status: 'insufficient-evidence',
      value: null,
      sampleSize: score.answeredCount,
      explanation:
        'Readiness requires at least 20 graded questions and three topics with at least three attempts each.',
      nonAuthoritative: true,
    });
  }
  const weakestTopicAccuracy = Math.min(
    ...eligibleTopics.map((topic) => topic.accuracy ?? 0),
  );
  const improvementComponent =
    improvement.status === 'available'
      ? Math.max(-0.1, Math.min(0.1, (improvement.percentagePointChange ?? 0) / 100))
      : 0;
  const value = Math.max(
    0,
    Math.min(
      1,
      score.accuracy * 0.72 + weakestTopicAccuracy * 0.23 + improvementComponent * 0.05,
    ),
  );
  return Object.freeze({
    status: 'available',
    value,
    sampleSize: score.answeredCount,
    explanation:
      'Non-authoritative estimate derived from overall accuracy, weakest sufficiently sampled topic, and recent improvement.',
    nonAuthoritative: true,
  });
}

export class MetricsStore {
  private state: MetricsSnapshot = emptyMetrics();
  private listeners = new Set<MetricsListener>();

  public readonly getSnapshot = (): MetricsSnapshot => this.state;
  public readonly getServerSnapshot = (): MetricsSnapshot => this.state;

  public readonly subscribe = (listener: MetricsListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public update(
    gameplay: GameplayStoreSnapshot,
    score: ScoreSnapshot,
    xp: XPSnapshot,
    level: LevelProgressSnapshot,
    supplemental: MetricsSupplementalEvidence = {},
  ): MetricsSnapshot {
    const grades = uniqueGrades(gameplay.evidence);
    const responseTimes = grades
      .map((grade) => grade.responseTimeMilliseconds)
      .filter((value): value is number => value !== null);
    const topicMetrics = deriveTopicMetrics(grades);
    const qualifiedTopics = topicMetrics.filter((topic) => topic.attempts >= 2);
    const strongestTopic = qualifiedTopics.length > 0
      ? [...qualifiedTopics].sort(
          (left, right) =>
            (right.accuracy ?? 0) - (left.accuracy ?? 0) ||
            right.attempts - left.attempts,
        )[0]!.topic
      : null;
    const weakestTopic = qualifiedTopics.length > 0
      ? [...qualifiedTopics].sort(
          (left, right) =>
            (left.accuracy ?? 0) - (right.accuracy ?? 0) ||
            right.attempts - left.attempts,
        )[0]!.topic
      : null;
    const wrongCounts = new Map<string, number>();
    for (const grade of gameplay.evidence) {
      if (grade.type === 'answer-graded' && !grade.result.isCorrect) {
        wrongCounts.set(
          grade.questionId,
          (wrongCounts.get(grade.questionId) ?? 0) + 1,
        );
      }
    }
    const missedQuestionRecurrence = [...wrongCounts.values()].filter(
      (count) => count > 1,
    ).length;
    const recentImprovement = deriveRecentImprovement(grades);
    const completedInEvidence = gameplay.evidence.filter(
      (event) => event.type === 'session-completed',
    ).length;
    const completedSessions =
      (supplemental.priorCompletedSessions ?? 0) + completedInEvidence;
    if (!Number.isInteger(completedSessions) || completedSessions < 0) {
      throw new Error('completedSessions must resolve to a non-negative integer.');
    }

    const next: MetricsSnapshot = Object.freeze({
      schemaVersion: '1.0.0',
      revision: this.state.revision + 1,
      scope: 'current-session',
      scopeId: gameplay.session?.sessionId ?? null,
      score: score.rawScore,
      maximumScore: score.maximumScore,
      accuracy: score.accuracy,
      questionsAnswered: score.answeredCount,
      questionsRemaining: score.unansweredCount,
      currentStreak: score.currentStreak,
      bestStreak: score.bestStreak,
      elapsedStudyTimeMilliseconds: deriveElapsedMilliseconds(gameplay),
      averageResponseTimeMilliseconds:
        responseTimes.length > 0
          ? responseTimes.reduce((sum, value) => sum + value, 0) /
            responseTimes.length
          : null,
      topicMetrics,
      missedQuestionRecurrence,
      recentImprovement,
      strongestTopic,
      weakestTopic,
      readinessEstimate: deriveReadiness(score, topicMetrics, recentImprovement),
      completedSessions,
      bookmarkedQuestionCount: gameplay.bookmarkedQuestionIds.length,
      totalXP: xp.totalXP,
      sessionXP: xp.sessionXP,
      level: level.level,
      levelTitle: level.title,
      levelProgress: level.progressToNextLevel,
      updatedAt: gameplay.updatedAt,
    });
    this.state = next;
    for (const listener of this.listeners) listener(next);
    return next;
  }

  public restore(snapshot: MetricsSnapshot): MetricsSnapshot {
    const schemaVersion: string =
      snapshot.schemaVersion;

    if (schemaVersion !== '1.0.0') {
      throw new Error(`Unsupported metrics snapshot schema "${schemaVersion}".`);
    }
    if (snapshot.accuracy !== null && (snapshot.accuracy < 0 || snapshot.accuracy > 1)) {
      throw new Error('Metrics accuracy must be null or a value from 0 through 1.');
    }
    if (snapshot.levelProgress < 0 || snapshot.levelProgress > 1) {
      throw new Error('Metrics levelProgress must be a value from 0 through 1.');
    }
    this.state = Object.freeze({
      ...snapshot,
      topicMetrics: Object.freeze(
        snapshot.topicMetrics.map((topic) => Object.freeze({ ...topic })),
      ),
      recentImprovement: Object.freeze({ ...snapshot.recentImprovement }),
      readinessEstimate: Object.freeze({ ...snapshot.readinessEstimate }),
    });
    for (const listener of this.listeners) listener(this.state);
    return this.state;
  }

  public reset(): MetricsSnapshot {
    this.state = emptyMetrics();
    for (const listener of this.listeners) listener(this.state);
    return this.state;
  }
}
