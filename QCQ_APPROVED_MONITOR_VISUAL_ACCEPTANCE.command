#!/usr/bin/env bash
set -euo pipefail

REPO="/Users/carlgilmour/Downloads/QCQ"
BRANCH="integration/qcq-reconciled-20260807-193701"
AUTHORITY="public/qcq-current/index.html"
EXPECTED_AUTHORITY_BLOB="b9575d024d93261a8e6d3257f30f1a75cbc9b1ef"

cd "$REPO"

printf '\n============================================================\n'
printf ' QCQ APPROVED MONITOR — HUMAN VISUAL ACCEPTANCE\n'
printf ' CENTRAL TABLET MONITOR ONLY / F1E37 IMMUTABLE\n'
printf '============================================================\n'

printf '\n1. SAFETY GATES\n'
CURRENT_BRANCH="$(git branch --show-current)"
AUTHORITY_BLOB="$(git hash-object "$AUTHORITY")"
STAGED="$(git diff --cached --name-only | wc -l | tr -d ' ')"
printf 'BRANCH:         %s\n' "$CURRENT_BRANCH"
printf 'AUTHORITY BLOB: %s\n' "$AUTHORITY_BLOB"
printf 'STAGED:         %s\n' "$STAGED"
test "$CURRENT_BRANCH" = "$BRANCH"
test "$AUTHORITY_BLOB" = "$EXPECTED_AUTHORITY_BLOB"
test "$STAGED" = "0"

printf '\n2. GOVERNED MODULES\n'
test -f public/qcq-current/assets/approved-monitor/approved-monitor.css
test -f public/qcq-current/assets/approved-monitor/approved-monitor.js
grep -Fq 'qcq-authority-frame' index.html
grep -Fq 'approved-monitor.css' index.html
grep -Fq 'approved-monitor.js' index.html
printf 'ROOT HOST:       PASS\n'
printf 'MONITOR CSS:     PASS\n'
printf 'MONITOR JS:      PASS\n'
printf 'F1E37 UNCHANGED: PASS\n'

printf '\n3. START ISOLATED SERVER\n'
PORT="$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1]); s.close()')"
LOG="$HOME/Downloads/QCQ-APPROVED-MONITOR-${PORT}.log"
nohup npm run dev -- --host 127.0.0.1 --port "$PORT" --strictPort >"$LOG" 2>&1 < /dev/null &
PID=$!
READY=0
for _ in $(seq 1 80); do
  if curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then READY=1; break; fi
  if ! kill -0 "$PID" 2>/dev/null; then cat "$LOG"; exit 1; fi
  sleep 0.25
done
test "$READY" = "1"

curl -fsS "http://127.0.0.1:${PORT}/qcq-current/assets/approved-monitor/approved-monitor.css" >/dev/null
curl -fsS "http://127.0.0.1:${PORT}/qcq-current/assets/approved-monitor/approved-monitor.js" >/dev/null

URL="http://127.0.0.1:${PORT}/"
printf '\n============================================================\n'
printf ' APPROVED MONITOR VISUAL TEST READY\n'
printf '============================================================\n'
printf 'LIVE ROOT URL: %s\n' "$URL"
printf 'SERVER PID:    %s\n' "$PID"
printf 'SERVER LOG:    %s\n' "$LOG"
printf '\nCHECK IN ORDER:\n'
printf '  1. Quiz screen itself is unchanged.\n'
printf '  2. Left and right dashboard artwork is unchanged.\n'
printf '  3. DASHBOARD opens approved brushed-metal monitor.\n'
printf '  4. LEADERBOARD opens approved brushed-metal monitor.\n'
printf '  5. ACHIEVEMENTS opens approved brushed-metal monitor.\n'
printf '  6. HISTORY physical button remains untouched and opens DATASET monitor.\n'
printf '  7. ANALYTICS opens approved brushed-metal monitor.\n'
printf '  8. SETTINGS remains functional and receives approved metal treatment.\n'
printf '  9. LOGOUT remains functional and receives approved metal treatment.\n'
printf ' 10. CARL GILMOUR nameplate/business card remains unchanged and linked.\n'
printf '============================================================\n'

open "$URL"
