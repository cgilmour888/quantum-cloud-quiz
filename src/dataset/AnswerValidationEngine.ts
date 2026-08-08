/**
 * Artifact ID: QCQ-TBL-019
 * Artifact Name: AnswerValidationEngine
 * Repository Path: QCQ/frontend/src/dataset/AnswerValidationEngine.ts
 */

import type { CanonicalQuestion } from './DatasetLoader';

export type AnswerValidationStatus = 'correct' | 'incorrect' | 'incomplete' | 'invalid';
export type AnswerValidationIssueCode =
  | 'unknown-option'
  | 'duplicate-selection'
  | 'too-few-selections'
  | 'too-many-selections'
  | 'answer-key-invalid'
  | 'duplicate-submission'
  | 'submission-conflict';

export interface AnswerValidationIssue {
  readonly code: AnswerValidationIssueCode;
  readonly message: string;
  readonly optionId?: string | undefined;
}

export interface AnswerSubmissionInput {
  readonly sessionId: string;
  readonly question: CanonicalQuestion;
  readonly selectedOptionIds: readonly string[];
  readonly submittedAt?: string | undefined;
  readonly allowResubmission?: boolean | undefined;
}

export interface AnswerValidationResult {
  readonly submissionId: string;
  readonly sessionId: string;
  readonly questionId: string;
  readonly status: AnswerValidationStatus;
  readonly isCorrect: boolean;
  readonly selectedOptionIds: readonly string[];
  readonly correctOptionIds: readonly string[];
  readonly missingCorrectOptionIds: readonly string[];
  readonly extraSelectedOptionIds: readonly string[];
  readonly requiredSelectionCount: number;
  readonly score: 0 | 1;
  readonly issues: readonly AnswerValidationIssue[];
  readonly attemptNumber: number;
  readonly duplicateSubmission: boolean;
  readonly gradedAt: string;
}

function fnv1a64(value: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, '0');
}

function sameSelection(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const set = new Set(left);
  return right.every((id) => set.has(id));
}

function orderedSelection(question: CanonicalQuestion, selected: ReadonlySet<string>): readonly string[] {
  return Object.freeze(question.options.map((option) => option.id).filter((id) => selected.has(id)));
}

export class AnswerValidationEngine {
  private submissions = new Map<string, readonly AnswerValidationResult[]>();

  public grade(input: AnswerSubmissionInput): AnswerValidationResult {
    if (!input.sessionId.trim()) throw new Error('AnswerValidationEngine requires a non-empty sessionId.');
    const key = `${input.sessionId}:${input.question.id}`;
    const priorAttempts = this.submissions.get(key) ?? [];
    const duplicate = priorAttempts.find((attempt) => sameSelection(attempt.selectedOptionIds, input.selectedOptionIds));
    if (duplicate) {
      return Object.freeze({
        ...duplicate,
        duplicateSubmission: true,
        issues: Object.freeze([...duplicate.issues, { code: 'duplicate-submission' as const, message: 'This exact answer set was already submitted.' }]),
      });
    }

    if (priorAttempts.length > 0 && !input.allowResubmission) {
      const conflict = this.evaluate(input, priorAttempts.length + 1);
      return Object.freeze({
        ...conflict,
        status: 'invalid',
        isCorrect: false,
        score: 0,
        issues: Object.freeze([...conflict.issues, { code: 'submission-conflict' as const, message: 'A different answer set was already graded for this question.' }]),
      });
    }

    const result = this.evaluate(input, priorAttempts.length + 1);
    this.submissions.set(key, Object.freeze([...priorAttempts, result]));
    return result;
  }

  public evaluate(input: AnswerSubmissionInput, attemptNumber = 1): AnswerValidationResult {
    const { question } = input;
    const optionIds = new Set(question.options.map((option) => option.id));
    const selectedSet = new Set<string>();
    const issues: AnswerValidationIssue[] = [];

    for (const optionId of input.selectedOptionIds) {
      if (!optionIds.has(optionId)) {
        issues.push({ code: 'unknown-option', message: `Selected option "${optionId}" does not exist.`, optionId });
      } else if (selectedSet.has(optionId)) {
        issues.push({ code: 'duplicate-selection', message: `Selected option "${optionId}" was supplied more than once.`, optionId });
      } else {
        selectedSet.add(optionId);
      }
    }

    const correctSet = new Set(question.correctAnswers);
    const answerKeyInvalid =
      correctSet.size !== question.correctAnswers.length ||
      question.correctAnswers.some((id) => !optionIds.has(id)) ||
      question.correctAnswers.length !== question.selectionCount ||
      (question.selectionType === 'single' && question.selectionCount !== 1) ||
      (question.selectionType === 'multiple' && question.selectionCount < 2);
    if (answerKeyInvalid) issues.push({ code: 'answer-key-invalid', message: 'Question answer key or selection contract is internally inconsistent.' });
    if (selectedSet.size < question.selectionCount) issues.push({ code: 'too-few-selections', message: `Exactly ${question.selectionCount} answer${question.selectionCount === 1 ? '' : 's'} must be selected.` });
    if (selectedSet.size > question.selectionCount) issues.push({ code: 'too-many-selections', message: `No more than ${question.selectionCount} answer${question.selectionCount === 1 ? '' : 's'} may be selected.` });

    const selectedOptionIds = orderedSelection(question, selectedSet);
    const correctOptionIds = Object.freeze([...question.correctAnswers]);
    const missingCorrectOptionIds = Object.freeze(correctOptionIds.filter((id) => !selectedSet.has(id)));
    const extraSelectedOptionIds = Object.freeze(selectedOptionIds.filter((id) => !correctSet.has(id)));
    const invalid = issues.some((issue) => issue.code !== 'too-few-selections');
    const incomplete = issues.some((issue) => issue.code === 'too-few-selections');
    const exactMatch = !invalid && !incomplete && missingCorrectOptionIds.length === 0 && extraSelectedOptionIds.length === 0 && selectedOptionIds.length === correctOptionIds.length;
    const status: AnswerValidationStatus = invalid ? 'invalid' : incomplete ? 'incomplete' : exactMatch ? 'correct' : 'incorrect';
    const gradedAt = input.submittedAt ?? new Date().toISOString();
    if (!Number.isFinite(Date.parse(gradedAt))) throw new Error('submittedAt must be an ISO-compatible date-time.');
    const submissionId = `qcq-submission-${fnv1a64(`${input.sessionId}|${question.id}|${selectedOptionIds.join('|')}|${attemptNumber}`)}`;

    return Object.freeze({
      submissionId,
      sessionId: input.sessionId,
      questionId: question.id,
      status,
      isCorrect: status === 'correct',
      selectedOptionIds,
      correctOptionIds,
      missingCorrectOptionIds,
      extraSelectedOptionIds,
      requiredSelectionCount: question.selectionCount,
      score: status === 'correct' ? 1 : 0,
      issues: Object.freeze(issues),
      attemptNumber,
      duplicateSubmission: false,
      gradedAt,
    });
  }

  public attemptsFor(sessionId: string, questionId: string): readonly AnswerValidationResult[] {
    return Object.freeze([...(this.submissions.get(`${sessionId}:${questionId}`) ?? [])]);
  }

  public hasSubmission(sessionId: string, questionId: string): boolean {
    return (this.submissions.get(`${sessionId}:${questionId}`)?.length ?? 0) > 0;
  }

  public restore(results: readonly AnswerValidationResult[]): void {
    const next = new Map<string, AnswerValidationResult[]>();
    for (const result of results) {
      const key = `${result.sessionId}:${result.questionId}`;
      const attempts = next.get(key) ?? [];
      if (attempts.some((attempt) => attempt.submissionId === result.submissionId)) throw new Error(`Duplicate submission ID "${result.submissionId}" during restore.`);
      attempts.push(Object.freeze({
        ...result,
        selectedOptionIds: Object.freeze([...result.selectedOptionIds]),
        correctOptionIds: Object.freeze([...result.correctOptionIds]),
        missingCorrectOptionIds: Object.freeze([...result.missingCorrectOptionIds]),
        extraSelectedOptionIds: Object.freeze([...result.extraSelectedOptionIds]),
        issues: Object.freeze([...result.issues]),
      }));
      next.set(key, attempts);
    }
    this.submissions = new Map([...next].map(([key, attempts]) => [key, Object.freeze([...attempts])]));
  }

  public clearSession(sessionId: string): void {
    for (const key of this.submissions.keys()) if (key.startsWith(`${sessionId}:`)) this.submissions.delete(key);
  }
}
