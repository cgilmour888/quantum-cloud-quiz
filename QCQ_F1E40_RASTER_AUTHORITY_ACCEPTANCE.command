#!/usr/bin/env bash
set -euo pipefail
REPO="/Users/carlgilmour/Downloads/QCQ"
BRANCH="integration/qcq-reconciled-20260807-193701"
FROZEN_BLOB="b9575d024d93261a8e6d3257f30f1a75cbc9b1ef"
cd "$REPO"

printf '\n============================================================\n'
printf ' QCQ F1E40 — APPROVED RASTER AUTHORITY ACCEPTANCE\n'
printf ' RASTER CANVAS + LIVE SOCKETS / F1E37 FROZEN\n'
printf '============================================================\n'

test "$(git branch --show-current)" = "$BRANCH"
test "$(git hash-object public/qcq-current/index.html)" = "$FROZEN_BLOB"

grep -Fq '/qcq-current/assets/approved-monitor/approved-monitor.css' index.html
grep -Fq '/qcq-current/assets/approved-monitor/approved-monitor.js' index.html

BASE="public/qcq-current/assets/approved-monitor"
for f in \
  "$BASE/approved-monitor.js" \
  "$BASE/approved-monitor.css" \
  "$BASE/monitor-socket-atlas.js" \
  "$BASE/AUTHORITIES-MANIFEST.json" \
  "$BASE/authorities/dashboard-authority.webp" \
  "$BASE/authorities/leaderboard-authority.webp" \
  "$BASE/authorities/achievements-authority.webp" \
  "$BASE/authorities/dataset-authority.webp" \
  "$BASE/authorities/analytics-authority.webp" \
  "$BASE/authorities/settings-authority.webp"; do
  test -f "$f"
done

node --check "$BASE/approved-monitor.js"
node --check "$BASE/monitor-socket-atlas.js"

if grep -Fq 'business-card-raster-authority.png' "$BASE/approved-monitor.css" "$BASE/approved-monitor.js"; then
  echo 'FAIL: F1E39 business-card substrate reference remains' >&2
  exit 1
fi
if grep -Fq 'qcq-approved-panel' "$BASE/approved-monitor.js"; then
  echo 'FAIL: transitional CSS panel reconstruction remains' >&2
  exit 1
fi

for f in "$BASE"/authorities/*-authority.webp; do
  WIDTH="$(sips -g pixelWidth "$f" | awk '/pixelWidth:/ {print $2}')"
  HEIGHT="$(sips -g pixelHeight "$f" | awk '/pixelHeight:/ {print $2}')"
  test "$WIDTH" = "320"
  test "$HEIGHT" = "221"
  printf 'AUTHORITY %s %sx%s\n' "$(basename "$f")" "$WIDTH" "$HEIGHT"
done

PORT="$(python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1]);s.close()')"
LOG="$HOME/Downloads/QCQ-F1E40-VISUAL-${PORT}.log"
nohup npm run dev -- --host 127.0.0.1 --port "$PORT" --strictPort >"$LOG" 2>&1 < /dev/null &
PID=$!
READY=0
for _ in $(seq 1 80); do
  if curl -fsS "http://127.0.0.1:${PORT}/qcq-current/index.html" >/dev/null 2>&1; then READY=1; break; fi
  if ! kill -0 "$PID" 2>/dev/null; then cat "$LOG"; exit 1; fi
  sleep 0.25
done
test "$READY" = 1

for f in dashboard leaderboard achievements dataset analytics settings; do
  curl -fsS "http://127.0.0.1:${PORT}/qcq-current/assets/approved-monitor/authorities/${f}-authority.webp" >/dev/null
done
curl -fsS "http://127.0.0.1:${PORT}/qcq-current/assets/approved-monitor/approved-monitor.js" >/dev/null
curl -fsS "http://127.0.0.1:${PORT}/qcq-current/assets/approved-monitor/monitor-socket-atlas.js" >/dev/null

URL="http://127.0.0.1:${PORT}/qcq-current/index.html"
printf '\nF1E40 SERVER READY\nURL: %s\nPID: %s\nLOG: %s\n' "$URL" "$PID" "$LOG"
printf '\nVISUAL ORDER: Dashboard -> Leaderboard -> Achievements -> History/Dataset -> Analytics -> Settings -> Logout.\n'
printf 'Confirm the physical raster canvas matches the approved concepts; confirm only live sockets change.\n'
printf 'Confirm right metrics, nameplate/business card, outer frame, quiz Q+A and soundtrack remain unchanged.\n\n'
open "$URL"
