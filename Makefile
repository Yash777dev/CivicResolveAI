.PHONY: help run install seed train test backend frontend build

run:
	python civic.py

help:
	@echo "CivicResolve AI - Makefile Commands"
	@echo "===================================="
	@echo "make run        : Run full application (backend + frontend) via civic.py"
	@echo "make install    : Install backend and frontend dependencies"
	@echo "make seed       : Seed demo database with departments, users, and cases"
	@echo "make train      : Train the TF-IDF category classifier"
	@echo "make test       : Run backend automated pytest suite (22 tests)"
	@echo "make backend    : Start Flask backend on http://127.0.0.1:5000"
	@echo "make frontend   : Start Vite frontend on http://localhost:5173"
	@echo "make build      : Build frontend production bundle"

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install --legacy-peer-deps

seed:
	cd backend && python scripts/seed_demo.py

train:
	cd backend && python scripts/train_classifier.py
	cd backend && python scripts/evaluate_classifier.py

test:
	pytest backend/tests -v

backend:
	cd backend && python wsgi.py

frontend:
	cd frontend && npm run dev

build:
	cd frontend && npm run build
