import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LocalProgressRepository,
  QuizSession,
  StaticQuestionRepository,
  buildQuestionSet,
} from '../components/quiz/index.js';
import {
  SceneEvents,
  dispatchSceneEvent,
} from '../components/scene/sceneEvents.js';
import { createQuizMetrics } from '../components/quiz/quizViewModel.js';

function resolveLocalStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

const DEFAULT_SETTINGS = Object.freeze({
  thunderEnabled: true,
  animationsPaused: false,
  reducedMotion: false,
});

const EMPTY_SUMMARY = Object.freeze({
  status: 'loading',
  score: 0,
  accuracy: 0,
  correct: 0,
  incorrect: 0,
  answered: 0,
  total: 0,
  attempts: 0,
  currentStreak: 0,
  bestStreak: 0,
  elapsedMilliseconds: 0,
  responses: [],
  topics: [],
});

function createInitialModel() {
  return {
    phase: 'loading',
    question: null,
    questionNumber: 0,
    summary: EMPTY_SUMMARY,
    response: null,
    selected: [],
    feedback: 'Loading the validated question collection…',
    error: null,
    progress: {
      results: [],
      missed: [],
      settings: { ...DEFAULT_SETTINGS },
      activeSession: null,
    },
    settings: { ...DEFAULT_SETTINGS },
  };
}

function findCurrentResponse(session) {
  const questionId = session.current?.id;
  if (!questionId) return null;
  return session.responses.find((response) => response.questionId === questionId) ?? null;
}

export function useQuizController({ eventTargetRef } = {}) {
  const questionRepositoryRef = useRef(null);
  const progressRepositoryRef = useRef(null);
  const sessionRef = useRef(null);
  const sessionBlueprintRef = useRef(null);
  const mountedRef = useRef(false);
  const completionPersistenceRef = useRef(Promise.resolve());
  const [model, setModel] = useState(createInitialModel);

  if (!questionRepositoryRef.current) {
    questionRepositoryRef.current = new StaticQuestionRepository();
  }

  if (!progressRepositoryRef.current) {
    progressRepositoryRef.current = new LocalProgressRepository(resolveLocalStorage());
  }

  const emit = useCallback((eventName, detail) => {
    const target = eventTargetRef?.current ?? globalThis.document?.documentElement;
    dispatchSceneEvent(target, eventName, detail);
  }, [eventTargetRef]);

  const publish = useCallback(({
    selected,
    feedback,
    error = null,
    persist = false,
    progress,
    settings,
  } = {}) => {
    const session = sessionRef.current;
    if (!session || !mountedRef.current) return;

    const response = findCurrentResponse(session);
    const summary = session.summary();

    setModel((previous) => ({
      phase: session.status === 'completed'
        ? 'completed'
        : session.status === 'paused'
          ? 'paused'
          : 'ready',
      question: session.current,
      questionNumber: session.index + 1,
      summary,
      response,
      selected: selected ?? (response?.selected ?? previous.selected ?? []),
      feedback: feedback ?? previous.feedback,
      error,
      progress: progress ?? previous.progress,
      settings: settings ?? previous.settings,
    }));

    if (persist && session.status !== 'completed') {
      void progressRepositoryRef.current.saveActiveSession(session.snapshot());
    }
  }, []);

  const refreshProgress = useCallback(async () => {
    const progress = await progressRepositoryRef.current.getSnapshot();
    if (!mountedRef.current) return progress;
    const settings = { ...DEFAULT_SETTINGS, ...(progress.settings ?? {}) };
    setModel((previous) => ({ ...previous, progress, settings }));
    return progress;
  }, []);

  const finalizeSession = useCallback(async (session) => {
    const summary = session.summary();
    const missed = summary.responses
      .filter((response) => !response.correct)
      .map((response) => response.questionId);

    const previous = await progressRepositoryRef.current.getSnapshot();
    await progressRepositoryRef.current.saveResult(summary);
    await progressRepositoryRef.current.saveMissed([
      ...(previous.missed ?? []),
      ...missed,
    ]);
    await progressRepositoryRef.current.clearActiveSession();
    return refreshProgress();
  }, [refreshProgress]);

  const createSession = useCallback(({ questions, title, mode }) => {
    const session = new QuizSession({
      questions,
      title,
      mode,
      shuffleQuestions: false,
      shuffleOptions: false,
      emit,
    });

    sessionRef.current = session;
    sessionBlueprintRef.current = { questions, title, mode };
    session.start();
    return session;
  }, [emit]);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    async function initialize() {
      try {
        const [dataset, progress] = await Promise.all([
          questionRepositoryRef.current.load(),
          progressRepositoryRef.current.getSnapshot(),
        ]);

        if (cancelled) return;

        emit(SceneEvents.DATASET_LOADED, {
          examCount: dataset.meta.examCount,
          totalQuestions: dataset.meta.totalQuestions,
          title: dataset.meta.title,
        });

        let session = null;
        const saved = progress.activeSession;
        const canRestore = saved?.version === 1
          && Array.isArray(saved?.questions)
          && ['active', 'paused'].includes(saved?.session?.status);

        if (canRestore) {
          session = QuizSession.restore(saved, { emit });
          sessionRef.current = session;
          sessionBlueprintRef.current = {
            questions: saved.questions,
            title: saved.session.title,
            mode: saved.session.mode,
          };

          if (session.status === 'paused') session.resume();
        } else {
          const firstExam = dataset.exams[0];
          if (!firstExam) throw new Error('The validated dataset does not contain an exam.');

          const blueprint = buildQuestionSet({
            exams: dataset.exams,
            mode: 'original',
            selectedExamId: firstExam.id,
          });

          session = createSession(blueprint);
        }

        if (cancelled) return;

        const settings = { ...DEFAULT_SETTINGS, ...(progress.settings ?? {}) };
        publish({
          selected: findCurrentResponse(session)?.selected ?? [],
          feedback: session.status === 'active'
            ? 'Select the best answer.'
            : 'Session restored.',
          persist: true,
          progress,
          settings,
        });
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        emit(SceneEvents.DATASET_REJECTED, { message });
        setModel({
          ...createInitialModel(),
          phase: 'error',
          feedback: 'The question collection could not be loaded.',
          error: message,
        });
      }
    }

    void initialize();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [createSession, emit, publish]);

  useEffect(() => {
    if (model.phase !== 'ready') return undefined;

    const timer = globalThis.setInterval(() => {
      if (sessionRef.current?.status === 'active') publish();
    }, 1000);

    return () => globalThis.clearInterval(timer);
  }, [model.phase, publish]);

  const submitAnswers = useCallback((answers) => {
    const session = sessionRef.current;
    if (!session || session.status !== 'active') return false;

    try {
      const response = session.submit(answers);
      const feedback = response.correct
        ? 'Correct.'
        : `Incorrect. Correct answer${response.expected.length === 1 ? '' : 's'}: ${response.expected.join(', ')}.`;

      publish({
        selected: response.selected,
        feedback,
        persist: true,
      });
      return true;
    } catch (error) {
      publish({
        selected: answers,
        feedback: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }, [publish]);

  const selectOption = useCallback((optionKey) => {
    const session = sessionRef.current;
    const question = session?.current;
    if (!session || !question || session.hasAnsweredCurrent || session.status !== 'active') {
      return false;
    }

    if (question.selectionType === 'single') {
      return submitAnswers([optionKey]);
    }

    setModel((previous) => {
      const selected = new Set(previous.selected);
      if (selected.has(optionKey)) selected.delete(optionKey);
      else if (selected.size < question.selectionCount) selected.add(optionKey);

      const nextSelected = [...selected];
      return {
        ...previous,
        selected: nextSelected,
        feedback: `${nextSelected.length} of ${question.selectionCount} answers selected.`,
        error: null,
      };
    });

    return true;
  }, [submitAnswers]);

  const submitCurrent = useCallback(() => {
    const session = sessionRef.current;
    if (!session?.current || session.hasAnsweredCurrent) return false;
    return submitAnswers(model.selected);
  }, [model.selected, submitAnswers]);

  const advance = useCallback(() => {
    const session = sessionRef.current;
    if (!session || !session.hasAnsweredCurrent || session.status !== 'active') return false;

    try {
      const hasNextQuestion = session.next();

      if (hasNextQuestion) {
        publish({ selected: [], feedback: 'Select the best answer.', persist: true });
      } else {
        publish({
          selected: [],
          feedback: `Exam complete · ${session.correctCount}/${session.total} correct.`,
        });
        completionPersistenceRef.current = finalizeSession(session);
      }

      return true;
    } catch (error) {
      publish({
        feedback: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }, [finalizeSession, publish]);

  const restart = useCallback(async () => {
    const blueprint = sessionBlueprintRef.current;
    if (!blueprint) return false;

    await completionPersistenceRef.current;
    const session = createSession(blueprint);
    publish({
      selected: [],
      feedback: 'New session initialized.',
      persist: true,
    });
    return Boolean(session);
  }, [createSession, publish]);

  const togglePause = useCallback(() => {
    const session = sessionRef.current;
    if (!session || session.status === 'completed') return false;

    const changed = session.status === 'paused' ? session.resume() : session.pause();
    if (changed) {
      publish({
        feedback: session.status === 'paused' ? 'Session paused.' : 'Session resumed.',
        persist: true,
      });
    }
    return changed;
  }, [publish]);

  const updateSetting = useCallback(async (name, value) => {
    const nextSettings = { ...model.settings, [name]: value };
    await progressRepositoryRef.current.saveSettings(nextSettings);
    if (!mountedRef.current) return nextSettings;

    setModel((previous) => ({
      ...previous,
      settings: nextSettings,
      progress: { ...previous.progress, settings: nextSettings },
    }));

    emit(SceneEvents.SETTINGS_CHANGED, { name, value, settings: nextSettings });
    return nextSettings;
  }, [emit, model.settings]);

  return {
    ...model,
    metrics: createQuizMetrics(model.summary),
    selectOption,
    submitCurrent,
    advance,
    restart,
    togglePause,
    updateSetting,
  };
}
