/**
 * Artifact ID: QCQ-TBL-020
 * Artifact Name: QuestionProgressionEngine
 * Repository Path: QCQ/frontend/src/dataset/QuestionProgressionEngine.ts
 */

import type { AnswerValidationResult } from './AnswerValidationEngine';
import type { QuestionSessionSnapshot } from './QuestionSessionEngine';

export type QuestionProgressionPhase = 'answering' | 'feedback' | 'review' | 'completed';
export type QuestionProgressRecordStatus = 'unseen' | 'viewed' | 'selected' | 'graded' | 'skipped';

export interface QuestionProgressRecord {
  readonly questionId: string;
  readonly status: QuestionProgressRecordStatus;
  readonly selectedOptionIds: readonly string[];
  readonly validationResult: AnswerValidationResult | null;
  readonly flagged: boolean;
  readonly visitedAt: string | null;
  readonly updatedAt: string;
}

export interface QuestionProgressionPolicy {
  readonly allowSkip: boolean;
  readonly allowBackNavigation: boolean;
  readonly allowReviewAfterGrade: boolean;
  readonly allowIncompleteFinalization: boolean;
}

export interface QuestionProgressionSnapshot {
  readonly schemaVersion: '1.0.0';
  readonly sessionId: string;
  readonly datasetId: string;
  readonly datasetVersion: string;
  readonly phase: QuestionProgressionPhase;
  readonly currentIndex: number;
  readonly currentQuestionId: string;
  readonly records: readonly QuestionProgressRecord[];
  readonly answeredCount: number;
  readonly correctCount: number;
  readonly incorrectCount: number;
  readonly skippedCount: number;
  readonly flaggedCount: number;
  readonly completionRatio: number;
  readonly revision: number;
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
}

export type QuestionProgressionEvent =
  | { readonly type: 'quiz:question-changed'; readonly questionId: string; readonly index: number }
  | { readonly type: 'quiz:answer-selected'; readonly questionId: string; readonly selectedOptionIds: readonly string[] }
  | { readonly type: 'quiz:answer-correct'; readonly questionId: string }
  | { readonly type: 'quiz:answer-incorrect'; readonly questionId: string }
  | { readonly type: 'quiz:question-skipped'; readonly questionId: string }
  | { readonly type: 'quiz:exam-completed'; readonly snapshot: QuestionProgressionSnapshot };

type SnapshotListener = (snapshot: QuestionProgressionSnapshot) => void;
type EventListener = (event: QuestionProgressionEvent) => void;

export class QuestionProgressionError extends Error {
  public readonly code: string;
  public constructor(code: string, message: string) {
    super(message);
    this.name = 'QuestionProgressionError';
    this.code = code;
  }
}

const DEFAULT_POLICY: QuestionProgressionPolicy = {
  allowSkip: true,
  allowBackNavigation: true,
  allowReviewAfterGrade: true,
  allowIncompleteFinalization: false,
};

function nowIso(): string { return new Date().toISOString(); }
function freezeRecord(record: QuestionProgressRecord): QuestionProgressRecord {
  return Object.freeze({ ...record, selectedOptionIds: Object.freeze([...record.selectedOptionIds]) });
}
function assertUnique(values: readonly string[], name: string): void {
  if (new Set(values).size !== values.length) throw new QuestionProgressionError('duplicate-selection', `${name} contains duplicate option IDs.`);
}

export class QuestionProgressionEngine {
  private state: QuestionProgressionSnapshot;
  private readonly policy: QuestionProgressionPolicy;
  private snapshotListeners = new Set<SnapshotListener>();
  private eventListeners = new Set<EventListener>();

  public constructor(session: QuestionSessionSnapshot, policy: Partial<QuestionProgressionPolicy> = {}) {
    if (session.questionIds.length === 0) throw new QuestionProgressionError('empty-session', 'QuestionProgressionEngine requires at least one question.');
    this.policy = Object.freeze({ ...DEFAULT_POLICY, ...policy });
    const timestamp = nowIso();
    const records = session.questionIds.map((questionId, index) => freezeRecord({
      questionId,
      status: index === 0 ? 'viewed' : 'unseen',
      selectedOptionIds: [],
      validationResult: null,
      flagged: false,
      visitedAt: index === 0 ? timestamp : null,
      updatedAt: timestamp,
    }));
    this.state = this.derive({
      schemaVersion: '1.0.0',
      sessionId: session.sessionId,
      datasetId: session.datasetId,
      datasetVersion: session.datasetVersion,
      phase: 'answering',
      currentIndex: 0,
      currentQuestionId: session.questionIds[0]!,
      records,
      answeredCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      skippedCount: 0,
      flaggedCount: 0,
      completionRatio: 0,
      revision: 0,
      startedAt: session.startedAt,
      updatedAt: timestamp,
      completedAt: null,
    });
  }

  public snapshot(): QuestionProgressionSnapshot { return this.state; }

  public selectAnswers(selectedOptionIds: readonly string[]): QuestionProgressionSnapshot {
    this.assertPhase(['answering']);
    assertUnique(selectedOptionIds, 'selectedOptionIds');
    const current = this.currentRecord();
    const next = freezeRecord({ ...current, status: selectedOptionIds.length > 0 ? 'selected' : 'viewed', selectedOptionIds, updatedAt: nowIso() });
    this.replaceCurrentRecord(next, 'answering');
    this.emitEvent({ type: 'quiz:answer-selected', questionId: current.questionId, selectedOptionIds: next.selectedOptionIds });
    return this.state;
  }

  public recordGrade(result: AnswerValidationResult): QuestionProgressionSnapshot {
    this.assertPhase(['answering']);
    const current = this.currentRecord();
    if (result.sessionId !== this.state.sessionId || result.questionId !== current.questionId) throw new QuestionProgressionError('grade-target-mismatch', 'Validation result does not target the current session question.');
    if (result.status === 'incomplete' || result.status === 'invalid') throw new QuestionProgressionError('grade-not-final', 'Only correct or incorrect validation results may advance to feedback.');
    if (current.validationResult) {
      if (current.validationResult.submissionId === result.submissionId) return this.state;
      throw new QuestionProgressionError('duplicate-grade', 'Current question already has a different grade.');
    }
    const next = freezeRecord({ ...current, status: 'graded', selectedOptionIds: result.selectedOptionIds, validationResult: result, updatedAt: nowIso() });
    this.replaceCurrentRecord(next, 'feedback');
    this.emitEvent({ type: result.isCorrect ? 'quiz:answer-correct' : 'quiz:answer-incorrect', questionId: current.questionId });
    return this.state;
  }

  public skipCurrent(): QuestionProgressionSnapshot {
    if (!this.policy.allowSkip) throw new QuestionProgressionError('skip-prohibited', 'Skipping is prohibited by the active progression policy.');
    this.assertPhase(['answering']);
    const current = this.currentRecord();
    const next = freezeRecord({ ...current, status: 'skipped', selectedOptionIds: [], validationResult: null, updatedAt: nowIso() });
    this.replaceCurrentRecord(next, 'feedback');
    this.emitEvent({ type: 'quiz:question-skipped', questionId: current.questionId });
    return this.state;
  }

  public toggleFlag(): QuestionProgressionSnapshot {
    const current = this.currentRecord();
    this.replaceCurrentRecord(freezeRecord({ ...current, flagged: !current.flagged, updatedAt: nowIso() }), this.state.phase);
    return this.state;
  }

  public next(): QuestionProgressionSnapshot {
    this.assertPhase(['feedback', 'review']);
    return this.state.currentIndex >= this.state.records.length - 1 ? this.finalize() : this.navigateTo(this.state.currentIndex + 1);
  }

  public previous(): QuestionProgressionSnapshot {
    if (!this.policy.allowBackNavigation) throw new QuestionProgressionError('back-navigation-prohibited', 'Back navigation is prohibited by policy.');
    return this.state.currentIndex === 0 ? this.state : this.navigateTo(this.state.currentIndex - 1, true);
  }

  public jumpTo(index: number): QuestionProgressionSnapshot {
    if (!this.policy.allowBackNavigation && index < this.state.currentIndex) throw new QuestionProgressionError('back-navigation-prohibited', 'Back navigation is prohibited by policy.');
    return this.navigateTo(index, true);
  }

  public beginReview(): QuestionProgressionSnapshot {
    if (!this.policy.allowReviewAfterGrade) throw new QuestionProgressionError('review-prohibited', 'Review is prohibited by policy.');
    this.state = this.commit({ ...this.state, phase: 'review' });
    return this.state;
  }

  public finalize(): QuestionProgressionSnapshot {
    const incomplete = this.state.records.filter((record) => record.status !== 'graded' && record.status !== 'skipped');
    if (incomplete.length > 0 && !this.policy.allowIncompleteFinalization) throw new QuestionProgressionError('incomplete-session', `${incomplete.length} questions remain unanswered or unskipped.`);
    this.state = this.commit({ ...this.state, phase: 'completed', completedAt: nowIso() });
    this.emitEvent({ type: 'quiz:exam-completed', snapshot: this.state });
    return this.state;
  }

  public restore(snapshot: QuestionProgressionSnapshot): QuestionProgressionSnapshot {
    const schemaVersion: string = snapshot.schemaVersion;
    if (schemaVersion !== '1.0.0') throw new QuestionProgressionError('schema-version-unsupported', `Unsupported progression schema "${schemaVersion}".`);
    if (snapshot.records.length === 0 || snapshot.currentIndex < 0 || snapshot.currentIndex >= snapshot.records.length) throw new QuestionProgressionError('snapshot-invalid', 'Progression snapshot contains an invalid question range.');
    if (snapshot.records[snapshot.currentIndex]!.questionId !== snapshot.currentQuestionId) throw new QuestionProgressionError('snapshot-current-mismatch', 'currentQuestionId does not match currentIndex.');
    if (new Set(snapshot.records.map((record) => record.questionId)).size !== snapshot.records.length) throw new QuestionProgressionError('snapshot-duplicate-question', 'Progression snapshot contains duplicate question IDs.');
    this.state = this.derive({ ...snapshot, records: snapshot.records.map(freezeRecord) });
    this.notifySnapshot();
    return this.state;
  }

  public subscribe(listener: SnapshotListener): () => void { this.snapshotListeners.add(listener); return () => this.snapshotListeners.delete(listener); }
  public subscribeEvents(listener: EventListener): () => void { this.eventListeners.add(listener); return () => this.eventListeners.delete(listener); }

  private currentRecord(): QuestionProgressRecord { return this.state.records[this.state.currentIndex]!; }
  private assertPhase(allowed: readonly QuestionProgressionPhase[]): void {
    if (!allowed.includes(this.state.phase)) throw new QuestionProgressionError('phase-transition-invalid', `Operation is invalid during phase "${this.state.phase}".`);
  }
  private replaceCurrentRecord(record: QuestionProgressRecord, phase: QuestionProgressionPhase): void {
    const records = [...this.state.records];
    records[this.state.currentIndex] = record;
    this.state = this.commit({ ...this.state, records, phase });
  }
  private navigateTo(index: number, review = false): QuestionProgressionSnapshot {
    if (!Number.isInteger(index) || index < 0 || index >= this.state.records.length) throw new QuestionProgressionError('navigation-out-of-range', `Question index ${index} is outside the session range.`);
    const timestamp = nowIso();
    const records = [...this.state.records];
    const target = records[index]!;
    records[index] = freezeRecord({ ...target, status: target.status === 'unseen' ? 'viewed' : target.status, visitedAt: target.visitedAt ?? timestamp, updatedAt: timestamp });
    const phase: QuestionProgressionPhase = review || records[index].status === 'graded' || records[index].status === 'skipped' ? 'review' : 'answering';
    this.state = this.commit({ ...this.state, records, currentIndex: index, currentQuestionId: records[index].questionId, phase });
    this.emitEvent({ type: 'quiz:question-changed', questionId: this.state.currentQuestionId, index });
    return this.state;
  }
  private commit(candidate: QuestionProgressionSnapshot): QuestionProgressionSnapshot {
    this.state = this.derive({ ...candidate, revision: this.state.revision + 1, updatedAt: nowIso() });
    this.notifySnapshot();
    return this.state;
  }
  private derive(candidate: QuestionProgressionSnapshot): QuestionProgressionSnapshot {
    const records = Object.freeze(candidate.records.map(freezeRecord));
    const answeredCount = records.filter((record) => record.status === 'graded').length;
    const correctCount = records.filter((record) => record.validationResult?.isCorrect === true).length;
    const incorrectCount = records.filter((record) => record.validationResult?.status === 'incorrect').length;
    const skippedCount = records.filter((record) => record.status === 'skipped').length;
    const flaggedCount = records.filter((record) => record.flagged).length;
    return Object.freeze({ ...candidate, records, answeredCount, correctCount, incorrectCount, skippedCount, flaggedCount, completionRatio: records.length === 0 ? 0 : (answeredCount + skippedCount) / records.length });
  }
  private notifySnapshot(): void { for (const listener of this.snapshotListeners) listener(this.state); }
  private emitEvent(event: QuestionProgressionEvent): void { for (const listener of this.eventListeners) listener(event); }
}
