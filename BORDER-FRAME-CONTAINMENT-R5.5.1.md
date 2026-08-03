# BorderFrameEngine R5.5.1 — Placard Circuit Containment Correction

## Visual defect corrected

R5.5 promoted the true-purple animation into production but used an over-broad local mask near the placard. The carrier/tracer omitted the original purple frame immediately surrounding the placard and contaminated unrelated ring, Star of David, and altar pixels above it.

## R5.5.1 rule

- Restore purple linework traced directly from the immutable MASTER inside the physical placard outline and outside the inner black face.
- Preserve only connected left/right approach routes.
- Hard-exclude the inner placard face, concentric-ring area, Star of David, and altar/background zone.
- Bind normal production, current diagnostics, tracer diagnostics, event surges, glow, bloom, and tails to one thresholded mask sampler.
- Preserve the independent placard hit zone and tablet business-card workflow byte-for-byte.

## Inspection routes

- `?qcq-border-proof=placard-circuit-containment`
- `?qcq-border-proof=placard-circuit-isolated`
- `?qcq-border-debug=purple-mask-cyan-phase`
- `?qcq-border-debug=purple-mask-tracer`
- `/`

No Git commit or push is permitted until the integrated `/` route is approved from a screenshot and short video.
