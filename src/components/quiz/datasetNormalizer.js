const DEFAULT_COLLECTION_ID = 'quantum-cloud-quiz-collection';

function asNonEmptyString(value, fallback = '') {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

function asStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item ?? '').split(/[;,]/))
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);
  }

  if (value === undefined || value === null || value === '') return [];

  return String(value)
    .split(/[;,]/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values)];
}

function fallbackOptionKey(index) {
  return String.fromCharCode(65 + index);
}

export function normalizeOption(option, index) {
  if (typeof option === 'string') {
    return {
      key: fallbackOptionKey(index),
      text: option.trim(),
    };
  }

  const key = asNonEmptyString(
    option?.key ?? option?.id ?? option?.value,
    fallbackOptionKey(index),
  ).toUpperCase();

  return {
    key,
    text: asNonEmptyString(option?.text ?? option?.label ?? option?.name),
  };
}

export function normalizeQuestion(question, index, examContext = {}) {
  const options = (question?.options ?? question?.choices ?? []).map(normalizeOption);
  const answers = unique(
    asStringArray(
      question?.answers
      ?? question?.correctAnswers
      ?? question?.correctAnswer
      ?? question?.answer
      ?? question?.correct,
    ),
  ).sort();

  const prompt = asNonEmptyString(question?.prompt ?? question?.question ?? question?.text);
  const selectionCount = Number(question?.selectionCount) || answers.length || 1;

  return {
    id: asNonEmptyString(
      question?.id,
      `${examContext.id || 'exam'}-q${index + 1}`,
    ),
    number: Number(question?.number) || index + 1,
    sourceNumber: Number(question?.sourceNumber) || Number(question?.number) || index + 1,
    prompt,
    options,
    answers,
    selectionType: answers.length > 1 || question?.selectionType === 'multiple'
      ? 'multiple'
      : 'single',
    selectionCount,
    topic: asNonEmptyString(question?.topic ?? question?.category, 'Uncategorized'),
    explanation: asNonEmptyString(question?.explanation),
    references: Array.isArray(question?.references)
      ? question.references.map(String).filter(Boolean)
      : [],
    examId: asNonEmptyString(question?.examId ?? examContext.id),
    examTitle: asNonEmptyString(question?.examTitle ?? examContext.title),
  };
}

export function normalizeExam(exam, index = 0) {
  const id = asNonEmptyString(exam?.id ?? exam?.slug, `exam-${index + 1}`);
  const title = asNonEmptyString(exam?.title ?? exam?.name, `Practice Exam ${index + 1}`);
  const questions = (exam?.questions ?? []).map((question, questionIndex) =>
    normalizeQuestion(question, questionIndex, { id, title }),
  );

  return {
    id,
    slug: asNonEmptyString(exam?.slug, id),
    title,
    sourceFile: asNonEmptyString(exam?.sourceFile),
    custom: Boolean(exam?.custom),
    questionCount: questions.length,
    questions,
  };
}

function extractExams(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.exams)) return value.exams;
  if (value?.exam && typeof value.exam === 'object') return [value.exam];
  if (Array.isArray(value?.questions)) return [value];
  return [];
}

export function normalizeQuizDataset(value, { source = 'unknown' } = {}) {
  const exams = extractExams(value).map(normalizeExam);
  const totalQuestions = exams.reduce((sum, exam) => sum + exam.questions.length, 0);

  return {
    meta: {
      id: asNonEmptyString(value?.meta?.id, DEFAULT_COLLECTION_ID),
      title: asNonEmptyString(
        value?.meta?.title ?? value?.title,
        'Quantum Cloud Quiz Question Collection',
      ),
      version: value?.meta?.version ?? value?.version ?? 1,
      source,
      examCount: exams.length,
      totalQuestions,
      normalizedAt: new Date().toISOString(),
    },
    exams,
  };
}

export function summarizeDataset(dataset) {
  const exams = dataset?.exams ?? [];
  let singleSelectQuestions = 0;
  let multipleSelectQuestions = 0;
  const topics = new Set();

  for (const exam of exams) {
    for (const question of exam.questions ?? []) {
      if (question.selectionType === 'multiple') multipleSelectQuestions += 1;
      else singleSelectQuestions += 1;
      if (question.topic) topics.add(question.topic);
    }
  }

  return {
    examCount: exams.length,
    questionCount: singleSelectQuestions + multipleSelectQuestions,
    singleSelectQuestions,
    multipleSelectQuestions,
    topicCount: topics.size,
    topics: [...topics].sort(),
  };
}
