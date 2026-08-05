#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="${QCQ_PROJECT_DIR:-$HOME/projects/quantum-cloud-quiz}"
cd "$PROJECT_DIR"
echo "A2.3 clean route: http://127.0.0.1:5173/"
echo "A2.3 shell audit: http://127.0.0.1:5173/?qcq-a23-audit=shell"
echo "A2.3 content-plane audit: http://127.0.0.1:5173/?qcq-a23-audit=plane"
echo "A2.3 host audit: http://127.0.0.1:5173/?qcq-a23-audit=hosts"
echo "A2.3 layer audit: http://127.0.0.1:5173/?qcq-a23-audit=layers"
echo "A2.3 perspective audit: http://127.0.0.1:5173/?qcq-a23-audit=perspective"
npm run dev -- --host 127.0.0.1
