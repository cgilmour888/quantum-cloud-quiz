import { A23_HARD_CLIP_CSS, A23_LOCAL_PLANE, matrix3dString } from './tabletA23Geometry.js';

export function TabletContentPlane({ children, auditMode = '' }) {
  return (
    <section
      className="qcq-a23-content-plane"
      data-a23-content-plane="single-authority"
      data-a23-audit={auditMode}
      style={{
        width: `${A23_LOCAL_PLANE.width}px`,
        height: `${A23_LOCAL_PLANE.height}px`,
        transform: matrix3dString(),
        clipPath: A23_HARD_CLIP_CSS,
      }}
      aria-label="Quantum Cloud Quiz tablet content"
    >
      {children}
    </section>
  );
}
