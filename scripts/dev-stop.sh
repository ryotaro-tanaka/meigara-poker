#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_DIR="$ROOT_DIR/.devpids"

stop_from_pid_file() {
  local pid_file="$1"
  local service_name="$2"

  if [[ ! -f "$pid_file" ]]; then
    echo "$service_name: pid file not found"
    return
  fi

  local pid
  pid="$(cat "$pid_file" 2>/dev/null || true)"
  rm -f "$pid_file"

  if [[ -z "${pid:-}" ]]; then
    echo "$service_name: empty pid"
    return
  fi

  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    for _ in {1..10}; do
      if ! kill -0 "$pid" 2>/dev/null; then
        echo "$service_name stopped (PID: $pid)"
        return
      fi
      sleep 0.2
    done
    kill -9 "$pid" 2>/dev/null || true
    echo "$service_name force-stopped (PID: $pid)"
    return
  fi

  echo "$service_name already stopped (PID: $pid)"
}

stop_from_pid_file "$PID_DIR/backend.pid" "backend"
stop_from_pid_file "$PID_DIR/frontend.pid" "frontend"
