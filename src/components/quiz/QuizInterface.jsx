import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuizController } from '../../hooks/useQuizController.js';
import {
  DASHBOARD_CONTROLS,
  METRIC_FIELDS,
  TABLET_REGIONS,
  geometryStyle,
} from './tabletGeometry.js';
import { createDashboardPanel } from './dashboardModels.js';
import {
  getOptionState,
  getQuestionDensity,
  paginateOptions,
} from './quizViewModel.js';
import {
  SceneEvents,
  dispatchSceneEvent,
} from '../scene/sceneEvents.js';
import '../../styles/quiz-interface.css';

const ROW_TONES = Object.freeze(['cyan', 'magenta', 'emerald', 'orange']);

function isCalibrationMode() {
  try {
    return new URLSearchParams(globalThis.location?.search ?? '').get('qcq-calibrate') === '1';
  } catch {
    return false;
  }
}

function MetricsOverlay({ metrics }) {
  return (
    <div className="qcq-metrics-layer" aria-label="Live session metrics">
      {METRIC_FIELDS.map((field) => (
        <output
          key={field.id}
          className="qcq-metric-value"
          data-metric={field.id}
          data-tone={field.tone}
          style={geometryStyle(field.rect)}
          aria-label={`${field.label}: ${metrics[field.id]}`}
        >
          {metrics[field.id]}
        </output>
      ))}
    </div>
  );
}

function DashboardControls({ activePanel, onNavigate }) {
  return (
    <nav className="qcq-dashboard-controls" aria-label="Performance dashboard">
      {DASHBOARD_CONTROLS.map((control) => (
        <button
          key={control.id}
          type="button"
          className="qcq-dashboard-hit"
          data-tone={control.tone}
          data-active={activePanel === control.panel ? 'true' : 'false'}
          style={geometryStyle(control.rect)}
          aria-label={control.label}
          onClick={() => onNavigate(control.panel, control.id)}
        />
      ))}
    </nav>
  );
}

function stateGlyph(state) {
  if (state === 'correct-selected' || state === 'correct-answer') return '✓';
  if (state === 'incorrect-selected') return '×';
  if (state === 'selected') return '◆';
  return '';
}

function TabletRow({
  geometry,
  tone,
  option,
  state = 'idle',
  disabled = false,
  onActivate,
  role,
  checked,
  detail = '',
  panelState = null,
}) {
  const bakedKeyMatches = option?.key === geometry.bakedKey;
  const empty = !option;
  const label = option?.text ?? '';
  const glyph = panelState === 'complete' ? '✓' : panelState === 'locked' ? '◇' : stateGlyph(state);

  return (
    <>
      <span
        className="qcq-answer-veil"
        data-empty={empty ? 'true' : 'false'}
        style={geometryStyle(geometry.text)}
        aria-hidden="true"
      />

      {(!bakedKeyMatches || empty) && (
        <span
          className="qcq-badge-veil"
          style={geometryStyle(geometry.badge)}
          aria-hidden="true"
        />
      )}

      {!empty && !bakedKeyMatches && (
        <span
          className="qcq-dynamic-key"
          data-tone={tone}
          style={geometryStyle(geometry.badge)}
          aria-hidden="true"
        >
          {option.key}
        </span>
      )}

      {!empty && (
        <span
          className="qcq-answer-copy"
          data-state={state}
          data-panel-state={panelState ?? ''}
          style={geometryStyle(geometry.text)}
          aria-hidden="true"
        >
          <span className="qcq-answer-copy__text">{label}</span>
          {detail && <span className="qcq-answer-copy__detail">{detail}</span>}
          {glyph && <span className="qcq-answer-copy__glyph">{glyph}</span>}
        </span>
      )}

      <button
        type="button"
        className="qcq-answer-hit"
        data-tone={tone}
        data-state={state}
        data-empty={empty ? 'true' : 'false'}
        style={geometryStyle(geometry.hit)}
        disabled={disabled || empty}
        role={role}
        aria-checked={checked}
        aria-label={empty ? undefined : `${option.key}. ${label}${detail ? `, ${detail}` : ''}`}
        onClick={onActivate}
      />
    </>
  );
}

function PanelSurface({ panelModel }) {
  const rows = [...(panelModel?.rows ?? [])].slice(0, 4);
  while (rows.length < 4) rows.push(null);

  return (
    <>
      <div className="qcq-tablet-title" style={geometryStyle(TABLET_REGIONS.title)}>
        {panelModel?.title ?? 'DASHBOARD'}
      </div>
      <div className="qcq-tablet-prompt" style={geometryStyle(TABLET_REGIONS.prompt)}>
        {panelModel?.prompt ?? ''}
      </div>
      {TABLET_REGIONS.rows.map((geometry, index) => {
        const item = rows[index];
        return (
          <TabletRow
            key={geometry.slot}
            geometry={geometry}
            tone={ROW_TONES[index]}
            option={item ? { key: geometry.bakedKey, text: item.text } : null}
            detail={item?.detail ?? ''}
            panelState={item?.state ?? null}
            disabled={!item?.action}
            onActivate={item?.action ?? undefined}
          />
        );
      })}
    </>
  );
}

function CompletionSurface({ controller, onRestart }) {
  const rows = [
    { key: 'A', text: 'Correct Answers', detail: String(controller.summary.correct ?? 0) },
    { key: 'B', text: 'Incorrect Answers', detail: String(controller.summary.incorrect ?? 0) },
    { key: 'C', text: 'Final Accuracy', detail: controller.metrics.accuracy },
    { key: 'D', text: 'Time Played', detail: controller.metrics.elapsed },
  ];

  return (
    <>
      <button
        type="button"
        className="qcq-tablet-title qcq-tablet-title--action"
        style={geometryStyle(TABLET_REGIONS.title)}
        onClick={onRestart}
      >
        RESTART EXAM
      </button>
      <div className="qcq-tablet-prompt" style={geometryStyle(TABLET_REGIONS.prompt)}>
        SESSION COMPLETE · {controller.summary.correct}/{controller.summary.total} CORRECT
      </div>
      {TABLET_REGIONS.rows.map((geometry, index) => (
        <TabletRow
          key={geometry.slot}
          geometry={geometry}
          tone={ROW_TONES[index]}
          option={rows[index]}
          detail={rows[index].detail}
          disabled
        />
      ))}
    </>
  );
}

export function QuizInterface({ eventTargetRef }) {
  const controller = useQuizController({ eventTargetRef });
  const [activePanel, setActivePanel] = useState('quiz');
  const [optionPage, setOptionPage] = useState(0);
  const actionRef = useRef(null);
  const calibration = useMemo(isCalibrationMode, []);

  const question = controller.question;
  const answered = Boolean(controller.response);
  const density = getQuestionDensity(question);
  const optionPages = paginateOptions(question?.options ?? [], optionPage, 4);
  const isLastAnswered = answered
    && controller.summary.answered === controller.summary.total
    && controller.summary.total > 0;

  useEffect(() => {
    setOptionPage(0);
  }, [question?.id]);

  const navigate = useCallback((panel, controlId = panel) => {
    setActivePanel(panel);
    const target = eventTargetRef?.current ?? globalThis.document?.documentElement;
    dispatchSceneEvent(target, SceneEvents.DASHBOARD_NAVIGATED, { panel, controlId });
  }, [eventTargetRef]);

  const returnToQuiz = useCallback(() => setActivePanel('quiz'), []);

  const restartAndReturn = useCallback(async () => {
    await controller.restart();
    setActivePanel('quiz');
    setOptionPage(0);
  }, [controller]);

  const panelActions = useMemo(() => ({
    returnToQuiz,
    restart: restartAndReturn,
    togglePause: controller.togglePause,
    toggleThunder: () => controller.updateSetting('thunderEnabled', controller.settings.thunderEnabled === false),
    toggleMotion: () => controller.updateSetting('animationsPaused', !controller.settings.animationsPaused),
    toggleReducedMotion: () => controller.updateSetting('reducedMotion', !controller.settings.reducedMotion),
  }), [controller, restartAndReturn, returnToQuiz]);

  const panelModel = useMemo(() => createDashboardPanel(activePanel, {
    summary: controller.summary,
    progress: controller.progress,
    settings: controller.settings,
    actions: panelActions,
  }), [activePanel, controller.progress, controller.settings, controller.summary, panelActions]);

  const titleAction = useMemo(() => {
    if (activePanel !== 'quiz') return null;
    if (controller.phase === 'paused') {
      return { label: 'RESUME SESSION', handler: controller.togglePause };
    }
    if (controller.phase === 'completed') {
      return { label: 'RESTART EXAM', handler: restartAndReturn };
    }
    if (!question || controller.phase !== 'ready') return null;
    if (answered) {
      return {
        label: isLastAnswered ? 'COMPLETE EXAM' : 'NEXT QUESTION',
        handler: controller.advance,
      };
    }
    if (question.selectionType === 'multiple'
      && controller.selected.length === question.selectionCount) {
      return {
        label: `SUBMIT ${question.selectionCount} ANSWERS`,
        handler: controller.submitCurrent,
      };
    }
    return null;
  }, [
    activePanel,
    answered,
    controller,
    isLastAnswered,
    question,
    restartAndReturn,
  ]);

  useEffect(() => {
    if (titleAction) actionRef.current?.focus({ preventScroll: true });
  }, [titleAction?.label]);

  function handleKeyDown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === 'Escape' && activePanel !== 'quiz') {
      event.preventDefault();
      returnToQuiz();
      return;
    }

    if (activePanel !== 'quiz' || !question || !['ready', 'paused'].includes(controller.phase)) return;

    const normalized = event.key.toUpperCase();
    const numericIndex = /^[1-9]$/.test(event.key) ? Number(event.key) - 1 : -1;
    const optionIndex = question.options.findIndex((item) => item.key === normalized);
    const resolvedIndex = optionIndex >= 0 ? optionIndex : numericIndex;
    const option = question.options[resolvedIndex];

    if (option && !answered && controller.phase === 'ready') {
      event.preventDefault();
      setOptionPage(Math.floor(resolvedIndex / 4));
      controller.selectOption(option.key);
      return;
    }

    if (event.key === 'ArrowRight' && optionPages.pageCount > 1) {
      event.preventDefault();
      setOptionPage((page) => (page + 1) % optionPages.pageCount);
      return;
    }

    if (event.key === 'ArrowLeft' && optionPages.pageCount > 1) {
      event.preventDefault();
      setOptionPage((page) => (page - 1 + optionPages.pageCount) % optionPages.pageCount);
      return;
    }

    const activeButton = event.target instanceof HTMLButtonElement;
    if (!activeButton && event.key === 'Enter' && titleAction?.handler) {
      event.preventDefault();
      titleAction.handler();
    }
  }

  function renderQuizSurface() {
    if (controller.phase === 'completed') {
      return <CompletionSurface controller={controller} onRestart={restartAndReturn} />;
    }

    const title = titleAction?.label
      ?? (question ? `QUESTION ${controller.questionNumber}` : 'INITIALIZING');

    return (
      <>
        {titleAction ? (
          <button
            ref={actionRef}
            type="button"
            className="qcq-tablet-title qcq-tablet-title--action"
            style={geometryStyle(TABLET_REGIONS.title)}
            onClick={titleAction.handler}
          >
            {title}
          </button>
        ) : (
          <div className="qcq-tablet-title" style={geometryStyle(TABLET_REGIONS.title)}>
            {title}
          </div>
        )}

        <div
          className="qcq-tablet-prompt"
          data-density={density}
          style={geometryStyle(TABLET_REGIONS.prompt)}
          aria-live="polite"
        >
          {controller.phase === 'loading' && 'Loading the validated question collection…'}
          {controller.phase === 'error' && 'Question collection unavailable.'}
          {controller.phase === 'paused'
            ? 'Session paused. Activate the title to resume.'
            : question?.prompt}
          {question?.selectionType === 'multiple' && controller.phase === 'ready' && (
            <span className="qcq-selection-instruction">
              CHOOSE {question.selectionCount} · {controller.selected.length}/{question.selectionCount}
            </span>
          )}
        </div>

        {TABLET_REGIONS.rows.map((geometry, index) => {
          const option = optionPages.visible[index] ?? null;
          const state = option
            ? getOptionState({
              optionKey: option.key,
              selected: controller.selected,
              response: controller.response,
            })
            : 'disabled';

          return (
            <TabletRow
              key={`${question?.id ?? 'loading'}-${optionPages.page}-${geometry.slot}`}
              geometry={geometry}
              tone={ROW_TONES[index]}
              option={option}
              state={state}
              role={question?.selectionType === 'multiple' ? 'checkbox' : 'radio'}
              checked={option ? controller.selected.includes(option.key) : false}
              disabled={answered || controller.phase !== 'ready'}
              onActivate={option ? () => controller.selectOption(option.key) : undefined}
            />
          );
        })}

        <span className="qcq-progress-marker" style={geometryStyle(TABLET_REGIONS.progress)} aria-hidden="true">
          {controller.questionNumber || 0} / {controller.summary.total || 0}
        </span>

        {optionPages.pageCount > 1 && (
          <button
            type="button"
            className="qcq-option-pager"
            style={geometryStyle(TABLET_REGIONS.pager)}
            onClick={() => setOptionPage((page) => (page + 1) % optionPages.pageCount)}
            aria-label={`Show option page ${((optionPages.page + 1) % optionPages.pageCount) + 1} of ${optionPages.pageCount}`}
          >
            {optionPages.page === 0 ? 'MORE OPTIONS  ›' : '‹  OPTIONS A–D'}
          </button>
        )}
      </>
    );
  }

  return (
    <div
      className="scene-layer scene-layer--controls qcq-live-interface"
      data-panel={activePanel}
      data-calibration={calibration ? 'true' : 'false'}
      data-density={density}
      onKeyDown={handleKeyDown}
    >
      <MetricsOverlay metrics={controller.metrics} />
      <DashboardControls activePanel={activePanel} onNavigate={navigate} />

      <section className="qcq-tablet-surface" aria-label="Quantum Cloud Quiz live tablet">
        {activePanel === 'quiz'
          ? renderQuizSurface()
          : <PanelSurface panelModel={panelModel} />}
      </section>

      <p className="qcq-live-status" aria-live="assertive">
        {controller.error || controller.feedback}
      </p>
    </div>
  );
}
