#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-dir) PROJECT_DIR="${2:-}"; shift 2 ;;
    *) echo "FAIL: unknown argument: $1"; exit 1 ;;
  esac
done
[[ -n "$PROJECT_DIR" ]] || { echo "FAIL: --project-dir is required."; exit 1; }
PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"
[[ -d "$PROJECT_DIR/.git" ]] || { echo "FAIL: not a Git repository."; exit 1; }

cat <<'INTRO'
DRY RUN ONLY — nothing will be deleted.
The following generated directories are candidates for deletion after:
1. the final commit and tag are pushed;
2. remote verification passes;
3. the recovery ZIP and checksum are uploaded;
4. restoration from the recovery ZIP passes.
INTRO

for rel in node_modules dist coverage .vite playwright-report test-results; do
  path="$PROJECT_DIR/$rel"
  if [[ -e "$path" ]]; then
    size="$(du -sh "$path" 2>/dev/null | awk '{print $1}')"
    echo "$size  $path"
  fi
done

echo
echo "Not included in deletion: source code, .git, artwork, datasets, audio, reports, recovery ZIPs, or files outside the repository."
