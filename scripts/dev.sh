#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

BACKEND_VENV="${BACKEND_VENV:-.venv}"
APP_PORT="${APP_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
PYTHON_BIN="${PYTHON_BIN:-$(bash ./scripts/select_python.sh)}"
BACKEND_RELOAD="${BACKEND_RELOAD:-1}"

if ! command -v "${PYTHON_BIN}" >/dev/null 2>&1; then
  echo "Fehler: ${PYTHON_BIN} wurde nicht gefunden." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Fehler: npm wurde nicht gefunden." >&2
  exit 1
fi

if [[ ! -d "${BACKEND_VENV}" ]]; then
  echo "Erstelle Python-Virtualenv in ${BACKEND_VENV} mit ${PYTHON_BIN} ..."
  "${PYTHON_BIN}" -m venv "${BACKEND_VENV}"
fi

BACKEND_PYTHON="${ROOT_DIR}/${BACKEND_VENV}/bin/python"
BACKEND_PIP="${ROOT_DIR}/${BACKEND_VENV}/bin/pip"

if ! "${BACKEND_PYTHON}" -c "import fastapi" >/dev/null 2>&1; then
  echo "Installiere Backend-Abhaengigkeiten ..."
  "${BACKEND_PIP}" install -r backend/requirements.txt
fi

if [[ ! -d "${ROOT_DIR}/frontend/node_modules" ]]; then
  echo "Installiere Frontend-Abhaengigkeiten ..."
  npm --prefix frontend install
fi

port_pids() {
  local port="$1"
  lsof -t -nP -iTCP:"${port}" -sTCP:LISTEN 2>/dev/null | tr '\n' ' ' || true
}

ensure_port_free() {
  local port="$1"
  local service="$2"
  local pids
  pids="$(port_pids "${port}")"
  if [[ -n "${pids// }" ]]; then
    echo "Fehler: Port ${port} ist bereits belegt (${service})." >&2
    echo "Belegte PID(s): ${pids}" >&2
    echo "Loesen mit z. B.: kill ${pids}" >&2
    exit 1
  fi
}

ensure_port_free "${APP_PORT}" "Backend"
ensure_port_free "${FRONTEND_PORT}" "Frontend"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "${BACKEND_PID}" >/dev/null 2>&1; then
    kill "${BACKEND_PID}" >/dev/null 2>&1 || true
    wait "${BACKEND_PID}" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starte Backend auf http://localhost:${APP_PORT} ..."
if [[ "${BACKEND_RELOAD}" == "1" ]]; then
  "${BACKEND_PYTHON}" -m uvicorn backend.app.main:app --reload --port "${APP_PORT}" &
else
  "${BACKEND_PYTHON}" -m uvicorn backend.app.main:app --port "${APP_PORT}" &
fi
BACKEND_PID=$!

sleep 1
if ! kill -0 "${BACKEND_PID}" >/dev/null 2>&1; then
  echo "Backend konnte nicht gestartet werden." >&2
  exit 1
fi

echo "Starte Frontend auf http://localhost:${FRONTEND_PORT} ..."
npm --prefix frontend run dev -- --host 0.0.0.0 --port "${FRONTEND_PORT}"
