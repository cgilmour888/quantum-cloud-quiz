/**
 * Artifact ID: QCQ-TBL-013
 * Artifact Name: AnswerCard
 * Repository Path: QCQ/frontend/src/tablet/AnswerCard.tsx
 */

import {
  forwardRef,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

export type AnswerCardPalette = 'cyan' | 'violet' | 'emerald' | 'orange' | 'gold' | 'indigo';
export type AnswerCardState = 'idle' | 'selected' | 'submitted' | 'correct' | 'incorrect' | 'disabled';

export interface AnswerCardReadingPreview {
  readonly optionId: string;
  readonly label: string;
  readonly text: string;
}

export interface AnswerCardProps {
  readonly optionId: string;
  readonly label: string;
  readonly text: string;
  readonly palette?: AnswerCardPalette | undefined;
  readonly state?: AnswerCardState | undefined;
  readonly selected?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly tabIndex?: number | undefined;
  readonly className?: string | undefined;
  readonly ariaDescription?: string | undefined;
  readonly minimumFontSizeRem?: number | undefined;
  readonly maximumFontSizeRem?: number | undefined;
  readonly onActivate?: ((optionId: string) => void) | undefined;
  readonly onFocusMove?: ((direction: 'previous' | 'next' | 'first' | 'last') => void) | undefined;
  readonly onReadingPreviewChange?: ((preview: AnswerCardReadingPreview | null) => void) | undefined;
}

type AnswerCardStyle = CSSProperties & Record<'--qcq-answer-min-font' | '--qcq-answer-max-font', string>;

const styles = `
  .qcq-answer-card {
    --qcq-answer-accent: #20ddff;
    --qcq-answer-accent-rgb: 32 221 255;
    --qcq-answer-font-size: var(--qcq-answer-max-font);
    position: relative;
    isolation: isolate;
    display: grid;
    grid-template-columns: clamp(3.05rem, 6cqi, 5rem) minmax(0, 1fr) auto;
    gap: clamp(0.68rem, 1.55cqi, 1.2rem);
    align-items: center;
    width: 100%;
    min-width: 0;
    min-height: clamp(3.8rem, 9cqh, 5.7rem);
    padding: clamp(0.55rem, 1.2cqi, 0.85rem) clamp(0.75rem, 1.8cqi, 1.35rem) clamp(0.6rem, 1.3cqi, 0.9rem) clamp(0.5rem, 1.1cqi, 0.76rem);
    overflow: hidden;
    border: 1px solid rgb(var(--qcq-answer-accent-rgb) / 58%);
    border-radius: clamp(0.66rem, 1.2cqi, 0.92rem);
    color: #f9fcff;
    text-align: left;
    background:
      linear-gradient(180deg, rgb(255 255 255 / 7%), transparent 26%),
      linear-gradient(96deg, rgb(var(--qcq-answer-accent-rgb) / 22%), rgb(6 14 31 / 94%) 28%, rgb(1 4 13 / 98%) 76%);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 14%),
      inset 0 -0.28rem 0.7rem rgb(0 0 0 / 38%),
      inset 0 0 1.25rem rgb(var(--qcq-answer-accent-rgb) / 8%),
      0 0.32rem 0.12rem rgb(0 0 0 / 56%),
      0 0.7rem 1.5rem rgb(0 0 0 / 34%),
      0 0 0.9rem rgb(var(--qcq-answer-accent-rgb) / 15%);
    transform: translateY(0) translateZ(0);
    transform-origin: center;
    transition: transform 140ms cubic-bezier(0.2, 0.75, 0.2, 1), border-color 140ms ease, box-shadow 140ms ease, filter 140ms ease, background 140ms ease;
    -webkit-tap-highlight-color: transparent;
  }

  .qcq-answer-card::before {
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    background: linear-gradient(90deg, transparent, rgb(var(--qcq-answer-accent-rgb) / 18%), transparent);
    opacity: 0;
    content: "";
    transform: translateX(-75%);
  }

  .qcq-answer-card::after {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--qcq-answer-accent) 15%, var(--qcq-answer-accent) 85%, transparent);
    box-shadow: 0 0 0.75rem var(--qcq-answer-accent);
    opacity: 0.76;
    content: "";
  }

  .qcq-answer-card[data-palette="violet"] { --qcq-answer-accent: #e36dff; --qcq-answer-accent-rgb: 227 109 255; }
  .qcq-answer-card[data-palette="emerald"] { --qcq-answer-accent: #27e6a1; --qcq-answer-accent-rgb: 39 230 161; }
  .qcq-answer-card[data-palette="orange"] { --qcq-answer-accent: #ff8a1f; --qcq-answer-accent-rgb: 255 138 31; }
  .qcq-answer-card[data-palette="gold"] { --qcq-answer-accent: #ffe05d; --qcq-answer-accent-rgb: 255 224 93; }
  .qcq-answer-card[data-palette="indigo"] { --qcq-answer-accent: #7b8cff; --qcq-answer-accent-rgb: 123 140 255; }

  .qcq-answer-card__glyph {
    display: grid;
    min-height: clamp(2.65rem, 6.5cqh, 3.75rem);
    place-items: center;
    border: 1px solid rgb(var(--qcq-answer-accent-rgb) / 68%);
    clip-path: polygon(15% 0, 100% 0, 85% 100%, 0 100%);
    color: var(--qcq-answer-accent);
    font-family: "Arial Black", Inter, system-ui, sans-serif;
    font-size: clamp(1.25rem, 3.1cqi, 2rem);
    font-weight: 950;
    background: linear-gradient(180deg, rgb(255 255 255 / 9%), rgb(var(--qcq-answer-accent-rgb) / 8%));
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 18%), inset 0 -0.2rem 0.4rem rgb(0 0 0 / 44%);
    text-shadow: 0 -0.04em 0 rgb(255 255 255 / 62%), 0 0.08em 0 rgb(0 0 0 / 82%), 0 0 0.72rem currentColor;
  }

  .qcq-answer-card__text-region {
    display: grid;
    min-width: 0;
    min-height: 0;
    align-items: center;
    overflow: hidden;
  }

  .qcq-answer-card__text {
    max-width: 100%;
    margin: 0;
    overflow: hidden;
    color: #f7fbff;
    font-family: "Arial Black", "Aptos Display", Inter, system-ui, sans-serif;
    font-size: var(--qcq-answer-font-size);
    font-weight: 900;
    line-height: 1.22;
    letter-spacing: 0.008em;
    overflow-wrap: anywhere;
    text-wrap: pretty;
    -webkit-text-stroke: 0.014em rgb(221 242 255 / 34%);
    text-shadow:
      0 -0.035em 0 rgb(255 255 255 / 65%),
      0 0.055em 0 rgb(108 144 186 / 66%),
      0 0.12em 0 rgb(8 17 34 / 98%),
      0 0.2em 0.28em rgb(0 0 0 / 58%),
      0 0 0.72em rgb(var(--qcq-answer-accent-rgb) / 18%);
  }

  .qcq-answer-card[data-text-overflow="true"] .qcq-answer-card__text::after {
    display: inline-block;
    margin-inline-start: 0.5rem;
    color: var(--qcq-answer-accent);
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 0.48em;
    font-weight: 950;
    letter-spacing: 0.12em;
    content: "MORE";
    vertical-align: middle;
    -webkit-text-stroke: 0;
    text-shadow: 0 0 0.7rem currentColor;
  }

  .qcq-answer-card__state {
    display: grid;
    width: clamp(1.6rem, 3.4cqi, 2.35rem);
    aspect-ratio: 1;
    place-items: center;
    border: 1px solid rgb(var(--qcq-answer-accent-rgb) / 34%);
    border-radius: 50%;
    color: var(--qcq-answer-accent);
    font-size: clamp(0.9rem, 1.9cqi, 1.2rem);
    font-weight: 950;
    background: rgb(var(--qcq-answer-accent-rgb) / 6%);
    box-shadow: inset 0 0 0.65rem rgb(var(--qcq-answer-accent-rgb) / 9%);
  }

  .qcq-answer-card[data-state="selected"], .qcq-answer-card[data-state="submitted"] {
    border-color: var(--qcq-answer-accent);
    background:
      linear-gradient(180deg, rgb(255 255 255 / 10%), transparent 28%),
      linear-gradient(96deg, rgb(var(--qcq-answer-accent-rgb) / 34%), rgb(7 19 39 / 97%) 34%, rgb(1 4 13 / 99%) 82%);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 18%), inset 0 -0.3rem 0.75rem rgb(0 0 0 / 42%), inset 0 0 1.65rem rgb(var(--qcq-answer-accent-rgb) / 14%), 0 0.42rem 0.14rem rgb(0 0 0 / 58%), 0 0.85rem 1.8rem rgb(0 0 0 / 38%), 0 0 1.25rem rgb(var(--qcq-answer-accent-rgb) / 35%);
  }

  .qcq-answer-card[data-state="correct"] { --qcq-answer-accent: #27e6a1; --qcq-answer-accent-rgb: 39 230 161; }
  .qcq-answer-card[data-state="incorrect"] { --qcq-answer-accent: #ff5c58; --qcq-answer-accent-rgb: 255 92 88; }
  .qcq-answer-card[data-state="disabled"], .qcq-answer-card:disabled { cursor: not-allowed; opacity: 0.52; filter: saturate(0.55); }

  @media (hover: hover) and (pointer: fine) {
    .qcq-answer-card:not(:disabled):hover {
      z-index: 3;
      border-color: var(--qcq-answer-accent);
      filter: brightness(1.09) saturate(1.08);
      transform: translateY(-0.24rem) scale(1.006) translateZ(0);
      box-shadow: inset 0 1px 0 rgb(255 255 255 / 22%), inset 0 -0.32rem 0.72rem rgb(0 0 0 / 38%), inset 0 0 1.8rem rgb(var(--qcq-answer-accent-rgb) / 16%), 0 0.48rem 0.16rem rgb(0 0 0 / 52%), 0 1.2rem 2.15rem rgb(0 0 0 / 45%), 0 0 1.6rem rgb(var(--qcq-answer-accent-rgb) / 42%);
    }
    .qcq-answer-card:not(:disabled):hover::before { opacity: 1; animation: qcq-answer-card-sheen 820ms ease-out both; }
  }

  .qcq-answer-card:focus-visible {
    z-index: 4;
    outline: 0.19rem solid #fff;
    outline-offset: 0.18rem;
    border-color: var(--qcq-answer-accent);
    transform: translateY(-0.2rem) translateZ(0);
    box-shadow: inset 0 0 1.5rem rgb(var(--qcq-answer-accent-rgb) / 14%), 0 0 0 0.28rem rgb(var(--qcq-answer-accent-rgb) / 35%), 0 0.9rem 2rem rgb(0 0 0 / 48%);
  }

  @keyframes qcq-answer-card-sheen { from { transform: translateX(-75%); } to { transform: translateX(75%); } }

  @media (prefers-reduced-motion: reduce) {
    .qcq-answer-card { transition: border-color 100ms ease, box-shadow 100ms ease; }
    .qcq-answer-card:not(:disabled):hover, .qcq-answer-card:focus-visible { transform: none; }
    .qcq-answer-card:not(:disabled):hover::before { animation: none; }
  }

  @media (forced-colors: active) {
    .qcq-answer-card { border: 1px solid ButtonText; color: ButtonText; background: ButtonFace; box-shadow: none; }
    .qcq-answer-card__text, .qcq-answer-card__glyph, .qcq-answer-card__state { color: ButtonText; -webkit-text-stroke: 0; text-shadow: none; }
  }
`;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function installTextFit(textElement: HTMLElement, minimumRem: number, maximumRem: number): () => void {
  let frame = 0;
  let cancelled = false;
  const fit = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (cancelled || !textElement.isConnected) return;
      const container = textElement.parentElement;
      if (!container || container.clientWidth === 0 || container.clientHeight === 0) return;
      let low = minimumRem;
      let high = maximumRem;
      let best = minimumRem;
      for (let iteration = 0; iteration < 11; iteration += 1) {
        const candidate = (low + high) / 2;
        textElement.style.setProperty('--qcq-answer-font-size', `${candidate}rem`);
        const fits = textElement.scrollWidth <= container.clientWidth + 1 && textElement.scrollHeight <= container.clientHeight + 1;
        if (fits) { best = candidate; low = candidate; } else { high = candidate; }
      }
      textElement.style.setProperty('--qcq-answer-font-size', `${best}rem`);
      const overflow = textElement.scrollWidth > container.clientWidth + 1 || textElement.scrollHeight > container.clientHeight + 1;
      const card = textElement.closest<HTMLElement>('.qcq-answer-card');
      if (card) card.dataset.textOverflow = String(overflow);
    });
  };
  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
  resizeObserver?.observe(textElement);
  if (textElement.parentElement) resizeObserver?.observe(textElement.parentElement);
  const mutationObserver = new MutationObserver(fit);
  mutationObserver.observe(textElement, { childList: true, characterData: true, subtree: true });
  if (typeof document !== 'undefined' && 'fonts' in document) void document.fonts.ready.then(fit, () => undefined);
  fit();
  return () => { cancelled = true; cancelAnimationFrame(frame); resizeObserver?.disconnect(); mutationObserver.disconnect(); };
}

export const AnswerCard = forwardRef<HTMLButtonElement, AnswerCardProps>(function AnswerCard(
  {
    optionId,
    label,
    text,
    palette = 'cyan',
    state = 'idle',
    selected = false,
    disabled = false,
    tabIndex = 0,
    className,
    ariaDescription,
    minimumFontSizeRem = 0.78,
    maximumFontSizeRem = 1.24,
    onActivate,
    onFocusMove,
    onReadingPreviewChange,
  },
  forwardedRef,
) {
  if (!optionId.trim()) throw new Error('AnswerCard requires a non-empty optionId.');
  if (!label.trim()) throw new Error(`AnswerCard option "${optionId}" requires a label.`);
  if (!text.trim()) throw new Error(`AnswerCard option "${optionId}" requires text.`);

  const textRef = useRef<HTMLParagraphElement | null>(null);
  const minFont = clamp(minimumFontSizeRem, 0.68, 2);
  const maxFont = clamp(maximumFontSizeRem, minFont, 2.5);
  useLayoutEffect(() => {
    const element = textRef.current;
    return element ? installTextFit(element, minFont, maxFont) : undefined;
  }, [minFont, maxFont, text]);

  const resolvedState: AnswerCardState = disabled ? 'disabled' : state === 'idle' && selected ? 'selected' : state;
  const preview = (): void => {
    const card = textRef.current?.closest<HTMLElement>('.qcq-answer-card');
    if (card?.dataset.textOverflow === 'true') onReadingPreviewChange?.({ optionId, label, text });
  };
  const clearPreview = (): void => onReadingPreviewChange?.(null);
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>): void => {
    const direction = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
      ? 'previous'
      : event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? 'next'
        : event.key === 'Home'
          ? 'first'
          : event.key === 'End'
            ? 'last'
            : null;
    if (direction) { event.preventDefault(); onFocusMove?.(direction); }
  };
  const stateGlyph = resolvedState === 'correct' ? '✓' : resolvedState === 'incorrect' ? '×' : selected ? '◆' : '';
  const classes = ['qcq-answer-card', className].filter(Boolean).join(' ');
  const style: AnswerCardStyle = { '--qcq-answer-min-font': `${minFont}rem`, '--qcq-answer-max-font': `${maxFont}rem` };

  return (
    <>
      <style>{styles}</style>
      <button
        ref={forwardedRef}
        type="button"
        className={classes}
        style={style}
        data-option-id={optionId}
        data-palette={palette}
        data-state={resolvedState}
        data-text-overflow="false"
        aria-pressed={selected}
        aria-description={ariaDescription}
        disabled={disabled}
        tabIndex={tabIndex}
        onClick={() => onActivate?.(optionId)}
        onKeyDown={handleKeyDown}
        onFocus={preview}
        onBlur={clearPreview}
        onPointerEnter={(event: ReactPointerEvent<HTMLButtonElement>) => { if (event.pointerType !== 'touch') preview(); }}
        onPointerLeave={clearPreview}
      >
        <span className="qcq-answer-card__glyph" aria-hidden="true">{label}</span>
        <span className="qcq-answer-card__text-region"><p ref={textRef} className="qcq-answer-card__text">{text}</p></span>
        <span className="qcq-answer-card__state" aria-hidden="true">{stateGlyph}</span>
      </button>
    </>
  );
});
