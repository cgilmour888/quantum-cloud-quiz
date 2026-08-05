# Quantum Cloud Quiz — Legacy Prototype Archive

This repository preserves the original Quantum Cloud Quiz prototype and the technical investigation performed before the native rebuild.

## Status

- **Development status:** closed as a legacy prototype.
- **Production direction:** superseded by a clean native rebuild in a separate repository.
- **Repository purpose after closeout:** historical reference, requirements evidence, recovery source, and lessons learned.
- **Do not use as the technical foundation of the native rebuild.**

## What remains valuable

- verified question and answer behavior;
- exam-dataset structure and coverage;
- scoring, progress, timing, and navigation requirements;
- visual experiments and diagnostic evidence;
- BorderFrame and SceneEngine investigation;
- installer, rollback, testing, and release-engineering lessons;
- evidence showing why raster-overlay and perspective-mapped content strategies were rejected.

## What must not migrate automatically

- full-page artwork used as a live interface surface;
- baked question, answer, or metric text;
- overlay-based tablet and dashboard systems;
- legacy perspective mappings;
- contaminated shell assets;
- obsolete diagnostic routes and temporary proof files;
- old animation engines unless independently redesigned and reapproved.

The authoritative next-build strategy is stored under `docs/continuity/`.
