import { assetPath } from '../../../utils/assetPath.js';
import {
  TABLET_A21R_AREA_REPORT,
  TABLET_A21R_GEOMETRY_VERSION,
  TABLET_BEVEL_SAFE_ADVISORY_POLYGON,
  TABLET_CANONICAL_ASSET_ZONES,
  TABLET_HARD_CLIP_POLYGON,
  TABLET_HOMOGRAPHY_DESTINATION_QUAD,
  TABLET_MASTER_PLANE,
  TABLET_MAXIMUM_APERTURE_POLYGON,
  TABLET_OUTER_REFERENCE_POLYGON,
  TABLET_VISIBLE_INNER_EDGE_POLYGON,
  tabletLocalToMaster,
} from '../../quiz/tabletMaximumApertureGeometry.js';

const VALID_MODES = new Set([
  'all', 'outer', 'inner', 'aperture', 'hard', 'safe', 'grid',
  'quiz', 'dashboard', 'business', 'utilization',
]);

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

/**
 * Static mode is retained for frozen registration review:
 *   ?qcq-tablet-a21r=grid
 *
 * Live mode draws geometry only and leaves the operating compositor, quiz UI,
 * placard controls, and every registered SceneEngine animation visible:
 *   ?qcq-tablet-a21r-live=grid
 */
export function readTabletA21RProofConfig() {
  try {
    const parameters = new URLSearchParams(globalThis.location?.search ?? '');
    const liveMode = parameters.get('qcq-tablet-a21r-live');
    const staticMode = parameters.get('qcq-tablet-a21r');

    let mode = null;
    let presentation = null;

    if (VALID_MODES.has(liveMode)) {
      mode = liveMode;
      presentation = 'live';
    } else if (VALID_MODES.has(staticMode)) {
      mode = staticMode;
      presentation = 'static';
    }

    if (!mode) return null;

    const requestedOpacity = Number.parseFloat(parameters.get('qcq-tablet-opacity') ?? '1');
    const opacity = Number.isFinite(requestedOpacity)
      ? clamp(requestedOpacity, 0.15, 1)
      : 1;

    return Object.freeze({
      mode,
      presentation,
      opacity,
      showHud: parameters.get('qcq-tablet-hud') !== '0',
    });
  } catch {
    return null;
  }
}

/** Backward-compatible helper retained for existing A2.1R callers. */
export function readTabletA21RProofMode() {
  return readTabletA21RProofConfig()?.mode ?? null;
}

function points(polygon) {
  return polygon.map(([x, y]) => `${x},${y}`).join(' ');
}

function Polygon({ polygon, stroke, fill = 'none', width = 6, dash, opacity = 1 }) {
  return (
    <polygon
      points={points(polygon)}
      fill={fill}
      stroke={stroke}
      strokeWidth={width}
      strokeDasharray={dash}
      vectorEffect="non-scaling-stroke"
      opacity={opacity}
    />
  );
}

function PolyLabel({ x, y, children, color = '#fff' }) {
  return (
    <text
      x={x}
      y={y}
      fill={color}
      stroke="#000"
      strokeWidth="7"
      paintOrder="stroke"
      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      fontSize="34"
      fontWeight="800"
      letterSpacing="2"
    >
      {children}
    </text>
  );
}

function LocalGrid() {
  const lines = [];
  for (let step = 0; step <= 10; step += 1) {
    const value = step / 10;
    const vertical = [];
    const horizontal = [];
    for (let sample = 0; sample <= 80; sample += 1) {
      const t = sample / 80;
      vertical.push(tabletLocalToMaster([value, t]));
      horizontal.push(tabletLocalToMaster([t, value]));
    }
    lines.push(
      <polyline
        key={`v-${step}`}
        points={points(vertical)}
        fill="none"
        stroke={step === 5 ? '#fff' : '#45f6ff'}
        strokeWidth={step === 5 ? 5 : 2.5}
        opacity={step === 5 ? 0.95 : 0.7}
        vectorEffect="non-scaling-stroke"
      />,
      <polyline
        key={`h-${step}`}
        points={points(horizontal)}
        fill="none"
        stroke={step === 5 ? '#fff' : '#45f6ff'}
        strokeWidth={step === 5 ? 5 : 2.5}
        opacity={step === 5 ? 0.95 : 0.7}
        vectorEffect="non-scaling-stroke"
      />,
    );
  }
  return lines;
}

function QuizZones() {
  const tones = ['#2cf3ff', '#ff55ee', '#00f39d', '#ff9800'];
  return (
    <>
      <Polygon
        polygon={TABLET_CANONICAL_ASSET_ZONES.questionHost}
        stroke="#ffe84a"
        fill="rgba(255,232,74,0.08)"
        width={5}
      />
      <PolyLabel x={1450} y={660} color="#ffe84a">QUESTION HOST</PolyLabel>
      {TABLET_CANONICAL_ASSET_ZONES.answerButtons.map((polygon, index) => (
        <g key={`answer-${index}`}>
          <Polygon
            polygon={TABLET_CANONICAL_ASSET_ZONES.nativeAnswerEnvelopes[index]}
            stroke="#ffffff"
            width={2.5}
            dash="11 9"
            opacity={0.65}
          />
          <Polygon
            polygon={polygon}
            stroke={tones[index]}
            fill={`${tones[index]}18`}
            width={5}
          />
          <PolyLabel x={1375} y={950 + index * 149} color={tones[index]}>
            {`ANSWER ${String.fromCharCode(65 + index)}`}
          </PolyLabel>
        </g>
      ))}
    </>
  );
}

function SurfaceZone({ polygon, stroke, label }) {
  return (
    <>
      <Polygon polygon={polygon} stroke={stroke} fill={`${stroke}18`} width={6} />
      <PolyLabel x={1510} y={820} color={stroke}>{label}</PolyLabel>
    </>
  );
}

export function TabletMaximumApertureProofLayer({
  mode,
  presentation = 'static',
  opacity = 1,
  showHud = true,
}) {
  if (!mode) return null;

  const isLive = presentation === 'live';
  const showAll = mode === 'all';
  const showOuter = showAll || mode === 'outer';
  const showInner = showAll || mode === 'inner';
  const showAperture = showAll || mode === 'aperture' || mode === 'grid' || mode === 'quiz';
  const showHard = showAll || mode === 'hard';
  const showSafe = showAll || mode === 'safe';
  const showGrid = showAll || mode === 'grid';
  const showQuiz = showAll || mode === 'quiz';

  return (
    <div
      className="tablet-a21r-proof-layer"
      data-mode={mode}
      data-presentation={presentation}
      style={{ '--tablet-a21r-overlay-opacity': opacity }}
      aria-hidden="true"
    >
      {!isLive && (
        <img
          className="tablet-a21r-proof-layer__master"
          src={assetPath('images/master/MASTER.png')}
          alt=""
          draggable={false}
        />
      )}

      <svg
        className="tablet-a21r-proof-layer__svg"
        viewBox={`0 0 ${TABLET_MASTER_PLANE.width} ${TABLET_MASTER_PLANE.height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <clipPath id="tablet-a21r-aperture-clip">
            <polygon points={points(TABLET_MAXIMUM_APERTURE_POLYGON)} />
          </clipPath>
        </defs>

        {showOuter && <Polygon polygon={TABLET_OUTER_REFERENCE_POLYGON} stroke="#338dff" width={7} />}
        {showInner && <Polygon polygon={TABLET_VISIBLE_INNER_EDGE_POLYGON} stroke="#4cff66" width={7} />}
        {showAperture && (
          <Polygon polygon={TABLET_MAXIMUM_APERTURE_POLYGON} stroke="#ffe143" fill="rgba(255,225,67,0.035)" width={6} />
        )}
        {showHard && <Polygon polygon={TABLET_HARD_CLIP_POLYGON} stroke="#00f4ff" width={6} />}
        {showSafe && (
          <Polygon polygon={TABLET_BEVEL_SAFE_ADVISORY_POLYGON} stroke="#ff58d8" width={5} dash="18 12" />
        )}

        {showGrid && (
          <g clipPath="url(#tablet-a21r-aperture-clip)">
            <Polygon polygon={TABLET_HOMOGRAPHY_DESTINATION_QUAD} stroke="#fff" width={3} opacity={0.55} />
            <LocalGrid />
          </g>
        )}

        {showQuiz && <QuizZones />}
        {mode === 'dashboard' && (
          <SurfaceZone
            polygon={TABLET_CANONICAL_ASSET_ZONES.dashboardPresentationHost}
            stroke="#3de6ff"
            label="DASHBOARD PRESENTATION HOST"
          />
        )}
        {mode === 'business' && (
          <SurfaceZone
            polygon={TABLET_CANONICAL_ASSET_ZONES.businessCardPresentationHost}
            stroke="#c66cff"
            label="BUSINESS-CARD PRESENTATION HOST"
          />
        )}
      </svg>

      {showHud && (
        <div className="tablet-a21r-proof-layer__banner">
          <strong>A2.1R {isLive ? 'LIVE ANIMATED OVERLAY' : 'STATIC REGISTRATION'}</strong>
          <span>{TABLET_A21R_GEOMETRY_VERSION} · proof: {mode}</span>
          <span>
            {isLive
              ? 'Underlying compositor, quiz interface, placard interaction, and registered animations remain active.'
              : 'Frozen MASTER reference mode.'}
          </span>
          <span>
            Aperture retains {(TABLET_A21R_AREA_REPORT.maximumApertureRetention * 100).toFixed(2)}% of visible face · hard clip retains {(TABLET_A21R_AREA_REPORT.hardClipRetention * 100).toFixed(2)}% of aperture
          </span>
          {mode === 'utilization' && (
            <span>
              Visible {Math.round(TABLET_A21R_AREA_REPORT.visibleInnerEdgeArea).toLocaleString()} px² · aperture {Math.round(TABLET_A21R_AREA_REPORT.maximumApertureArea).toLocaleString()} px² · hard clip {Math.round(TABLET_A21R_AREA_REPORT.hardClipArea).toLocaleString()} px²
            </span>
          )}
        </div>
      )}
    </div>
  );
}
