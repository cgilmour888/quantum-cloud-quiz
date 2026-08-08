/**
 * Artifact ID: QCQ-TBL-021
 * Artifact Name: GameplayStore
 * Repository Path: QCQ/frontend/src/gameplay/GameplayStore.ts
 */

import type { CanonicalQuestion, QuestionDifficulty } from '../dataset/DatasetLoader';
import type { AnswerValidationResult } from '../dataset/AnswerValidationEngine';
import type { QuestionProgressionSnapshot } from '../dataset/QuestionProgressionEngine';
import type { QuestionSessionSnapshot } from '../dataset/QuestionSessionEngine';

export type GameplayPhase =
  | 'idle'
  | 'active'
  | 'paused'
  | 'review'
  | 'completed'
  | 'abandoned';

export type GameplayInputModality =
  | 'keyboard'
  | 'mouse'
  | 'touch'
  | 'stylus'
  | 'voice'
  | 'assistive-technology'
  | 'programmatic'
  | 'unknown';

interface GameplayEvidenceBase {
  readonly eventId: string;
  readonly sequence: number;
  readonly sessionId: string;
  readonly occurredAt: string;
}

export type GameplayEvidenceEvent =
  | (GameplayEvidenceBase & {
      readonly type: 'session-started';
      readonly datasetId: string;
      readonly datasetVersion: string;
      readonly questionCount: number;
    })
  | (GameplayEvidenceBase & {
      readonly type: 'question-viewed';
      readonly questionId: string;
      readonly questionIndex: number;
      readonly topic: string;
    })
  | (GameplayEvidenceBase & {
      readonly type: 'answer-selected';
      readonly questionId: string;
      readonly selectedOptionIds: readonly string[];
      readonly inputModality: GameplayInputModality;
    })
  | (GameplayEvidenceBase & {
      readonly type: 'answer-graded';
      readonly questionId: string;
      readonly submissionId: string;
      readonly result: AnswerValidationResult;
      readonly topic: string;
      readonly subtopic: string | null;
      readonly difficulty: QuestionDifficulty;
      readonly responseTimeMilliseconds: number | null;
    })
  | (GameplayEvidenceBase & {
      readonly type: 'question-skipped';
      readonly questionId: string;
      readonly topic: string;
    })
  | (GameplayEvidenceBase & {
      readonly type: 'question-flag-changed';
      readonly questionId: string;
      readonly flagged: boolean;
    })
  | (GameplayEvidenceBase & {
      readonly type: 'bookmark-changed';
      readonly questionId: string;
      readonly bookmarked: boolean;
    })
  | (GameplayEvidenceBase & {
      readonly type: 'session-paused';
      readonly reason: 'user' | 'visibility' | 'system';
    })
  | (GameplayEvidenceBase & {
      readonly type: 'session-resumed';
      readonly reason: 'user' | 'visibility' | 'system';
    })
  | (GameplayEvidenceBase & {
      readonly type: 'session-completed';
      readonly completedQuestionCount: number;
    })
  | (GameplayEvidenceBase & {
      readonly type: 'session-abandoned';
      readonly reason: string;
    });

export interface GameplayStoreSnapshot {
  readonly schemaVersion: '1.0.0';
  readonly revision: number;
  readonly phase: GameplayPhase;
  readonly session: QuestionSessionSnapshot | null;
  readonly progression: QuestionProgressionSnapshot | null;
  readonly evidence: readonly GameplayEvidenceEvent[];
  readonly bookmarkedQuestionIds: readonly string[];
  readonly startedAt: string | null;
  readonly updatedAt: string;
  readonly completedAt: string | null;
  readonly lastEventId: string | null;
}

export interface StartGameplayOptions {
  readonly replaceActiveSession?: boolean | undefined;
  readonly occurredAt?: string | undefined;
}

export interface RecordSelectionInput {
  readonly questionId: string;
  readonly selectedOptionIds: readonly string[];
  readonly inputModality?: GameplayInputModality | undefined;
  readonly occurredAt?: string | undefined;
}

export interface RecordGradeInput {
  readonly question: CanonicalQuestion;
  readonly result: AnswerValidationResult;
  readonly responseTimeMilliseconds?: number | null | undefined;
  readonly occurredAt?: string | undefined;
}

export interface GameplayStoreRestoreOptions {
  readonly expectedDatasetId?: string | undefined;
  readonly expectedDatasetVersion?: string | undefined;
}

type GameplayStoreListener = (snapshot: GameplayStoreSnapshot) => void;
type GameplayEvidenceListener = (event: GameplayEvidenceEvent) => void;

export class GameplayStoreError extends Error {
  public readonly code: string;

  public constructor(code: string, message: string) {
    super(message);
    this.name = 'GameplayStoreError';
    this.code = code;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function assertIsoDate(value: string, fieldName: string): void {
  if (!Number.isFinite(Date.parse(value))) {
    throw new GameplayStoreError('invalid-date', `${fieldName} must be an ISO-compatible date-time.`);
  }
}

function assertUnique(values: readonly string[], fieldName: string): void {
  if (new Set(values).size !== values.length) {
    throw new GameplayStoreError('duplicate-value', `${fieldName} contains duplicate values.`);
  }
}

function createEventId(sessionId: string, type: string, identity: string): string {
  return `${sessionId}:${type}:${identity}`;
}

function freezeEvidence(event: GameplayEvidenceEvent): GameplayEvidenceEvent {
  if (event.type === 'answer-selected') {
    return Object.freeze({
      ...event,
      selectedOptionIds: Object.freeze([...event.selectedOptionIds]),
    });
  }
  return Object.freeze({ ...event });
}

function freezeSnapshot(snapshot: GameplayStoreSnapshot): GameplayStoreSnapshot {
  return Object.freeze({
    ...snapshot,
    evidence: Object.freeze(snapshot.evidence.map(freezeEvidence)),
    bookmarkedQuestionIds: Object.freeze([...snapshot.bookmarkedQuestionIds]),
  });
}

function emptySnapshot(): GameplayStoreSnapshot {
  const timestamp = nowIso();
  return freezeSnapshot({
    schemaVersion: '1.0.0',
    revision: 0,
    phase: 'idle',
    session: null,
    progression: null,
    evidence: [],
    bookmarkedQuestionIds: [],
    startedAt: null,
    updatedAt: timestamp,
    completedAt: null,
    lastEventId: null,
  });
}

export class GameplayStore {
  private state: GameplayStoreSnapshot = emptySnapshot();
  private snapshotListeners = new Set<GameplayStoreListener>();
  private evidenceListeners = new Set<GameplayEvidenceListener>();
  private eventIds = new Set<string>();
  private submissionIds = new Set<string>();

  public readonly getSnapshot = (): GameplayStoreSnapshot => this.state;
  public readonly getServerSnapshot = (): GameplayStoreSnapshot => this.state;

  public readonly subscribe = (listener: GameplayStoreListener): (() => void) => {
    this.snapshotListeners.add(listener);
    return () => this.snapshotListeners.delete(listener);
  };

  public readonly subscribeEvidence = (listener: GameplayEvidenceListener): (() => void) => {
    this.evidenceListeners.add(listener);
    return () => this.evidenceListeners.delete(listener);
  };

  public startSession(
    session: QuestionSessionSnapshot,
    progression: QuestionProgressionSnapshot,
    options: StartGameplayOptions = {},
  ): GameplayStoreSnapshot {
    if (
      this.state.phase !== 'idle' &&
      this.state.phase !== 'completed' &&
      this.state.phase !== 'abandoned' &&
      !options.replaceActiveSession
    ) {
      throw new GameplayStoreError(
        'active-session-exists',
        'An active gameplay session must be completed, abandoned, or explicitly replaced.',
      );
    }
    this.assertSessionProgressionCoherence(session, progression);
    const occurredAt = options.occurredAt ?? session.startedAt;
    assertIsoDate(occurredAt, 'occurredAt');

    this.eventIds.clear();
    this.submissionIds.clear();
    const startEvent = freezeEvidence({
      type: 'session-started',
      eventId: createEventId(session.sessionId, 'session-started', session.startedAt),
      sequence: 1,
      sessionId: session.sessionId,
      occurredAt,
      datasetId: session.datasetId,
      datasetVersion: session.datasetVersion,
      questionCount: session.questionCount,
    });
    this.eventIds.add(startEvent.eventId);

    this.state = freezeSnapshot({
      schemaVersion: '1.0.0',
      revision: this.state.revision + 1,
      phase: 'active',
      session,
      progression,
      evidence: [startEvent],
      bookmarkedQuestionIds: [],
      startedAt: session.startedAt,
      updatedAt: occurredAt,
      completedAt: null,
      lastEventId: startEvent.eventId,
    });
    this.notifySnapshot();
    this.notifyEvidence(startEvent);
    return this.state;
  }

  public updateProgression(progression: QuestionProgressionSnapshot): GameplayStoreSnapshot {
    const session = this.requireSession();
    this.assertSessionProgressionCoherence(session, progression);
    const phase: GameplayPhase =
      progression.phase === 'completed'
        ? 'completed'
        : progression.phase === 'review'
          ? 'review'
          : this.state.phase === 'paused'
            ? 'paused'
            : 'active';
    this.state = this.commit({
      ...this.state,
      phase,
      progression,
      completedAt: progression.completedAt,
    });
    return this.state;
  }

  public recordQuestionViewed(
    question: CanonicalQuestion,
    questionIndex: number,
    occurredAt = nowIso(),
  ): GameplayStoreSnapshot {
    const session = this.requireActiveSession();
    if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex >= session.questionCount) {
      throw new GameplayStoreError('question-index-invalid', 'questionIndex is outside the active session range.');
    }
    this.assertQuestionInSession(question.id);
    const eventId = createEventId(session.sessionId, 'question-viewed', `${question.id}:${questionIndex}`);
    return this.appendEvidence({
      type: 'question-viewed',
      eventId,
      sequence: this.nextSequence(),
      sessionId: session.sessionId,
      occurredAt,
      questionId: question.id,
      questionIndex,
      topic: question.topic,
    });
  }

  public recordSelection(input: RecordSelectionInput): GameplayStoreSnapshot {
    const session = this.requireActiveSession();
    this.assertQuestionInSession(input.questionId);
    assertUnique(input.selectedOptionIds, 'selectedOptionIds');
    const occurredAt = input.occurredAt ?? nowIso();
    const identity = `${input.questionId}:${this.nextSequence()}:${input.selectedOptionIds.join(',')}`;
    return this.appendEvidence({
      type: 'answer-selected',
      eventId: createEventId(session.sessionId, 'answer-selected', identity),
      sequence: this.nextSequence(),
      sessionId: session.sessionId,
      occurredAt,
      questionId: input.questionId,
      selectedOptionIds: Object.freeze([...input.selectedOptionIds]),
      inputModality: input.inputModality ?? 'unknown',
    });
  }

  public recordGrade(input: RecordGradeInput): GameplayStoreSnapshot {
    const session = this.requireActiveSession();
    const { question, result } = input;
    this.assertQuestionInSession(question.id);
    if (result.sessionId !== session.sessionId || result.questionId !== question.id) {
      throw new GameplayStoreError(
        'grade-target-mismatch',
        'The validation result does not target the active session question.',
      );
    }
    if (result.status !== 'correct' && result.status !== 'incorrect') {
      throw new GameplayStoreError(
        'grade-not-final',
        'Only final correct or incorrect validation results may become gameplay evidence.',
      );
    }
    if (this.submissionIds.has(result.submissionId)) {
      return this.state;
    }

    const responseTime = input.responseTimeMilliseconds ?? null;
    if (responseTime !== null && (!Number.isFinite(responseTime) || responseTime < 0)) {
      throw new GameplayStoreError(
        'response-time-invalid',
        'responseTimeMilliseconds must be null or a non-negative finite number.',
      );
    }
    const event = {
      type: 'answer-graded' as const,
      eventId: createEventId(session.sessionId, 'answer-graded', result.submissionId),
      sequence: this.nextSequence(),
      sessionId: session.sessionId,
      occurredAt: input.occurredAt ?? result.gradedAt,
      questionId: question.id,
      submissionId: result.submissionId,
      result,
      topic: question.topic,
      subtopic: question.subtopic,
      difficulty: question.difficulty,
      responseTimeMilliseconds: responseTime,
    };
    this.submissionIds.add(result.submissionId);
    return this.appendEvidence(event);
  }

  public recordSkip(
    question: CanonicalQuestion,
    occurredAt = nowIso(),
  ): GameplayStoreSnapshot {
    const session = this.requireActiveSession();
    this.assertQuestionInSession(question.id);
    return this.appendEvidence({
      type: 'question-skipped',
      eventId: createEventId(session.sessionId, 'question-skipped', question.id),
      sequence: this.nextSequence(),
      sessionId: session.sessionId,
      occurredAt,
      questionId: question.id,
      topic: question.topic,
    });
  }

  public setQuestionFlag(
    questionId: string,
    flagged: boolean,
    occurredAt = nowIso(),
  ): GameplayStoreSnapshot {
    const session = this.requireSession();
    this.assertQuestionInSession(questionId);
    return this.appendEvidence({
      type: 'question-flag-changed',
      eventId: createEventId(
        session.sessionId,
        'question-flag-changed',
        `${questionId}:${flagged}:${this.nextSequence()}`,
      ),
      sequence: this.nextSequence(),
      sessionId: session.sessionId,
      occurredAt,
      questionId,
      flagged,
    });
  }

  public setBookmark(
    questionId: string,
    bookmarked: boolean,
    occurredAt = nowIso(),
  ): GameplayStoreSnapshot {
    const session = this.requireSession();
    this.assertQuestionInSession(questionId);
    const current = new Set(this.state.bookmarkedQuestionIds);
    if (bookmarked) current.add(questionId);
    else current.delete(questionId);
    const event: GameplayEvidenceEvent = {
      type: 'bookmark-changed',
      eventId: createEventId(
        session.sessionId,
        'bookmark-changed',
        `${questionId}:${bookmarked}:${this.nextSequence()}`,
      ),
      sequence: this.nextSequence(),
      sessionId: session.sessionId,
      occurredAt,
      questionId,
      bookmarked,
    };
    return this.appendEvidence(event, Object.freeze([...current]));
  }

  public pause(
    reason: 'user' | 'visibility' | 'system' = 'user',
    occurredAt = nowIso(),
  ): GameplayStoreSnapshot {
    const session = this.requireActiveSession();
    const eventId = createEventId(session.sessionId, 'session-paused', occurredAt);
    const snapshot = this.appendEvidence({
      type: 'session-paused',
      eventId,
      sequence: this.nextSequence(),
      sessionId: session.sessionId,
      occurredAt,
      reason,
    });
    this.state = this.commit({ ...snapshot, phase: 'paused' });
    return this.state;
  }

  public resume(
    reason: 'user' | 'visibility' | 'system' = 'user',
    occurredAt = nowIso(),
  ): GameplayStoreSnapshot {
    const session = this.requireSession();
    if (this.state.phase !== 'paused') {
      throw new GameplayStoreError('session-not-paused', 'Only a paused session may be resumed.');
    }
    const snapshot = this.appendEvidence({
      type: 'session-resumed',
      eventId: createEventId(session.sessionId, 'session-resumed', occurredAt),
      sequence: this.nextSequence(),
      sessionId: session.sessionId,
      occurredAt,
      reason,
    });
    this.state = this.commit({ ...snapshot, phase: 'active' });
    return this.state;
  }

  public complete(
    progression: QuestionProgressionSnapshot,
    occurredAt = progression.completedAt ?? nowIso(),
  ): GameplayStoreSnapshot {
    const session = this.requireSession();
    this.assertSessionProgressionCoherence(session, progression);
    if (progression.phase !== 'completed') {
      throw new GameplayStoreError(
        'progression-not-complete',
        'Gameplay completion requires a completed progression snapshot.',
      );
    }
    const eventId = createEventId(session.sessionId, 'session-completed', session.sessionId);
    const snapshot = this.appendEvidence({
      type: 'session-completed',
      eventId,
      sequence: this.nextSequence(),
      sessionId: session.sessionId,
      occurredAt,
      completedQuestionCount: progression.answeredCount + progression.skippedCount,
    });
    this.state = this.commit({
      ...snapshot,
      phase: 'completed',
      progression,
      completedAt: occurredAt,
    });
    return this.state;
  }

  public abandon(reason: string, occurredAt = nowIso()): GameplayStoreSnapshot {
    const session = this.requireSession();
    if (!reason.trim()) {
      throw new GameplayStoreError('abandon-reason-empty', 'An abandonment reason is required.');
    }
    const snapshot = this.appendEvidence({
      type: 'session-abandoned',
      eventId: createEventId(session.sessionId, 'session-abandoned', occurredAt),
      sequence: this.nextSequence(),
      sessionId: session.sessionId,
      occurredAt,
      reason: reason.trim(),
    });
    this.state = this.commit({ ...snapshot, phase: 'abandoned' });
    return this.state;
  }

  public restore(
    snapshot: GameplayStoreSnapshot,
    options: GameplayStoreRestoreOptions = {},
  ): GameplayStoreSnapshot {
    const schemaVersion: string =
      snapshot.schemaVersion;

    if (schemaVersion !== '1.0.0') {
      throw new GameplayStoreError(
        'schema-version-unsupported',
        `Unsupported gameplay-store schema "${schemaVersion}".`,
      );
    }
    if (snapshot.session === null || snapshot.progression === null) {
      if (snapshot.phase !== 'idle') {
        throw new GameplayStoreError(
          'snapshot-incomplete',
          'A non-idle gameplay snapshot requires session and progression state.',
        );
      }
    } else {
      this.assertSessionProgressionCoherence(snapshot.session, snapshot.progression);
      if (
        options.expectedDatasetId &&
        snapshot.session.datasetId !== options.expectedDatasetId
      ) {
        throw new GameplayStoreError(
          'dataset-id-mismatch',
          'Restored gameplay dataset ID does not match the expected dataset.',
        );
      }
      if (
        options.expectedDatasetVersion &&
        snapshot.session.datasetVersion !== options.expectedDatasetVersion
      ) {
        throw new GameplayStoreError(
          'dataset-version-mismatch',
          'Restored gameplay dataset version does not match the expected version.',
        );
      }
    }

    let expectedSequence = 1;
    const eventIds = new Set<string>();
    const submissionIds = new Set<string>();
    for (const event of snapshot.evidence) {
      assertIsoDate(event.occurredAt, 'evidence.occurredAt');
      if (event.sequence !== expectedSequence) {
        throw new GameplayStoreError(
          'evidence-sequence-invalid',
          'Gameplay evidence sequence must be contiguous and one-based.',
        );
      }
      expectedSequence += 1;
      if (eventIds.has(event.eventId)) {
        throw new GameplayStoreError(
          'duplicate-event-id',
          `Duplicate gameplay event ID "${event.eventId}".`,
        );
      }
      eventIds.add(event.eventId);
      if (event.type === 'answer-graded') {
        if (submissionIds.has(event.submissionId)) {
          throw new GameplayStoreError(
            'duplicate-submission-id',
            `Duplicate graded submission ID "${event.submissionId}".`,
          );
        }
        submissionIds.add(event.submissionId);
      }
    }
    assertUnique(snapshot.bookmarkedQuestionIds, 'bookmarkedQuestionIds');
    this.eventIds = eventIds;
    this.submissionIds = submissionIds;
    this.state = freezeSnapshot(snapshot);
    this.notifySnapshot();
    return this.state;
  }

  public reset(): GameplayStoreSnapshot {
    this.eventIds.clear();
    this.submissionIds.clear();
    this.state = emptySnapshot();
    this.notifySnapshot();
    return this.state;
  }

  private appendEvidence(
    event: GameplayEvidenceEvent,
    bookmarks = this.state.bookmarkedQuestionIds,
  ): GameplayStoreSnapshot {
    assertIsoDate(event.occurredAt, 'occurredAt');
    const activeSession = this.requireSession();
    if (event.sessionId !== activeSession.sessionId) {
      throw new GameplayStoreError(
        'event-session-mismatch',
        'Gameplay evidence does not belong to the active session.',
      );
    }
    if (this.eventIds.has(event.eventId)) {
      return this.state;
    }
    if (event.sequence !== this.nextSequence()) {
      throw new GameplayStoreError(
        'event-sequence-invalid',
        'Gameplay evidence sequence is not the next contiguous sequence value.',
      );
    }
    const frozenEvent = freezeEvidence(event);
    this.eventIds.add(frozenEvent.eventId);
    this.state = this.commit({
      ...this.state,
      evidence: Object.freeze([...this.state.evidence, frozenEvent]),
      bookmarkedQuestionIds: bookmarks,
      lastEventId: frozenEvent.eventId,
      updatedAt: frozenEvent.occurredAt,
    });
    this.notifyEvidence(frozenEvent);
    return this.state;
  }

  private commit(candidate: GameplayStoreSnapshot): GameplayStoreSnapshot {
    this.state = freezeSnapshot({
      ...candidate,
      revision: this.state.revision + 1,
      updatedAt: candidate.updatedAt || nowIso(),
    });
    this.notifySnapshot();
    return this.state;
  }

  private nextSequence(): number {
    return this.state.evidence.length + 1;
  }

  private requireSession(): QuestionSessionSnapshot {
    if (!this.state.session) {
      throw new GameplayStoreError('session-missing', 'No gameplay session is active.');
    }
    return this.state.session;
  }

  private requireActiveSession(): QuestionSessionSnapshot {
    const session = this.requireSession();
    if (this.state.phase !== 'active' && this.state.phase !== 'review') {
      throw new GameplayStoreError(
        'session-not-active',
        `Gameplay operation is invalid during phase "${this.state.phase}".`,
      );
    }
    return session;
  }

  private assertQuestionInSession(questionId: string): void {
    const session = this.requireSession();
    if (!session.questionIds.includes(questionId)) {
      throw new GameplayStoreError(
        'question-not-in-session',
        `Question "${questionId}" does not belong to the active session.`,
      );
    }
  }

  private assertSessionProgressionCoherence(
    session: QuestionSessionSnapshot,
    progression: QuestionProgressionSnapshot,
  ): void {
    if (
      progression.sessionId !== session.sessionId ||
      progression.datasetId !== session.datasetId ||
      progression.datasetVersion !== session.datasetVersion
    ) {
      throw new GameplayStoreError(
        'session-progression-mismatch',
        'Session and progression identities do not match.',
      );
    }
    const progressionIds = progression.records.map((record) => record.questionId);
    if (
      progressionIds.length !== session.questionIds.length ||
      progressionIds.some((questionId, index) => questionId !== session.questionIds[index])
    ) {
      throw new GameplayStoreError(
        'session-question-order-mismatch',
        'Session and progression question order do not match.',
      );
    }
  }

  private notifySnapshot(): void {
    for (const listener of this.snapshotListeners) {
      listener(this.state);
    }
  }

  private notifyEvidence(event: GameplayEvidenceEvent): void {
    for (const listener of this.evidenceListeners) {
      listener(event);
    }
  }
}
