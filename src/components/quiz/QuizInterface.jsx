import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuizController } from '../../hooks/useQuizController.js';
import {
  DASHBOARD_CONTROLS,
  METRIC_FIELDS,
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
import { PlacardControl } from '../scene/placard/PlacardControl.jsx';
import { ProfileCardSurface } from '../profile/ProfileCardSurface.jsx';
import { PixelLockedTablet } from './PixelLockedTablet.jsx';
import { TabletQuestionRegion } from './TabletQuestionRegion.jsx';
import { TabletAnswerOption } from './TabletAnswerOption.jsx';
import { TabletProgressRegion } from './TabletProgressRegion.jsx';
import { A23_REGIONS } from './tabletA23Geometry.js';
import '../../styles/quiz-interface.css';


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

function A23PanelSurface({ panelModel }) {
  const rows = [...(panelModel?.rows ?? [])].slice(0, 4);
  while (rows.length < 4) rows.push(null);
  return (
    <>
      <TabletQuestionRegion title={panelModel?.title ?? 'DASHBOARD'} prompt={panelModel?.prompt ?? ''} />
      {A23_REGIONS.rows.map((geometry, index) => {
        const item = rows[index];
        return (
          <TabletAnswerOption
            key={geometry.slot}
            geometry={geometry}
            option={item ? { key: geometry.bakedKey, text: item.text } : null}
            detail={item?.detail ?? ''}
            disabled={!item?.action}
            onActivate={item?.action ?? undefined}
          />
        );
      })}
    </>
  );
}

function A23CompletionSurface({ controller, onRestart }) {
  const rows = [
    { key: 'A', text: 'Correct Answers', detail: String(controller.summary.correct ?? 0) },
    { key: 'B', text: 'Incorrect Answers', detail: String(controller.summary.incorrect ?? 0) },
    { key: 'C', text: 'Final Accuracy', detail: controller.metrics.accuracy },
    { key: 'D', text: 'Time Played', detail: controller.metrics.elapsed },
  ];
  return (
    <>
      <TabletQuestionRegion
        title="RESTART EXAM"
        prompt={`SESSION COMPLETE · ${controller.summary.correct}/${controller.summary.total} CORRECT`}
        action={onRestart}
      />
      {A23_REGIONS.rows.map((geometry, index) => (
        <TabletAnswerOption key={geometry.slot} geometry={geometry} option={rows[index]} detail={rows[index].detail} disabled />
      ))}
    </>
  );
}

export function QuizInterface({ eventTargetRef }) {
  const controller = useQuizController({ eventTargetRef });
  const [activePanel, setActivePanel] = useState('quiz');
  const [optionPage, setOptionPage] = useState(0);
  const priorPanelRef = useRef('quiz');
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

  const openBusinessCard = useCallback(() => {
    if (activePanel !== 'profile') priorPanelRef.current = activePanel;
    setActivePanel('profile');
    const target = eventTargetRef?.current ?? globalThis.document?.documentElement;
    dispatchSceneEvent(target, SceneEvents.BUSINESS_CARD_OPENED, {
      source: 'placard',
      geometryAuthority: 'lower-purple-trim',
    });
  }, [activePanel, eventTargetRef]);

  const closeBusinessCard = useCallback(() => {
    setActivePanel(priorPanelRef.current || 'quiz');
    const target = eventTargetRef?.current ?? globalThis.document?.documentElement;
    dispatchSceneEvent(target, SceneEvents.BUSINESS_CARD_CLOSED, {
      source: 'tablet',
      quizStatePreserved: true,
    });
  }, [eventTargetRef]);

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


  function handleKeyDown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === 'Escape' && activePanel === 'profile') {
      event.preventDefault();
      closeBusinessCard();
      return;
    }

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
      return <A23CompletionSurface controller={controller} onRestart={restartAndReturn} />;
    }

    const title = titleAction?.label
      ?? (question ? `QUESTION ${controller.questionNumber}` : 'INITIALIZING');
    const prompt = controller.phase === 'loading'
      ? 'Loading the validated question collection…'
      : controller.phase === 'error'
        ? 'Question collection unavailable.'
        : controller.phase === 'paused'
          ? 'Session paused. Activate the title to resume.'
          : question?.prompt ?? '';
    const instruction = question?.selectionType === 'multiple' && controller.phase === 'ready'
      ? `CHOOSE ${question.selectionCount} · ${controller.selected.length}/${question.selectionCount}`
      : '';

    return (
      <>
        <TabletQuestionRegion title={title} prompt={prompt} action={titleAction?.handler} selectionInstruction={instruction} />
        {A23_REGIONS.rows.map((geometry, index) => {
          const option = optionPages.visible[index] ?? null;
          const state = option
            ? getOptionState({ optionKey: option.key, selected: controller.selected, response: controller.response })
            : 'disabled';
          return (
            <TabletAnswerOption
              key={`${question?.id ?? 'loading'}-${optionPages.page}-${geometry.slot}`}
              geometry={geometry}
              option={option}
              state={state}
              role={question?.selectionType === 'multiple' ? 'checkbox' : 'radio'}
              checked={option ? controller.selected.includes(option.key) : false}
              disabled={answered || controller.phase !== 'ready'}
              onActivate={option ? () => controller.selectOption(option.key) : undefined}
            />
          );
        })}
        <TabletProgressRegion
          current={controller.questionNumber}
          total={controller.summary.total}
          pageCount={optionPages.pageCount}
          page={optionPages.page}
          onPage={() => setOptionPage((page) => (page + 1) % optionPages.pageCount)}
        />
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

      <PixelLockedTablet>
        {activePanel === 'quiz' ? renderQuizSurface() : activePanel === 'profile' ? null : <A23PanelSurface panelModel={panelModel} />}
      </PixelLockedTablet>

      {activePanel === 'profile' && (
        <ProfileCardSurface eventTargetRef={eventTargetRef} onClose={closeBusinessCard} />
      )}

      <PlacardControl
        eventTargetRef={eventTargetRef}
        active={activePanel === 'profile'}
        onActivate={openBusinessCard}
      />

      <p className="qcq-live-status" aria-live="assertive">
        {controller.error || controller.feedback}
      </p>
    </div>
  );
}
