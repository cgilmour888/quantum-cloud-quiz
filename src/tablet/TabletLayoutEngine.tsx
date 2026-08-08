/**
 * Artifact ID: QCQ-TBL-002
 * Artifact Name: TabletLayoutEngine
 * Repository Path: QCQ/frontend/src/tablet/TabletLayoutEngine.tsx
 *
 * Architectural authority: tablet-internal composition only.
 * QCQ-APP-002 remains the sole macro application-zone layout authority.
 */

import type { ReactNode } from 'react';

export type TabletLayoutMode = 'compact' | 'balanced' | 'command';

export interface TabletLayoutEngineProps {
  readonly header?: ReactNode | undefined;
  readonly centerStage: ReactNode;
  readonly supportingContent?: ReactNode | undefined;
  readonly lowerDeck?: ReactNode | undefined;
  readonly className?: string | undefined;
  readonly mode?: TabletLayoutMode | 'auto' | undefined;
  readonly ariaLabel?: string | undefined;
  /**
   * @deprecated Application-level performance content belongs in the
   * QCQ-APP-002 `performance` zone. Retained only as a non-authoritative
   * tablet support-region compatibility bridge.
   */
  readonly leftConsole?: ReactNode | undefined;
  /**
   * @deprecated Application-level metrics content belongs in the
   * QCQ-APP-002 `metrics` zone. Retained only as a non-authoritative
   * tablet support-region compatibility bridge.
   */
  readonly rightConsole?: ReactNode | undefined;
}

const layoutStyles = `
  .qcq-tablet-layout {
    position: relative;
    display: grid;
    grid-template-areas:
      "header"
      "center"
      "support"
      "lower";
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr) auto auto;
    gap: clamp(0.72rem, 1.65cqi, 1.25rem);
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    container-type: size;
    contain: layout style;
  }

  .qcq-tablet-layout__region {
    min-width: 0;
    min-height: 0;
  }

  .qcq-tablet-layout__header {
    grid-area: header;
  }

  .qcq-tablet-layout__center {
    grid-area: center;
    align-self: stretch;
    overflow: hidden;
  }

  .qcq-tablet-layout__support {
    grid-area: support;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
    gap: clamp(0.62rem, 1.3cqi, 0.95rem);
    min-width: 0;
  }

  .qcq-tablet-layout__lower {
    grid-area: lower;
  }

  .qcq-tablet-layout[data-layout-mode="command"] {
    gap: clamp(0.9rem, 1.9cqi, 1.45rem);
  }

  .qcq-tablet-layout[data-layout-mode="balanced"] {
    gap: clamp(0.68rem, 1.45cqi, 1.05rem);
  }

  .qcq-tablet-layout[data-layout-mode="compact"] {
    grid-template-rows: auto minmax(0, 1fr) auto auto;
    gap: 0.62rem;
  }

  .qcq-tablet-layout[data-layout-mode="compact"]
    .qcq-tablet-layout__support {
    grid-template-columns: minmax(0, 1fr);
  }

  .qcq-tablet-layout__legacy-region {
    min-width: 0;
    padding: clamp(0.62rem, 1.4cqi, 0.9rem);
    overflow: auto;
    border: 1px solid rgb(110 170 219 / 16%);
    border-radius: 0.75rem;
    background: rgb(3 9 23 / 58%);
    scrollbar-width: thin;
  }

  @container (max-width: 42rem), (max-height: 34rem) {
    .qcq-tablet-layout {
      gap: 0.62rem;
    }

    .qcq-tablet-layout__support {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (forced-colors: active) {
    .qcq-tablet-layout__legacy-region {
      border: 1px solid CanvasText;
      color: CanvasText;
      background: Canvas;
    }
  }
`;

export function TabletLayoutEngine({
  header,
  centerStage,
  supportingContent,
  lowerDeck,
  className,
  mode = 'auto',
  ariaLabel = 'Certification tablet internal layout',
  leftConsole,
  rightConsole,
}: TabletLayoutEngineProps) {
  const resolvedMode: TabletLayoutMode | 'auto' = mode;
  const compatibilityContent =
    leftConsole !== undefined || rightConsole !== undefined ? (
      <>
        {leftConsole !== undefined ? (
          <section
            className="qcq-tablet-layout__legacy-region"
            aria-label="Tablet supporting performance content"
            data-legacy-source="left-console"
          >
            {leftConsole}
          </section>
        ) : null}
        {rightConsole !== undefined ? (
          <section
            className="qcq-tablet-layout__legacy-region"
            aria-label="Tablet supporting metrics content"
            data-legacy-source="right-console"
          >
            {rightConsole}
          </section>
        ) : null}
      </>
    ) : null;
  const support = supportingContent ?? compatibilityContent;
  const classes = ['qcq-tablet-layout', className].filter(Boolean).join(' ');

  return (
    <>
      <style>{layoutStyles}</style>
      <div
        className={classes}
        data-layout-mode={resolvedMode}
        data-layout-authority="tablet-internal"
        aria-label={ariaLabel}
      >
        {header !== undefined ? (
          <div className="qcq-tablet-layout__region qcq-tablet-layout__header">
            {header}
          </div>
        ) : null}

        <div className="qcq-tablet-layout__region qcq-tablet-layout__center">
          {centerStage}
        </div>

        {support !== null && support !== undefined ? (
          <div className="qcq-tablet-layout__region qcq-tablet-layout__support">
            {support}
          </div>
        ) : null}

        {lowerDeck !== undefined ? (
          <div className="qcq-tablet-layout__region qcq-tablet-layout__lower">
            {lowerDeck}
          </div>
        ) : null}
      </div>
    </>
  );
}
