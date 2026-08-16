#!/usr/bin/env bash
set -euo pipefail

REPO="/Users/carlgilmour/Downloads/QCQ"
BRANCH="integration/qcq-reconciled-20260807-193701"
AUTHORITY="public/qcq-current/index.html"
EXPECTED_AUTHORITY_BLOB="b9575d024d93261a8e6d3257f30f1a75cbc9b1ef"
CSS="public/qcq-current/assets/approved-monitor/approved-monitor.css"
JS="public/qcq-current/assets/approved-monitor/approved-monitor.js"
RASTER="public/qcq-current/assets/business-card/business-card-raster-authority.png"

cd "$REPO"

printf '\n============================================================\n'
printf ' QCQ F1E39 — HYBRID AUXILIARY MONITOR ACCEPTANCE\n'
printf ' LEFT COMMAND FUNCTIONS / RASTER + LIVE SOCKETS\n'
printf '============================================================\n'

printf '\n1. SAFETY GATES\n'
CURRENT_BRANCH="$(git branch --show-current)"
AUTHORITY_BLOB="$(git hash-object "$AUTHORITY")"
STAGED="$(git diff --cached --name-only | wc -l | tr -d ' ')"
printf 'BRANCH:         %s\n' "$CURRENT_BRANCH"
printf 'HEAD:           %s\n' "$(git rev-parse HEAD)"
printf 'AUTHORITY BLOB: %s\n' "$AUTHORITY_BLOB"
printf 'STAGED:         %s\n' "$STAGED"
test "$CURRENT_BRANCH" = "$BRANCH"
test "$AUTHORITY_BLOB" = "$EXPECTED_AUTHORITY_BLOB"
test "$STAGED" = "0"

printf '\n2. HYBRID MODULE CONTRACT\n'
test -f "$CSS"
test -f "$JS"
test -f "$RASTER"
grep -Fq 'business-card-raster-authority.png' "$CSS"
grep -Fq "id==='L1'" "$JS"
grep -Fq "id==='L2'" "$JS"
grep -Fq "id==='L3'" "$JS"
grep -Fq "id==='L4'" "$JS"
grep -Fq "id==='L5'" "$JS"
grep -Fq "id==='L6'" "$JS"
grep -Fq "id==='L7'" "$JS"
grep -Fq 'qcq-authority-frame' index.html
grep -Fq 'approved-monitor.css' index.html
grep -Fq 'approved-monitor.js' index.html

printf 'ROOT INJECTION HOST:     PASS\n'
printf 'F1E37 AUTHORITY FROZEN:  PASS\n'
printf 'CERTIFIED RASTER:        PASS\n'
printf 'L1-L7 ROUTING CONTRACT:  PASS\n'

printf '\n3. SOURCE SANITY\n'
node --check "$JS"
printf 'JAVASCRIPT SYNTAX:       PASS\n'

printf '\n4. START ISOLATED SERVER\n'
PORT="$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1]); s.close()')"
LOG="$HOME/Downloads/QCQ-F1E39-HYBRID-MONITOR-${PORT}.log"
nohup npm run dev -- --host 127.0.0.1 --port "$PORT" --strictPort >"$LOG" 2>&1 < /dev/null &
PID=$!

READY=0
for _ in $(seq 1 80); do
  if curl -fsS "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
    READY=1
    break
  fi
  if ! kill -0 "$PID" 2>/dev/null; then
    printf '\nFAIL: Vite exited. Log follows:\n'
    cat "$LOG"
    exit 1
  fi
  sleep 0.25
done
test "$READY" = "1"

curl -fsS "http://127.0.0.1:${PORT}/qcq-current/assets/approved-monitor/approved-monitor.css" >/dev/null
curl -fsS "http://127.0.0.1:${PORT}/qcq-current/assets/approved-monitor/approved-monitor.js" >/dev/null
curl -fsS "http://127.0.0.1:${PORT}/qcq-current/assets/business-card/business-card-raster-authority.png" >/dev/null

URL="http://127.0.0.1:${PORT}/"

printf '\n============================================================\n'
printf ' F1E39 LIVE VISUAL ACCEPTANCE READY\n'
printf '============================================================\n'
printf 'LIVE ROOT URL: %s\n' "$URL"
printf 'SERVER PID:    %s\n' "$PID"
printf 'SERVER LOG:    %s\n' "$LOG"

printf '\nCHECK IN ORDER:\n'
printf '  1. Quiz/tablet question screen is unchanged before opening a left control.\n'
printf '  2. DASHBOARD: approved metallic canvas + live topic/score/accuracy/streak/rank/correct.\n'
printf '  3. LEADERBOARD: approved metallic canvas + live player/rank/score/table.\n'
printf '  4. ACHIEVEMENTS: approved metallic six-panel canvas + live values.\n'
printf '  5. HISTORY physical control opens the approved DATASET monitor.\n'
printf '  6. DATASET upload/validate/replace controls respond without leaving the monitor.\n'
printf '  7. ANALYTICS: approved metallic canvas + live distribution/KPIs.\n'
printf '  8. SETTINGS: existing brightness/audio/reduced-effects controls remain functional.\n'
printf '  9. LOGOUT: existing logout behavior remains functional.\n'
printf ' 10. CARL GILMOUR nameplate/business card remains unchanged and linked.\n'
printf ' 11. Right-side metrics dashboard remains unchanged.\n'
printf '============================================================\n'

open "$URL"
