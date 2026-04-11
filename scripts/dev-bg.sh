#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT_DIR/.devlogs"
PID_DIR="$ROOT_DIR/.devpids"

mkdir -p "$LOG_DIR" "$PID_DIR"

backend_pid_file="$PID_DIR/backend.pid"
frontend_pid_file="$PID_DIR/frontend.pid"

ensure_not_running() {
  local pid_file="$1"
  local service_name="$2"

  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
      echo "$service_name is already running (PID: $pid)"
      exit 1
    fi
    rm -f "$pid_file"
  fi
}

ensure_not_running "$backend_pid_file" "backend"
ensure_not_running "$frontend_pid_file" "frontend"

cd "$ROOT_DIR"

npm --prefix backend run dev > "$LOG_DIR/backend.log" 2>&1 &
backend_pid=$!
echo "$backend_pid" > "$backend_pid_file"

npm --prefix frontend run dev > "$LOG_DIR/frontend.log" 2>&1 &
frontend_pid=$!
echo "$frontend_pid" > "$frontend_pid_file"

echo "Started backend (PID: $backend_pid) and frontend (PID: $frontend_pid)."
echo "Logs:"
echo "  $LOG_DIR/backend.log"
echo "  $LOG_DIR/frontend.log"
echo "Stop with: npm run dev:stop"
