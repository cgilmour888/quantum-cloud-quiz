# Unified MASTER Compositor — R3 Foundation

## Decision

The former visible-overlay architecture is retired for decorative animation.
The protected MASTER and every future decorative engine now share one canvas,
one backing-store transform, one device-pixel-ratio policy, and one normalized UV
coordinate plane.

## Why

Independent `<img>`, canvas, SVG, and CSS transforms created visible double
vision, echoing, over-extension, and fractional-pixel drift. The unified
compositor removes that failure mode at the rendering-foundation level.

## Runtime stack

1. `scene-artwork--fallback` displays the protected MASTER during loading or if
   the canvas renderer is unavailable.
2. `MasterSceneCompositor` loads the verified WebP first and PNG second.
3. WebGL2 renders the MASTER as the base texture inside the same canvas future
   animation engines will use.
4. The fallback is hidden only after the compositor is ready.
5. Semantic quiz text and transparent controls remain accessible DOM elements.

## Current approval boundary

The compositor is active. BorderFrameEngine has migrated to the shared plane,
but border masks and motion remain disabled until the static border-only proof
is accepted.

## Local A/B test

Default compositor:

`http://localhost:5174/`

Force the Canvas 2D fallback path:

`http://localhost:5174/?qcq-renderer=fallback`

Both paths must preserve the original full-viewport `object-fit: fill` visual
contract and all existing gameplay behavior.
