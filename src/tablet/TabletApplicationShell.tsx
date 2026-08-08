/**
 * Artifact ID: QCQ-TBL-001
 * Artifact Name: TabletApplicationShell
 * Repository Path: QCQ/frontend/src/tablet/TabletApplicationShell.tsx
 *
 * Architectural authority: semantic and visual tablet shell only.
 * QCQ-APP-002 owns the application viewport, skip link, primary landmark,
 * environment, performance, metrics, and player-banner zones.
 */

import {
  useEffect,
  useId,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { TabletLayoutEngine, type TabletLayoutMode } from './TabletLayoutEngine';
import { TabletViewport } from './TabletViewport';

export type TabletMotionPreference = 'system' | 'reduced' | 'full';

export interface TabletApplicationShellProps {
  readonly children: ReactNode;
  readonly supportingContent?: ReactNode | undefined;
  readonly lowerDeck?: ReactNode | undefined;
  readonly utilityControls?: ReactNode | undefined;
  readonly applicationTitle?: string | undefined;
  readonly applicationSubtitle?: string | undefined;
  readonly statusMessage?: string | undefined;
  readonly motionPreference?: TabletMotionPreference | undefined;
  readonly layoutMode?: TabletLayoutMode | 'auto' | undefined;
  readonly className?: string | undefined;
  readonly contentKey?: string | number | undefined;
  readonly ariaLabel?: string | undefined;
  readonly onReady?: (() => void) | undefined;
  /** @deprecated Supply this content to QCQ-APP-002 `performance`. */
  readonly leftConsole?: ReactNode | undefined;
  /** @deprecated Supply this content to QCQ-APP-002 `metrics`. */
  readonly rightConsole?: ReactNode | undefined;
  /** @deprecated Supply this content to QCQ-APP-002 `playerBanner`. */
  readonly playerBanner?: ReactNode | undefined;
}

type ShellStyle = CSSProperties &
  Record<'--qcq-tablet-motion-scale', string>;

const shellStyles = `
  .qcq-tablet-application-shell {
    --qcq-tablet-cyan: #20ddff;
    --qcq-tablet-blue: #3978ff;
    --qcq-tablet-violet: #a970ff;
    --qcq-tablet-orange: #ff8a1f;
    --qcq-tablet-emerald: #27e6a1;
    --qcq-tablet-text: #f4f8ff;
    --qcq-tablet-muted: #a5b7d4;
    position: relative;
    isolation: isolate;
    display: grid;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: clip;
    border: 1px solid rgb(153 205 244 / 18%);
    border-radius: inherit;
    color: var(--qcq-tablet-text);
    background:
      radial-gradient(circle at 50% -18%, rgb(62 112 190 / 16%), transparent 48%),
      linear-gradient(180deg, rgb(4 10 24 / 94%), rgb(1 4 13 / 98%));
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 9%),
      inset 0 0 2.8rem rgb(32 221 255 / 5%),
      0 1.1rem 2.6rem rgb(0 0 0 / 34%);
    container-type: size;
  }

  .qcq-tablet-application-shell::before,
  .qcq-tablet-application-shell::after {
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: inherit;
    pointer-events: none;
    content: "";
  }

  .qcq-tablet-application-shell::before {
    background:
      linear-gradient(90deg, transparent, rgb(32 221 255 / 4%), transparent),
      repeating-linear-gradient(0deg, transparent 0 2.2rem, rgb(86 151 205 / 2%) 2.25rem 2.3rem);
    mask-image: radial-gradient(ellipse at 50% 48%, black, transparent 84%);
  }

  .qcq-tablet-application-shell::after {
    inset: clamp(0.42rem, 0.95cqi, 0.75rem);
    border: 1px solid rgb(32 221 255 / 11%);
    box-shadow:
      inset 0 0 1.2rem rgb(169 112 255 / 5%),
      0 0 1.1rem rgb(32 221 255 / 5%);
  }

  .qcq-tablet-application-shell__content {
    position: relative;
    z-index: 2;
    min-width: 0;
    min-height: 0;
    padding: clamp(0.72rem, 1.75cqi, 1.35rem);
  }

  .qcq-tablet-application-shell__masthead {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: clamp(0.7rem, 1.5cqi, 1.1rem);
    min-width: 0;
    padding-inline: clamp(0.15rem, 0.5cqi, 0.4rem);
  }

  .qcq-tablet-application-shell__identity {
    min-width: 0;
  }

  .qcq-tablet-application-shell__subtitle {
    margin: 0;
    color: var(--qcq-tablet-cyan);
    font-size: clamp(0.58rem, 1.15cqi, 0.72rem);
    font-weight: 900;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    text-shadow: 0 0 0.8rem rgb(32 221 255 / 32%);
  }

  .qcq-tablet-application-shell__title {
    margin: 0.24rem 0 0;
    overflow-wrap: anywhere;
    font-family: "Arial Black", "Aptos Display", Inter, system-ui, sans-serif;
    font-size: clamp(1.05rem, 2.5cqi, 1.8rem);
    font-weight: 950;
    line-height: 1.08;
    letter-spacing: 0.045em;
    text-shadow:
      0 -0.03em 0 rgb(255 255 255 / 52%),
      0 0.09em 0 rgb(4 12 27 / 94%),
      0 0 1rem rgb(32 221 255 / 26%);
  }

  .qcq-tablet-application-shell__utility {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.55rem;
    min-width: 0;
  }

  .qcq-tablet-application-shell__viewport {
    min-height: 0;
    border: 1px solid rgb(142 204 244 / 10%);
    border-radius: clamp(0.72rem, 1.4cqi, 1.05rem);
    background: rgb(1 4 13 / 56%);
  }

  .qcq-tablet-application-shell__legacy-banner {
    justify-self: center;
    max-width: 100%;
    padding: 0.5rem 0.72rem;
    border: 1px solid rgb(169 112 255 / 18%);
    border-radius: 999px;
    color: rgb(224 235 255 / 82%);
    background: rgb(20 10 45 / 64%);
  }

  .qcq-tablet-application-shell__status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .qcq-tablet-application-shell[data-motion="reduced"] {
    --qcq-tablet-motion-scale: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .qcq-tablet-application-shell[data-motion="system"] {
      --qcq-tablet-motion-scale: 0;
    }
  }

  @media (forced-colors: active) {
    .qcq-tablet-application-shell,
    .qcq-tablet-application-shell__viewport,
    .qcq-tablet-application-shell__legacy-banner {
      border: 1px solid CanvasText;
      color: CanvasText;
      background: Canvas;
      box-shadow: none;
    }

    .qcq-tablet-application-shell::before,
    .qcq-tablet-application-shell::after {
      display: none;
    }
  }
`;

export function TabletApplicationShell({
  children,
  supportingContent,
  lowerDeck,
  utilityControls,
  applicationTitle = 'Quantum Certification Quest',
  applicationSubtitle = 'Certification command tablet',
  statusMessage = 'Certification tablet ready.',
  motionPreference = 'system',
  layoutMode = 'auto',
  className,
  contentKey,
  ariaLabel = 'Quantum Certification Quest tablet shell',
  onReady,
  leftConsole,
  rightConsole,
  playerBanner,
}: TabletApplicationShellProps) {
  const titleId = useId();
  const statusId = useId();

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const supporting =
    supportingContent ??
    (leftConsole !== undefined || rightConsole !== undefined
      ? undefined
      : null);
  const resolvedLowerDeck =
    lowerDeck !== undefined || playerBanner !== undefined ? (
      <>
        {lowerDeck}
        {playerBanner !== undefined ? (
          <div
            className="qcq-tablet-application-shell__legacy-banner"
            data-legacy-source="player-banner"
          >
            {playerBanner}
          </div>
        ) : null}
      </>
    ) : undefined;

  const rootStyle: ShellStyle = {
    '--qcq-tablet-motion-scale': motionPreference === 'reduced' ? '0' : '1',
  };
  const classes = ['qcq-tablet-application-shell', className]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <style>{shellStyles}</style>
      <section
        className={classes}
        style={rootStyle}
        data-motion={motionPreference}
        data-layout-authority="tablet-shell"
        aria-label={ariaLabel}
        aria-labelledby={titleId}
        aria-describedby={statusId}
      >
        <div className="qcq-tablet-application-shell__content">
          <TabletLayoutEngine
            mode={layoutMode}
            header={
              <header className="qcq-tablet-application-shell__masthead">
                <div className="qcq-tablet-application-shell__identity">
                  <p className="qcq-tablet-application-shell__subtitle">
                    {applicationSubtitle}
                  </p>
                  <h1
                    id={titleId}
                    className="qcq-tablet-application-shell__title"
                  >
                    {applicationTitle}
                  </h1>
                </div>
                {utilityControls !== undefined ? (
                  <div className="qcq-tablet-application-shell__utility">
                    {utilityControls}
                  </div>
                ) : null}
              </header>
            }
            centerStage={
              <TabletViewport
                className="qcq-tablet-application-shell__viewport"
                ariaLabel="Certification tablet content"
                contentKey={contentKey}
                scrollRestoration="top"
              >
                {children}
              </TabletViewport>
            }
            supportingContent={supporting}
            lowerDeck={resolvedLowerDeck}
            leftConsole={leftConsole}
            rightConsole={rightConsole}
          />
        </div>

        <p
          id={statusId}
          className="qcq-tablet-application-shell__status"
          aria-live="polite"
          aria-atomic="true"
        >
          {statusMessage}
        </p>
      </section>
    </>
  );
}
