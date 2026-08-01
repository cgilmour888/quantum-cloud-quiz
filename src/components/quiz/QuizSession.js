import { SceneEvents } from '../scene/sceneEvents.js';
import { shuffled } from './questionSetBuilder.js';

function uniqueSorted(values) {
  return [...new Set((values ?? []).map((value) => String(value).trim().toUpperCase()).filter(Boolean))]
    .sort();
}

function sameSet(left, right) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function defaultIdFactory() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export class QuizSession {
  constructor({
    questions,
    title = 'Practice Session',
    mode = 'original',
    shuffleQuestions = true,
    shuffleOptions = false,
    random = Math.random,
    clock = () => Date.now(),
    idFactory = defaultIdFactory,
    emit = () => {},
  }) {
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('QuizSession requires at least one question.');
    }

    this.id = idFactory();
    this.title = title;
    this.mode = mode;
    this.clock = clock;
    this.emit = emit;
    this.questions = (shuffleQuestions ? shuffled(questions, random) : [...questions]).map((question) => ({
      ...clone(question),
      options: shuffleOptions ? shuffled(question.options ?? [], random) : [...(question.options ?? [])],
    }));

    this.index = 0;
    this.responses = [];
    this.status = 'ready';
    this.startedAt = null;
    this.pausedAt = null;
    this.pausedDuration = 0;
    this.finishedAt = null;
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.attempts = 0;
  }

  start() {
    if (this.status !== 'ready') return this.snapshot();

    this.startedAt = this.clock();
    this.status = 'active';
    this.emit(SceneEvents.EXAM_STARTED, this.eventSnapshot());
    this.emit(SceneEvents.QUESTION_CHANGED, this.questionEventDetail());
    return this.snapshot();
  }

  get current() {
    return this.questions[this.index] ?? null;
  }

  get total() {
    return this.questions.length;
  }

  get answered() {
    return this.responses.length;
  }

  get correctCount() {
    return this.responses.filter((response) => response.correct).length;
  }

  get incorrectCount() {
    return this.answered - this.correctCount;
  }

  get progress() {
    return this.total ? this.answered / this.total : 0;
  }

  get score() {
    return this.total ? (this.correctCount / this.total) * 100 : 0;
  }

  get accuracy() {
    return this.answered ? (this.correctCount / this.answered) * 100 : 0;
  }

  get hasAnsweredCurrent() {
    return Boolean(this.responses.find((response) => response.questionId === this.current?.id));
  }

  get elapsedMilliseconds() {
    if (this.startedAt === null) return 0;
    const end = this.finishedAt ?? this.pausedAt ?? this.clock();
    return Math.max(0, end - this.startedAt - this.pausedDuration);
  }

  assertActive() {
    if (this.status === 'ready') throw new Error('Start the quiz before submitting an answer.');
    if (this.status === 'paused') throw new Error('Resume the quiz before submitting an answer.');
    if (this.status === 'completed') throw new Error('This quiz session is complete.');
  }

  submit(selectedAnswers) {
    this.assertActive();
    if (!this.current) throw new Error('No active question.');
    if (this.hasAnsweredCurrent) throw new Error('This question has already been answered.');

    const selected = uniqueSorted(selectedAnswers);
    const expected = uniqueSorted(this.current.answers);
    const required = Number(this.current.selectionCount) || expected.length || 1;

    if (selected.length !== required) {
      throw new Error(`Select exactly ${required} answer${required === 1 ? '' : 's'}.`);
    }

    const validOptionKeys = new Set((this.current.options ?? []).map((option) => option.key));
    if (selected.some((answer) => !validOptionKeys.has(answer))) {
      throw new Error('One or more selected answers do not belong to the active question.');
    }

    this.attempts += 1;
    this.emit(SceneEvents.ANSWER_SELECTED, {
      ...this.questionEventDetail(),
      selected,
      attempt: this.attempts,
    });

    const correct = sameSet(selected, expected);
    this.currentStreak = correct ? this.currentStreak + 1 : 0;
    this.bestStreak = Math.max(this.bestStreak, this.currentStreak);

    const response = {
      questionId: this.current.id,
      examId: this.current.examId,
      prompt: this.current.prompt,
      topic: this.current.topic,
      selected,
      expected,
      correct,
      explanation: this.current.explanation,
      attempt: this.attempts,
      answeredAt: new Date(this.clock()).toISOString(),
    };

    this.responses.push(response);

    this.emit(
      correct ? SceneEvents.ANSWER_CORRECT : SceneEvents.ANSWER_INCORRECT,
      {
        ...this.questionEventDetail(),
        response: clone(response),
        currentStreak: this.currentStreak,
        bestStreak: this.bestStreak,
        accuracy: this.accuracy,
      },
    );

    this.emit(SceneEvents.STREAK_CHANGED, {
      sessionId: this.id,
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      correct,
    });

    return clone(response);
  }

  next() {
    this.assertActive();
    if (!this.hasAnsweredCurrent) throw new Error('Answer the current question before continuing.');

    if (this.index < this.total - 1) {
      this.index += 1;
      this.emit(SceneEvents.QUESTION_CHANGED, this.questionEventDetail());
      return true;
    }

    this.complete();
    return false;
  }

  pause() {
    if (this.status !== 'active') return false;
    this.pausedAt = this.clock();
    this.status = 'paused';
    this.emit(SceneEvents.EXAM_PAUSED, this.eventSnapshot());
    return true;
  }

  resume() {
    if (this.status !== 'paused') return false;
    this.pausedDuration += this.clock() - this.pausedAt;
    this.pausedAt = null;
    this.status = 'active';
    this.emit(SceneEvents.EXAM_RESUMED, this.eventSnapshot());
    return true;
  }

  complete() {
    if (this.status === 'completed') return this.summary();
    if (this.startedAt === null) throw new Error('Cannot complete a quiz that has not started.');

    if (this.status === 'paused') this.resume();
    this.finishedAt = this.clock();
    this.status = 'completed';

    const summary = this.summary();
    this.emit(SceneEvents.EXAM_COMPLETED, summary);
    this.emit(SceneEvents.SCORE_REVEAL, summary);
    return summary;
  }

  topicSummary() {
    const topics = new Map();

    for (const response of this.responses) {
      const current = topics.get(response.topic) ?? {
        topic: response.topic,
        correct: 0,
        total: 0,
      };

      current.total += 1;
      if (response.correct) current.correct += 1;
      topics.set(response.topic, current);
    }

    return [...topics.values()]
      .map((topic) => ({
        ...topic,
        score: topic.total ? (topic.correct / topic.total) * 100 : 0,
      }))
      .sort((left, right) => left.score - right.score || right.total - left.total);
  }

  summary() {
    return {
      id: this.id,
      title: this.title,
      mode: this.mode,
      status: this.status,
      score: this.score,
      accuracy: this.accuracy,
      correct: this.correctCount,
      incorrect: this.incorrectCount,
      answered: this.answered,
      total: this.total,
      attempts: this.attempts,
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      elapsedMilliseconds: this.elapsedMilliseconds,
      startedAt: this.startedAt === null ? null : new Date(this.startedAt).toISOString(),
      completedAt: this.finishedAt === null ? null : new Date(this.finishedAt).toISOString(),
      topics: this.topicSummary(),
      responses: clone(this.responses),
    };
  }

  snapshot() {
    return {
      version: 1,
      session: this.summary(),
      index: this.index,
      pausedAt: this.pausedAt,
      pausedDuration: this.pausedDuration,
      finishedAt: this.finishedAt,
      questions: clone(this.questions),
    };
  }

  eventSnapshot() {
    return {
      sessionId: this.id,
      title: this.title,
      mode: this.mode,
      status: this.status,
      answered: this.answered,
      total: this.total,
      attempts: this.attempts,
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      elapsedMilliseconds: this.elapsedMilliseconds,
    };
  }

  questionEventDetail() {
    return {
      ...this.eventSnapshot(),
      questionIndex: this.index,
      questionNumber: this.index + 1,
      questionId: this.current?.id ?? null,
      examId: this.current?.examId ?? null,
      topic: this.current?.topic ?? null,
      selectionType: this.current?.selectionType ?? 'single',
      selectionCount: this.current?.selectionCount ?? 1,
    };
  }

  static restore(snapshot, options = {}) {
    if (snapshot?.version !== 1 || !snapshot?.session || !Array.isArray(snapshot?.questions)) {
      throw new Error('Unsupported or invalid quiz-session snapshot.');
    }

    const session = new QuizSession({
      questions: snapshot.questions,
      title: snapshot.session.title,
      mode: snapshot.session.mode,
      shuffleQuestions: false,
      shuffleOptions: false,
      ...options,
      idFactory: () => snapshot.session.id,
    });

    session.index = snapshot.index;
    session.responses = clone(snapshot.session.responses ?? []);
    session.status = snapshot.session.status;
    session.startedAt = snapshot.session.startedAt
      ? Date.parse(snapshot.session.startedAt)
      : null;
    session.pausedAt = snapshot.pausedAt;
    session.pausedDuration = snapshot.pausedDuration ?? 0;
    session.finishedAt = snapshot.finishedAt;
    session.currentStreak = snapshot.session.currentStreak ?? 0;
    session.bestStreak = snapshot.session.bestStreak ?? 0;
    session.attempts = snapshot.session.attempts ?? session.responses.length;
    session.emit(SceneEvents.SESSION_RESTORED, session.eventSnapshot());
    return session;
  }
}
