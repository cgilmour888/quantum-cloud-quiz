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
README="$PROJECT_DIR/README.md"
mkdir -p "$PROJECT_DIR/docs/legacy-archive/generated"
[[ -f "$README" ]] || { echo "FAIL: README.md not found."; exit 1; }

START='<!-- QCQ_LEGACY_ARCHIVE_NOTICE_START -->'
END='<!-- QCQ_LEGACY_ARCHIVE_NOTICE_END -->'
if grep -Fq "$START" "$README"; then
  echo "Archive banner already present in README.md."
  exit 0
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
cat > "$TMP" <<'BANNER'
<!-- QCQ_LEGACY_ARCHIVE_NOTICE_START -->
> [!IMPORTANT]
> **Archived legacy prototype.** Active Quantum Cloud Quiz production development is moving to a clean native rebuild in a separate repository. This repository remains available for historical reference, recovery, requirements evidence, and lessons learned. See [`ARCHIVED-PROJECT.md`](ARCHIVED-PROJECT.md).
<!-- QCQ_LEGACY_ARCHIVE_NOTICE_END -->

BANNER
cat "$README" >> "$TMP"
cp "$README" "$PROJECT_DIR/docs/legacy-archive/generated/README-BEFORE-ARCHIVE-BANNER.md"
cp "$TMP" "$README"
echo "Archive banner added to README.md."
