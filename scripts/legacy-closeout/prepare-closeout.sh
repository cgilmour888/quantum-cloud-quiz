#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo 'Usage: bash prepare-closeout.sh --project-dir PATH'
}

PROJECT_DIR=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-dir) PROJECT_DIR="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "FAIL: unknown argument: $1"; usage; exit 1 ;;
  esac
done

[[ -n "$PROJECT_DIR" ]] || { echo "FAIL: --project-dir is required."; exit 1; }
PROJECT_DIR="$(cd "$PROJECT_DIR" 2>/dev/null && pwd || true)"
[[ -n "$PROJECT_DIR" && -d "$PROJECT_DIR/.git" ]] || { echo "FAIL: not a Git repository."; exit 1; }

GENERATED="$PROJECT_DIR/docs/legacy-archive/generated"
mkdir -p "$GENERATED"
TIMESTAMP="$(date '+%Y-%m-%dT%H:%M:%S%z')"
BRANCH="$(git -C "$PROJECT_DIR" symbolic-ref --quiet --short HEAD 2>/dev/null || echo DETACHED)"
HEAD_SHA="$(git -C "$PROJECT_DIR" rev-parse HEAD)"
SHORT_SHA="$(git -C "$PROJECT_DIR" rev-parse --short=12 HEAD)"

sanitize_url() {
  sed -E 's#(https?://)[^/@]+@#\1[REDACTED]@#g; s#(https?://)[^/:]+:[^/@]+@#\1[REDACTED]@#g'
}

{
  echo "QCQ LEGACY REPOSITORY CLOSEOUT — PREPARATION STATE"
  echo "Captured: $TIMESTAMP"
  echo "Repository: $PROJECT_DIR"
  echo "Branch: $BRANCH"
  echo "HEAD: $HEAD_SHA"
  echo "Short HEAD: $SHORT_SHA"
  echo "Git: $(git --version 2>/dev/null || echo unavailable)"
  echo "Node: $(node --version 2>/dev/null || echo unavailable)"
  echo "npm: $(npm --version 2>/dev/null || echo unavailable)"
  echo "Operating system: $(sw_vers -productVersion 2>/dev/null || uname -a)"
} > "$GENERATED/REPOSITORY-IDENTITY.txt"

git -C "$PROJECT_DIR" status --short --branch > "$GENERATED/GIT-STATUS.txt"
git -C "$PROJECT_DIR" diff --binary > "$GENERATED/WORKING-TREE.patch"
git -C "$PROJECT_DIR" diff --cached --binary > "$GENERATED/STAGED-WORK.patch"
git -C "$PROJECT_DIR" ls-files --others --exclude-standard > "$GENERATED/UNTRACKED-FILES.txt"
git -C "$PROJECT_DIR" log --oneline --decorate --graph -n 250 > "$GENERATED/RECENT-HISTORY.txt"
git -C "$PROJECT_DIR" branch -avv > "$GENERATED/BRANCHES.txt"
git -C "$PROJECT_DIR" tag --sort=-creatordate > "$GENERATED/TAGS.txt"
{
  git -C "$PROJECT_DIR" remote -v 2>/dev/null || true
} | sanitize_url > "$GENERATED/REMOTES-REDACTED.txt"

find "$PROJECT_DIR" \
  -path "$PROJECT_DIR/.git" -prune -o \
  -path "$PROJECT_DIR/node_modules" -prune -o \
  -path "$PROJECT_DIR/dist" -prune -o \
  -path "$PROJECT_DIR/coverage" -prune -o \
  -type f -size +52428800c -print | sed "s#^$PROJECT_DIR/##" | sort > "$GENERATED/FILES-OVER-50MB.txt"
find "$PROJECT_DIR" \
  -path "$PROJECT_DIR/.git" -prune -o \
  -path "$PROJECT_DIR/node_modules" -prune -o \
  -path "$PROJECT_DIR/dist" -prune -o \
  -path "$PROJECT_DIR/coverage" -prune -o \
  -type f -size +104857600c -print | sed "s#^$PROJECT_DIR/##" | sort > "$GENERATED/FILES-OVER-100MB.txt"

find "$PROJECT_DIR" \
  -path "$PROJECT_DIR/.git" -prune -o \
  -path "$PROJECT_DIR/node_modules" -prune -o \
  -type f \( \
    -name '.env' -o -name '.env.*' -o -name '*.pem' -o -name '*.key' -o \
    -name 'id_rsa' -o -name 'id_ed25519' -o -name '*credentials*' -o \
    -name '*secret*' -o -name '*token*' \
  \) -print | sed "s#^$PROJECT_DIR/##" | sort > "$GENERATED/SENSITIVE-FILENAME-REVIEW.txt"

SECRET_PATTERN='(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|AWS_SECRET_ACCESS_KEY|CLOUDFLARE_API_TOKEN|GITHUB_TOKEN[[:space:]]*=)'
: > "$GENERATED/POTENTIAL-SECRET-FILES.txt"
while IFS= read -r -d '' rel; do
  file="$PROJECT_DIR/$rel"
  [[ -f "$file" ]] || continue
  size="$(wc -c < "$file" | tr -d ' ')"
  [[ "$size" -le 5242880 ]] || continue
  if LC_ALL=C grep -IEl "$SECRET_PATTERN" "$file" >/dev/null 2>&1; then
    printf '%s\n' "$rel" >> "$GENERATED/POTENTIAL-SECRET-FILES.txt"
  fi
done < <(git -C "$PROJECT_DIR" ls-files -z --cached --others --exclude-standard)
sort -u "$GENERATED/POTENTIAL-SECRET-FILES.txt" -o "$GENERATED/POTENTIAL-SECRET-FILES.txt"

TRACKED_COUNT="$(git -C "$PROJECT_DIR" ls-files | wc -l | tr -d ' ')"
UNTRACKED_COUNT="$(wc -l < "$GENERATED/UNTRACKED-FILES.txt" | tr -d ' ')"
OVER_50="$(wc -l < "$GENERATED/FILES-OVER-50MB.txt" | tr -d ' ')"
OVER_100="$(wc -l < "$GENERATED/FILES-OVER-100MB.txt" | tr -d ' ')"
SENSITIVE="$(wc -l < "$GENERATED/SENSITIVE-FILENAME-REVIEW.txt" | tr -d ' ')"
SECRET_FILES="$(wc -l < "$GENERATED/POTENTIAL-SECRET-FILES.txt" | tr -d ' ')"
DIRTY_COUNT="$(git -C "$PROJECT_DIR" status --porcelain | wc -l | tr -d ' ')"

cat > "$GENERATED/CLOSEOUT-READINESS.md" <<REPORT
# Legacy Closeout Readiness

- Captured: $TIMESTAMP
- Repository: \`$PROJECT_DIR\`
- Branch: \`$BRANCH\`
- HEAD: \`$HEAD_SHA\`
- Tracked files: $TRACKED_COUNT
- Untracked non-ignored files: $UNTRACKED_COUNT
- Current status entries: $DIRTY_COUNT
- Files larger than 50 MB: $OVER_50
- Files larger than 100 MB: $OVER_100
- Sensitive-looking filenames requiring review: $SENSITIVE
- Files matching potential secret patterns: $SECRET_FILES

## Required review before staging

1. Review \`GIT-STATUS.txt\`.
2. Review \`UNTRACKED-FILES.txt\`.
3. Review \`FILES-OVER-50MB.txt\` and \`FILES-OVER-100MB.txt\`.
4. Review \`SENSITIVE-FILENAME-REVIEW.txt\`.
5. Review \`POTENTIAL-SECRET-FILES.txt\` without committing any actual secret.
6. Confirm no credentials, private keys, tokens, or local-only files will be committed.
7. Run the verification script and record tests/builds.
8. Apply the archive banner to the root README.
9. Commit only after the reports accurately describe the final legacy state.
REPORT

cat > "$GENERATED/PROJECT-STATE-FINAL.md" <<REPORT
# Quantum Cloud Quiz Legacy Final State

## Repository

- Path: \`$PROJECT_DIR\`
- Branch at capture: \`$BRANCH\`
- HEAD at capture: \`$HEAD_SHA\`
- Captured: $TIMESTAMP

## Disposition

This repository is being closed as the legacy prototype. A separate repository will host the native rebuild. This repository remains the authoritative record of the prototype's code, Git history, requirements evidence, test reports, visual experiments, and engineering lessons.

## Verification

Test and build results are written by \`verify-closeout.sh\` to this directory. The final Git commit and tag must be recorded after they are created.

## Restore authority

The final recovery archive must contain a verified Git bundle, a source archive for the final commit, checksums, closeout reports, and restoration scripts.
REPORT

node - "$GENERATED/PROJECT-STATE.json" "$PROJECT_DIR" "$BRANCH" "$HEAD_SHA" "$TIMESTAMP" "$TRACKED_COUNT" "$UNTRACKED_COUNT" "$DIRTY_COUNT" <<'NODE'
const fs = require('fs');
const [out, repo, branch, head, captured, tracked, untracked, dirty] = process.argv.slice(2);
const data = {
  project: 'Quantum Cloud Quiz',
  status: 'legacy-closeout-in-progress',
  repository_path: repo,
  branch,
  head,
  captured_at: captured,
  tracked_file_count: Number(tracked),
  untracked_nonignored_count: Number(untracked),
  working_tree_status_entry_count: Number(dirty),
  next_repository: 'quantum-cloud-quiz-native',
  next_milestone: 'QCQ-NATIVE-M00 — Legacy Archive and Source Vault',
  commit_performed: false,
  push_performed: false,
  tag_created: false,
  github_archived: false
};
fs.writeFileSync(out, JSON.stringify(data, null, 2) + '\n', 'utf8');
NODE

git -C "$PROJECT_DIR" status --short --branch > "$GENERATED/FINAL-GIT-STATUS.txt"
git -C "$PROJECT_DIR" ls-files --others --exclude-standard > "$GENERATED/FINAL-UNTRACKED-FILES.txt"

: > "$GENERATED/FILE-MANIFEST.txt"
: > "$GENERATED/FILE-SHA256SUMS.txt"
while IFS= read -r -d '' rel; do
  [[ -f "$PROJECT_DIR/$rel" ]] || continue
  case "$rel" in
    docs/legacy-archive/generated/FILE-MANIFEST.txt|docs/legacy-archive/generated/FILE-SHA256SUMS.txt) continue ;;
  esac
  printf '%s\n' "$rel" >> "$GENERATED/FILE-MANIFEST.txt"
  hash="$(shasum -a 256 "$PROJECT_DIR/$rel" | awk '{print $1}')"
  printf '%s  %s\n' "$hash" "$rel" >> "$GENERATED/FILE-SHA256SUMS.txt"
done < <(git -C "$PROJECT_DIR" ls-files -z --cached --others --exclude-standard)

echo "Legacy closeout preparation reports created:"
echo "$GENERATED"
echo
echo "Review before staging:"
echo "  $GENERATED/GIT-STATUS.txt"
echo "  $GENERATED/UNTRACKED-FILES.txt"
echo "  $GENERATED/FILES-OVER-50MB.txt"
echo "  $GENERATED/FILES-OVER-100MB.txt"
echo "  $GENERATED/SENSITIVE-FILENAME-REVIEW.txt"
echo "  $GENERATED/POTENTIAL-SECRET-FILES.txt"
echo
echo "No commit, push, tag, reset, or deletion was performed."
