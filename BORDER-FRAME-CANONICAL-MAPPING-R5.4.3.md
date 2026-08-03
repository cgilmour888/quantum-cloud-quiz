# BorderFrameEngine R5.4.3 — Canonical Nameplate Mapping

## Correction

The lower-center focus route no longer loads the separately rasterized
`purple-lower-center-focus-4k.png`. That asset is retained only for audit and
backward verification. It is not referenced by the application.

Both the isolated focus proof and MASTER registration proof now sample the
same 3840 × 2160 luminance mask used by the live true-purple renderer. The
physical face polygon, MASTER, purple mask, centerline, and focus viewport all
share origin `(0, 0)` and center `x = 1920`.

## Proof routes

- Isolated canonical focus:
  `?qcq-border-proof=purple-lower-center-focus`
- MASTER registration comparison:
  `?qcq-border-proof=purple-lower-center-focus&qcq-border-registration=master`
- Canonical red-boundary classification:
  `?qcq-border-proof=purple-lower-center-boundary`
- Live true-purple current:
  `?qcq-border-debug=purple-mask-cyan-phase`
- Live true-purple tracer:
  `?qcq-border-debug=purple-mask-tracer`

## Invariants

- Protected MASTER checksum unchanged.
- Approved cyan mask and phase checksum unchanged.
- Live true-purple mask checksum unchanged.
- Border renderer and shader checksum unchanged.
- Purple flow remains counter-clockwise.
- Canonical horizontal registration error is zero pixels.
