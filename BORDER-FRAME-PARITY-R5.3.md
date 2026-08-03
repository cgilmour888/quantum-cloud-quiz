# BorderFrameEngine R5.3 — Channel Parity Diagnostic

R5.3 does not attempt to animate the true purple geometry.
It first proves whether purple can move through the exact cyan mask, phase route,
renderer, compositor pass, and frame loop that are already visually approved.

## Diagnostic modes

- `?qcq-border-debug=purple-cyan-clone`
  - exact cyan mask
  - exact cyan phase
  - exact cyan packet structure
  - purple color
  - counter-clockwise direction

- `?qcq-border-debug=purple-cyan-tracer`
  - exact cyan mask
  - exact cyan phase
  - one white-violet tracer head
  - one long tail
  - counter-clockwise direction

No true purple mask or purple phase atlas is used in R5.3.
