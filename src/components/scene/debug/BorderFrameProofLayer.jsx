import { assetPath } from '../../../utils/assetPath.js';
import {
  BORDER_PROOF_ASSETS,
  LOWER_CENTER_FOCUS_VIEWBOX,
  MASTER_PLANE,
  NAMEPLATE_FACE_POLYGON,
  PLACARD_PROOF_GEOMETRY,
  formatPolygon,
  formatViewBox,
} from './borderFrameProofGeometry.js';

const PROOF_ROOT = 'images/master/derived/border-frame/proofs/static-4k';

const PROOF_MODES = Object.freeze({
  master: Object.freeze({
    label: 'MASTER BASELINE — protected 4K artwork only',
    file: 'master-4k.png',
  }),
  overlay: Object.freeze({
    label: 'OVERLAY PROOF — registered cyan, orange, and purple masks',
    file: 'border-overlay-4k.png',
  }),
  isolated: Object.freeze({
    label: 'ISOLATED PROOF — border masks only; all interior artwork must be absent',
    file: 'border-isolated-4k.png',
  }),
  phase: Object.freeze({
    label: 'PHASE PROOF — route progression only',
    file: 'border-phase-4k.png',
  }),
  occlusion: Object.freeze({
    label: 'OCCLUSION PROOF — green permitted routes; red protected regions',
    file: 'border-occlusion-4k.png',
  }),
  'purple-true-mask': Object.freeze({
    label: 'R5.5 PRODUCTION PURPLE MASK — border circuitry active; placard independent',
    canonical: 'mask',
  }),
  'purple-lower-center-boundary': Object.freeze({
    label: 'R5.5 TRIM-ANCHORED BOUNDARY — physical face red; placard trim independent',
    canonical: 'boundary',
  }),
  'purple-lower-center-focus': Object.freeze({
    label: 'R5.5 PLACARD FOCUS — lower-most purple trim is the geometry authority',
    canonical: 'focus',
  }),
  'placard-trim-anchor': Object.freeze({
    label: 'R5.5 PLACARD TRIM ANCHOR — traced directly from the MASTER artwork',
    canonical: 'focus',
  }),
  'placard-circuit-containment': Object.freeze({
    label: 'R5.5.1 PLACARD CIRCUIT CONTAINMENT — active purple path over protected MASTER regions',
    file: 'placard-circuit-registration-r5.5.1.png',
  }),
  'placard-circuit-isolated': Object.freeze({
    label: 'R5.5.1 ISOLATED PLACARD CIRCUIT — purple path only; face and background protected',
    file: 'placard-circuit-isolated-r5.5.1.png',
  }),
  'placard-left-bridge-isolated': Object.freeze({
    label: 'R5.5.2 LEFT BRIDGE — corrected artwork-native connector only',
    file: 'placard-left-bridge-isolated-r5.5.2.png',
  }),
  'placard-left-bridge-registration': Object.freeze({
    label: 'R5.5.2 LEFT BRIDGE REGISTRATION — corrected mask over immutable MASTER',
    file: 'placard-left-bridge-registration-r5.5.2.png',
  }),
  'placard-left-bridge-phase': Object.freeze({
    label: 'R5.5.2 PURPLE PHASE — dedicated continuous left-to-right placard transport',
    file: 'placard-left-bridge-phase-r5.5.2.png',
  }),
  'placard-left-microbridge-isolated': Object.freeze({
    label: 'R5.5.3 MICRO-BRIDGE — final artwork-native left transition on black',
    file: 'placard-left-microbridge-isolated-r5.5.3.png',
  }),
  'placard-left-microbridge-registration': Object.freeze({
    label: 'R5.5.3 MICRO-BRIDGE REGISTRATION — corrected path over immutable MASTER',
    file: 'placard-left-microbridge-registration-r5.5.3.png',
  }),
  'placard-left-microbridge-phase': Object.freeze({
    label: 'R5.5.3 MICRO-BRIDGE PHASE — continuous incoming route to placard terminal',
    file: 'placard-left-microbridge-phase-r5.5.3.png',
  }),
  'placard-interaction-mask': Object.freeze({
    label: 'R5.5.3 PLACARD INTERACTION MASK — hover, focus, and activation circuitry only',
    file: 'placard-interaction-mask-r5.5.3.png',
  }),
});

function readRegistrationMode() {
  return new URLSearchParams(globalThis.location?.search ?? '')
    .get('qcq-border-registration') === 'master';
}

function TrimAnchoredPlacardProof({ variant, registration }) {
  const viewBox = LOWER_CENTER_FOCUS_VIEWBOX;
  const maskId = `qcq-purple-production-mask-${variant}`;
  const showMaster = registration;
  const showFace = registration || variant === 'boundary';
  const showPhysicalOutline = registration || variant === 'focus';
  const showTrim = registration || variant === 'focus';
  const fillFace = variant === 'boundary' && !registration;

  return (
    <svg
      className="border-proof-layer__image"
      viewBox={formatViewBox(viewBox)}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Trim-anchored lower-center placard proof"
      data-canonical-plane="3840x2160"
      data-placard-authority="lower-most-purple-trim"
      data-stage-center-used="false"
      data-text-center-used="false"
    >
      <defs>
        <mask
          id={maskId}
          x={MASTER_PLANE.x}
          y={MASTER_PLANE.y}
          width={MASTER_PLANE.width}
          height={MASTER_PLANE.height}
          maskUnits="userSpaceOnUse"
          maskContentUnits="userSpaceOnUse"
        >
          <image
            href={assetPath(BORDER_PROOF_ASSETS.purpleMask)}
            x={MASTER_PLANE.x}
            y={MASTER_PLANE.y}
            width={MASTER_PLANE.width}
            height={MASTER_PLANE.height}
            preserveAspectRatio="none"
          />
        </mask>
      </defs>

      <rect
        x={viewBox.x}
        y={viewBox.y}
        width={viewBox.width}
        height={viewBox.height}
        fill="#000"
      />

      {showMaster ? (
        <image
          href={assetPath(BORDER_PROOF_ASSETS.master)}
          x={MASTER_PLANE.x}
          y={MASTER_PLANE.y}
          width={MASTER_PLANE.width}
          height={MASTER_PLANE.height}
          preserveAspectRatio="none"
          opacity="0.72"
        />
      ) : null}

      <rect
        x={MASTER_PLANE.x}
        y={MASTER_PLANE.y}
        width={MASTER_PLANE.width}
        height={MASTER_PLANE.height}
        fill="#c225ff"
        mask={`url(#${maskId})`}
        opacity={showMaster ? '0.86' : '1'}
      />

      {showPhysicalOutline ? (
        <polygon
          points={formatPolygon(PLACARD_PROOF_GEOMETRY.physicalPolygon)}
          fill="none"
          stroke="#55efff"
          strokeWidth="6"
          vectorEffect="non-scaling-stroke"
          data-proof-role="placard-hit-zone"
        />
      ) : null}

      {showFace ? (
        <polygon
          points={formatPolygon(NAMEPLATE_FACE_POLYGON)}
          fill={fillFace ? '#ff2d2d' : 'none'}
          stroke="#ffffff"
          strokeWidth="5"
          vectorEffect="non-scaling-stroke"
          data-proof-role="physical-face"
        />
      ) : null}

      {showTrim ? (
        <polyline
          points={formatPolygon(PLACARD_PROOF_GEOMETRY.trimPath)}
          fill="none"
          stroke="#ffd31a"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          data-proof-role="lower-purple-trim-authority"
        />
      ) : null}

      {registration ? (
        <g aria-hidden="true">
          <circle
            cx={PLACARD_PROOF_GEOMETRY.trimMidpoint[0]}
            cy={PLACARD_PROOF_GEOMETRY.trimMidpoint[1]}
            r="13"
            fill="#ffd31a"
            stroke="#000"
            strokeWidth="4"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ) : null}
    </svg>
  );
}

export function readBorderFrameProofMode() {
  const value = new URLSearchParams(globalThis.location?.search ?? '')
    .get('qcq-border-proof');
  return Object.hasOwn(PROOF_MODES, value) ? value : null;
}

export function BorderFrameProofLayer({ mode }) {
  const proof = mode ? PROOF_MODES[mode] : null;
  if (!proof) return null;

  const registration = proof.canonical ? readRegistrationMode() : false;

  return (
    <figure
      className="border-proof-layer"
      data-border-proof-view={mode}
      data-border-proof-registration={registration ? 'master' : 'isolated'}
      aria-label={proof.label}
    >
      {proof.canonical ? (
        <TrimAnchoredPlacardProof
          variant={proof.canonical}
          registration={registration}
        />
      ) : (
        <img
          className="border-proof-layer__image"
          src={assetPath(`${PROOF_ROOT}/${proof.file}`)}
          alt=""
          draggable={false}
        />
      )}
      <figcaption className="border-proof-layer__badge">
        <strong>STATIC BORDER PROOF</strong>
        <span>{proof.label}</span>
        {registration ? <span>MASTER registration overlay enabled</span> : null}
      </figcaption>
    </figure>
  );
}
