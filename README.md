# CivicResolve AI
### Autonomous & Explainable Grievance Redressal System for Government Services
*A Final-Year / 7th-Semester Computer Science & Engineering Capstone Project*

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://python.org)
[![Flask](https://img.shields.io/badge/Backend-Flask%203.1-green.svg)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61dafb.svg)](https://react.dev/)
[![Tailwind](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38b2ac.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Pytest-22%2F22%20Passing-brightgreen.svg)](docs/test-plan.md)

---

## 🏛️ Executive Summary

**CivicResolve AI** is an explainable, autonomous municipal grievance redressal web platform engineered to modernize public service delivery. Traditional municipal grievance systems suffer from manual triage backlogs, opaque first-in-first-out prioritization, duplicate field dispatches, and citizen distrust. While some systems attempt to apply deep neural networks, opaque black-box AI cannot be justified in public administration.

CivicResolve AI solves this by introducing a **deterministic, versioned, explainable priority scoring engine**. Urgency scores (0–100) are broken down into transparent mathematical contributions (e.g., immediate safety hazards, essential service outages, critical facility proximity, prolonged outage duration). Authorized officers retain final decision-making power through an **officer-in-the-loop override mechanism** backed by mandatory justification and an immutable audit trail.

---

## 🌟 Key Features

1. **Deterministic Explainable Priority Engine (0–100)**:
   - Evaluates emergency signals, facility impact, and outage duration.
   - Categorizes cases into `LOW` (0–39), `MEDIUM` (40–69), and `HIGH` (70–100).
   - Shows citizens and officers exactly which rules fired and why.
2. **Officer-in-the-Loop Governance**:
   - Officers can override algorithm recommendations if on-ground inspection warrants.
   - Overrides require a mandatory written justification (minimum 10 characters) and are permanently logged.
3. **Strict Workflow State Machine**:
   - Enforces valid lifecycle transitions: `SUBMITTED -> TRIAGED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED`.
   - Requires resolution summaries and supports citizen appeals (`REOPENED`) and SLA breaches (`ESCALATED`).
4. **Duplicate Grievance Detection**:
   - TF-IDF vectorization and cosine similarity over a 30-day window within the same category.
   - Highlights duplicate clusters to prevent redundant field dispatches without leaking citizen PII.
5. **Bilingual Accessibility (English & Tamil)**:
   - Full UI localization in English and Tamil (தமிழ்).
   - Verbatim Unicode preservation for complaint text, search, and indexing.
6. **Defensive Security & Privacy**:
   - Role-Based Access Control (`citizen`, `officer`, `supervisor`, `admin`).
   - Object-Level Authorization (IDOR protection prevents cross-tenant complaint tampering).
   - CSV Formula Injection defense (neutralizing malicious spreadsheet formulas upon export).
   - Safe evidence upload pipeline (magic byte validation, UUID renaming, SHA-256 integrity checksums).
7. **Interactive Dashboards & Analytics**:
   - Real-time operational metrics queried from live database records: resolution rate, median turnaround hours, overdue percentage.
   - Leaflet + OpenStreetMap spatial visualization for geotagged complaints.

---

## 👥 Pre-Seeded Demo Accounts

The database comes pre-populated with realistic municipal accounts. You can also use the one-click credential picker on the Login page (`/login`):

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@civicresolve.gov` | `AdminPass123!` | System-wide governance, audit logs, ML metrics, rule engine tuning |
| **Water Supply Officer** | `water.officer@civicresolve.gov` | `OfficerPass123!` | Water & sewerage queue, priority inspection, case resolution |
| **Electricity Officer** | `power.officer@civicresolve.gov` | `OfficerPass123!` | Electrical outages, transformer hazards, emergency dispatches |
| **Supervisor** | `supervisor@civicresolve.gov` | `SupervisorPass123!` | Departmental oversight, escalations, cross-department transfers |
| **Citizen (Anita)** | `citizen.anita@example.com` | `CitizenPass123!` | Submit grievances, track progress, view timeline, submit feedback |

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python:** 3.11 or 3.12
- **Node.js:** v18.x or v20.x
- **Git**

### 🚀 One-Command Launch (Recommended)
You can start both the backend and frontend simultaneously with a single command:
```bash
python civic.py
```
This automatically:
1. Detects Python virtual environment and Node.js.
2. Initializes and seeds the SQLite database (`civicresolve.db`) if not already seeded.
3. Trains the ML category classifier if not present.
4. Starts the Flask Backend API on `http://127.0.0.1:5000`.
5. Starts the React + Vite Frontend on `http://localhost:5173`.
6. Opens your default web browser directly to `http://localhost:5173`.
7. Gracefully stops all child processes when you press `Ctrl+C`.

---

### Alternative Manual Setup

#### 1. Backend Setup
```bash
# Activate Python virtual environment
backend\venv\Scripts\activate   # (On Windows)
# source backend/venv/bin/activate  (On Linux/macOS)

# Launch Flask API server (Port 5000)
python backend/wsgi.py
```
*Backend API Health Check:* [http://127.0.0.1:5000/api/v1/health](http://127.0.0.1:5000/api/v1/health)

#### 2. Frontend Setup
Open a second terminal window:
```bash
cd frontend
npm run dev
```
Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Automated Testing

The project includes an automated test suite executed with **pytest**, covering authentication, authorization, IDOR protection, priority calculation, workflow transitions, SLA calculations, and CSV sanitization:

```bash
# Run test suite
pytest backend/tests -v
```

**Result:** `22 passed in 1.48s` (100% passing).

---

## 📁 Repository Structure

```
civicresolve-ai/
├── README.md                           # Project overview & quickstart
├── LICENSE                             # MIT Open Source License
├── Makefile                            # Common development shortcuts
├── .env.example                        # Template environment variables
├── docker-compose.yml                  # PostgreSQL container service
├── docs/                               # Comprehensive academic documentation
│   ├── requirements.md                 # Software Requirements Specification (SRS)
│   ├── architecture.md                 # 3-tier system architecture specification
│   ├── database-design.md              # 3NF database schema & data dictionary
│   ├── api-reference.md                # REST API endpoints & payload specifications
│   ├── priority-engine.md              # Explainable priority scoring mathematical rubric
│   ├── threat-model.md                 # STRIDE threat model & defensive safeguards
│   ├── test-plan.md                    # QA verification matrix & 22 pytest specs
│   ├── installation.md                 # Comprehensive native & container setup guide
│   ├── user-manual.md                  # Role-based operating manual
│   ├── project-report-outline.md       # Capstone report chapter outline (Chapters 1–7)
│   ├── viva-questions.md               # 15+ comprehensive examiner defense Q&As
│   └── diagrams/
│       ├── system-architecture.mmd     # Mermaid system architecture diagram
│       ├── complaint-workflow.mmd      # Mermaid workflow state diagram
│       └── er-diagram.mmd              # Mermaid Entity-Relationship schema diagram
├── backend/
│   ├── requirements.txt                # Pinned backend dependencies
│   ├── wsgi.py                         # WSGI server entrypoint
│   ├── app/                            # Flask application package
│   │   ├── config.py                   # Environment-driven configuration
│   │   ├── extensions.py               # SQLAlchemy, JWT, CORS extensions
│   │   ├── errors.py                   # Standardized JSON error handlers
│   │   ├── api/v1/                     # Modular REST API blueprints
│   │   ├── models/                     # SQLAlchemy relational models
│   │   ├── schemas/                    # Pydantic validation schemas
│   │   ├── services/                   # Core business logic & domain services
│   │   └── policies/                   # RBAC & workflow transition validators
│   ├── scripts/
│   │   ├── seed_demo.py                # Database population script
│   │   ├── train_classifier.py         # TF-IDF + Logistic Regression training
│   │   └── evaluate_classifier.py      # Confusion matrix & macro-F1 evaluation
│   └── tests/                          # Automated pytest test cases (22 tests)
├── frontend/
│   ├── package.json                    # React, Vite, Tailwind dependencies
│   ├── vite.config.ts                  # Vite 6 configuration & API proxy
│   └── src/
│       ├── App.tsx                     # Route hierarchy & role guards
│       ├── i18n/                       # English & Tamil localization dictionaries
│       ├── components/                 # Reusable UI & explainability components
│       ├── pages/                      # Citizen, Officer, Admin & Public pages
│       └── lib/                        # Axios API client & TanStack Query
├── data/
│   ├── category_taxonomy.json          # Municipal category taxonomy & baseline SLAs
│   └── sample_complaints.csv           # Seed dataset for classifier training
└── storage/                            # Secure local evidence file storage
```

---

## 📚 Complete Project Documentation

Detailed technical documents are available in the [`docs/`](docs/) directory:
- [System Architecture](docs/architecture.md)
- [Database Design & Schema](docs/database-design.md)
- [REST API Reference](docs/api-reference.md)
- [Explainable Priority Engine](docs/priority-engine.md)
- [STRIDE Threat Model](docs/threat-model.md)
- [Verification & Test Plan](docs/test-plan.md)
- [Installation Guide](docs/installation.md)
- [User Operation Manual](docs/user-manual.md)
- [Project Report Outline](docs/project-report-outline.md)
- [Viva Voce Defense Questions](docs/viva-questions.md)

---

## ⚖️ Ethical & Governance Statement

CivicResolve AI is designed exclusively as an administrative decision-support system. It automates triage, mathematical scoring, duplicate grouping, and notification routing. It does not replace human judgement, does not penalize citizens for linguistic tone or literacy, and never takes irreversible administrative actions without human authorization.
