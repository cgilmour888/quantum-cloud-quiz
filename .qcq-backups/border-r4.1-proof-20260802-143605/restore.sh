#!/usr/bin/env bash
set -euo pipefail
ROOT="/Users/carlgilmour/projects/quantum-cloud-quiz"
rm -rf   "$ROOT/src/components/scene/debug/BorderFrameProofLayer.jsx"   "$ROOT/public/images/master/derived/border-frame/proofs/static-4k"   "$ROOT/scripts/verify-border-proof-r4-1-gates.mjs"
tar -C "$ROOT" -xzf "/Users/carlgilmour/projects/quantum-cloud-quiz/.qcq-backups/border-r4.1-proof-20260802-143605/prior-state.tar.gz"
echo "Restored pre-R4.1 proof files from /Users/carlgilmour/projects/quantum-cloud-quiz/.qcq-backups/border-r4.1-proof-20260802-143605/prior-state.tar.gz"
