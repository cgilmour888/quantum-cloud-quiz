#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-$(pwd)}"
PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"
GITIGNORE="$PROJECT_DIR/.gitignore"
MARKER_START="# QCQ LEGACY CLOSEOUT GENERATED-FILE RULES"
MARKER_END="# END QCQ LEGACY CLOSEOUT GENERATED-FILE RULES"

if grep -Fq "$MARKER_START" "$GITIGNORE" 2>/dev/null; then
  echo "Closeout .gitignore rules already present."
  exit 0
fi

cat >> "$GITIGNORE" <<'RULES'

# QCQ LEGACY CLOSEOUT GENERATED-FILE RULES
node_modules/
dist/
coverage/
.vite/
playwright-report/
test-results/
.DS_Store
*.log
*.tmp
*.swp
# END QCQ LEGACY CLOSEOUT GENERATED-FILE RULES
RULES

echo "Appended conservative generated-file rules to: $GITIGNORE"
