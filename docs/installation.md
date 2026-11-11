# CivicResolve AI — Installation & Quickstart Guide

This guide details steps for local development using the native Python virtual environment with SQLite, as well as production container deployment via Docker Compose.

---

## 1. Prerequisites
- **Python:** 3.11 or 3.12 (with `venv` and `pip`)
- **Node.js:** v18.x, v20.x, or v22.x (with `npm`)
- **Git**

---

## 2. Local Setup (Recommended Development Mode)

### Step 2.1: Clone & Configure Environment
```bash
git clone <repository-url>
cd Civic_proj

# Create root .env from template
copy .env.example .env
```
Default `.env` configuration uses SQLite (`DATABASE_URL=sqlite:///civicresolve.db`) and requires zero database installation!

### Step 2.2: Backend Setup
```bash
# 1. Create and activate Python virtual environment
py -3.11 -m venv backend/venv
# On Windows PowerShell / Command Prompt:
backend\venv\Scripts\activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Seed demo departments, categories, users, rules, and sample complaints
python backend/scripts/seed_demo.py

# 4. Train the ML category classifier and compute baseline evaluation
python backend/scripts/train_classifier.py
python backend/scripts/evaluate_classifier.py

# 5. Start Flask development backend server (Port 5000)
python backend/wsgi.py
```
The backend API is now running at `http://127.0.0.1:5000/api/v1/health`.

### Step 2.3: Frontend Setup
Open a second terminal window:
```bash
cd Civic_proj/frontend

# 1. Install frontend dependencies
npm install --legacy-peer-deps

# 2. Start Vite development server (Port 5173)
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 3. Pre-Seeded Demo Credentials

The database comes pre-loaded with realistic municipal accounts. You can also use the one-click credential picker on the Login page (`/login`)!

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@civicresolve.gov` | `AdminPass123!` | System-wide config, audit logs, ML metrics, rule engine tuning. |
| **Water Supply Officer** | `water.officer@civicresolve.gov` | `OfficerPass123!` | Water & sewerage queue, triage, overrides, resolution. |
| **Electricity Officer** | `power.officer@civicresolve.gov` | `OfficerPass123!` | Electrical & streetlight cases, emergency dispatches. |
| **Supervisor** | `supervisor@civicresolve.gov` | `SupervisorPass123!` | Escalated complaints, cross-departmental reassignments. |
| **Citizen (Anita)** | `citizen.anita@example.com` | `CitizenPass123!` | File complaints, track status, view timeline, submit feedback. |

---

## 4. Running with Docker Compose (PostgreSQL)

To run with PostgreSQL 15 in Docker:
```bash
docker-compose up -d db
```
Update your `.env` file:
```env
DATABASE_URL=postgresql://civic_user:civic_secret@localhost:5432/civic_db
```
Then run the backend migration and seed commands:
```bash
backend\venv\Scripts\python backend/scripts/seed_demo.py
```
