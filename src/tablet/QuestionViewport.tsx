/**
 * Artifact ID: QCQ-TBL-011
 * Artifact Name: QuestionViewport
 * Repository Path: QCQ/frontend/src/tablet/QuestionViewport.tsx
 */

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

export interface QuestionViewportProps {
  readonly questionId: string;
  readonly prompt: string;
  readonly counter?: ReactNode | undefined;
  readonly timer?: ReactNode | undefined;
  readonly instruction?: ReactNode | undefined;
  readonly footer?: ReactNode | undefined;
  readonly className?: string | undefined;
  readonly ariaLabel?: string | undefined;
  readonly minimumFontSizeRem?: number | undefined;
  readonly maximumFontSizeRem?: number | undefined;
  readonly showFullTextOnHover?: boolean | undefined;
}

type QuestionViewportStyle = CSSProperties & Record<'--qcq-question-min-font' | '--qcq-question-max-font', string>;

const styles = `
  .qcq-question-viewport {
    position: relative;
    isolation: isolate;
    display: grid;
    min-width: 0;
    min-height: clamp(12rem, 26cqh, 20rem);
    overflow: hidden;
    border-radius: clamp(0.9rem, 1.7cqi, 1.45rem);
    background: radial-gradient(circle at 50% -12%, rgb(67 122 205 / 20%), transparent 48%), linear-gradient(180deg, rgb(4 10 25 / 96%), rgb(1 4 14 / 98%));
    box-shadow: inset 0 0 2.6rem rgb(32 221 255 / 7%), inset 0 -1rem 2.8rem rgb(0 0 0 / 42%), 0 1.2rem 2.8rem rgb(0 0 0 / 32%);
    container-type: size;
  }

  .qcq-question-viewport__plasma-channel {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    border-radius: inherit;
    pointer-events: none;
  }

  .qcq-question-viewport__plasma-channel::before,
  .qcq-question-viewport__plasma-channel::after {
    position: absolute;
    inset: 0;
    border: clamp(0.18rem, 0.42cqi, 0.38rem) solid transparent;
    border-radius: inherit;
    background: conic-gradient(from var(--qcq-plasma-angle, 0deg), #20ddff 0deg, #3978ff 58deg, #a970ff 112deg, #ff8a1f 166deg, #20ddff 224deg, #e36dff 292deg, #20ddff 360deg) border-box;
    mask: linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0);
    mask-composite: exclude;
    content: "";
    filter: drop-shadow(0 0 0.42rem rgb(32 221 255 / 72%));
    animation: qcq-question-plasma-flow 5.8s linear infinite;
  }

  .qcq-question-viewport__plasma-channel::after {
    inset: clamp(0.42rem, 0.8cqi, 0.72rem);
    opacity: 0.66;
    filter: blur(0.08rem) drop-shadow(0 0 0.7rem rgb(169 112 255 / 58%));
    animation-duration: 8.4s;
    animation-direction: reverse;
  }

  .qcq-question-viewport__sanctum {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: clamp(0.7rem, 2cqh, 1.15rem);
    min-width: 0;
    min-height: 0;
    margin: clamp(0.82rem, 1.55cqi, 1.3rem);
    padding: clamp(0.9rem, 2.4cqi, 1.8rem);
    overflow: hidden;
    border: 1px solid rgb(164 220 255 / 16%);
    border-radius: clamp(0.62rem, 1.2cqi, 1rem);
    background: linear-gradient(135deg, rgb(32 221 255 / 5%), transparent 26%), linear-gradient(315deg, rgb(169 112 255 / 5%), transparent 30%), rgb(1 4 13 / 94%);
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 3%), inset 0 0 1.6rem rgb(36 78 145 / 10%);
  }

  .qcq-question-viewport__header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0.8rem; align-items: start; min-width: 0; }
  .qcq-question-viewport__prompt-region { position: relative; display: grid; min-width: 0; min-height: 0; place-items: center; overflow: hidden; }
  .qcq-question-viewport__prompt {
    --qcq-question-font-size: var(--qcq-question-max-font);
    max-width: 48ch;
    margin: 0;
    color: #f7fbff;
    font-family: "Arial Black", "Aptos Display", Inter, system-ui, sans-serif;
    font-size: var(--qcq-question-font-size);
    font-weight: 900;
    line-height: 1.16;
    letter-spacing: 0.012em;
    text-align: center;
    text-wrap: balance;
    overflow-wrap: anywhere;
    -webkit-text-stroke: 0.018em rgb(216 239 255 / 40%);
    text-shadow: 0 -0.035em 0 rgb(255 255 255 / 72%), 0 0.045em 0 rgb(120 161 207 / 72%), 0 0.11em 0 rgb(14 23 43 / 96%), 0 0.19em 0.2em rgb(0 0 0 / 62%), 0 0 0.78em rgb(32 221 255 / 24%);
    transform: translateZ(0);
  }

  .qcq-question-viewport__prompt[data-overflow="true"] { cursor: help; }
  .qcq-question-viewport__prompt[data-overflow="true"]::after {
    display: inline-block;
    margin-inline-start: 0.55rem;
    color: #20ddff;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 0.48em;
    font-weight: 900;
    letter-spacing: 0.12em;
    content: "FULL TEXT";
    vertical-align: middle;
    -webkit-text-stroke: 0;
    text-shadow: 0 0 0.8rem currentColor;
  }

  .qcq-question-viewport__instruction { color: rgb(181 216 242 / 88%); font-size: clamp(0.68rem, 1.1cqi, 0.82rem); font-weight: 800; line-height: 1.45; letter-spacing: 0.09em; text-align: center; text-transform: uppercase; }
  .qcq-question-viewport__reading-layer {
    position: absolute;
    inset: clamp(0.5rem, 1.4cqi, 1rem);
    z-index: 12;
    display: grid;
    align-content: center;
    padding: clamp(1.1rem, 3.2cqi, 2.4rem);
    overflow: auto;
    overscroll-behavior: contain;
    border: 1px solid rgb(32 221 255 / 48%);
    border-radius: clamp(0.65rem, 1.2cqi, 1rem);
    color: #f8fbff;
    background: radial-gradient(circle at 50% 0, rgb(48 103 186 / 24%), transparent 50%), rgb(1 4 13 / 98%);
    box-shadow: 0 0 0 1px rgb(169 112 255 / 18%), 0 1.5rem 4rem rgb(0 0 0 / 74%), inset 0 0 2rem rgb(32 221 255 / 8%);
    pointer-events: none;
  }
  .qcq-question-viewport__reading-layer span { color: #20ddff; font-size: 0.7rem; font-weight: 900; letter-spacing: 0.16em; text-align: center; text-transform: uppercase; }
  .qcq-question-viewport__reading-layer p { max-width: 58ch; margin: 0.9rem auto 0; font-family: "Arial Black", "Aptos Display", Inter, system-ui, sans-serif; font-size: clamp(1rem, 2.4cqi, 1.7rem); font-weight: 850; line-height: 1.42; text-align: center; text-wrap: pretty; text-shadow: 0 0.08em 0 rgb(8 19 36 / 92%), 0 0.2em 0.32em rgb(0 0 0 / 58%); }
  .qcq-question-viewport[data-reading-open="true"] .qcq-question-viewport__prompt-region,
  .qcq-question-viewport[data-reading-open="true"] .qcq-question-viewport__header,
  .qcq-question-viewport[data-reading-open="true"] .qcq-question-viewport__instruction { opacity: 0.2; filter: saturate(0.35); }

  @property --qcq-plasma-angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
  @keyframes qcq-question-plasma-flow { to { --qcq-plasma-angle: 360deg; } }
  @container (max-width: 34rem) { .qcq-question-viewport__header { grid-template-columns: 1fr; } }
  @media (prefers-reduced-motion: reduce) { .qcq-question-viewport__plasma-channel::before, .qcq-question-viewport__plasma-channel::after { animation: none; } }
  @media (forced-colors: active) {
    .qcq-question-viewport, .qcq-question-viewport__sanctum, .qcq-question-viewport__reading-layer { border: 1px solid CanvasText; color: CanvasText; background: Canvas; box-shadow: none; }
    .qcq-question-viewport__plasma-channel { display: none; }
    .qcq-question-viewport__prompt { color: CanvasText; -webkit-text-stroke: 0; text-shadow: none; }
  }
`;

function clamp(value: number, minimum: number, maximum: number): number { return Math.min(maximum, Math.max(minimum, value)); }

function installAdaptiveTextFit(element: HTMLElement, minimumRem: number, maximumRem: number): () => void {
  let frame = 0;
  let cancelled = false;
  const fit = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (cancelled || !element.isConnected) return;
      const container = element.parentElement;
      if (!container || container.clientWidth === 0 || container.clientHeight === 0) return;
      let low = minimumRem;
      let high = maximumRem;
      let best = minimumRem;
      for (let iteration = 0; iteration < 12; iteration += 1) {
        const candidate = (low + high) / 2;
        element.style.setProperty('--qcq-question-font-size', `${candidate}rem`);
        const fits = element.scrollWidth <= container.clientWidth + 1 && element.scrollHeight <= container.clientHeight + 1;
        if (fits) { best = candidate; low = candidate; } else { high = candidate; }
      }
      element.style.setProperty('--qcq-question-font-size', `${best}rem`);
      element.dataset.overflow = String(element.scrollWidth > container.clientWidth + 1 || element.scrollHeight > container.clientHeight + 1);
    });
  };
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
  observer?.observe(element);
  if (element.parentElement) observer?.observe(element.parentElement);
  const mutationObserver = new MutationObserver(fit);
  mutationObserver.observe(element, { characterData: true, childList: true, subtree: true });
  if (typeof document !== 'undefined' && 'fonts' in document) void document.fonts.ready.then(fit, () => undefined);
  fit();
  return () => { cancelled = true; cancelAnimationFrame(frame); observer?.disconnect(); mutationObserver.disconnect(); };
}

export function QuestionViewport({
  questionId,
  prompt,
  counter,
  timer,
  instruction,
  footer,
  className,
  ariaLabel = 'Certification question',
  minimumFontSizeRem = 1,
  maximumFontSizeRem = 2.15,
  showFullTextOnHover = true,
}: QuestionViewportProps) {
  if (!questionId.trim()) throw new Error('QuestionViewport requires a non-empty questionId.');
  if (!prompt.trim()) throw new Error(`QuestionViewport question "${questionId}" has an empty prompt.`);
  const promptId = useId();
  const instructionId = useId();
  const promptRef = useRef<HTMLParagraphElement | null>(null);
  const [readingOpen, setReadingOpen] = useState(false);
  const minFont = clamp(minimumFontSizeRem, 0.8, 3);
  const maxFont = clamp(maximumFontSizeRem, minFont, 4.5);
  useLayoutEffect(() => {
    const element = promptRef.current;
    return element ? installAdaptiveTextFit(element, minFont, maxFont) : undefined;
  }, [minFont, maxFont, prompt]);
  const openReadingLayer = () => {
    if (showFullTextOnHover && promptRef.current?.dataset.overflow === 'true') setReadingOpen(true);
  };
  const closeReadingLayer = () => setReadingOpen(false);
  const classes = ['qcq-question-viewport', className].filter(Boolean).join(' ');
  const rootStyle: QuestionViewportStyle = { '--qcq-question-min-font': `${minFont}rem`, '--qcq-question-max-font': `${maxFont}rem` };

  return (
    <>
      <style>{styles}</style>
      <section className={classes} style={rootStyle} data-question-id={questionId} data-reading-open={String(readingOpen)} aria-label={ariaLabel} aria-labelledby={promptId} aria-describedby={instruction ? instructionId : undefined}>
        <div className="qcq-question-viewport__plasma-channel" aria-hidden="true" />
        <div className="qcq-question-viewport__sanctum">
          <header className="qcq-question-viewport__header"><div>{counter}</div><div>{timer}</div></header>
          <div className="qcq-question-viewport__prompt-region">
            <p
              ref={promptRef}
              id={promptId}
              className="qcq-question-viewport__prompt"
              data-overflow="false"
              tabIndex={0}
              onFocus={openReadingLayer}
              onBlur={closeReadingLayer}
              onPointerEnter={(event: ReactPointerEvent<HTMLParagraphElement>) => { if (event.pointerType !== 'touch') openReadingLayer(); }}
              onPointerLeave={closeReadingLayer}
            >
              {prompt}
            </p>
          </div>
          <div>{instruction ? <div id={instructionId} className="qcq-question-viewport__instruction">{instruction}</div> : null}{footer}</div>
        </div>
        {readingOpen ? <div className="qcq-question-viewport__reading-layer" role="tooltip"><span>Complete question</span><p>{prompt}</p></div> : null}
      </section>
    </>
  );
}
