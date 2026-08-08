/**
 * Artifact ID: QCQ-TBL-003
 * Artifact Name: TabletViewport
 * Repository Path: QCQ/frontend/src/tablet/TabletViewport.tsx
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface TabletViewportOverflow {
  readonly top: boolean;
  readonly right: boolean;
  readonly bottom: boolean;
  readonly left: boolean;
}

export interface TabletViewportProps {
  readonly children: ReactNode;
  readonly className?: string | undefined;
  readonly ariaLabel?: string | undefined;
  readonly labelledBy?: string | undefined;
  readonly describedBy?: string | undefined;
  readonly contentKey?: string | number | undefined;
  readonly scrollRestoration?: 'preserve' | 'top' | undefined;
  readonly onOverflowChange?:
    | ((overflow: TabletViewportOverflow) => void)
    | undefined;
}

const viewportStyles = `
  .qcq-tablet-viewport {
    position: relative;
    min-width: 0;
    min-height: 0;
    height: 100%;
    overflow: hidden;
    border-radius: inherit;
  }

  .qcq-tablet-viewport__scroller {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable both-edges;
    scrollbar-width: thin;
    scrollbar-color: rgb(79 219 255 / 62%) rgb(2 6 17 / 62%);
    outline: none;
  }

  .qcq-tablet-viewport__scroller::-webkit-scrollbar {
    width: 0.68rem;
    height: 0.68rem;
  }

  .qcq-tablet-viewport__scroller::-webkit-scrollbar-track {
    background: rgb(2 6 17 / 68%);
  }

  .qcq-tablet-viewport__scroller::-webkit-scrollbar-thumb {
    border: 2px solid rgb(2 6 17 / 68%);
    border-radius: 999px;
    background:
      linear-gradient(
        180deg,
        rgb(32 221 255 / 82%),
        rgb(169 112 255 / 82%)
      );
  }

  .qcq-tablet-viewport__content {
    min-width: 0;
    min-height: 100%;
  }

  .qcq-tablet-viewport__fade {
    position: absolute;
    z-index: 2;
    pointer-events: none;
    opacity: 0;
    transition: opacity 140ms ease;
  }

  .qcq-tablet-viewport__fade--top,
  .qcq-tablet-viewport__fade--bottom {
    right: 0.7rem;
    left: 0;
    height: 2.25rem;
  }

  .qcq-tablet-viewport__fade--top {
    top: 0;
    background: linear-gradient(180deg, rgb(1 4 12 / 96%), transparent);
  }

  .qcq-tablet-viewport__fade--bottom {
    bottom: 0;
    background: linear-gradient(0deg, rgb(1 4 12 / 96%), transparent);
  }

  .qcq-tablet-viewport__fade--left,
  .qcq-tablet-viewport__fade--right {
    top: 0;
    bottom: 0.7rem;
    width: 2.25rem;
  }

  .qcq-tablet-viewport__fade--left {
    left: 0;
    background: linear-gradient(90deg, rgb(1 4 12 / 96%), transparent);
  }

  .qcq-tablet-viewport__fade--right {
    right: 0;
    background: linear-gradient(270deg, rgb(1 4 12 / 96%), transparent);
  }

  .qcq-tablet-viewport[data-overflow-top="true"]
    .qcq-tablet-viewport__fade--top,
  .qcq-tablet-viewport[data-overflow-right="true"]
    .qcq-tablet-viewport__fade--right,
  .qcq-tablet-viewport[data-overflow-bottom="true"]
    .qcq-tablet-viewport__fade--bottom,
  .qcq-tablet-viewport[data-overflow-left="true"]
    .qcq-tablet-viewport__fade--left {
    opacity: 1;
  }

  .qcq-tablet-viewport__overflow-status {
    position: absolute;
    right: 1rem;
    bottom: 0.55rem;
    z-index: 3;
    padding: 0.24rem 0.48rem;
    border: 1px solid rgb(32 221 255 / 28%);
    border-radius: 999px;
    color: rgb(210 239 255 / 88%);
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: rgb(1 5 15 / 88%);
    opacity: 0;
    pointer-events: none;
    transition: opacity 140ms ease;
  }

  .qcq-tablet-viewport[data-overflow-bottom="true"]
    .qcq-tablet-viewport__overflow-status {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .qcq-tablet-viewport__fade,
    .qcq-tablet-viewport__overflow-status {
      transition: none;
    }
  }
`;

const EMPTY_OVERFLOW: TabletViewportOverflow = {
  top: false,
  right: false,
  bottom: false,
  left: false,
};

function overflowEquals(
  left: TabletViewportOverflow,
  right: TabletViewportOverflow,
): boolean {
  return (
    left.top === right.top &&
    left.right === right.right &&
    left.bottom === right.bottom &&
    left.left === right.left
  );
}

export function TabletViewport({
  children,
  className,
  ariaLabel,
  labelledBy,
  describedBy,
  contentKey,
  scrollRestoration = 'top',
  onOverflowChange,
}: TabletViewportProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [overflow, setOverflow] =
    useState<TabletViewportOverflow>(EMPTY_OVERFLOW);

  const measureOverflow = useCallback(() => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    const epsilon = 1;
    const next: TabletViewportOverflow = {
      top: scroller.scrollTop > epsilon,
      right:
        scroller.scrollLeft + scroller.clientWidth <
        scroller.scrollWidth - epsilon,
      bottom:
        scroller.scrollTop + scroller.clientHeight <
        scroller.scrollHeight - epsilon,
      left: scroller.scrollLeft > epsilon,
    };

    setOverflow((current) => {
      if (overflowEquals(current, next)) {
        return current;
      }

      onOverflowChange?.(next);
      return next;
    });
  }, [onOverflowChange]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return undefined;
    }

    let frame = 0;
    const scheduleMeasurement = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measureOverflow);
    };

    const resizeObserver = new ResizeObserver(scheduleMeasurement);
    const mutationObserver = new MutationObserver(scheduleMeasurement);

    resizeObserver.observe(scroller);
    if (scroller.firstElementChild) {
      resizeObserver.observe(scroller.firstElementChild);
    }

    mutationObserver.observe(scroller, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });

    scroller.addEventListener('scroll', scheduleMeasurement, {
      passive: true,
    });

    scheduleMeasurement();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      scroller.removeEventListener('scroll', scheduleMeasurement);
    };
  }, [measureOverflow]);

  useEffect(() => {
    if (scrollRestoration !== 'top') {
      return undefined;
    }

    const frame = requestAnimationFrame(() => {
      scrollerRef.current?.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [contentKey, scrollRestoration]);

  const classes = ['qcq-tablet-viewport', className]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <style>{viewportStyles}</style>
      <div
        className={classes}
        data-overflow-top={String(overflow.top)}
        data-overflow-right={String(overflow.right)}
        data-overflow-bottom={String(overflow.bottom)}
        data-overflow-left={String(overflow.left)}
      >
        <div
          ref={scrollerRef}
          className="qcq-tablet-viewport__scroller"
          role="region"
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          tabIndex={0}
        >
          <div className="qcq-tablet-viewport__content">{children}</div>
        </div>

        <span
          className="qcq-tablet-viewport__fade qcq-tablet-viewport__fade--top"
          aria-hidden="true"
        />
        <span
          className="qcq-tablet-viewport__fade qcq-tablet-viewport__fade--right"
          aria-hidden="true"
        />
        <span
          className="qcq-tablet-viewport__fade qcq-tablet-viewport__fade--bottom"
          aria-hidden="true"
        />
        <span
          className="qcq-tablet-viewport__fade qcq-tablet-viewport__fade--left"
          aria-hidden="true"
        />

        <span
          className="qcq-tablet-viewport__overflow-status"
          aria-hidden="true"
        >
          Scroll for more
        </span>
      </div>
    </>
  );
}
