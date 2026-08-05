#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR=""
CONFIRM=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-dir) PROJECT_DIR="${2:-}"; shift 2 ;;
    --confirm) CONFIRM="${2:-}"; shift 2 ;;
    *) echo "FAIL: unknown argument: $1"; exit 1 ;;
  esac
done
[[ -n "$PROJECT_DIR" ]] || { echo "FAIL: --project-dir is required."; exit 1; }
[[ "$CONFIRM" == "QCQ_LEGACY_REMOTE_VERIFIED" ]] || {
  echo "FAIL: cleanup confirmation phrase missing."
  echo "Required: --confirm QCQ_LEGACY_REMOTE_VERIFIED"
  exit 1
}
PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"
[[ -d "$PROJECT_DIR/.git" ]] || { echo "FAIL: not a Git repository."; exit 1; }

for rel in node_modules dist coverage .vite playwright-report test-results; do
  path="$PROJECT_DIR/$rel"
  if [[ -e "$path" ]]; then
    rm -rf "$path"
    echo "Removed generated directory: $path"
  fi
done

echo "Conservative project-cache cleanup complete."
echo "Source, Git history, assets, reports, and recovery packages were preserved."
