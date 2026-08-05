import { useEffect, useMemo, useRef, useState } from 'react';
import { assetPath } from '../../utils/assetPath.js';
import { A23_MASTER_CROP } from './tabletA23Geometry.js';
import { TabletContentPlane } from './TabletContentPlane.jsx';

function readAuditMode() {
  try {
    return new URLSearchParams(globalThis.location?.search ?? '').get('qcq-a23-audit') ?? '';
  } catch {
    return '';
  }
}

export function PixelLockedTablet({ children }) {
  const rootRef = useRef(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const auditMode = useMemo(readAuditMode, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;
    const update = () => {
      const rect = node.getBoundingClientRect();
      setScale({ x: rect.width / 3840, y: rect.height / 2160 });
    };
    const observer = new ResizeObserver(update);
    observer.observe(node);
    update();
    return () => observer.disconnect();
  }, []);

  const cropStyle = {
    left: `${A23_MASTER_CROP.x}px`,
    top: `${A23_MASTER_CROP.y}px`,
    width: `${A23_MASTER_CROP.width}px`,
    height: `${A23_MASTER_CROP.height}px`,
  };

  return (
    <section
      ref={rootRef}
      className="qcq-a23-tablet-root"
      data-a23-version="A2.3-pixel-locked-modular-tablet-v1.0.1"
      data-a23-audit={auditMode}
      aria-label="Pixel-locked modular quiz tablet"
    >
      <div
        className="qcq-a23-design-plane"
        style={{ transform: `scale(${scale.x}, ${scale.y})` }}
      >
        <img className="qcq-a23-layer qcq-a23-layer--restoration" style={cropStyle} src={assetPath('assets/tablet/a2.3/tablet-background-restoration.webp')} alt="" />
        <img className="qcq-a23-layer qcq-a23-layer--shadow" style={cropStyle} src={assetPath('assets/tablet/a2.3/tablet-shadow.webp')} alt="" />
        <img className="qcq-a23-layer qcq-a23-layer--rear" style={cropStyle} src={assetPath('assets/tablet/a2.3/tablet-rear-shell.webp')} alt="" />
        <img className="qcq-a23-layer qcq-a23-layer--screen" style={cropStyle} src={assetPath('assets/tablet/a2.3/tablet-screen-surface.webp')} alt="" />
        <TabletContentPlane auditMode={auditMode}>{children}</TabletContentPlane>
        <img className="qcq-a23-layer qcq-a23-layer--reflection" style={cropStyle} src={assetPath('assets/tablet/a2.3/tablet-reflection.webp')} alt="" />
        <img className="qcq-a23-layer qcq-a23-layer--bezel" style={cropStyle} src={assetPath('assets/tablet/a2.3/tablet-foreground-bezel.webp')} alt="" />
      </div>
    </section>
  );
}
