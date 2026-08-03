# BorderFrameEngine R5.4 — True Purple Mask Parity

R5.4 changes one major variable after the successful R5.3 cyan-parity diagnostic:

- R5.3: cyan mask + cyan phase + purple counter-clockwise shader.
- R5.4: true purple mask + cyan phase + the same approved purple counter-clockwise shader.

The true-purple mask includes the outer purple perimeter, lower-center purple circuit extensions, and placard-adjacent conduit threads. The physical nameplate face remains visually untouched. The legacy occlusion atlas is intentionally bypassed for these R5.4 diagnostic modes because it suppressed the active lower-center circuitry.

## Proof routes

- `?qcq-border-proof=purple-true-mask`
- `?qcq-border-proof=purple-lower-center-boundary`
- `?qcq-border-proof=purple-lower-center-focus`

## Live diagnostic routes

- `?qcq-border-debug=purple-mask-cyan-phase`
- `?qcq-border-debug=purple-mask-tracer`

R5.4 does not introduce a dedicated purple phase map. That remains a later phase after the true geometry is visually approved.
