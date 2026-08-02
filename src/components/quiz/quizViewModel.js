const TOPIC_LABELS = Object.freeze({
  'cloud concepts': 'Cloud Concepts',
  'security & compliance': 'Security',
  'security and compliance': 'Security',
  'technology': 'Technology',
  'billing & pricing': 'Billing',
  'billing and pricing': 'Billing',
  'networking & content delivery': 'Networking',
  'networking and content delivery': 'Networking',
  'compute': 'Compute',
  'storage': 'Storage',
  'databases': 'Databases',
  'management & governance': 'Governance',
  'management and governance': 'Governance',
});

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function formatElapsed(milliseconds = 0) {
  const totalSeconds = Math.max(0, Math.floor(finiteNumber(milliseconds) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export function formatPercentage(value = 0, fractionDigits = 1) {
  return `${finiteNumber(value).toFixed(fractionDigits)}%`;
}

export function formatExperience(summary = {}) {
  const correct = finiteNumber(summary.correct);
  const bestStreak = finiteNumber(summary.bestStreak);
  const points = Math.max(0, Math.round((correct * 100) + (bestStreak * 10)));
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(points);
}

export function compactTopicLabel(topic = '') {
  const clean = String(topic || '').trim();
  if (!clean) return 'Awaiting';
  const mapped = TOPIC_LABELS[clean.toLowerCase()];
  if (mapped) return mapped;
  const firstClause = clean.split(/[&/·:]/)[0].trim();
  return firstClause.length <= 13 ? firstClause : `${firstClause.slice(0, 12).trim()}…`;
}

export function deriveBestCategory(responses = []) {
  const categories = new Map();

  for (const response of responses) {
    const topic = String(response?.topic || 'Uncategorized');
    const current = categories.get(topic) ?? { topic, correct: 0, total: 0 };
    current.total += 1;
    if (response?.correct) current.correct += 1;
    categories.set(topic, current);
  }

  if (categories.size === 0) return 'Awaiting';

  return compactTopicLabel([...categories.values()]
    .map((category) => ({
      ...category,
      accuracy: category.total ? category.correct / category.total : 0,
    }))
    .sort((left, right) => (
      right.accuracy - left.accuracy
      || right.total - left.total
      || left.topic.localeCompare(right.topic)
    ))[0].topic);
}

export function deriveRank({ accuracy = 0, answered = 0 } = {}) {
  if (!finiteNumber(answered)) return 'Initiate';
  if (accuracy >= 90) return 'Master';
  if (accuracy >= 80) return 'Architect';
  if (accuracy >= 70) return 'Practitioner';
  if (accuracy >= 60) return 'Operator';
  return 'Apprentice';
}

export function createQuizMetrics(summary = {}) {
  const responses = summary.responses ?? [];
  const answered = finiteNumber(summary.answered);
  const accuracy = finiteNumber(summary.accuracy);

  return {
    experience: formatExperience(summary),
    accuracy: formatPercentage(accuracy, 1),
    streak: String(finiteNumber(summary.currentStreak)),
    elapsed: formatElapsed(summary.elapsedMilliseconds),
    questions: String(answered),
    attempts: String(finiteNumber(summary.attempts)),
    bestCategory: deriveBestCategory(responses),
    rank: deriveRank({ accuracy, answered }),
  };
}

export function getQuestionDensity(question = null) {
  if (!question) return 'standard';

  const promptLength = String(question.prompt ?? '').length;
  const options = question.options ?? [];
  const longestOption = options.reduce(
    (maximum, option) => Math.max(maximum, String(option?.text ?? '').length),
    0,
  );

  if (promptLength > 335 || longestOption > 175) return 'dense';
  if (promptLength > 235 || longestOption > 115) return 'compact';
  return 'standard';
}

export function getOptionState({ optionKey, selected = [], response = null } = {}) {
  const key = String(optionKey ?? '').toUpperCase();
  const selectedSet = new Set(selected.map((value) => String(value).toUpperCase()));
  const expectedSet = new Set((response?.expected ?? []).map((value) => String(value).toUpperCase()));
  const responseSelectedSet = new Set((response?.selected ?? []).map((value) => String(value).toUpperCase()));

  if (!response) return selectedSet.has(key) ? 'selected' : 'idle';
  if (expectedSet.has(key) && responseSelectedSet.has(key)) return 'correct-selected';
  if (expectedSet.has(key)) return 'correct-answer';
  if (responseSelectedSet.has(key)) return 'incorrect-selected';
  return 'disabled';
}

export function paginateOptions(options = [], page = 0, pageSize = 4) {
  const safeOptions = Array.isArray(options) ? options : [];
  const pageCount = Math.max(1, Math.ceil(safeOptions.length / pageSize));
  const safePage = Math.min(Math.max(0, Number(page) || 0), pageCount - 1);
  const start = safePage * pageSize;

  return {
    page: safePage,
    pageCount,
    start,
    visible: safeOptions.slice(start, start + pageSize),
  };
}

export function summarizeResults(results = []) {
  const valid = Array.isArray(results) ? results : [];
  const bestScore = valid.reduce((best, result) => Math.max(best, finiteNumber(result?.score)), 0);
  const bestAccuracy = valid.reduce((best, result) => Math.max(best, finiteNumber(result?.accuracy)), 0);
  const bestStreak = valid.reduce((best, result) => Math.max(best, finiteNumber(result?.bestStreak)), 0);
  const correct = valid.reduce((total, result) => total + finiteNumber(result?.correct), 0);

  return { sessions: valid.length, bestScore, bestAccuracy, bestStreak, correct };
}
