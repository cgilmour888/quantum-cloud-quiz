import { TOPIC_GUIDANCE, getRank } from './constants.js';

export function aggregateHistoricalTopics(results) {
  const map = new Map();
  results.forEach((result) => {
    (result.topics || []).forEach((topic) => {
      const current = map.get(topic.topic) || { topic: topic.topic, correct: 0, total: 0 };
      current.correct += Number(topic.correct) || 0;
      current.total += Number(topic.total) || 0;
      map.set(topic.topic, current);
    });
  });
  return [...map.values()]
    .map((entry) => ({ ...entry, score: entry.total ? (entry.correct / entry.total) * 100 : 0 }))
    .sort((a, b) => a.score - b.score || b.total - a.total);
}

export function getWeakTopics(results, limit = 4) {
  return aggregateHistoricalTopics(results)
    .filter((topic) => topic.total >= 2 && topic.score < 80)
    .slice(0, limit)
    .map((topic) => topic.topic);
}

export function buildDashboardMetrics(results) {
  if (!results.length) {
    return {
      attempts: 0,
      averageScore: 0,
      bestScore: 0,
      questionsAnswered: 0,
      rank: getRank(0),
      trend: 0,
    };
  }
  const scores = results.map((result) => Number(result.score) || 0);
  const recent = scores.slice(-5);
  const prior = scores.slice(-10, -5);
  const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  return {
    attempts: results.length,
    averageScore: average(scores),
    bestScore: Math.max(...scores),
    questionsAnswered: results.reduce((sum, result) => sum + (Number(result.total) || 0), 0),
    rank: getRank(average(scores)),
    trend: average(recent) - average(prior),
  };
}

export function studyRecommendation(topic) {
  return TOPIC_GUIDANCE[topic] || 'Repeat missed questions and review the relevant AWS service documentation.';
}

export function formatDuration(milliseconds) {
  const seconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}
