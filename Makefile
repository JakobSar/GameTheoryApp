SHELL := /bin/bash
PYTHON_BIN ?= $(shell bash ./scripts/select_python.sh)

.PHONY: setup setup-backend setup-frontend dev dev-backend dev-frontend test-backend

setup: setup-backend setup-frontend

setup-backend:
	$(PYTHON_BIN) -m venv .venv
	. .venv/bin/activate && pip install -r backend/requirements.txt

setup-frontend:
	npm --prefix frontend install

dev:
	./scripts/dev.sh

dev-backend:
	. .venv/bin/activate && uvicorn backend.app.main:app --reload --port 8000

dev-frontend:
	npm --prefix frontend run dev

test-backend:
	. .venv/bin/activate && pytest backend/tests -q
