#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR=""
TAG="qcq-legacy-final-v1.0.0"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-dir) PROJECT_DIR="${2:-}"; shift 2 ;;
    --tag) TAG="${2:-}"; shift 2 ;;
    *) echo "FAIL: unknown argument: $1"; exit 1 ;;
  esac
done
[[ -n "$PROJECT_DIR" ]] || { echo "FAIL: --project-dir is required."; exit 1; }
PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"
[[ -d "$PROJECT_DIR/.git" ]] || { echo "FAIL: not a Git repository."; exit 1; }

BRANCH="$(git -C "$PROJECT_DIR" symbolic-ref --quiet --short HEAD)"
LOCAL_HEAD="$(git -C "$PROJECT_DIR" rev-parse HEAD)"
REMOTE_HEAD="$(git -C "$PROJECT_DIR" ls-remote origin "refs/heads/$BRANCH" | awk '{print $1}')"
REMOTE_TAG="$(git -C "$PROJECT_DIR" ls-remote origin "refs/tags/$TAG^{}" | awk '{print $1}')"
if [[ -z "$REMOTE_TAG" ]]; then
  REMOTE_TAG="$(git -C "$PROJECT_DIR" ls-remote origin "refs/tags/$TAG" | awk '{print $1}')"
fi

[[ "$REMOTE_HEAD" == "$LOCAL_HEAD" ]] || {
  echo "FAIL: remote branch does not match local HEAD."
  echo "Local:  $LOCAL_HEAD"
  echo "Remote: ${REMOTE_HEAD:-missing}"
  exit 1
}
[[ -n "$REMOTE_TAG" ]] || { echo "FAIL: remote tag is missing: $TAG"; exit 1; }

echo "REMOTE CLOSEOUT VERIFICATION: PASSED"
echo "Branch: $BRANCH"
echo "HEAD: $LOCAL_HEAD"
echo "Tag: $TAG"
