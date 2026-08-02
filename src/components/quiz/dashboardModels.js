import {
  compactTopicLabel,
  deriveRank,
  formatElapsed,
  formatPercentage,
  summarizeResults,
} from './quizViewModel.js';

function row(id, text, detail = '', action = null, state = null) {
  return { id, text, detail, action, state };
}

function combinedResults(summary, progress) {
  const completed = Array.isArray(progress?.results) ? progress.results : [];
  return summary?.status === 'completed' ? [...completed, summary] : completed;
}

function currentTopicRows(summary = {}) {
  const topics = Array.isArray(summary.topics) ? [...summary.topics] : [];
  if (topics.length === 0) {
    return [
      row('answered', 'Questions Answered', String(summary.answered ?? 0)),
      row('attempts', 'Attempts', String(summary.attempts ?? 0)),
      row('accuracy', 'Current Accuracy', formatPercentage(summary.accuracy ?? 0, 1)),
      row('time', 'Time Played', formatElapsed(summary.elapsedMilliseconds ?? 0)),
    ];
  }

  return topics
    .sort((left, right) => right.score - left.score || right.total - left.total)
    .slice(0, 4)
    .map((topic) => row(
      topic.topic,
      compactTopicLabel(topic.topic),
      `${formatPercentage(topic.score, 0)} · ${topic.total}`,
    ));
}

export function createDashboardPanel(panel, {
  summary = {},
  progress = {},
  settings = {},
  actions = {},
} = {}) {
  const results = combinedResults(summary, progress);
  const totals = summarizeResults(results);
  const currentRank = deriveRank({ accuracy: summary.accuracy ?? 0, answered: summary.answered ?? 0 });

  switch (panel) {
    case 'leaderboard':
      return {
        title: 'LOCAL LEADERBOARD',
        prompt: 'Performance stored on this device.',
        rows: [
          row('best-score', 'Best Exam Score', formatPercentage(totals.bestScore, 0)),
          row('best-accuracy', 'Best Accuracy', formatPercentage(totals.bestAccuracy, 1)),
          row('sessions', 'Exams Completed', String(totals.sessions)),
          row('rank', 'Current Rank', currentRank),
        ],
      };

    case 'achievements': {
      const answered = Number(summary.answered || 0) + results.reduce((total, item) => total + Number(item.answered || 0), 0);
      const correct = Number(summary.correct || 0) + totals.correct;
      const streak = Math.max(Number(summary.bestStreak || 0), totals.bestStreak);
      const achievements = [
        ['first-answer', 'First Answer', answered >= 1],
        ['ten-correct', 'Ten Correct Answers', correct >= 10],
        ['five-streak', 'Five-Answer Streak', streak >= 5],
        ['exam-complete', 'Complete An Exam', totals.sessions >= 1],
      ];
      return {
        title: 'ACHIEVEMENTS',
        prompt: `${achievements.filter((item) => item[2]).length} of ${achievements.length} milestones unlocked.`,
        rows: achievements.map(([id, text, unlocked]) => row(id, text, unlocked ? 'UNLOCKED' : 'LOCKED', null, unlocked ? 'complete' : 'locked')),
      };
    }

    case 'history': {
      const recent = [...results].slice(-4).reverse();
      return {
        title: 'SESSION HISTORY',
        prompt: recent.length ? 'Most recent completed examinations.' : 'No completed examinations are stored yet.',
        rows: recent.length
          ? recent.map((result, index) => row(
            result.id ?? `result-${index}`,
            result.title || `Session ${recent.length - index}`,
            `${formatPercentage(result.accuracy ?? 0, 0)} · ${formatElapsed(result.elapsedMilliseconds ?? 0)}`,
          ))
          : [row('empty', 'Complete an exam to establish history.', '')],
      };
    }

    case 'analytics':
      return {
        title: 'DETAILED ANALYTICS',
        prompt: 'Current topic performance and session efficiency.',
        rows: currentTopicRows(summary),
      };

    case 'settings':
      return {
        title: 'SETTINGS',
        prompt: 'One settings controller for the living scene.',
        rows: [
          row('thunder', 'Thunder Effects', settings.thunderEnabled === false ? 'DISABLED' : 'ENABLED', actions.toggleThunder, settings.thunderEnabled === false ? 'off' : 'on'),
          row('motion', 'Scene Motion', settings.animationsPaused ? 'PAUSED' : 'RUNNING', actions.toggleMotion, settings.animationsPaused ? 'off' : 'on'),
          row('reduced-motion', 'Reduced Motion', settings.reducedMotion ? 'ENABLED' : 'SYSTEM', actions.toggleReducedMotion, settings.reducedMotion ? 'on' : 'auto'),
          row('return', 'Return To Quiz', 'OPEN', actions.returnToQuiz),
        ],
      };

    case 'session':
      return {
        title: 'LOCAL SESSION',
        prompt: 'This build uses local training data and has no remote account.',
        rows: [
          row('return', 'Continue Training', 'RETURN', actions.returnToQuiz),
          row('restart', 'Restart Current Exam', 'RESTART', actions.restart),
          row('pause', summary.status === 'paused' ? 'Resume Session Timer' : 'Pause Session Timer', summary.status === 'paused' ? 'RESUME' : 'PAUSE', actions.togglePause),
          row('mode', 'Storage Mode', 'LOCAL DEVICE'),
        ],
      };

    default:
      return null;
  }
}
