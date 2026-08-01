function shuffled(items, random = Math.random) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function decorate(exam) {
  return exam.questions.map((question) => ({
    ...question,
    examId: exam.id,
    examTitle: exam.title,
  }));
}

export function buildQuestionSet({
  exams,
  mode = 'original',
  selectedExamId,
  poolIds = [],
  questionCount = 'all',
  missedIds = [],
  historicalWeakTopics = [],
  random = Math.random,
}) {
  if (!Array.isArray(exams) || exams.length === 0) {
    throw new Error('At least one exam is required.');
  }

  if (mode === 'original') {
    const selected = exams.find((exam) => String(exam.id) === String(selectedExamId));
    if (!selected) throw new Error('Select a valid practice exam.');

    return {
      title: selected.title,
      mode,
      questions: decorate(selected),
    };
  }

  let pool = exams.flatMap(decorate);

  if (poolIds.length > 0) {
    const allowed = new Set(poolIds.map(String));
    pool = pool.filter((question) => allowed.has(String(question.examId)));
  }

  if (mode === 'missed') {
    const missed = new Set(missedIds.map(String));
    pool = pool.filter((question) => missed.has(String(question.id)));
    if (pool.length === 0) throw new Error('No missed questions are available yet.');
  }

  if (mode === 'weak') {
    const weakTopics = new Set(historicalWeakTopics);
    pool = pool.filter((question) => weakTopics.has(question.topic));
    if (pool.length === 0) {
      throw new Error('Complete at least one exam before starting a weak-topic drill.');
    }
  }

  const requestedCount = questionCount === 'all'
    ? pool.length
    : Math.min(Math.max(1, Number(questionCount) || 50), pool.length);

  if (requestedCount === 0) throw new Error('The selected question pool is empty.');

  const titles = {
    mixed: `Mixed Laboratory · ${requestedCount} Questions`,
    missed: `Missed Question Recovery · ${requestedCount} Questions`,
    weak: `Adaptive Weak-Topic Drill · ${requestedCount} Questions`,
  };

  return {
    title: titles[mode] || `Custom Practice Session · ${requestedCount} Questions`,
    mode,
    questions: shuffled(pool, random).slice(0, requestedCount),
  };
}

export { shuffled };
