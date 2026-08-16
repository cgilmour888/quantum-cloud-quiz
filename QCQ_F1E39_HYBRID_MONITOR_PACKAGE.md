# QCQ F1E39 — Hybrid Auxiliary Monitor Package

## Scope

This package upgrades only the central auxiliary monitor opened by the left-side command controls. It does not replace or rewrite the F1E37 current-authority page.

## Frozen authority

- Branch: `integration/qcq-reconciled-20260807-193701`
- Current-authority path: `public/qcq-current/index.html`
- Frozen authority blob: `b9575d024d93261a8e6d3257f30f1a75cbc9b1ef`
- Certified raster substrate: `public/qcq-current/assets/business-card/business-card-raster-authority.png`
- Certified raster blob: `10f1118457cd65e7c2cb8429e350c9fba55ad16a`

## Governed implementation

- `public/qcq-current/assets/approved-monitor/approved-monitor.js`
  - L1 Dashboard
  - L2 Leaderboard
  - L3 Achievements
  - L4 physical History control -> approved Dataset monitor
  - L5 Analytics
  - L6 Settings, preserving existing settings controllers
  - L7 Logout, preserving existing logout controller
- `public/qcq-current/assets/approved-monitor/approved-monitor.css`
  - Uses the certified business-card raster authority as the shared metallic physical substrate.
  - Live DOM values remain above the raster layer.
  - Provides per-view layout, panel registration, typography, live controls, focus states, reduced-motion behavior, and forced-colors fallback.
- `QCQ_APPROVED_MONITOR_VISUAL_ACCEPTANCE.command`
  - Confirms branch and frozen authority.
  - Confirms the raster dependency and all L1-L7 routes.
  - Runs JavaScript syntax validation.
  - Starts an isolated local Vite server.
  - Verifies monitor JS/CSS/raster over HTTP.
  - Opens the site for ordered human visual acceptance.

## Implementation commits

- `b6ad5ae61156655cfbe8786e934912c3d53abd44` — restore all auxiliary hybrid views.
- `e42ffdc05df2a183a52ac2ff8f5eed6521c0206d` — apply certified raster hybrid treatment.
- `f84dcf775eb962c22d274f0f322011e25f515a43` — package F1E39 hybrid visual acceptance.
- `6e891062535455dd231c7c51e0ebcc79e799ed08` — add the F1E39 package manifest.

## Change boundary proof

Relative to F1E38 base `cadff61ca74f648e3be814b021a3fb76768f1470`, the complete F1E39 package changes only:

1. `public/qcq-current/assets/approved-monitor/approved-monitor.js`
2. `public/qcq-current/assets/approved-monitor/approved-monitor.css`
3. `QCQ_APPROVED_MONITOR_VISUAL_ACCEPTANCE.command`
4. `QCQ_F1E39_HYBRID_MONITOR_PACKAGE.md`

The F1E37 authority blob remains `b9575d024d93261a8e6d3257f30f1a75cbc9b1ef`.

## Local acceptance

From the QCQ repository root:

```bash
chmod +x QCQ_APPROVED_MONITOR_VISUAL_ACCEPTANCE.command
./QCQ_APPROVED_MONITOR_VISUAL_ACCEPTANCE.command
```

Human acceptance remains required for pixel-level visual approval. Do not promote beyond this checkpoint until the live browser has been reviewed against the approved concept images.
