import { A23_REGIONS, localGeometryStyle } from './tabletA23Geometry.js';

export function TabletProgressRegion({ current, total, pageCount = 1, page = 0, onPage }) {
  return (
    <>
      <span className="qcq-a23-progress" style={localGeometryStyle(A23_REGIONS.progress)} aria-hidden="true">
        {current || 0} / {total || 0}
      </span>
      {pageCount > 1 && (
        <button type="button" className="qcq-a23-pager" style={localGeometryStyle(A23_REGIONS.pager)} onClick={onPage}>
          {page === 0 ? 'MORE OPTIONS  ›' : '‹  OPTIONS A–D'}
        </button>
      )}
    </>
  );
}
