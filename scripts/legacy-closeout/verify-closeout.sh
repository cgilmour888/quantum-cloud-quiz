#!/usr/bin/env bash
set -u

usage() {
  cat <<'USAGE'
Usage:
  bash verify-closeout.sh --project-dir PATH [--validation record|strict]

record (default): run available checks and record pass/fail without hiding failures.
strict: return nonzero when any requested check fails.
USAGE
}

PROJECT_DIR=""
VALIDATION="record"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-dir) PROJECT_DIR="${2:-}"; shift 2 ;;
    --validation) VALIDATION="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "FAIL: unknown argument: $1"; usage; exit 1 ;;
  esac
done

[[ -n "$PROJECT_DIR" ]] || { echo "FAIL: --project-dir is required."; exit 1; }
PROJECT_DIR="$(cd "$PROJECT_DIR" 2>/dev/null && pwd || true)"
[[ -n "$PROJECT_DIR" && -d "$PROJECT_DIR/.git" ]] || { echo "FAIL: not a Git repository."; exit 1; }
[[ "$VALIDATION" == "record" || "$VALIDATION" == "strict" ]] || { echo "FAIL: invalid validation mode."; exit 1; }

GENERATED="$PROJECT_DIR/docs/legacy-archive/generated"
mkdir -p "$GENERATED"
SUMMARY="$GENERATED/VERIFICATION-SUMMARY.md"
LOG_DIR="$GENERATED/verification-logs"
mkdir -p "$LOG_DIR"
: > "$SUMMARY"
FAILURES=0

run_check() {
  name="$1"
  shift
  log="$LOG_DIR/${name}.log"
  echo "Running: $name"
  if (cd "$PROJECT_DIR" && "$@") > "$log" 2>&1; then
    printf -- '- %s: PASSED\n' "$name" >> "$SUMMARY"
    echo "PASSED: $name"
  else
    code=$?
    printf -- '- %s: FAILED (exit %s)\n' "$name" "$code" >> "$SUMMARY"
    echo "FAILED: $name (exit $code)"
    FAILURES=$((FAILURES + 1))
  fi
}

{
  echo "# Legacy Closeout Verification"
  echo
  echo "- Captured: $(date '+%Y-%m-%dT%H:%M:%S%z')"
  echo "- Repository: \`$PROJECT_DIR\`"
  echo "- Branch: \`$(git -C "$PROJECT_DIR" symbolic-ref --quiet --short HEAD 2>/dev/null || echo DETACHED)\`"
  echo "- HEAD: \`$(git -C "$PROJECT_DIR" rev-parse HEAD)\`"
  echo "- Validation mode: \`$VALIDATION\`"
  echo
  echo "## Results"
} > "$SUMMARY"

run_check git-diff-check git diff --check

if [[ -f "$PROJECT_DIR/package.json" ]]; then
  if command -v npm >/dev/null 2>&1; then
    if node -e "const p=require('./package.json'); process.exit(p.scripts&&p.scripts.test?0:1)" >/dev/null 2>&1; then
      run_check npm-test npm test
    else
      printf -- '- npm-test: NOT CONFIGURED\n' >> "$SUMMARY"
    fi
    if node -e "const p=require('./package.json'); process.exit(p.scripts&&p.scripts.build?0:1)" >/dev/null 2>&1; then
      run_check npm-build npm run build
    else
      printf -- '- npm-build: NOT CONFIGURED\n' >> "$SUMMARY"
    fi
  else
    printf -- '- npm: UNAVAILABLE\n' >> "$SUMMARY"
    FAILURES=$((FAILURES + 1))
  fi
else
  printf -- '- package.json: NOT PRESENT\n' >> "$SUMMARY"
fi

if [[ -x "$PROJECT_DIR/scripts/verify-tablet-a23.mjs" ]] || [[ -f "$PROJECT_DIR/scripts/verify-tablet-a23.mjs" ]]; then
  run_check verify-tablet-a23 node scripts/verify-tablet-a23.mjs
fi

{
  echo
  echo "## Result"
  if [[ "$FAILURES" -eq 0 ]]; then
    echo "All requested closeout checks passed."
  else
    echo "$FAILURES requested check(s) failed. The failures are preserved as part of the legacy state and must be reviewed before final closeout."
  fi
  echo
  echo "Logs: \`docs/legacy-archive/generated/verification-logs/\`"
} >> "$SUMMARY"

echo
cat "$SUMMARY"

if [[ "$VALIDATION" == "strict" && "$FAILURES" -ne 0 ]]; then
  exit 1
fi
exit 0
