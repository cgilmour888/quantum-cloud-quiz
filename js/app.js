import { CompositeQuestionRepository, parseUploadedJSON, parseUploadedMarkdown } from './repository.js';
import { LocalProgressRepository } from './progress-repository.js';
import { QuizEngine, buildQuestionSet } from './quiz-engine.js';
import { AudioEngine } from './audio-engine.js';
import { StormEngine } from './storm-engine.js';
import { FXEngine } from './fx-engine.js';
import { buildDashboardMetrics, aggregateHistoricalTopics, getWeakTopics, studyRecommendation, formatDuration } from './analytics.js';
import { getRank, RANKS, MASTERY_THRESHOLD } from './constants.js';
import { downloadCertificatePNG, downloadCertificateSVG, downloadProgressBackup } from './certificate.js';

const app = document.querySelector('#app');
const modalRoot = document.querySelector('#modalRoot');
const toastRoot = document.querySelector('#toastRoot');
const navAvatar = document.querySelector('#navAvatar');
const soundIcon = document.querySelector('#soundIcon');
const pauseButton = document.querySelector('[data-action="pause"]');

const audio = new AudioEngine();
const storm = new StormEngine(document.querySelector('#stormCanvas'), audio);
const fx = new FXEngine(document.querySelector('#fxCanvas'));
const questionRepository = new CompositeQuestionRepository();
const progressRepository = new LocalProgressRepository();

const state = {
  exams: [],
  profile: null,
  results: [],
  missed: [],
  settings: null,
  customBanks: [],
  mode: 'original',
  selectedExamId: '1',
  questionCount: '50',
  poolIds: [],
  engine: null,
  selectedAnswers: new Set(),
  answerLocked: false,
  latestResult: null,
  paused: false,
  lastConfig: null,
  profileDraft: null,
};

function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatScore(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function avatarContent(profile = state.profile) {
  if (profile?.avatarMode === 'image' && profile.avatarImage) {
    return `<img src="${escapeHTML(profile.avatarImage)}" alt="">`;
  }
  return escapeHTML(profile?.avatarSymbol || '⚛');
}

function updateChrome() {
  navAvatar.innerHTML = avatarContent();
  soundIcon.textContent = state.settings?.soundEnabled ? '♫' : '♩';
  document.querySelector('[data-action="sound"]')?.classList.toggle('is-active', Boolean(state.settings?.soundEnabled));
  pauseButton.disabled = !state.engine;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  toast.textContent = message;
  toastRoot.append(toast);
  setTimeout(() => toast.remove(), 4200);
}

function closeModal() {
  modalRoot.innerHTML = '';
}

function setPause(paused) {
  if (!state.engine) return;
  state.paused = paused;
  if (paused) state.engine.pause();
  else state.engine.resume();
  document.querySelector('#pauseScreen')?.remove();
  if (paused) {
    const overlay = document.createElement('div');
    overlay.className = 'pause-screen';
    overlay.id = 'pauseScreen';
    overlay.innerHTML = `
      <div class="pause-card">
        <div class="eyebrow">Session suspended</div>
        <h2>Laboratory paused</h2>
        <p class="lede">Your timer and exam state are preserved locally. Resume when ready.</p>
        <button class="primary-button" type="button" data-pause-resume>Resume examination</button>
      </div>`;
    overlay.querySelector('[data-pause-resume]').addEventListener('click', () => setPause(false));
    document.body.append(overlay);
  }
  const label = pauseButton.querySelector('.button-label');
  if (label) label.textContent = paused ? 'Resume' : 'Pause';
}

function metricCard(label, value, note) {
  return `<article class="metric-card"><div class="metric-label">${escapeHTML(label)}</div><div class="metric-value">${escapeHTML(value)}</div><div class="metric-note">${escapeHTML(note)}</div></article>`;
}

function renderDashboard() {
  state.engine = null;
  state.paused = false;
  document.querySelector('#pauseScreen')?.remove();
  pauseButton.disabled = true;
  storm.setQuizState({ correct: 0, answered: 0, total: 50 });
  storm.targetCharge = Math.max(0.08, Math.min(0.32, buildDashboardMetrics(state.results).averageScore / 400));

  const metrics = buildDashboardMetrics(state.results);
  const builtInExams = state.exams.filter((exam) => !exam.custom);
  const recent = [...state.results].slice(-5).reverse();
  const currentRank = getRank(metrics.averageScore);
  const profileName = state.profile.name?.trim() || 'Cloud Scholar';
  const modes = [
    ['original', 'Original', 'Tests 1–23 intact'],
    ['mixed', 'Mixed', 'Aggregate any exams'],
    ['missed', 'Recovery', 'Previously missed'],
    ['weak', 'Adaptive', 'Weak-topic drill'],
  ];

  app.innerHTML = `
    <div class="app-container">
      <section class="hero">
        <div class="eyebrow">Static-first · adaptive AWS practice environment</div>
        <h1>Welcome, <span class="neon-text">${escapeHTML(profileName)}</span>.</h1>
        <p class="lede">Choose an original practice exam, synthesize a mixed challenge from all ${state.exams.reduce((sum, exam) => sum + exam.questionCount, 0).toLocaleString()} questions, or let the laboratory target the subjects that need reinforcement.</p>
        <div class="hero-actions">
          <button class="primary-button" type="button" data-scroll-lab>Enter examination laboratory</button>
          <button class="secondary-button" type="button" data-open-profile>Configure profile & avatar</button>
        </div>
      </section>

      <section class="metrics-grid" aria-label="Learning metrics">
        ${metricCard('Attempts', String(metrics.attempts), 'Completed examination sessions')}
        ${metricCard('Average', formatScore(metrics.averageScore), `${metrics.trend >= 0 ? '+' : ''}${metrics.trend.toFixed(1)} recent trend`)}
        ${metricCard('Best score', formatScore(metrics.bestScore), 'Certificate unlocks at 90%')}
        ${metricCard('Questions', metrics.questionsAnswered.toLocaleString(), `${state.missed.length} currently marked missed`)}
      </section>

      <section class="dashboard-grid" id="examLab">
        <div class="glass-panel">
          <div class="panel-heading">
            <div>
              <div class="eyebrow">Mission configuration</div>
              <h2>Construct your practice session</h2>
              <p>The 23 source exams remain untouched. Mixed modes create temporary sessions without altering the originals.</p>
            </div>
          </div>

          <div class="mode-tabs" role="tablist" aria-label="Exam mode">
            ${modes.map(([id, title, note]) => `
              <button class="mode-tab ${state.mode === id ? 'is-active' : ''}" type="button" data-mode="${id}">
                <strong>${title}</strong><small>${note}</small>
              </button>`).join('')}
          </div>

          ${state.mode === 'original' ? `
            <div class="form-grid">
              <label class="field"><span>Choose practice exam</span>
                <select id="examSelect">
                  ${state.exams.map((exam) => `<option value="${escapeHTML(exam.id)}" ${String(exam.id) === String(state.selectedExamId) ? 'selected' : ''}>${escapeHTML(exam.title)} · ${exam.questionCount} questions${exam.custom ? ' · uploaded' : ''}</option>`).join('')}
                </select>
              </label>
              <div class="field"><span>Scoring</span><div class="privacy-note">The chosen exam is weighted to 100%. Test 12 therefore scores correct ÷ 42 × 100.</div></div>
            </div>` : `
            <div class="form-grid">
              <label class="field"><span>Session length</span>
                <select id="questionCount">
                  ${['10','25','50','100','all'].map((count) => `<option value="${count}" ${state.questionCount === count ? 'selected' : ''}>${count === 'all' ? 'All available questions' : `${count} questions`}</option>`).join('')}
                </select>
              </label>
              <div class="field"><span>Source pool</span><div class="privacy-note">Choose any combination of the original and uploaded exam banks.</div></div>
            </div>
            <div class="pool-grid" aria-label="Exam source pool">
              ${state.exams.map((exam) => `
                <div class="pool-chip"><input id="pool-${escapeHTML(exam.id)}" type="checkbox" value="${escapeHTML(exam.id)}" ${state.poolIds.map(String).includes(String(exam.id)) ? 'checked' : ''}><label for="pool-${escapeHTML(exam.id)}">${exam.custom ? 'U' : exam.id}</label></div>`).join('')}
            </div>`}

          <div class="inline-settings">
            <label class="check-row"><input id="shuffleQuestions" type="checkbox" ${state.settings.shuffleQuestions ? 'checked' : ''}> Randomize question order</label>
            <label class="check-row"><input id="shuffleOptions" type="checkbox" ${state.settings.shuffleOptions ? 'checked' : ''}> Randomize answer order</label>
            <label class="check-row"><input id="soundSetting" type="checkbox" ${state.settings.soundEnabled ? 'checked' : ''}> Cinematic thunder audio</label>
          </div>

          <div class="start-row">
            <p>${builtInExams.length} original banks · ${state.customBanks.length} uploaded banks · local personal storage</p>
            <button class="primary-button" type="button" id="startExam">Initialize examination</button>
          </div>
        </div>

        <aside class="glass-panel">
          <div class="eyebrow">Current standing</div>
          <div class="rank-orb"><div><strong>${escapeHTML(currentRank.label)}</strong><small>${formatScore(metrics.averageScore)}</small></div></div>
          <div class="rank-scale">
            ${RANKS.map((rank) => `<div class="rank-row"><span>${rank.label}</span><div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, Math.max(5, rank.minimum))}%"></div></div><b>${rank.minimum}+</b></div>`).join('')}
          </div>
          <h3 style="margin-top:28px">Recent missions</h3>
          <div class="recent-list">
            ${recent.length ? recent.map((result) => `<div class="recent-item"><div><strong>${escapeHTML(result.title)}</strong><small>${formatDate(result.completedAt)} · ${result.correct}/${result.total}</small></div><div class="score-badge">${Number(result.score).toFixed(1)}%</div></div>`).join('') : '<div class="empty-state">Complete your first practice exam to activate adaptive metrics.</div>'}
          </div>
        </aside>
      </section>
    </div>`;

  updateChrome();
}

function currentResponse() {
  const question = state.engine?.current;
  return question ? state.engine.responses.find((response) => response.questionId === question.id) : null;
}

function renderQuiz() {
  const engine = state.engine;
  const question = engine.current;
  const response = currentResponse();
  const rank = getRank(engine.score);
  const selected = state.selectedAnswers;
  const progressPercent = ((engine.index + (response ? 1 : 0)) / engine.total) * 100;

  app.innerHTML = `
    <div class="quiz-stage">
      <div class="quiz-hud">
        <div class="hud-chip"><small>Exam</small><strong>${escapeHTML(engine.title)}</strong></div>
        <div class="hud-chip"><small>Question</small><strong>${engine.index + 1} / ${engine.total}</strong></div>
        <div class="hud-chip"><small>Live score</small><strong>${engine.answered ? formatScore(engine.score) : '—'}</strong></div>
        <div class="hud-chip"><small>Rank signal</small><strong>${escapeHTML(rank.label)}</strong></div>
      </div>

      <article class="tablet-frame" aria-labelledby="questionHeading">
        <div class="tablet-topline">
          <span>${escapeHTML(question.topic)}</span>
          <div class="question-progress" aria-label="Exam progress"><span style="width:${progressPercent}%"></span></div>
        </div>
        <h2 id="questionHeading" class="question-copy">${escapeHTML(question.prompt)}</h2>
        <div class="choice-list" role="group" aria-label="Answer choices">
          ${question.options.map((option) => {
            const isSelected = selected.has(option.key);
            const isCorrect = response?.expected.includes(option.key);
            const isWrong = response && response.selected.includes(option.key) && !isCorrect;
            const classes = ['choice-button', isSelected ? 'is-selected' : '', response && isCorrect ? 'is-correct' : '', isWrong ? 'is-wrong' : ''].filter(Boolean).join(' ');
            return `<button class="${classes}" type="button" data-answer="${option.key}" ${response ? 'disabled' : ''}><span class="choice-key">${option.key}</span><span>${escapeHTML(option.text)}</span></button>`;
          }).join('')}
        </div>

        ${response ? `
          <div class="feedback-panel ${response.correct ? 'correct' : 'wrong'}">
            <strong>${response.correct ? 'Correct — storm charge increased.' : `Incorrect — correct answer: ${response.expected.join(', ')}.`}</strong>
            <p>${escapeHTML(question.explanation || (response.correct ? 'The selected response matches the source answer key.' : 'Review the service distinction represented by the correct choice.'))}</p>
            ${question.references?.length ? `<div class="reference-list">${question.references.slice(0, 3).map((url, index) => `<a href="${escapeHTML(url)}" target="_blank" rel="noreferrer">Reference ${index + 1}</a>`).join('')}</div>` : ''}
          </div>` : ''}

        <div class="tablet-actions">
          <span class="selection-help">${question.selectionType === 'multiple' ? `Select exactly ${question.selectionCount} answers.` : 'Select one answer, then submit.'}</span>
          ${response
            ? `<button class="primary-button" type="button" id="nextQuestion">${engine.index === engine.total - 1 ? 'Complete exam' : 'Next question'}</button>`
            : `<button class="primary-button" type="button" id="submitAnswer" ${selected.size ? '' : 'disabled'}>Lock answer</button>`}
        </div>
      </article>
    </div>`;
  updateChrome();
  pauseButton.disabled = false;
}

function selectAnswer(key, element) {
  if (!state.engine || currentResponse()) return;
  const question = state.engine.current;
  if (question.selectionType === 'single') {
    state.selectedAnswers.clear();
    state.selectedAnswers.add(key);
  } else if (state.selectedAnswers.has(key)) {
    state.selectedAnswers.delete(key);
  } else if (state.selectedAnswers.size < question.selectionCount) {
    state.selectedAnswers.add(key);
  } else {
    showToast(`Select exactly ${question.selectionCount} answers.`, 'error');
    return;
  }
  const rect = element.getBoundingClientRect();
  fx.ripple(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.35);
  renderQuiz();
}

function submitAnswer() {
  const question = state.engine.current;
  if (state.selectedAnswers.size !== question.selectionCount) {
    showToast(`This question requires ${question.selectionCount} selection${question.selectionCount === 1 ? '' : 's'}.`, 'error');
    return;
  }
  const response = state.engine.submit([...state.selectedAnswers]);
  storm.setQuizState({ correct: state.engine.correctCount, answered: state.engine.answered, total: state.engine.total });
  if (response.correct) {
    storm.rewardCorrect();
    audio.clickPulse(true);
  } else {
    storm.penalizeIncorrect();
    audio.clickPulse(false);
  }
  renderQuiz();
}

async function finishQuiz() {
  const engine = state.engine;
  if (!engine.finishedAt) engine.finishedAt = Date.now();
  const result = engine.summary();
  state.latestResult = result;
  state.results = [...state.results, result].slice(-250);
  const missed = new Set(state.missed);
  result.responses.forEach((response) => response.correct ? missed.delete(response.questionId) : missed.add(response.questionId));
  state.missed = [...missed];
  await Promise.all([
    progressRepository.saveResults(state.results),
    progressRepository.saveMissed(state.missed),
  ]);
  state.engine = null;
  pauseButton.disabled = true;
  app.innerHTML = `<div class="finale-overlay"><div class="finale-message"><div class="eyebrow">Examination complete</div><h2>Nimbus mastery sequence</h2><p>Final score remains sealed until the storm resolves.</p></div></div>`;
  storm.finale(result.score, () => renderResults(result));
}

function renderResults(result) {
  const rank = getRank(result.score);
  const weak = result.topics.filter((topic) => topic.score < 80).slice(0, 5);
  storm.setQuizState({ correct: result.correct, answered: result.total, total: result.total });
  app.innerHTML = `
    <div class="app-container">
      <section class="results-header">
        <div class="eyebrow">Mission analysis complete</div>
        <div class="result-score neon-text">${Number(result.score).toFixed(2)}%</div>
        <div class="result-rank">${escapeHTML(rank.label)}</div>
        <p class="lede" style="margin-inline:auto">${result.correct} of ${result.total} questions answered accurately in ${formatDuration(result.elapsedMilliseconds)}.</p>
      </section>

      <section class="metrics-grid">
        ${metricCard('Correct', String(result.correct), `${result.total - result.correct} require review`)}
        ${metricCard('Rank', rank.label, rank.description)}
        ${metricCard('Duration', formatDuration(result.elapsedMilliseconds), `${Math.round(result.elapsedMilliseconds / result.total / 1000)} sec average`)}
        ${metricCard('Question bank', result.mode === 'original' ? 'Original' : 'Synthesized', result.title)}
      </section>

      <section class="dashboard-grid">
        <div class="glass-panel">
          <div class="eyebrow">AWS ecosystem diagnostics</div>
          <h2>Topic performance</h2>
          <div class="topic-grid">
            ${result.topics.map((topic) => `<div class="topic-row"><div><strong>${escapeHTML(topic.topic)}</strong><small>${topic.correct} of ${topic.total} correct</small></div><div class="progress-track"><div class="progress-fill" style="width:${topic.score}%"></div></div><div class="topic-score">${topic.score.toFixed(0)}%</div></div>`).join('')}
          </div>
        </div>
        <aside class="glass-panel">
          <div class="eyebrow">Adaptive study path</div>
          <h2>Recommended focus</h2>
          <div class="study-list">
            ${weak.length ? weak.map((topic) => `<div class="study-item"><strong>${escapeHTML(topic.topic)} · ${topic.score.toFixed(0)}%</strong><p>${escapeHTML(studyRecommendation(topic.topic))}</p></div>`).join('') : '<div class="study-item"><strong>Balanced mastery</strong><p>No topic in this session fell below 80%. Continue with mixed and adaptive drills.</p></div>'}
          </div>
          <div class="certificate-callout ${result.score < MASTERY_THRESHOLD ? 'locked' : ''}">
            <strong>${result.score >= MASTERY_THRESHOLD ? 'Certificate of Mastery unlocked' : `Mastery certificate locked · ${MASTERY_THRESHOLD}% required`}</strong>
            <p>${result.score >= MASTERY_THRESHOLD ? 'Download a personalized high-resolution PNG or scalable SVG certificate.' : `Increase the score by ${(MASTERY_THRESHOLD - result.score).toFixed(2)} percentage points to unlock.`}</p>
          </div>
        </aside>
      </section>

      <div class="results-actions">
        <button class="primary-button" type="button" data-result-action="dashboard">Return to dashboard</button>
        <button class="secondary-button" type="button" data-result-action="retry">Retake configuration</button>
        <button class="secondary-button" type="button" data-result-action="missed">Review missed questions</button>
        <button class="ghost-button" type="button" data-result-action="scores">Open full metrics</button>
        <button class="ghost-button" type="button" data-result-action="png" ${result.score < MASTERY_THRESHOLD ? 'disabled' : ''}>Download certificate PNG</button>
        <button class="ghost-button" type="button" data-result-action="svg" ${result.score < MASTERY_THRESHOLD ? 'disabled' : ''}>Download certificate SVG</button>
      </div>
    </div>`;
  updateChrome();
}

async function startConfiguredExam() {
  try {
    await audio.unlock();
    audio.setEnabled(state.settings.soundEnabled);
    const weakTopics = getWeakTopics(state.results, 5);
    const built = buildQuestionSet({
      exams: state.exams,
      mode: state.mode,
      selectedExamId: state.selectedExamId,
      poolIds: state.poolIds,
      questionCount: state.questionCount,
      missedIds: state.missed,
      historicalWeakTopics: weakTopics,
    });
    state.lastConfig = {
      mode: state.mode,
      selectedExamId: state.selectedExamId,
      poolIds: [...state.poolIds],
      questionCount: state.questionCount,
    };
    state.engine = new QuizEngine({
      questions: built.questions,
      title: built.title,
      mode: state.mode,
      shuffleQuestions: state.mode === 'original' ? false : state.settings.shuffleQuestions,
      shuffleOptions: state.settings.shuffleOptions,
    });
    state.selectedAnswers = new Set();
    state.answerLocked = false;
    storm.targetCharge = 0.08;
    storm.setQuizState({ correct: 0, answered: 0, total: state.engine.total });
    renderQuiz();
    scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    showToast(error.message || 'Unable to start the selected exam.', 'error');
  }
}

function renderProfileModal() {
  state.profileDraft = { ...state.profile };
  modalRoot.innerHTML = `
    <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="profileTitle">
      <div class="modal-header"><div><div class="eyebrow">Local learner identity</div><h2 id="profileTitle">Profile & avatar</h2></div><button class="modal-close" type="button" data-close-modal aria-label="Close">×</button></div>
      <div class="avatar-editor">
        <div>
          <div class="avatar-preview" id="avatarPreview">${avatarContent(state.profileDraft)}</div>
          <p class="privacy-note" style="margin-top:14px">Your name, email, avatar, scores, and history remain in this browser unless a future backend is deliberately connected.</p>
        </div>
        <div class="form-grid" style="grid-template-columns:1fr">
          <label class="field"><span>Name displayed on certificates</span><input id="profileName" value="${escapeHTML(state.profileDraft.name || '')}" autocomplete="name" placeholder="Your name"></label>
          <label class="field"><span>Email address</span><input id="profileEmail" type="email" value="${escapeHTML(state.profileDraft.email || '')}" autocomplete="email" placeholder="name@example.com"></label>
          <div class="field"><span>Generated avatar symbol</span><div class="avatar-symbols">${['⚛','☁','✦','⬡','⟁','⟡'].map((symbol) => `<button class="avatar-symbol ${state.profileDraft.avatarSymbol === symbol ? 'is-active' : ''}" type="button" data-avatar-symbol="${symbol}">${symbol}</button>`).join('')}</div></div>
          <div class="field"><span>Neon accent</span><div class="accent-options">${['aqua','purple','emerald','platinum'].map((accent) => `<button class="accent-option ${state.profileDraft.avatarAccent === accent ? 'is-active' : ''}" type="button" data-avatar-accent="${accent}">${accent}</button>`).join('')}</div></div>
          <label class="field"><span>Optional portrait image</span><input id="avatarImageInput" type="file" accept="image/*"></label>
          <div style="display:flex;flex-wrap:wrap;gap:9px"><button class="primary-button" type="button" data-save-profile>Save profile</button><button class="ghost-button" type="button" data-use-generated>Use generated avatar</button></div>
        </div>
      </div>
    </section>`;
}

function renderUploadModal() {
  modalRoot.innerHTML = `
    <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="uploadTitle">
      <div class="modal-header"><div><div class="eyebrow">Expandable content architecture</div><h2 id="uploadTitle">Upload exams or restore progress</h2><p class="lede">Accepts the Markdown answer-key structure used by the 23 source exams, normalized JSON exam banks, or a Quantum Cloud progress backup.</p></div><button class="modal-close" type="button" data-close-modal aria-label="Close">×</button></div>
      <div class="drop-zone"><input id="examUpload" type="file" multiple accept=".md,.json,text/markdown,application/json"><p>Choose one or more .md or .json files. Uploaded banks are stored locally and become available in original and mixed modes.</p></div>
      <div class="upload-results" id="uploadResults"></div>
      <div style="display:flex;flex-wrap:wrap;gap:9px;margin-top:16px"><button class="secondary-button" type="button" data-download-backup>Download progress backup</button></div>
      <h3 style="margin-top:28px">Uploaded question banks</h3>
      <div class="custom-bank-list">${state.customBanks.length ? state.customBanks.map((bank) => `<div class="custom-bank"><div><strong>${escapeHTML(bank.title)}</strong><small>${bank.questionCount} questions · ${escapeHTML(bank.sourceFile || 'local JSON')}</small></div><button class="danger-button" type="button" data-delete-bank="${escapeHTML(bank.id)}">Remove</button></div>`).join('') : '<div class="empty-state">No custom banks have been uploaded.</div>'}</div>
    </section>`;
}

function renderScoresModal() {
  const metrics = buildDashboardMetrics(state.results);
  const topics = aggregateHistoricalTopics(state.results);
  const history = [...state.results].reverse();
  modalRoot.innerHTML = `
    <section class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="scoresTitle">
      <div class="modal-header"><div><div class="eyebrow">Longitudinal analytics</div><h2 id="scoresTitle">Scores, progress & mastery</h2></div><button class="modal-close" type="button" data-close-modal aria-label="Close">×</button></div>
      <div class="metrics-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">
        ${metricCard('Average', formatScore(metrics.averageScore), getRank(metrics.averageScore).label)}
        ${metricCard('Best', formatScore(metrics.bestScore), `${metrics.attempts} completed attempts`)}
      </div>
      <h3>Historical AWS topic performance</h3>
      <div class="topic-grid">${topics.length ? topics.map((topic) => `<div class="topic-row"><div><strong>${escapeHTML(topic.topic)}</strong><small>${topic.correct}/${topic.total} correct</small></div><div class="progress-track"><div class="progress-fill" style="width:${topic.score}%"></div></div><div class="topic-score">${topic.score.toFixed(0)}%</div></div>`).join('') : '<div class="empty-state">No topic metrics are available yet.</div>'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:9px;margin:22px 0"><button class="secondary-button" type="button" data-download-backup>Download progress backup</button></div>
      <h3>Attempt history</h3>
      <div style="overflow:auto"><table class="history-table"><thead><tr><th>Exam</th><th>Date</th><th>Score</th><th>Rank</th><th>Certificate</th></tr></thead><tbody>${history.length ? history.map((result) => `<tr><td>${escapeHTML(result.title)}</td><td>${formatDate(result.completedAt)}</td><td>${formatScore(result.score)}</td><td>${escapeHTML(getRank(result.score).label)}</td><td>${result.score >= MASTERY_THRESHOLD ? `<button class="ghost-button" type="button" data-history-certificate="${result.id}">PNG</button>` : '—'}</td></tr>`).join('') : '<tr><td colspan="5">No completed attempts.</td></tr>'}</tbody></table></div>
    </section>`;
}

function previewProfileDraft() {
  const preview = document.querySelector('#avatarPreview');
  if (preview) preview.innerHTML = avatarContent(state.profileDraft);
}

async function resizeImage(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const image = new Image();
  await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = dataUrl; });
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const sourceSize = Math.min(image.width, image.height);
  const sx = (image.width - sourceSize) / 2;
  const sy = (image.height - sourceSize) / 2;
  ctx.drawImage(image, sx, sy, sourceSize, sourceSize, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.86);
}

async function refreshExams() {
  questionRepository.staticRepository.payload = null;
  state.customBanks = questionRepository.customRepository.getExams();
  state.exams = await questionRepository.getExams();
  if (!state.poolIds.length) state.poolIds = state.exams.map((exam) => String(exam.id));
}

async function handleFiles(files) {
  const status = document.querySelector('#uploadResults');
  const messages = [];
  for (const file of files) {
    try {
      const text = await file.text();
      if (file.name.toLowerCase().endsWith('.json')) {
        const parsed = JSON.parse(text);
        if (parsed.format === 'quantum-cloud-quiz-backup-v1' || (parsed.profile && parsed.results && parsed.exportedAt)) {
          state.profile = parsed.profile || state.profile;
          state.results = Array.isArray(parsed.results) ? parsed.results : [];
          state.missed = Array.isArray(parsed.missed) ? parsed.missed : [];
          state.settings = { ...state.settings, ...(parsed.settings || {}) };
          state.customBanks = Array.isArray(parsed.customBanks) ? parsed.customBanks : [];
          await Promise.all([
            progressRepository.saveProfile(state.profile),
            progressRepository.saveResults(state.results),
            progressRepository.saveMissed(state.missed),
            progressRepository.saveSettings(state.settings),
            progressRepository.saveCustomBanks(state.customBanks),
          ]);
          messages.push(`${file.name}: progress backup restored.`);
          continue;
        }
      }
      const banks = file.name.toLowerCase().endsWith('.json') ? parseUploadedJSON(text, file.name) : parseUploadedMarkdown(text, file.name);
      banks.forEach((bank) => questionRepository.saveCustomExam(bank));
      messages.push(`${file.name}: ${banks.reduce((sum, bank) => sum + bank.questionCount, 0)} questions imported.`);
    } catch (error) {
      messages.push(`${file.name}: ${error.message}`);
    }
  }
  await refreshExams();
  updateChrome();
  if (status) status.innerHTML = messages.map((message) => `<div class="privacy-note" style="margin-top:7px">${escapeHTML(message)}</div>`).join('');
  showToast('Upload processing complete.');
}

async function saveSettingsFromDashboard() {
  state.settings = {
    ...state.settings,
    shuffleQuestions: Boolean(document.querySelector('#shuffleQuestions')?.checked),
    shuffleOptions: Boolean(document.querySelector('#shuffleOptions')?.checked),
    soundEnabled: Boolean(document.querySelector('#soundSetting')?.checked),
  };
  audio.setEnabled(state.settings.soundEnabled);
  await progressRepository.saveSettings(state.settings);
  updateChrome();
}

// Global chrome actions.
document.querySelector('.topbar').addEventListener('click', async (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  if (action === 'dashboard') {
    if (state.engine && !confirm('Leave the active exam? Current answers in this unfinished session will be discarded.')) return;
    renderDashboard();
  }
  if (action === 'pause') setPause(!state.paused);
  if (action === 'upload') renderUploadModal();
  if (action === 'scores') renderScoresModal();
  if (action === 'profile') renderProfileModal();
  if (action === 'sound') {
    state.settings.soundEnabled = !state.settings.soundEnabled;
    await audio.unlock();
    audio.setEnabled(state.settings.soundEnabled);
    await progressRepository.saveSettings(state.settings);
    updateChrome();
    showToast(`Cinematic sound ${state.settings.soundEnabled ? 'enabled' : 'disabled'}.`);
  }
});

app.addEventListener('click', async (event) => {
  const mode = event.target.closest('[data-mode]')?.dataset.mode;
  if (mode) {
    state.mode = mode;
    renderDashboard();
    document.querySelector('#examLab')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (event.target.closest('[data-scroll-lab]')) document.querySelector('#examLab')?.scrollIntoView({ behavior: 'smooth' });
  if (event.target.closest('[data-open-profile]')) renderProfileModal();
  if (event.target.closest('#startExam')) {
    await saveSettingsFromDashboard();
    await startConfiguredExam();
  }
  const answerButton = event.target.closest('[data-answer]');
  if (answerButton) selectAnswer(answerButton.dataset.answer, answerButton);
  if (event.target.closest('#submitAnswer')) submitAnswer();
  if (event.target.closest('#nextQuestion')) {
    state.selectedAnswers = new Set();
    if (state.engine.next()) renderQuiz();
    else await finishQuiz();
  }
  const resultAction = event.target.closest('[data-result-action]')?.dataset.resultAction;
  if (resultAction === 'dashboard') renderDashboard();
  if (resultAction === 'scores') renderScoresModal();
  if (resultAction === 'retry') {
    if (state.lastConfig) Object.assign(state, state.lastConfig);
    renderDashboard();
    setTimeout(() => document.querySelector('#examLab')?.scrollIntoView({ behavior: 'smooth' }), 60);
  }
  if (resultAction === 'missed') {
    state.mode = 'missed';
    state.questionCount = String(Math.min(50, state.missed.length || 50));
    renderDashboard();
    setTimeout(() => document.querySelector('#examLab')?.scrollIntoView({ behavior: 'smooth' }), 60);
  }
  if (resultAction === 'png' && state.latestResult) await downloadCertificatePNG(state.profile, state.latestResult);
  if (resultAction === 'svg' && state.latestResult) downloadCertificateSVG(state.profile, state.latestResult);
});

app.addEventListener('change', async (event) => {
  if (event.target.id === 'examSelect') state.selectedExamId = event.target.value;
  if (event.target.id === 'questionCount') state.questionCount = event.target.value;
  if (event.target.matches('.pool-chip input')) {
    state.poolIds = [...document.querySelectorAll('.pool-chip input:checked')].map((input) => input.value);
  }
  if (['shuffleQuestions','shuffleOptions','soundSetting'].includes(event.target.id)) await saveSettingsFromDashboard();
});

modalRoot.addEventListener('click', async (event) => {
  if (event.target === modalRoot || event.target.closest('[data-close-modal]')) closeModal();
  const symbol = event.target.closest('[data-avatar-symbol]')?.dataset.avatarSymbol;
  if (symbol) {
    state.profileDraft.avatarMode = 'generated';
    state.profileDraft.avatarSymbol = symbol;
    state.profileDraft.avatarImage = '';
    renderProfileModal();
  }
  const accent = event.target.closest('[data-avatar-accent]')?.dataset.avatarAccent;
  if (accent) {
    state.profileDraft.avatarAccent = accent;
    renderProfileModal();
  }
  if (event.target.closest('[data-use-generated]')) {
    state.profileDraft.avatarMode = 'generated';
    state.profileDraft.avatarImage = '';
    previewProfileDraft();
  }
  if (event.target.closest('[data-save-profile]')) {
    state.profileDraft.name = document.querySelector('#profileName')?.value.trim() || '';
    state.profileDraft.email = document.querySelector('#profileEmail')?.value.trim() || '';
    state.profile = { ...state.profileDraft };
    await progressRepository.saveProfile(state.profile);
    updateChrome();
    closeModal();
    showToast('Profile saved locally.');
    if (!state.engine) renderDashboard();
  }
  if (event.target.closest('[data-download-backup]')) {
    downloadProgressBackup({ profile: state.profile, results: state.results, missed: state.missed, customBanks: state.customBanks, settings: state.settings });
  }
  const bankId = event.target.closest('[data-delete-bank]')?.dataset.deleteBank;
  if (bankId) {
    questionRepository.customRepository.deleteExam(bankId);
    await refreshExams();
    renderUploadModal();
  }
  const resultId = event.target.closest('[data-history-certificate]')?.dataset.historyCertificate;
  if (resultId) {
    const result = state.results.find((candidate) => candidate.id === resultId);
    if (result) await downloadCertificatePNG(state.profile, result);
  }
});

modalRoot.addEventListener('change', async (event) => {
  if (event.target.id === 'avatarImageInput' && event.target.files?.[0]) {
    try {
      state.profileDraft.avatarImage = await resizeImage(event.target.files[0]);
      state.profileDraft.avatarMode = 'image';
      previewProfileDraft();
    } catch (error) {
      showToast('Unable to prepare that avatar image.', 'error');
    }
  }
  if (event.target.id === 'examUpload' && event.target.files?.length) await handleFiles([...event.target.files]);
});

async function initialize() {
  try {
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
    const snapshot = await progressRepository.getSnapshot();
    Object.assign(state, snapshot);
    audio.setEnabled(state.settings.soundEnabled);
    await refreshExams();
    state.poolIds = state.exams.map((exam) => String(exam.id));
    renderDashboard();
  } catch (error) {
    app.innerHTML = `<div class="app-container"><section class="hero"><div class="glass-panel"><h1>Unable to initialize the laboratory</h1><p class="lede">${escapeHTML(error.message)}</p><p>Run this folder through a local static server instead of opening index.html directly. Example: <code>python3 -m http.server 8080</code></p></div></section></div>`;
  }
}

initialize();
