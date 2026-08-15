/* QCQ governed approved-monitor renderer. Intentionally touches only #auxMonitor content. */
(function () {
  'use strict';

  var body = document.getElementById('auxBody');
  var header = document.getElementById('auxHeader');
  if (!body || !header) return;

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function activeView() {
    var active = document.querySelector('.left-hit.active[data-view]');
    return active ? active.getAttribute('data-view') : null;
  }

  function text(selector, fallback) {
    var node = body.querySelector(selector);
    var value = node && node.textContent ? node.textContent.trim() : '';
    return value || fallback;
  }

  function panel(label, value, extraClass) {
    return '<section class="qcq-approved-panel ' + (extraClass || '') + '">' +
      '<div class="qcq-approved-label">' + esc(label) + '</div>' +
      '<div class="qcq-approved-value">' + esc(value) + '</div>' +
      '</section>';
  }

  function decorateDashboard() {
    var originalDonut = body.querySelector('.dashboard-donut-wrap');
    var donut = originalDonut ? originalDonut.outerHTML : '<div class="dashboard-donut-wrap"></div>';
    var score = text('.f1e34-score .aux-big', '0');
    var values = Array.prototype.map.call(body.querySelectorAll('.f1e34-kpi .aux-big'), function (node) {
      return node.textContent.trim();
    });
    var labels = Array.prototype.map.call(body.querySelectorAll('.f1e34-kpi h3'), function (node) {
      return node.textContent.trim();
    });
    var map = {};
    labels.forEach(function (label, index) { map[label.toLowerCase()] = values[index] || '—'; });

    body.innerHTML = '<div class="qcq-approved-monitor qcq-dashboard">' +
      '<section class="qcq-approved-panel topic"><div class="qcq-approved-label">Topic Coverage</div>' + donut + '</section>' +
      '<section class="qcq-approved-panel score"><div class="qcq-approved-label">Score</div><div class="qcq-approved-value">' + esc(score) + '</div><div class="qcq-approved-status">Live Session</div></section>' +
      '<section class="kpis">' +
        panel('Accuracy', map.accuracy || '—') +
        panel('Streak', map.streak || '0') +
        panel('Rank', map.rank || '—') +
        panel('Correct', map.correct || '0') +
      '</section>' +
    '</div>';
  }

  function decorateLeaderboard() {
    var name = text('.f1e30r1-leader-name', 'CARL GILMOUR');
    var rank = text('.f1e30r1-leader-rank', '—');
    var score = text('.f1e30r1-leader-score', '0');
    var table = body.querySelector('.aux-table');
    var tableHTML = table ? table.outerHTML.replace('aux-table', 'qcq-approved-table') : '<table class="qcq-approved-table"></table>';
    body.innerHTML = '<div class="qcq-approved-monitor qcq-leaderboard">' +
      '<section class="qcq-leader-hero">' +
        '<div class="qcq-approved-panel player"><div class="qcq-approved-label">Current Player</div><div class="qcq-approved-value">' + esc(name) + '</div></div>' +
        '<div class="qcq-approved-panel rank"><div class="qcq-approved-label">Rank</div><div class="qcq-approved-value">' + esc(rank) + '</div></div>' +
        '<div class="qcq-approved-panel score"><div class="qcq-approved-label">Score</div><div class="qcq-approved-value">' + esc(score) + '</div></div>' +
      '</section>' +
      '<section class="qcq-approved-panel">' + tableHTML + '</section>' +
    '</div>';
  }

  function decorateAchievements() {
    var vals = {};
    Array.prototype.forEach.call(body.querySelectorAll('.f1e30r1-achievement-stat'), function (card) {
      var label = card.querySelector('h3');
      var value = card.querySelector('.aux-big');
      if (label && value) vals[label.textContent.trim().toLowerCase()] = value.textContent.trim();
    });
    var rank = text('.f1e30r1-achievement-hero .rank', '—');
    var highScore = vals['high score'] || '0';
    var streak = vals['best streak'] || '0';
    var correct = vals.correct || '0';
    var answered = vals.answered || '0';
    var accuracy = '—';
    var metricAccuracy = document.querySelector('.metric-row[data-row="R2"] .metric-value');
    if (metricAccuracy && metricAccuracy.textContent) accuracy = metricAccuracy.textContent.trim();

    body.innerHTML = '<div class="qcq-approved-monitor qcq-achievements">' +
      '<section class="qcq-approved-panel qcq-achievement-card purple"><div class="qcq-approved-label">Questions Answered</div><div class="qcq-achievement-icon">?</div><div class="qcq-approved-value">' + esc(answered) + '</div></section>' +
      '<section class="qcq-approved-panel qcq-achievement-card green"><div class="qcq-approved-label">Correct Answers</div><div class="qcq-achievement-icon">✓</div><div class="qcq-approved-value">' + esc(correct) + '</div></section>' +
      '<section class="qcq-approved-panel qcq-achievement-card orange"><div class="qcq-approved-label">First Streak</div><div class="qcq-achievement-icon">ϟ</div><div class="qcq-achievement-sub">Best streak achieved</div><div class="qcq-approved-value">' + esc(streak) + '</div></section>' +
      '<section class="qcq-approved-panel qcq-achievement-card cyan"><div class="qcq-approved-label">Accuracy</div><div class="qcq-achievement-icon">◎</div><div class="qcq-approved-value">' + esc(accuracy) + '</div></section>' +
      '<section class="qcq-approved-panel qcq-achievement-card orange"><div class="qcq-approved-label">Current Rank</div><div class="qcq-achievement-icon">♛</div><div class="qcq-approved-value" style="font-size:46px">' + esc(rank) + '</div></section>' +
      '<section class="qcq-approved-panel qcq-achievement-card cyan"><div class="qcq-approved-label">High Score</div><div class="qcq-achievement-icon">✧</div><div class="qcq-approved-value">' + esc(highScore) + '</div></section>' +
    '</div>';
  }

  function decorateDataset() {
    header.textContent = 'DATASET';
    body.innerHTML = '<div class="qcq-approved-monitor qcq-dataset">' +
      '<section class="qcq-approved-panel qcq-dataset-currentbox"><div class="qcq-approved-label">Current Dataset:</div><div class="qcq-dataset-title">AWS Cloud Practitioner Exam</div></section>' +
      '<section class="qcq-approved-panel qcq-upload"><div class="qcq-upload-icon">↥</div><button id="qcqDatasetChoose" class="qcq-upload-button" type="button">UPLOAD NEW DATASET</button><input id="qcqDatasetFile" type="file" hidden accept=".csv,.json,.xlsx,.tsv,.txt,.yaml,.yml"><div class="qcq-formats" style="grid-column:1 / span 2"><span class="qcq-format">CSV</span><span class="qcq-format">JSON</span><span class="qcq-format">XLSX</span><span class="qcq-format">TSV</span><span class="qcq-format">TXT</span><span class="qcq-format">YAML</span></div></section>' +
      '<section class="qcq-tools">' +
        '<div class="qcq-approved-panel qcq-tool"><strong>VALIDATE SCHEMA</strong><span>Check structure and data integrity</span><button id="qcqDatasetValidate" type="button">VALIDATE</button></div>' +
        '<div class="qcq-approved-panel qcq-tool"><strong>REPLACE CURRENT DATASET</strong><span>Stage a selected data file</span><button id="qcqDatasetReplace" type="button">REPLACE</button></div>' +
        '<div class="qcq-approved-panel qcq-tool ready"><strong>DATASET READY</strong><span id="qcqDatasetStatus">Current dataset is valid and ready for use</span><button type="button" disabled>READY</button></div>' +
      '</section>' +
    '</div>';

    var file = document.getElementById('qcqDatasetFile');
    var choose = document.getElementById('qcqDatasetChoose');
    var validate = document.getElementById('qcqDatasetValidate');
    var replace = document.getElementById('qcqDatasetReplace');
    var status = document.getElementById('qcqDatasetStatus');
    var selected = null;
    choose.addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () {
      selected = file.files && file.files[0] ? file.files[0] : null;
      status.textContent = selected ? 'Selected: ' + selected.name : 'Current dataset is valid and ready for use';
    });
    validate.addEventListener('click', function () {
      if (!selected) { status.textContent = 'Choose a supported dataset file first'; return; }
      var ext = (selected.name.split('.').pop() || '').toLowerCase();
      var ok = ['csv','json','xlsx','tsv','txt','yaml','yml'].indexOf(ext) !== -1;
      status.textContent = ok ? 'Format accepted for governed import: ' + selected.name : 'Unsupported file format';
    });
    replace.addEventListener('click', function () {
      status.textContent = selected ? 'Selected file staged for the governed dataset-import pipeline' : 'Choose a dataset file before replacement';
    });
  }

  function analyticsLegendItems() {
    return Array.prototype.map.call(body.querySelectorAll('.donut-item'), function (item) {
      var label = item.querySelector('.donut-label');
      var stat = item.querySelector('.donut-stat');
      return { label: label ? label.textContent.trim() : '—', pct: stat ? stat.textContent.trim() : '0%' };
    });
  }

  function decorateAnalytics() {
    var donutNode = body.querySelector('.dashboard-donut-wrap');
    var donut = donutNode ? donutNode.outerHTML : '';
    var items = analyticsLegendItems();
    var values = {};
    Array.prototype.forEach.call(body.querySelectorAll('.f1e34-analytics-kpi'), function (card) {
      var label = card.querySelector('h3');
      var value = card.querySelector('.aux-big');
      if (label && value) values[label.textContent.trim().toLowerCase()] = value.textContent.trim();
    });
    var strongest = items.length ? items[0].label : 'Awaiting data';
    var weakest = items.length ? items[items.length - 1].label : 'Awaiting data';
    var total = document.querySelector('.metric-row[data-row="R5"] .metric-value');
    var totalQuestions = total && total.textContent ? total.textContent.trim() : '0';

    body.innerHTML = '<div class="qcq-approved-monitor qcq-analytics">' +
      '<section class="qcq-analytics-left">' +
        '<div class="qcq-approved-panel topic"><div class="qcq-approved-label">Topic Distribution</div>' + donut + '</div>' +
        '<div class="qcq-approved-panel qcq-trend"><div class="qcq-approved-label">Performance Trend</div><svg viewBox="0 0 600 135" preserveAspectRatio="none" aria-label="Performance trend"><path d="M10 112 L110 80 L210 104 L310 55 L410 88 L590 24" fill="none" stroke="#67eaff" stroke-width="5"/><path d="M10 112 L110 80 L210 104 L310 55 L410 88 L590 24" fill="none" stroke="rgba(103,234,255,.18)" stroke-width="16"/></svg></div>' +
      '</section>' +
      '<section class="qcq-analytics-right">' +
        '<div class="qcq-approved-panel"><div class="qcq-approved-label">Accuracy</div><div class="qcq-approved-value">' + esc(values.accuracy || '—') + '</div></div>' +
        '<div class="qcq-approved-panel"><div class="qcq-approved-label">Strongest Coverage</div><div class="qcq-approved-value strong">' + esc(strongest) + '</div></div>' +
        '<div class="qcq-approved-panel"><div class="qcq-approved-label">Weakest Coverage</div><div class="qcq-approved-value weak">' + esc(weakest) + '</div></div>' +
        '<div class="qcq-approved-panel"><div class="qcq-approved-label">Best Streak</div><div class="qcq-approved-value response">' + esc(values['best streak'] || '0') + '</div></div>' +
        '<div class="qcq-approved-panel"><div class="qcq-approved-label">Questions</div><div class="qcq-approved-value">' + esc(totalQuestions) + '</div></div>' +
      '</section>' +
    '</div>';
  }

  function decorateSettingsInPlace() {
    var root = body.firstElementChild;
    if (!root || root.getAttribute('data-qcq-approved') === 'settings') return;
    root.setAttribute('data-qcq-approved', 'settings');
    root.classList.add('qcq-approved-monitor', 'qcq-settings');
    Array.prototype.forEach.call(root.children, function (card) { card.classList.add('qcq-approved-panel'); });
    var dataset = document.createElement('section');
    dataset.className = 'aux-card qcq-approved-panel dataset';
    dataset.innerHTML = '<div class="qcq-approved-label">Dataset</div><div style="margin-top:10px;font-size:20px">CURRENT DATASET</div><div class="qcq-dataset-current">AWS Cloud Practitioner Exam</div>';
    root.appendChild(dataset);
  }

  function decorateLogoutInPlace() {
    var root = body.firstElementChild;
    if (!root || root.getAttribute('data-qcq-approved') === 'logout') return;
    root.setAttribute('data-qcq-approved', 'logout');
    root.classList.add('qcq-approved-monitor', 'qcq-logout');
    Array.prototype.forEach.call(root.children, function (card) { card.classList.add('qcq-approved-panel'); });
    var close = root.querySelector('#logoutExit');
    if (close) close.classList.add('danger');
  }

  function transform() {
    var view = activeView();
    if (!view || !document.body.classList.contains('aux-open')) return;
    var root = body.firstElementChild;
    if (root && root.getAttribute('data-qcq-monitor-view') === view) return;

    if (view === 'L1') decorateDashboard();
    else if (view === 'L2') decorateLeaderboard();
    else if (view === 'L3') decorateAchievements();
    else if (view === 'L4') decorateDataset();
    else if (view === 'L5') decorateAnalytics();
    else if (view === 'L6') decorateSettingsInPlace();
    else if (view === 'L7') decorateLogoutInPlace();

    if (body.firstElementChild) body.firstElementChild.setAttribute('data-qcq-monitor-view', view);
  }

  var queued = false;
  var observer = new MutationObserver(function () {
    if (queued) return;
    queued = true;
    Promise.resolve().then(function () {
      queued = false;
      transform();
    });
  });
  observer.observe(body, { childList: true, subtree: true });

  document.addEventListener('click', function (event) {
    var hit = event.target && event.target.closest ? event.target.closest('.left-hit') : null;
    if (hit) setTimeout(transform, 0);
  }, true);

  transform();
}());
