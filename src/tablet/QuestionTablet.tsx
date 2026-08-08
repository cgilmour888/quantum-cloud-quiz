/**
 * Artifact ID: QCQ-TBL-010
 * Artifact Name: QuestionTablet
 * Repository Path: QCQ/frontend/src/tablet/QuestionTablet.tsx
 *
 * Composition authority: QCQ-TBL-011 through QCQ-TBL-015.
 * Grading authority remains external in QCQ-TBL-019 AnswerValidationEngine.
 */

import {
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { InnerFrameRenderer } from '../frame/InnerFrameRenderer';
import { PlatinumFrameGlow } from '../frame/PlatinumFrameGlow';
import type { AnswerValidationResult } from '../dataset/AnswerValidationEngine';
import { AnswerGrid, type AnswerGridOption, type AnswerGridSelectionRule } from './AnswerGrid';
import { QuestionCounter } from './QuestionCounter';
import { QuestionViewport } from './QuestionViewport';
import { TimerDisplay, type TimerDisplayProps } from './TimerDisplay';

export type QuestionSelectionRule = AnswerGridSelectionRule;

export interface QuestionOption {
  readonly id: string;
  readonly text: string;
  readonly label?: string | undefined;
}

export interface QuestionModel {
  readonly id: string;
  readonly prompt: string;
  readonly options: readonly QuestionOption[];
  readonly selectionType?: 'single' | 'multiple' | undefined;
  readonly selectionCount?: number | undefined;
  readonly selection?: QuestionSelectionRule | undefined;
  readonly topic?: string | undefined;
  readonly explanation?: string | null | undefined;
  readonly references?: readonly {
    readonly id?: string | undefined;
    readonly url: string;
    readonly title?: string | undefined;
    readonly publisher?: string | undefined;
  }[] | undefined;
  /** @deprecated Use references. */
  readonly reference?: string | undefined;
}

export type QuestionValidationState =
  | 'idle'
  | 'submitted'
  | 'correct'
  | 'incorrect'
  | 'locked';

export interface QuestionSubmissionRequest {
  readonly questionId: string;
  readonly selectedOptionIds: readonly string[];
  readonly requestedAt: string;
}

export interface QuestionTabletProps {
  readonly question: QuestionModel;
  readonly questionIndex: number;
  readonly totalQuestions: number;
  readonly answeredCount?: number | undefined;
  readonly flaggedCount?: number | undefined;
  readonly selectedOptionIds?: readonly string[] | undefined;
  readonly defaultSelectedOptionIds?: readonly string[] | undefined;
  readonly validationResult?: AnswerValidationResult | null | undefined;
  readonly validationState?: QuestionValidationState | undefined;
  readonly correctOptionIds?: readonly string[] | undefined;
  readonly disabled?: boolean | undefined;
  readonly timer?: ReactNode | undefined;
  readonly timerProps?: Omit<TimerDisplayProps, 'className'> | undefined;
  /** @deprecated Prefer timer or timerProps backed by authoritative state. */
  readonly timerLabel?: string | undefined;
  readonly submitLabel?: string | undefined;
  readonly nextLabel?: string | undefined;
  readonly className?: string | undefined;
  readonly allowTwoAnswerColumns?: boolean | undefined;
  readonly showFeedback?: boolean | undefined;
  readonly onSelectionChange?:
    | ((selectedOptionIds: readonly string[]) => void)
    | undefined;
  readonly onSubmit?:
    | ((submission: QuestionSubmissionRequest) => void)
    | undefined;
  readonly onNext?: (() => void) | undefined;
}

type QuestionTabletStyle = CSSProperties &
  Record<'--qcq-question-progress', string>;

interface InternalSelectionState {
  readonly questionId: string;
  readonly selectedOptionIds: readonly string[];
}

const styles = `
  .qcq-question-tablet {
    --qcq-question-progress: 0%;
    position: relative;
    isolation: isolate;
    display: grid;
    min-width: 0;
    min-height: 100%;
    padding: clamp(0.72rem, 1.65cqi, 1.25rem);
    overflow: hidden;
    border-radius: clamp(0.85rem, 1.7cqi, 1.35rem);
    color: #f7fbff;
    background:
      radial-gradient(circle at 50% -12%, rgb(53 108 191 / 16%), transparent 46%),
      linear-gradient(180deg, rgb(3 9 22 / 96%), rgb(1 4 13 / 99%));
    box-shadow:
      inset 0 0 2.8rem rgb(32 221 255 / 5%),
      0 1.2rem 2.9rem rgb(0 0 0 / 38%);
    container-type: size;
  }

  .qcq-question-tablet__plasma {
    position: absolute;
    inset: clamp(0.44rem, 0.9cqi, 0.72rem);
    z-index: 1;
    overflow: hidden;
    border-radius: clamp(0.7rem, 1.35cqi, 1.05rem);
    pointer-events: none;
  }

  .qcq-question-tablet__plasma::before,
  .qcq-question-tablet__plasma::after {
    position: absolute;
    inset: 0;
    border: clamp(0.12rem, 0.27cqi, 0.23rem) solid transparent;
    border-radius: inherit;
    background:
      conic-gradient(
        from var(--qcq-question-tablet-plasma-angle, 0deg),
        #20ddff,
        #3978ff 22%,
        #a970ff 42%,
        #ff8a1f 63%,
        #27e6a1 79%,
        #20ddff
      ) border-box;
    mask:
      linear-gradient(#000 0 0) padding-box,
      linear-gradient(#000 0 0);
    mask-composite: exclude;
    content: "";
    filter: drop-shadow(0 0 0.5rem rgb(32 221 255 / 58%));
    animation: qcq-question-tablet-plasma 7s linear infinite;
  }

  .qcq-question-tablet__plasma::after {
    inset: clamp(0.28rem, 0.6cqi, 0.48rem);
    opacity: 0.58;
    animation-duration: 10.5s;
    animation-direction: reverse;
  }

  .qcq-question-tablet__sanctum {
    position: relative;
    z-index: 4;
    display: grid;
    grid-template-rows: auto minmax(18rem, 1fr) auto auto;
    gap: clamp(0.7rem, 1.55cqi, 1.08rem);
    min-width: 0;
    min-height: 0;
    margin: clamp(0.5rem, 1.05cqi, 0.8rem);
    padding: clamp(0.55rem, 1.25cqi, 0.95rem);
    overflow: hidden;
    border-radius: clamp(0.55rem, 1cqi, 0.82rem);
    background: rgb(1 4 13 / 92%);
    box-shadow: inset 0 0 1.5rem rgb(35 77 142 / 8%);
  }

  .qcq-question-tablet__topic {
    position: absolute;
    top: clamp(0.65rem, 1.3cqi, 1rem);
    left: 50%;
    z-index: 8;
    max-width: min(72%, 32rem);
    margin: 0;
    overflow: hidden;
    color: rgb(174 219 247 / 76%);
    font-size: clamp(0.54rem, 1.05cqi, 0.68rem);
    font-weight: 900;
    letter-spacing: 0.12em;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
    transform: translateX(-50%);
    pointer-events: none;
  }

  .qcq-question-tablet__answers {
    min-width: 0;
    min-height: 0;
  }

  .qcq-question-tablet__feedback {
    display: grid;
    gap: 0.5rem;
    min-width: 0;
    max-height: min(17rem, 34cqh);
    padding: clamp(0.72rem, 1.5cqi, 1.05rem);
    overflow: auto;
    border: 1px solid rgb(91 151 205 / 18%);
    border-radius: 0.72rem;
    color: rgb(221 238 249 / 88%);
    background: rgb(4 12 27 / 72%);
    scrollbar-width: thin;
  }

  .qcq-question-tablet__feedback[data-result="correct"] {
    border-color: rgb(39 230 161 / 38%);
    background: rgb(8 43 34 / 54%);
  }

  .qcq-question-tablet__feedback[data-result="incorrect"] {
    border-color: rgb(255 92 88 / 42%);
    background: rgb(57 16 22 / 58%);
  }

  .qcq-question-tablet__feedback h3,
  .qcq-question-tablet__feedback p,
  .qcq-question-tablet__feedback ul {
    margin: 0;
  }

  .qcq-question-tablet__feedback h3 {
    font-family: "Arial Black", Inter, system-ui, sans-serif;
    font-size: 0.9rem;
    font-weight: 950;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .qcq-question-tablet__feedback p,
  .qcq-question-tablet__feedback li {
    font-size: 0.77rem;
    line-height: 1.5;
  }

  .qcq-question-tablet__references {
    display: grid;
    gap: 0.3rem;
    padding-inline-start: 1.15rem;
  }

  .qcq-question-tablet__references a {
    color: #8beaff;
    overflow-wrap: anywhere;
  }

  .qcq-question-tablet__controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    justify-content: flex-end;
    min-width: 0;
  }

  .qcq-question-tablet__button {
    min-width: min(100%, 10rem);
    min-height: 2.8rem;
    padding: 0.68rem 1rem;
    border: 1px solid rgb(32 221 255 / 58%);
    border-radius: 0.68rem;
    color: #f7fbff;
    font-family: "Arial Black", Inter, system-ui, sans-serif;
    font-size: 0.75rem;
    font-weight: 950;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background:
      linear-gradient(180deg, rgb(255 255 255 / 9%), transparent 28%),
      linear-gradient(100deg, rgb(32 221 255 / 22%), rgb(4 13 30 / 96%) 44%, rgb(20 8 45 / 96%));
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 14%),
      inset 0 -0.25rem 0.55rem rgb(0 0 0 / 38%),
      0 0.42rem 0.9rem rgb(0 0 0 / 34%),
      0 0 0.9rem rgb(32 221 255 / 18%);
    transition: transform 130ms ease, filter 130ms ease, box-shadow 130ms ease;
  }

  .qcq-question-tablet__button--secondary {
    border-color: rgb(169 112 255 / 56%);
    background:
      linear-gradient(180deg, rgb(255 255 255 / 8%), transparent 28%),
      linear-gradient(100deg, rgb(169 112 255 / 24%), rgb(14 8 33 / 96%) 52%, rgb(4 13 30 / 96%));
  }

  .qcq-question-tablet__button:disabled {
    cursor: not-allowed;
    opacity: 0.48;
    filter: saturate(0.5);
  }

  .qcq-question-tablet__button:focus-visible {
    outline: 0.18rem solid #fff;
    outline-offset: 0.18rem;
  }

  .qcq-question-tablet__legacy-timer {
    min-width: 7.5rem;
    padding: 0.5rem 0.7rem;
    border: 1px solid rgb(169 112 255 / 36%);
    border-radius: 0.6rem;
    color: #f3e9ff;
    font-family: "Arial Black", Inter, system-ui, sans-serif;
    font-size: 0.82rem;
    font-variant-numeric: tabular-nums;
    text-align: center;
    background: rgb(29 13 61 / 72%);
  }

  .qcq-question-tablet__live {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  @property --qcq-question-tablet-plasma-angle {
    syntax: "<angle>";
    inherits: false;
    initial-value: 0deg;
  }

  @keyframes qcq-question-tablet-plasma {
    to {
      --qcq-question-tablet-plasma-angle: 360deg;
    }
  }

  @media (hover: hover) and (pointer: fine) {
    .qcq-question-tablet__button:not(:disabled):hover {
      filter: brightness(1.1) saturate(1.08);
      transform: translateY(-0.18rem);
      box-shadow:
        inset 0 1px 0 rgb(255 255 255 / 18%),
        inset 0 -0.25rem 0.55rem rgb(0 0 0 / 34%),
        0 0.75rem 1.35rem rgb(0 0 0 / 42%),
        0 0 1.25rem rgb(32 221 255 / 30%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .qcq-question-tablet__plasma::before,
    .qcq-question-tablet__plasma::after {
      animation: none;
    }

    .qcq-question-tablet__button {
      transition: none;
    }

    .qcq-question-tablet__button:not(:disabled):hover {
      transform: none;
    }
  }

  @media (forced-colors: active) {
    .qcq-question-tablet,
    .qcq-question-tablet__sanctum,
    .qcq-question-tablet__feedback,
    .qcq-question-tablet__button,
    .qcq-question-tablet__legacy-timer {
      border: 1px solid CanvasText;
      color: CanvasText;
      background: Canvas;
      box-shadow: none;
    }

    .qcq-question-tablet__plasma {
      display: none;
    }
  }
`;

function requiredSelectionCount(question: QuestionModel): number {
  if (question.selection) {
    return question.selection.kind === 'single' ? 1 : question.selection.exact;
  }
  if (question.selectionCount !== undefined) {
    return Math.trunc(question.selectionCount);
  }
  return question.selectionType === 'multiple' ? 2 : 1;
}

function selectionRule(question: QuestionModel): QuestionSelectionRule {
  if (question.selection) {
    return question.selection;
  }
  const exact = requiredSelectionCount(question);
  return exact === 1 ? { kind: 'single' } : { kind: 'multiple', exact };
}

function uniqueSelection(
  selected: readonly string[],
  allowed: ReadonlySet<string>,
  maximum: number,
): readonly string[] {
  const result: string[] = [];
  for (const id of selected) {
    if (allowed.has(id) && !result.includes(id) && result.length < maximum) {
      result.push(id);
    }
  }
  return result;
}

function isSafeReferenceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function QuestionTablet({
  question,
  questionIndex,
  totalQuestions,
  answeredCount = 0,
  flaggedCount = 0,
  selectedOptionIds,
  defaultSelectedOptionIds = [],
  validationResult = null,
  validationState = 'idle',
  correctOptionIds = [],
  disabled = false,
  timer,
  timerProps,
  timerLabel,
  submitLabel = 'Submit answer',
  nextLabel = 'Next question',
  className,
  allowTwoAnswerColumns = false,
  showFeedback = true,
  onSelectionChange,
  onSubmit,
  onNext,
}: QuestionTabletProps) {
  if (!question.id.trim()) {
    throw new Error('QuestionTablet requires a non-empty question ID.');
  }
  if (!question.prompt.trim()) {
    throw new Error(`QuestionTablet question "${question.id}" has an empty prompt.`);
  }
  if (!Number.isInteger(totalQuestions) || totalQuestions < 1) {
    throw new Error('QuestionTablet totalQuestions must be a positive integer.');
  }
  if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex >= totalQuestions) {
    throw new Error('QuestionTablet questionIndex is outside the total question range.');
  }
  if (timer !== undefined && timerProps !== undefined) {
    throw new Error('QuestionTablet accepts either timer or timerProps, not both.');
  }

  const optionIds = useMemo(
    () => new Set(question.options.map((option) => option.id)),
    [question.options],
  );
  if (optionIds.size !== question.options.length) {
    throw new Error(`QuestionTablet question "${question.id}" contains duplicate option IDs.`);
  }

  const rule = selectionRule(question);
  const requiredCount = rule.kind === 'single' ? 1 : rule.exact;
  if (!Number.isInteger(requiredCount) || requiredCount < 1 || requiredCount > question.options.length) {
    throw new Error(`QuestionTablet question "${question.id}" has an invalid selection count.`);
  }

  const [internalSelection, setInternalSelection] = useState<InternalSelectionState>(() => ({
    questionId: question.id,
    selectedOptionIds: uniqueSelection(defaultSelectedOptionIds, optionIds, requiredCount),
  }));
  const uncontrolledSelection =
    internalSelection.questionId === question.id
      ? internalSelection.selectedOptionIds
      : uniqueSelection(defaultSelectedOptionIds, optionIds, requiredCount);
  const effectiveSelection = selectedOptionIds === undefined
    ? uncontrolledSelection
    : uniqueSelection(selectedOptionIds, optionIds, requiredCount);

  const resolvedValidationState: QuestionValidationState = validationResult
    ? validationResult.status === 'correct'
      ? 'correct'
      : validationResult.status === 'incorrect'
        ? 'incorrect'
        : validationState
    : validationState;
  const validationIsFinal =
    validationResult?.status === 'correct' ||
    validationResult?.status === 'incorrect';
  const hasSubmitted =
    validationIsFinal ||
    resolvedValidationState === 'submitted' ||
    resolvedValidationState === 'correct' ||
    resolvedValidationState === 'incorrect' ||
    resolvedValidationState === 'locked';
  const authoritativeCorrectOptionIds = hasSubmitted
    ? validationResult?.correctOptionIds ?? correctOptionIds
    : [];
  const gridValidationState =
    resolvedValidationState === 'correct'
      ? 'correct'
      : resolvedValidationState === 'incorrect'
        ? 'incorrect'
        : hasSubmitted
          ? 'submitted'
          : 'idle';
  const canSubmit =
    onSubmit !== undefined &&
    !disabled &&
    !hasSubmitted &&
    effectiveSelection.length === requiredCount;
  const selectionInstruction =
    requiredCount === 1
      ? 'Select one answer.'
      : `Select exactly ${requiredCount} answers.`;

  const counter = (
    <QuestionCounter
      current={questionIndex + 1}
      total={totalQuestions}
      answered={answeredCount}
      flagged={flaggedCount}
      compact
    />
  );
  const renderedTimer = timer ??
    (timerProps ? <TimerDisplay {...timerProps} /> : timerLabel ? (
      <output
        className="qcq-question-tablet__legacy-timer"
        aria-label={`Time ${timerLabel}`}
      >
        {timerLabel}
      </output>
    ) : null);

  const options: readonly AnswerGridOption[] = question.options.map((option) => ({
    id: option.id,
    text: option.text,
    label: option.label,
  }));
  const feedbackHeading =
    resolvedValidationState === 'correct'
      ? 'Correct response'
      : resolvedValidationState === 'incorrect'
        ? 'Review this response'
        : 'Response recorded';
  const referenceRecords = question.references ??
    (question.reference ? [{ url: question.reference }] : []);
  const safeReferences = referenceRecords.filter((reference) =>
    isSafeReferenceUrl(reference.url),
  );
  const classes = ['qcq-question-tablet', className].filter(Boolean).join(' ');
  const rootStyle: QuestionTabletStyle = {
    '--qcq-question-progress': `${((questionIndex + 1) / totalQuestions) * 100}%`,
  };
  const feedbackId = useId();
  const liveId = useId();
  const [liveMessage, setLiveMessage] = useState('');

  const handleSelectionChange = (next: readonly string[]): void => {
    if (selectedOptionIds === undefined) {
      setInternalSelection({ questionId: question.id, selectedOptionIds: next });
    }
    setLiveMessage(`${next.length} of ${requiredCount} answers selected.`);
    onSelectionChange?.(next);
  };

  const submit = (): void => {
    if (!canSubmit) {
      setLiveMessage(selectionInstruction);
      return;
    }
    const requestedAt = new Date().toISOString();
    onSubmit?.({
      questionId: question.id,
      selectedOptionIds: Object.freeze([...effectiveSelection]),
      requestedAt,
    });
    setLiveMessage('Answer submitted for authoritative validation.');
  };

  return (
    <>
      <style>{styles}</style>
      <section
        className={classes}
        style={rootStyle}
        data-validation={resolvedValidationState}
        data-layout-authority="question-composer"
        aria-describedby={hasSubmitted && showFeedback ? feedbackId : liveId}
      >
        <PlatinumFrameGlow active={!disabled} intensity={0.62} />
        <InnerFrameRenderer active={!disabled} inset="tablet" />
        <div className="qcq-question-tablet__plasma" aria-hidden="true" />
        <p className="qcq-question-tablet__topic" aria-hidden="true">
          {question.topic?.trim() || 'Certification challenge'}
        </p>

        <div className="qcq-question-tablet__sanctum">
          <QuestionViewport
            questionId={question.id}
            prompt={question.prompt}
            counter={counter}
            timer={renderedTimer}
            instruction={selectionInstruction}
            ariaLabel={`Question ${questionIndex + 1} of ${totalQuestions}`}
          />

          <div className="qcq-question-tablet__answers">
            <AnswerGrid
              questionId={question.id}
              options={options}
              selectionRule={rule}
              selectedOptionIds={effectiveSelection}
              correctOptionIds={authoritativeCorrectOptionIds}
              validationState={gridValidationState}
              disabled={disabled || hasSubmitted}
              allowTwoColumns={allowTwoAnswerColumns}
              onSelectionChange={handleSelectionChange}
              onSelectionLimitReached={(count) => {
                setLiveMessage(`Exactly ${count} answers are permitted.`);
              }}
            />
          </div>

          {showFeedback && hasSubmitted ? (
            <section
              id={feedbackId}
              className="qcq-question-tablet__feedback"
              data-result={resolvedValidationState}
              aria-live="polite"
            >
              <h3>{feedbackHeading}</h3>
              <p>
                {question.explanation?.trim() ||
                  'The response has been recorded. Detailed explanation content was not supplied for this question.'}
              </p>
              {safeReferences.length > 0 ? (
                <ul className="qcq-question-tablet__references">
                  {safeReferences.map((reference, index) => (
                    <li key={reference.id ?? `${reference.url}:${index}`}>
                      <a href={reference.url} target="_blank" rel="noreferrer">
                        {reference.title?.trim() || reference.publisher?.trim() || reference.url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          <div className="qcq-question-tablet__controls">
            {!hasSubmitted ? (
              <button
                type="button"
                className="qcq-question-tablet__button"
                disabled={!canSubmit}
                onClick={submit}
              >
                {submitLabel}
              </button>
            ) : null}
            {hasSubmitted && onNext ? (
              <button
                type="button"
                className="qcq-question-tablet__button qcq-question-tablet__button--secondary"
                onClick={onNext}
              >
                {nextLabel}
              </button>
            ) : null}
          </div>
        </div>

        <p
          id={liveId}
          className="qcq-question-tablet__live"
          aria-live="polite"
          aria-atomic="true"
        >
          {liveMessage}
        </p>
      </section>
    </>
  );
}
