import { assetPath } from '../../../utils/assetPath.js';

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
});

export function readBorderFrameProofMode() {
  const value = new URLSearchParams(globalThis.location?.search ?? '')
    .get('qcq-border-proof');
  return Object.hasOwn(PROOF_MODES, value) ? value : null;
}

export function BorderFrameProofLayer({ mode }) {
  const proof = mode ? PROOF_MODES[mode] : null;
  if (!proof) return null;

  return (
    <figure
      className="border-proof-layer"
      data-border-proof-view={mode}
      aria-label={proof.label}
    >
      <img
        className="border-proof-layer__image"
        src={assetPath(`${PROOF_ROOT}/${proof.file}`)}
        alt=""
        draggable={false}
      />
      <figcaption className="border-proof-layer__badge">
        <strong>STATIC BORDER PROOF</strong>
        <span>{proof.label}</span>
      </figcaption>
    </figure>
  );
}
