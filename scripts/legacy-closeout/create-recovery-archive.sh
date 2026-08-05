#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  bash create-recovery-archive.sh --project-dir PATH [--output-dir PATH]

Requirements:
- the working tree must be clean;
- the final closeout commit and tag should already exist;
- the repository must have at least one commit.
USAGE
}

PROJECT_DIR=""
OUTPUT_DIR="$HOME/Desktop"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-dir) PROJECT_DIR="${2:-}"; shift 2 ;;
    --output-dir) OUTPUT_DIR="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "FAIL: unknown argument: $1"; usage; exit 1 ;;
  esac
done

[[ -n "$PROJECT_DIR" ]] || { echo "FAIL: --project-dir is required."; exit 1; }
PROJECT_DIR="$(cd "$PROJECT_DIR" 2>/dev/null && pwd || true)"
[[ -n "$PROJECT_DIR" && -d "$PROJECT_DIR/.git" ]] || { echo "FAIL: not a Git repository."; exit 1; }
mkdir -p "$OUTPUT_DIR"
OUTPUT_DIR="$(cd "$OUTPUT_DIR" && pwd)"

if [[ -n "$(git -C "$PROJECT_DIR" status --porcelain)" ]]; then
  echo "FAIL: the working tree is not clean. Commit the final closeout state before creating the recovery archive."
  git -C "$PROJECT_DIR" status --short
  exit 1
fi

BRANCH="$(git -C "$PROJECT_DIR" symbolic-ref --quiet --short HEAD 2>/dev/null || echo DETACHED)"
HEAD_SHA="$(git -C "$PROJECT_DIR" rev-parse HEAD)"
SHORT_SHA="$(git -C "$PROJECT_DIR" rev-parse --short=12 HEAD)"
DATE="$(date +%Y%m%d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
NAME="QCQ-LEGACY-M00-FINAL-ARCHIVE-v1.0.0-${DATE}-${SHORT_SHA}"
WORK="$OUTPUT_DIR/$NAME"
ZIP="$OUTPUT_DIR/$NAME.zip"
SHA_FILE="$ZIP.sha256"

rm -rf "$WORK" "$ZIP" "$SHA_FILE"
mkdir -p "$WORK"/{git,source,reports,restore,manifests}

printf '%s\n' "$BRANCH" > "$WORK/git/BRANCH.txt"
printf '%s\n' "$HEAD_SHA" > "$WORK/git/HEAD.txt"
git -C "$PROJECT_DIR" branch -avv > "$WORK/git/BRANCHES.txt"
git -C "$PROJECT_DIR" tag --sort=-creatordate > "$WORK/git/TAGS.txt"
git -C "$PROJECT_DIR" status --short --branch > "$WORK/git/STATUS.txt"
{
  git -C "$PROJECT_DIR" remote -v 2>/dev/null || true
} | sed -E 's#(https?://)[^/@]+@#\1[REDACTED]@#g' > "$WORK/git/REMOTES-REDACTED.txt"

git -C "$PROJECT_DIR" bundle create "$WORK/git/quantum-cloud-quiz-legacy.bundle" --all
git bundle verify "$WORK/git/quantum-cloud-quiz-legacy.bundle" > "$WORK/reports/GIT-BUNDLE-VERIFY.txt" 2>&1

git -C "$PROJECT_DIR" archive --format=tar.gz --prefix=quantum-cloud-quiz-legacy/ -o "$WORK/source/quantum-cloud-quiz-legacy-${SHORT_SHA}.tar.gz" HEAD

if [[ -d "$PROJECT_DIR/docs/legacy-archive" ]]; then
  tar -C "$PROJECT_DIR" -czf "$WORK/reports/legacy-closeout-reports.tar.gz" docs/legacy-archive docs/continuity ARCHIVED-PROJECT.md 2>/dev/null || \
    tar -C "$PROJECT_DIR" -czf "$WORK/reports/legacy-closeout-reports.tar.gz" docs/legacy-archive docs/continuity
fi

cat > "$WORK/README-FIRST.md" <<README
# Quantum Cloud Quiz Legacy Final Recovery Archive

- Created: $(date '+%Y-%m-%dT%H:%M:%S%z')
- Source repository: $PROJECT_DIR
- Final branch: $BRANCH
- Final HEAD: $HEAD_SHA
- Archive ID: $NAME

This archive contains a complete Git bundle with all reachable refs, a source archive for the final HEAD, closeout reports, checksums, and restoration scripts. It does not include secrets, ignored dependency folders, or build caches.
README

cat > "$WORK/restore/restore-macos.sh" <<'RESTORE'
#!/usr/bin/env bash
set -euo pipefail

ARCHIVE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DESTINATION="${1:-$HOME/projects/quantum-cloud-quiz-legacy-restored}"
BUNDLE="$ARCHIVE_ROOT/git/quantum-cloud-quiz-legacy.bundle"
BRANCH="$(cat "$ARCHIVE_ROOT/git/BRANCH.txt")"
EXPECTED_HEAD="$(cat "$ARCHIVE_ROOT/git/HEAD.txt")"

[[ ! -e "$DESTINATION" ]] || { echo "FAIL: destination already exists: $DESTINATION"; exit 1; }
git bundle verify "$BUNDLE"
git clone "$BUNDLE" "$DESTINATION"
cd "$DESTINATION"
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git checkout "$BRANCH"
elif git show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
  git checkout -b "$BRANCH" "origin/$BRANCH"
else
  git checkout --detach "$EXPECTED_HEAD"
fi
ACTUAL_HEAD="$(git rev-parse HEAD)"
[[ "$ACTUAL_HEAD" == "$EXPECTED_HEAD" ]] || { echo "FAIL: restored HEAD mismatch."; exit 1; }
echo "RESTORE: PASSED"
echo "Destination: $DESTINATION"
echo "HEAD: $ACTUAL_HEAD"
RESTORE
chmod +x "$WORK/restore/restore-macos.sh"

cat > "$WORK/restore/verify-restore.sh" <<'VERIFY'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
shasum -a 256 -c manifests/SHA256SUMS.txt
git bundle verify git/quantum-cloud-quiz-legacy.bundle
tar -tzf source/*.tar.gz >/dev/null
unzip -t "${ROOT}.zip" >/dev/null 2>&1 || true
echo "RECOVERY CONTENT: VERIFIED"
VERIFY
chmod +x "$WORK/restore/verify-restore.sh"

cat > "$WORK/restore/RESTORE-INSTRUCTIONS.md" <<'RESTOREMD'
# Restore instructions

From the extracted recovery directory:

```bash
bash restore/restore-macos.sh "$HOME/projects/quantum-cloud-quiz-legacy-restored"
```

The script verifies the Git bundle, clones it, checks out the recorded final branch when available, and verifies the final HEAD.
RESTOREMD

TEST_DEST="$OUTPUT_DIR/${NAME}-RESTORE-TEST"
rm -rf "$TEST_DEST"
bash "$WORK/restore/restore-macos.sh" "$TEST_DEST" > "$WORK/reports/RESTORE-SMOKE-TEST.txt" 2>&1
RESTORED_HEAD="$(git -C "$TEST_DEST" rev-parse HEAD)"
[[ "$RESTORED_HEAD" == "$HEAD_SHA" ]] || { echo "FAIL: restoration smoke test HEAD mismatch."; exit 1; }
rm -rf "$TEST_DEST"

(
  cd "$WORK"
  find . -type f ! -path './manifests/SHA256SUMS.txt' -print0 | while IFS= read -r -d '' file; do
    hash="$(shasum -a 256 "$file" | awk '{print $1}')"
    printf '%s  %s\n' "$hash" "${file#./}"
  done > manifests/SHA256SUMS.txt
  find . -type f | sort > manifests/FILE-MANIFEST.txt
  shasum -a 256 -c manifests/SHA256SUMS.txt > reports/CONTENT-CHECKSUM-VERIFY.txt
)

(
  cd "$OUTPUT_DIR"
  /usr/bin/zip -qry "$ZIP" "$NAME"
)
unzip -t "$ZIP" > "$ZIP.integrity.txt"
shasum -a 256 "$ZIP" > "$SHA_FILE"

echo "QCQ LEGACY RECOVERY ARCHIVE: PASSED"
echo "Final branch: $BRANCH"
echo "Final HEAD: $HEAD_SHA"
echo "Recovery directory: $WORK"
echo "Recovery ZIP: $ZIP"
echo "Recovery checksum: $SHA_FILE"
echo "SHA-256: $(awk '{print $1}' "$SHA_FILE")"
echo
echo "No GitHub release, commit, push, or repository archive action was performed."
