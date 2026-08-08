/**
 * Artifact ID: QCQ-TBL-046
 * Artifact Name: TabletCompositionEngine
 * Artifact Purpose: Deterministic tablet-local assembly authority allocating question, answer, feedback, header, footer, and frame geometry.
 * Artifact Layer: QCQ-TBL — CMP
 * Artifact Dependencies: QCQ-TBL-044, QCQ-TBL-047, QCQ-TBL-048
 * Artifact Dependents: QCQ-TBL-002, QCQ-TBL-010, QCQ-TBL-057, QCQ-TBL-063
 * Dependency Graph: policies + composition contracts/config -> TabletCompositionEngine -> layout/question/validation/master
 * Repository Path: QCQ/frontend/src/tablet/composition
 * Source File: TabletCompositionEngine.ts
 */

import type { TabletPolicy } from '../governance/TabletPolicies';
import {
  TABLET_COMPOSITION_CONFIG,
  type TabletCompositionConfig,
} from './TabletComposition.config';
import type {
  TabletCompositionInput,
  TabletCompositionResult,
  TabletRect,
  TabletSlotId,
  TabletSlotPlacement,
} from './TabletComposition.types';

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
): TabletRect {
  return Object.freeze({
    x,
    y,
    width: Math.max(0, width),
    height: Math.max(0, height),
  });
}

function slot(
  slotId: TabletSlotId,
  value: TabletRect,
  zIndex: number,
  scrollable = false,
  visible = true,
): TabletSlotPlacement {
  return Object.freeze({
    slotId,
    rect: value,
    zIndex,
    scrollable,
    visible,
  });
}

export class TabletCompositionEngine {
  readonly #config: TabletCompositionConfig;

  public constructor(
    config: TabletCompositionConfig = TABLET_COMPOSITION_CONFIG,
  ) {
    this.#config = config;
  }

  public compose(
    input: TabletCompositionInput,
    policy: TabletPolicy,
  ): TabletCompositionResult {
    if (
      !Number.isFinite(input.width) ||
      !Number.isFinite(input.height) ||
      input.width <= 0 ||
      input.height <= 0
    ) {
      throw new Error(
        'TabletCompositionEngine requires positive finite dimensions.',
      );
    }

    if (
      !Number.isSafeInteger(input.answerCount) ||
      input.answerCount < 1
    ) {
      throw new Error(
        'TabletCompositionEngine requires at least one answer option.',
      );
    }

    const config = this.#config;
    const mode =
      input.width < config.compactWidthThreshold
        ? 'compact'
        : input.width >= config.cinematicWidthThreshold
          ? 'cinematic'
          : 'standard';

    const inset = clamp(
      Math.min(input.width, input.height) * config.contentInsetRatio,
      config.minimumContentInset,
      config.maximumContentInset,
    );

    const gap = clamp(
      Math.min(input.width, input.height) * config.gapRatio,
      config.minimumGap,
      config.maximumGap,
    );

    const x = input.safeArea.left + inset;
    const y = input.safeArea.top + inset;
    const width = Math.max(
      0,
      input.width -
        input.safeArea.left -
        input.safeArea.right -
        inset * 2,
    );
    const height = Math.max(
      0,
      input.height -
        input.safeArea.top -
        input.safeArea.bottom -
        inset * 2,
    );

    const contentRect = rect(x, y, width, height);

    const headerHeight = clamp(
      height * config.headerHeightRatio,
      input.minimumInteractiveTarget,
      Math.max(input.minimumInteractiveTarget, height * 0.14),
    );
    const footerHeight = clamp(
      height * config.footerHeightRatio,
      0,
      Math.max(0, height * 0.1),
    );

    const questionDensity =
      clamp(input.questionLength / 240, 0, 1);

    const questionHeight = clamp(
      height *
        (
          config.minimumQuestionHeightRatio +
          questionDensity *
            (
              config.maximumQuestionHeightRatio -
              config.minimumQuestionHeightRatio
            )
        ),
      input.minimumInteractiveTarget * 2,
      height * config.maximumQuestionHeightRatio,
    );

    const feedbackHeight =
      input.hasFeedback
        ? clamp(
            height * config.feedbackHeightRatio,
            input.minimumInteractiveTarget,
            height * 0.16,
          )
        : 0;

    const reserved =
      headerHeight +
      footerHeight +
      questionHeight +
      feedbackHeight +
      gap * (input.hasFeedback ? 4 : 3);

    const answersHeight = Math.max(
      input.minimumInteractiveTarget * input.answerCount +
        gap * Math.max(0, input.answerCount - 1),
      height - reserved,
    );

    const answerRowMinimumHeight = Math.max(
      input.minimumInteractiveTarget,
      (
        answersHeight -
        gap * Math.max(0, input.answerCount - 1)
      ) / input.answerCount,
    );

    const warnings: string[] = [];
    if (
      answerRowMinimumHeight <
      input.minimumInteractiveTarget
    ) {
      warnings.push(
        'Answer rows require internal scrolling to preserve minimum target size.',
      );
    }
    if (input.answerCount > 8) {
      warnings.push(
        'High answer-option count detected; answers region is scrollable.',
      );
    }
    if (input.questionLength > 700) {
      warnings.push(
        'Long question detected; QuestionTablet should expose hover/focus expansion.',
      );
    }

    let cursorY = y;
    const frameRect = rect(0, 0, input.width, input.height);
    const headerRect = rect(x, cursorY, width, headerHeight);
    cursorY += headerHeight + gap;
    const questionRect = rect(x, cursorY, width, questionHeight);
    cursorY += questionHeight + gap;

    const availableForAnswers =
      Math.max(
        input.minimumInteractiveTarget,
        y + height -
          cursorY -
          footerHeight -
          feedbackHeight -
          gap * (input.hasFeedback ? 2 : 1),
      );

    const answersRect = rect(
      x,
      cursorY,
      width,
      availableForAnswers,
    );
    cursorY += availableForAnswers + gap;

    const feedbackRect = rect(
      x,
      cursorY,
      width,
      feedbackHeight,
    );
    if (input.hasFeedback) {
      cursorY += feedbackHeight + gap;
    }

    const footerRect = rect(
      x,
      Math.max(cursorY, y + height - footerHeight),
      width,
      footerHeight,
    );

    const slots: Readonly<Record<TabletSlotId, TabletSlotPlacement>> =
      Object.freeze({
        frame: slot('frame', frameRect, 0),
        header: slot('header', headerRect, 2),
        question: slot('question', questionRect, 2, true),
        answers: slot('answers', answersRect, 2, true),
        feedback: slot(
          'feedback',
          feedbackRect,
          2,
          true,
          input.hasFeedback,
        ),
        footer: slot('footer', footerRect, 2),
      });

    const cssVariables = Object.freeze({
      '--qcq-tablet-content-x': `${contentRect.x}px`,
      '--qcq-tablet-content-y': `${contentRect.y}px`,
      '--qcq-tablet-content-width': `${contentRect.width}px`,
      '--qcq-tablet-content-height': `${contentRect.height}px`,
      '--qcq-tablet-gap': `${gap}px`,
      '--qcq-tablet-answer-min-height': `${answerRowMinimumHeight}px`,
      '--qcq-tablet-question-max-height': `${questionRect.height}px`,
      '--qcq-tablet-min-target': `${input.minimumInteractiveTarget}px`,
      '--qcq-tablet-motion-scale': policy.allowDecorativeMotion ? '1' : '0',
      '--qcq-tablet-glow-scale': policy.allowFrameGlow ? '1' : '0',
    });

    return Object.freeze({
      mode,
      contentRect,
      slots,
      answerRowMinimumHeight,
      questionMaximumHeight: questionRect.height,
      internalGap: gap,
      cssVariables,
      warnings: Object.freeze(warnings),
    });
  }
}
