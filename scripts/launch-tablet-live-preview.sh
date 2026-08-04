#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${QCQ_PROJECT_DIR:-$HOME/projects/quantum-cloud-quiz}"
HOST="${QCQ_PREVIEW_HOST:-127.0.0.1}"
PORT="${QCQ_PREVIEW_PORT:-5173}"

cd "$PROJECT_DIR"

echo "=============================================================="
echo " QCQ A2.1R LIVE ANIMATED TABLET-MAPPING PREVIEW"
echo "=============================================================="
echo
echo "Open after Vite reports ready:"
echo "  Full registration: http://$HOST:$PORT/?qcq-tablet-a21r-live=all"
echo "  Perspective grid:  http://$HOST:$PORT/?qcq-tablet-a21r-live=grid"
echo "  Quiz hosts:        http://$HOST:$PORT/?qcq-tablet-a21r-live=quiz"
echo "  Dashboard host:    http://$HOST:$PORT/?qcq-tablet-a21r-live=dashboard"
echo "  Business host:     http://$HOST:$PORT/?qcq-tablet-a21r-live=business"
echo
echo "Optional controls:"
echo "  &qcq-tablet-opacity=0.65   geometry opacity from 0.15 to 1.0"
echo "  &qcq-tablet-hud=0          hide the diagnostic banner"
echo
echo "The normal compositor and every animation already registered by"
echo "useSceneEngine remain active. Press Control-C to stop the server."
echo

exec npm run dev:tablet-live -- --port "$PORT"
