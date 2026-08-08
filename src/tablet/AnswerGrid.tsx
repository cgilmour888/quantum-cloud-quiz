/**
 * Artifact ID: QCQ-TBL-012
 * Artifact Name: AnswerGrid
 * Repository Path: QCQ/frontend/src/tablet/AnswerGrid.tsx
 */

import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { AnswerCard, type AnswerCardPalette, type AnswerCardReadingPreview, type AnswerCardState } from './AnswerCard';

export interface AnswerGridOption {
  readonly id: string;
  readonly text: string;
  readonly label?: string | undefined;
  readonly palette?: AnswerCardPalette | undefined;
}

export type AnswerGridSelectionRule = { readonly kind: 'single' } | { readonly kind: 'multiple'; readonly exact: number };

export interface AnswerGridProps {
  readonly questionId: string;
  readonly options: readonly AnswerGridOption[];
  readonly selectionRule: AnswerGridSelectionRule;
  readonly selectedOptionIds?: readonly string[] | undefined;
  readonly defaultSelectedOptionIds?: readonly string[] | undefined;
  readonly correctOptionIds?: readonly string[] | undefined;
  readonly validationState?: 'idle' | 'submitted' | 'correct' | 'incorrect' | undefined;
  readonly disabled?: boolean | undefined;
  readonly className?: string | undefined;
  readonly minimumCardHeightRem?: number | undefined;
  readonly allowTwoColumns?: boolean | undefined;
  readonly onSelectionChange?: ((selectedOptionIds: readonly string[]) => void) | undefined;
  readonly onSelectionLimitReached?: ((requiredCount: number) => void) | undefined;
}

type AnswerGridStyle = CSSProperties & Record<'--qcq-answer-count' | '--qcq-answer-card-min-height', string>;
interface InternalSelection { readonly questionId: string; readonly optionIds: readonly string[]; }

const PALETTES: readonly AnswerCardPalette[] = ['cyan', 'violet', 'emerald', 'orange', 'gold', 'indigo'];
const styles = `
  .qcq-answer-grid { position: relative; isolation: isolate; display: grid; min-width: 0; min-height: clamp(18rem, 45cqh, 34rem); overflow: hidden; container-type: size; }
  .qcq-answer-grid__cards { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: repeat(var(--qcq-answer-count), minmax(var(--qcq-answer-card-min-height), 1fr)); gap: clamp(0.58rem, 1.35cqi, 0.95rem); min-width: 0; min-height: 0; padding: clamp(0.36rem, 0.9cqi, 0.62rem); overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: rgb(32 221 255 / 58%) rgb(1 4 13 / 70%); transition: opacity 140ms ease, filter 140ms ease; }
  .qcq-answer-grid[data-reading-open="true"] .qcq-answer-grid__cards { opacity: 0.2; filter: saturate(0.35); }
  .qcq-answer-grid__reading-layer { position: absolute; inset: clamp(0.45rem, 1cqi, 0.75rem); z-index: 20; display: grid; align-content: center; padding: clamp(1.1rem, 3.5cqi, 2.7rem); overflow: auto; overscroll-behavior: contain; border: 1px solid rgb(32 221 255 / 46%); border-radius: clamp(0.75rem, 1.3cqi, 1rem); color: #f7fbff; background: radial-gradient(circle at 50% 0, rgb(52 105 185 / 25%), transparent 48%), rgb(1 4 13 / 98%); box-shadow: 0 0 0 1px rgb(169 112 255 / 19%), 0 1.6rem 4rem rgb(0 0 0 / 74%), inset 0 0 2rem rgb(32 221 255 / 8%); pointer-events: none; }
  .qcq-answer-grid__reading-layer span { color: #20ddff; font-size: 0.7rem; font-weight: 950; letter-spacing: 0.16em; text-align: center; text-transform: uppercase; }
  .qcq-answer-grid__reading-layer p { max-width: 58ch; margin: 0.85rem auto 0; font-family: "Arial Black", Inter, system-ui, sans-serif; font-size: clamp(1rem, 2.45cqi, 1.7rem); font-weight: 900; line-height: 1.45; text-align: center; text-wrap: pretty; text-shadow: 0 0.1em 0 rgb(8 18 34 / 94%), 0 0.22em 0.34em rgb(0 0 0 / 62%); }
  .qcq-answer-grid__live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  @container (min-width: 58rem) and (max-height: 29rem) { .qcq-answer-grid[data-two-columns="true"] .qcq-answer-grid__cards { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: none; grid-auto-rows: minmax(var(--qcq-answer-card-min-height), 1fr); } }
  @media (prefers-reduced-motion: reduce) { .qcq-answer-grid__cards { transition: none; } }
`;

function requiredSelectionCount(rule: AnswerGridSelectionRule): number { return rule.kind === 'single' ? 1 : rule.exact; }
function labelForIndex(index: number): string { return String.fromCharCode(65 + index); }
function uniqueValidSelection(selected: readonly string[], optionIds: ReadonlySet<string>, maximum: number): readonly string[] {
  const result: string[] = [];
  for (const id of selected) if (optionIds.has(id) && !result.includes(id) && result.length < maximum) result.push(id);
  return result;
}

export function AnswerGrid({
  questionId,
  options,
  selectionRule,
  selectedOptionIds,
  defaultSelectedOptionIds = [],
  correctOptionIds = [],
  validationState = 'idle',
  disabled = false,
  className,
  minimumCardHeightRem = 3.8,
  allowTwoColumns = false,
  onSelectionChange,
  onSelectionLimitReached,
}: AnswerGridProps) {
  if (!questionId.trim()) throw new Error('AnswerGrid requires a non-empty questionId.');
  if (options.length < 2 || options.length > 26) throw new Error(`AnswerGrid question "${questionId}" must contain 2–26 options.`);
  const optionIds = useMemo(() => new Set(options.map((option) => option.id)), [options]);
  if (optionIds.size !== options.length) throw new Error(`AnswerGrid question "${questionId}" contains duplicate option IDs.`);
  const requiredCount = requiredSelectionCount(selectionRule);
  if (!Number.isInteger(requiredCount) || requiredCount < 1 || requiredCount > options.length) throw new Error(`AnswerGrid question "${questionId}" has an invalid selection rule.`);

  const [internalSelection, setInternalSelection] = useState<InternalSelection>(() => ({ questionId, optionIds: uniqueValidSelection(defaultSelectedOptionIds, optionIds, requiredCount) }));
  const [readingPreview, setReadingPreview] = useState<AnswerCardReadingPreview | null>(null);
  const [rovingIndex, setRovingIndex] = useState(0);
  const [liveMessage, setLiveMessage] = useState('');
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const controlledSelection = selectedOptionIds === undefined ? null : uniqueValidSelection(selectedOptionIds, optionIds, requiredCount);
  const effectiveSelection = controlledSelection ?? (internalSelection.questionId === questionId ? internalSelection.optionIds : uniqueValidSelection(defaultSelectedOptionIds, optionIds, requiredCount));
  const selectedSet = useMemo(() => new Set(effectiveSelection), [effectiveSelection]);
  const correctSet = useMemo(() => new Set(correctOptionIds.filter((id) => optionIds.has(id))), [correctOptionIds, optionIds]);

  const commitSelection = (next: readonly string[]): void => {
    if (selectedOptionIds === undefined) setInternalSelection({ questionId, optionIds: next });
    onSelectionChange?.(next);
  };
  const activate = (optionId: string): void => {
    if (disabled || validationState !== 'idle') return;
    if (selectionRule.kind === 'single') {
      const next = selectedSet.has(optionId) ? [] : [optionId];
      commitSelection(next);
      setLiveMessage(next.length === 0 ? 'Selection cleared.' : 'One answer selected.');
      return;
    }
    if (selectedSet.has(optionId)) {
      const next = effectiveSelection.filter((id) => id !== optionId);
      commitSelection(next);
      setLiveMessage(`${next.length} of ${requiredCount} answers selected.`);
      return;
    }
    if (effectiveSelection.length >= requiredCount) {
      setLiveMessage(`Exactly ${requiredCount} answers are permitted.`);
      onSelectionLimitReached?.(requiredCount);
      return;
    }
    const next = [...effectiveSelection, optionId];
    commitSelection(next);
    setLiveMessage(`${next.length} of ${requiredCount} answers selected.`);
  };
  const moveFocus = (fromIndex: number, direction: 'previous' | 'next' | 'first' | 'last'): void => {
    const targetIndex = direction === 'first' ? 0 : direction === 'last' ? options.length - 1 : direction === 'previous' ? (fromIndex - 1 + options.length) % options.length : (fromIndex + 1) % options.length;
    setRovingIndex(targetIndex);
    buttonRefs.current[targetIndex]?.focus();
  };
  const stateForOption = (optionId: string): AnswerCardState => {
    const selected = selectedSet.has(optionId);
    if (disabled) return 'disabled';
    if (validationState === 'idle') return selected ? 'selected' : 'idle';
    if (validationState === 'submitted') return selected ? 'submitted' : 'idle';
    if (correctSet.has(optionId)) return 'correct';
    return selected ? 'incorrect' : 'idle';
  };

  const densityScore = options.reduce((sum, option) => sum + option.text.trim().split(/\s+/u).length, 0);
  const density = densityScore > 110 || options.length >= 6 ? 'dense' : densityScore > 68 ? 'balanced' : 'spacious';
  const classes = ['qcq-answer-grid', className].filter(Boolean).join(' ');
  const style: AnswerGridStyle = { '--qcq-answer-count': String(options.length), '--qcq-answer-card-min-height': `${Math.max(3.3, minimumCardHeightRem)}rem` };

  return (
    <>
      <style>{styles}</style>
      <section className={classes} style={style} data-question-id={questionId} data-density={density} data-two-columns={String(allowTwoColumns)} data-reading-open={String(readingPreview !== null)} aria-label="Answer options">
        <div className="qcq-answer-grid__cards" role="group" aria-label={requiredCount === 1 ? 'Select one answer' : `Select exactly ${requiredCount} answers`}>
          {options.map((option, index) => {
            const label = option.label?.trim() || labelForIndex(index);
            const palette = option.palette ?? PALETTES[index % PALETTES.length]!;
            return (
              <AnswerCard
                key={option.id}
                ref={(element) => { buttonRefs.current[index] = element; }}
                optionId={option.id}
                label={label}
                text={option.text}
                palette={palette}
                state={stateForOption(option.id)}
                selected={selectedSet.has(option.id)}
                disabled={disabled || validationState !== 'idle'}
                tabIndex={index === rovingIndex ? 0 : -1}
                ariaDescription={requiredCount === 1 ? 'Single-answer option' : `Multiple-answer option; select exactly ${requiredCount}`}
                minimumFontSizeRem={density === 'dense' ? 0.72 : 0.78}
                maximumFontSizeRem={density === 'spacious' ? 1.28 : 1.16}
                onActivate={activate}
                onFocusMove={(direction) => moveFocus(index, direction)}
                onReadingPreviewChange={setReadingPreview}
              />
            );
          })}
        </div>
        {readingPreview ? <div className="qcq-answer-grid__reading-layer" role="tooltip"><span>Answer {readingPreview.label}</span><p>{readingPreview.text}</p></div> : null}
        <p className="qcq-answer-grid__live" aria-live="polite" aria-atomic="true">{liveMessage}</p>
      </section>
    </>
  );
}
