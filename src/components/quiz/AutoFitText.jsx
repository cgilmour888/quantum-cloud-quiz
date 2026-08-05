import { useLayoutEffect, useRef, useState } from 'react';

function fits(node) {
  return node.scrollWidth <= node.clientWidth + 1 && node.scrollHeight <= node.clientHeight + 1;
}

export function AutoFitText({
  children,
  min = 18,
  max = 42,
  step = 0.5,
  className = '',
  as: Tag = 'span',
  onFit,
  ...props
}) {
  const ref = useRef(null);
  const [size, setSize] = useState(max);

  useLayoutEffect(() => {
    let cancelled = false;
    const node = ref.current;
    if (!node) return undefined;

    const measure = async () => {
      await globalThis.document?.fonts?.ready;
      if (cancelled || !ref.current) return;
      let low = min;
      let high = max;
      let best = min;
      while (high - low > step) {
        const mid = (low + high) / 2;
        node.style.fontSize = `${mid}px`;
        if (fits(node)) {
          best = mid;
          low = mid;
        } else {
          high = mid;
        }
      }
      node.style.fontSize = `${best}px`;
      setSize(best);
      onFit?.({ fontSize: best, fits: fits(node), lines: Math.max(1, Math.round(node.scrollHeight / parseFloat(getComputedStyle(node).lineHeight || best))) });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    measure();
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [children, max, min, onFit, step]);

  return (
    <Tag ref={ref} className={className} style={{ fontSize: `${size}px` }} {...props}>
      {children}
    </Tag>
  );
}
