/**
 * Artifact ID: QCQ-TBL-027
 * Artifact Name: MetricsPanel
 * Repository Path: QCQ/frontend/src/metrics/MetricsPanel.tsx
 */

import { useSyncExternalStore } from 'react';

import { MetricTile } from './MetricTile';
import { MetricsStore, type MetricsSnapshot } from './MetricsStore';
import { ProgressTracker } from './ProgressTracker';

export interface MetricsPanelProps {
  readonly metrics?: MetricsSnapshot | undefined;
  readonly store?: MetricsStore | undefined;
  readonly title?: string | undefined;
  readonly className?: string | undefined;
  readonly compact?: boolean | undefined;
  readonly maximumTopics?: number | undefined;
}

const styles = `
  .qcq-metrics-panel {
    position: relative;
    isolation: isolate;
    display: grid;
    gap: clamp(0.72rem, 1.4cqi, 1rem);
    min-width: 0;
    padding: clamp(0.85rem, 1.8cqi, 1.35rem);
    overflow: hidden;
    border: 1px solid rgb(169 112 255 / 34%);
    border-radius: 1rem;
    color: #f7fbff;
    background:
      radial-gradient(circle at 100% 0, rgb(117 61 195 / 18%), transparent 42%),
      radial-gradient(circle at 0 100%, rgb(32 221 255 / 10%), transparent 40%),
      linear-gradient(180deg, rgb(5 12 29 / 94%), rgb(1 4 13 / 97%));
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 9%),
      inset 0 0 2rem rgb(76 42 139 / 9%),
      0 1rem 2.4rem rgb(0 0 0 / 32%);
    container-type: inline-size;
  }

  .qcq-metrics-panel::before {
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      repeating-linear-gradient(90deg, transparent 0 2.8rem, rgb(32 221 255 / 2%) 2.85rem 2.9rem),
      repeating-linear-gradient(0deg, transparent 0 2rem, rgb(169 112 255 / 2%) 2.05rem 2.1rem);
    content: "";
    pointer-events: none;
  }

  .qcq-metrics-panel__header {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem 1rem;
    align-items: baseline;
    justify-content: space-between;
    min-width: 0;
  }
  .qcq-metrics-panel__title {
    margin: 0;
    font-family: "Arial Black", Inter, system-ui, sans-serif;
    font-size: clamp(0.94rem, 2.1cqi, 1.25rem);
    font-weight: 950;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-shadow: 0 0 0.9rem rgb(169 112 255 / 32%);
  }
  .qcq-metrics-panel__scope {
    color: rgb(180 213 238 / 68%);
    font-size: 0.62rem;
    font-weight: 850;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .qcq-metrics-panel__hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(7rem, 0.38fr);
    gap: 0.8rem;
    align-items: stretch;
  }
  .qcq-metrics-panel__readiness {
    display: grid;
    place-items: center;
    min-width: 0;
    padding: 0.65rem;
    border: 1px solid rgb(32 221 255 / 18%);
    border-radius: 0.8rem;
    background: rgb(5 14 31 / 66%);
  }

  .qcq-metrics-panel__tiles {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.68rem;
    min-width: 0;
  }

  .qcq-metrics-panel__progress {
    display: grid;
    gap: 0.72rem;
    padding: 0.78rem;
    border: 1px solid rgb(97 155 209 / 15%);
    border-radius: 0.78rem;
    background: rgb(2 8 20 / 58%);
  }

  .qcq-metrics-panel__topics {
    display: grid;
    gap: 0.42rem;
    min-width: 0;
  }
  .qcq-metrics-panel__topics h3 {
    margin: 0;
    color: rgb(188 219 241 / 78%);
    font-size: 0.66rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .qcq-metrics-panel__topic-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.65rem;
    align-items: center;
    min-width: 0;
    padding: 0.5rem 0.62rem;
    border: 1px solid rgb(78 135 186 / 13%);
    border-radius: 0.55rem;
    background: rgb(5 13 28 / 55%);
  }
  .qcq-metrics-panel__topic-name {
    min-width: 0;
    color: rgb(224 239 250 / 88%);
    font-size: 0.72rem;
    font-weight: 800;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .qcq-metrics-panel__topic-value {
    color: #20ddff;
    font-family: "Arial Black", Inter, system-ui, sans-serif;
    font-size: 0.7rem;
    font-variant-numeric: tabular-nums;
  }
  .qcq-metrics-panel__insufficient {
    margin: 0;
    color: rgb(176 204 225 / 72%);
    font-size: 0.7rem;
    line-height: 1.45;
  }

  .qcq-metrics-panel[data-compact="true"] .qcq-metrics-panel__hero {
    grid-template-columns: 1fr;
  }
  .qcq-metrics-panel[data-compact="true"] .qcq-metrics-panel__tiles {
    grid-template-columns: 1fr;
  }

  @container (max-width: 27rem) {
    .qcq-metrics-panel__hero,
    .qcq-metrics-panel__tiles { grid-template-columns: 1fr; }
  }

  @media (forced-colors: active) {
    .qcq-metrics-panel,
    .qcq-metrics-panel__readiness,
    .qcq-metrics-panel__progress,
    .qcq-metrics-panel__topic-row {
      border: 1px solid CanvasText;
      color: CanvasText;
      background: Canvas;
      box-shadow: none;
    }
  }
`;

const EMPTY_STORE = new MetricsStore();

function formatPercent(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * 100)}%`;
}

function formatDuration(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function MetricsPanel({
  metrics,
  store,
  title = 'Performance Metrics',
  className,
  compact = false,
  maximumTopics = 4,
}: MetricsPanelProps) {
  if (metrics && store) {
    throw new Error('MetricsPanel accepts either metrics or store, not both.');
  }
  const activeStore = store ?? EMPTY_STORE;
  const storeMetrics = useSyncExternalStore(
    activeStore.subscribe,
    activeStore.getSnapshot,
    activeStore.getServerSnapshot,
  );
  const snapshot = metrics ?? storeMetrics;
  const classes = ['qcq-metrics-panel', className].filter(Boolean).join(' ');
  const readiness = snapshot.readinessEstimate;
  const topics = snapshot.topicMetrics
    .filter((topic) => topic.attempts > 0)
    .sort((left, right) => right.attempts - left.attempts)
    .slice(0, Math.max(0, Math.trunc(maximumTopics)));
  const trend = snapshot.recentImprovement.status === 'available'
    ? (snapshot.recentImprovement.percentagePointChange ?? 0) > 0.5
      ? 'up'
      : (snapshot.recentImprovement.percentagePointChange ?? 0) < -0.5
        ? 'down'
        : 'steady'
    : 'unknown';

  return (
    <>
      <style>{styles}</style>
      <aside
        className={classes}
        data-compact={String(compact)}
        aria-label={title}
      >
        <header className="qcq-metrics-panel__header">
          <h2 className="qcq-metrics-panel__title">{title}</h2>
          <span className="qcq-metrics-panel__scope">Current session</span>
        </header>

        <div className="qcq-metrics-panel__hero">
          <MetricTile
            label="Accuracy"
            value={formatPercent(snapshot.accuracy)}
            secondary={`${snapshot.questionsAnswered} answered`}
            tone="cyan"
            trend={trend}
            emphasis="strong"
            icon="◎"
          />
          <div className="qcq-metrics-panel__readiness">
            <ProgressTracker
              label="Readiness"
              value={readiness.value ?? 0}
              variant="radial"
              tone={readiness.status === 'available' ? 'emerald' : 'violet'}
              valueFormatter={() => readiness.status === 'available' ? formatPercent(readiness.value) : '—'}
              description={readiness.explanation}
            />
          </div>
        </div>

        <div className="qcq-metrics-panel__tiles">
          <MetricTile
            label="Score"
            value={`${snapshot.score}/${snapshot.maximumScore}`}
            secondary={`${snapshot.questionsRemaining} remaining`}
            tone="violet"
            icon="◇"
          />
          <MetricTile
            label="Streak"
            value={snapshot.currentStreak}
            secondary={`Best ${snapshot.bestStreak}`}
            tone="orange"
            icon="↟"
          />
          <MetricTile
            label="Level"
            value={snapshot.level}
            secondary={snapshot.levelTitle}
            tone="gold"
            icon="✦"
          />
          <MetricTile
            label="Study Time"
            value={formatDuration(snapshot.elapsedStudyTimeMilliseconds)}
            secondary={
              snapshot.averageResponseTimeMilliseconds === null
                ? 'Response time unavailable'
                : `${Math.round(snapshot.averageResponseTimeMilliseconds / 1000)}s average response`
            }
            tone="emerald"
            icon="◷"
          />
        </div>

        <div className="qcq-metrics-panel__progress">
          <ProgressTracker
            label="Session completion"
            value={snapshot.questionsAnswered}
            maximum={Math.max(1, snapshot.questionsAnswered + snapshot.questionsRemaining)}
            variant="segmented"
            tone="cyan"
            segments={10}
          />
          <ProgressTracker
            label="Level progress"
            value={snapshot.levelProgress}
            variant="linear"
            tone="gold"
            description={`${snapshot.sessionXP} XP earned this session`}
          />
        </div>

        <section className="qcq-metrics-panel__topics" aria-labelledby="qcq-metrics-topics-title">
          <h3 id="qcq-metrics-topics-title">Topic evidence</h3>
          {topics.length > 0 ? topics.map((topic) => (
            <div key={topic.topic} className="qcq-metrics-panel__topic-row">
              <span className="qcq-metrics-panel__topic-name" title={topic.topic}>{topic.topic}</span>
              <strong className="qcq-metrics-panel__topic-value">
                {formatPercent(topic.accuracy)} · {topic.attempts}
              </strong>
            </div>
          )) : (
            <p className="qcq-metrics-panel__insufficient">
              Topic metrics will appear after graded question evidence is available.
            </p>
          )}
        </section>
      </aside>
    </>
  );
}
