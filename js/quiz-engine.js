function shuffled(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function sameSet(left, right) {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}

export class QuizEngine {
  constructor({ questions, title, mode, shuffleQuestions = true, shuffleOptions = false }) {
    this.title = title;
    this.mode = mode;
    this.questions = (shuffleQuestions ? shuffled(questions) : [...questions]).map((question) => ({
      ...question,
      options: shuffleOptions ? shuffled(question.options) : [...question.options],
    }));
    this.index = 0;
    this.responses = [];
    this.startedAt = Date.now();
    this.pausedAt = null;
    this.pausedDuration = 0;
    this.finishedAt = null;
  }

  get current() {
    return this.questions[this.index] || null;
  }

  get total() {
    return this.questions.length;
  }

  get answered() {
    return this.responses.length;
  }

  get progress() {
    return this.total ? this.answered / this.total : 0;
  }

  get correctCount() {
    return this.responses.filter((response) => response.correct).length;
  }

  get score() {
    return this.total ? (this.correctCount / this.total) * 100 : 0;
  }

  submit(selectedAnswers) {
    if (!this.current) throw new Error('No active question.');
    if (this.responses.some((response) => response.questionId === this.current.id)) {
      throw new Error('This question has already been answered.');
    }
    const selected = [...new Set(selectedAnswers)].sort();
    const expected = [...this.current.answers].sort();
    const correct = sameSet(selected, expected);
    const response = {
      questionId: this.current.id,
      examId: this.current.examId,
      prompt: this.current.prompt,
      topic: this.current.topic,
      selected,
      expected,
      correct,
      explanation: this.current.explanation,
      answeredAt: new Date().toISOString(),
    };
    this.responses.push(response);
    return response;
  }

  next() {
    if (this.index < this.total - 1) {
      this.index += 1;
      return true;
    }
    this.finishedAt = Date.now();
    return false;
  }

  pause() {
    if (!this.pausedAt) this.pausedAt = Date.now();
  }

  resume() {
    if (this.pausedAt) {
      this.pausedDuration += Date.now() - this.pausedAt;
      this.pausedAt = null;
    }
  }

  get elapsedMilliseconds() {
    const end = this.finishedAt || this.pausedAt || Date.now();
    return Math.max(0, end - this.startedAt - this.pausedDuration);
  }

  summary() {
    const topicMap = new Map();
    this.responses.forEach((response) => {
      const current = topicMap.get(response.topic) || { topic: response.topic, correct: 0, total: 0 };
      current.total += 1;
      if (response.correct) current.correct += 1;
      topicMap.set(response.topic, current);
    });
    const topics = [...topicMap.values()]
      .map((topic) => ({ ...topic, score: topic.total ? (topic.correct / topic.total) * 100 : 0 }))
      .sort((a, b) => a.score - b.score || b.total - a.total);

    return {
      id: crypto.randomUUID(),
      title: this.title,
      mode: this.mode,
      score: this.score,
      correct: this.correctCount,
      total: this.total,
      elapsedMilliseconds: this.elapsedMilliseconds,
      completedAt: new Date().toISOString(),
      topics,
      responses: this.responses,
    };
  }
}

export function buildQuestionSet({ exams, mode, selectedExamId, poolIds, questionCount, missedIds, historicalWeakTopics }) {
  const decorated = exams.flatMap((exam) => exam.questions.map((question) => ({
    ...question,
    examId: exam.id,
    examTitle: exam.title,
  })));

  if (mode === 'original') {
    const exam = exams.find((candidate) => String(candidate.id) === String(selectedExamId));
    if (!exam) throw new Error('Select a valid practice exam.');
    return {
      title: exam.title,
      questions: exam.questions.map((question) => ({ ...question, examId: exam.id, examTitle: exam.title })),
    };
  }

  let pool = decorated;
  if (Array.isArray(poolIds) && poolIds.length) {
    const allowed = new Set(poolIds.map(String));
    pool = pool.filter((question) => allowed.has(String(question.examId)));
  }

  if (mode === 'missed') {
    const missed = new Set(missedIds || []);
    pool = pool.filter((question) => missed.has(question.id));
    if (!pool.length) throw new Error('No missed questions are available yet.');
  }

  if (mode === 'weak') {
    const weakTopics = new Set(historicalWeakTopics || []);
    pool = pool.filter((question) => weakTopics.has(question.topic));
    if (!pool.length) throw new Error('Complete at least one exam before starting a weak-topic drill.');
  }

  const count = questionCount === 'all'
    ? pool.length
    : Math.min(Number(questionCount) || 50, pool.length);
  if (!count) throw new Error('The selected question pool is empty.');

  const titles = {
    mixed: `Mixed Laboratory · ${count} Questions`,
    missed: `Missed Question Recovery · ${count} Questions`,
    weak: `Adaptive Weak-Topic Drill · ${count} Questions`,
  };
  return { title: titles[mode] || 'Custom Practice Session', questions: shuffled(pool).slice(0, count) };
}
