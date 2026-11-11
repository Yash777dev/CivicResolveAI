# CivicResolve AI — Software Requirements Specification (SRS)

## 1. Introduction
### 1.1 Purpose
This document specifies the software requirements for **CivicResolve AI — Explainable Autonomous Grievance Redressal System for Government Services**. It serves as the primary technical specification for developers, testers, evaluators, and system architects.

### 1.2 Scope
CivicResolve AI is a secure, role-based, full-stack municipal grievance redressal web application. It automates triage, deterministic priority calculation, duplicate detection, department routing, and SLA tracking for citizen grievances filed with municipal corporations or urban local bodies. 
**Operational Boundary:** The software handles digital case management, workflow coordination, explainable recommendation, and administrative auditing. It does not control physical municipal machinery or fabricate government authorizations.

---

## 2. Overall Description

### 2.1 User Classes and Characteristics
1. **Citizen:**
   - Files grievances with title, description, category, optional GPS coordinates, and media evidence.
   - Tracks complaint status transparently via non-guessable reference code + verification token.
   - Receives notifications, views public timeline updates, rates resolutions, and requests case reopening if unresolved.
2. **Department Officer:**
   - Manages departmental queue (e.g., Water Supply, Public Works, Electricity, Health & Sanitation).
   - Reviews priority scores and inspects explicit fired-rule explanations.
   - Manually overrides priority if field conditions warrant, with mandatory reason logging.
   - Updates status through a strictly enforced state machine, adds internal investigation notes, attaches resolution proofs, and identifies duplicate complaints.
3. **Supervisor / Department Head:**
   - Oversees cross-departmental queues, handles escalations, and approves overrides.
4. **System Administrator:**
   - Manages user accounts, department rosters, categories, baseline SLAs, and priority scoring rules.
   - Inspects immutable tamper-evident audit logs and monitors machine learning category classifier performance metrics.

### 2.2 Operating Environment
- **Server:** Python 3.11/3.12 (WSGI / Flask), Linux/Windows, SQLite (development) or PostgreSQL 15+ (production).
- **Client:** Modern web browsers (Google Chrome 110+, Mozilla Firefox 115+, Safari 16+, Edge).
- **Network:** HTTPS with TLS 1.3, strict CORS allowlists, secure HTTP-only cookie headers.

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization (FR-AUTH)
- **FR-AUTH-1:** The system shall support citizen self-registration with email verification format checks and secure password hashing (Argon2 / PBKDF2-SHA256).
- **FR-AUTH-2:** The system shall implement JSON Web Token (JWT) based authentication with short-lived access tokens (60 minutes) and refresh tokens (30 days).
- **FR-AUTH-3:** The system shall enforce role-based access control (RBAC) across 4 roles: `citizen`, `officer`, `supervisor`, `admin`.
- **FR-AUTH-4:** The system shall enforce Object-Level Authorization (IDOR protection): citizens cannot view or modify complaints belonging to other citizens.

### 3.2 Complaint Filing & Tracking (FR-COMP)
- **FR-COMP-1:** The system shall generate a secure, non-guessable reference format (`CR-YYYYMMDD-XXXXXX`) for each submitted complaint.
- **FR-COMP-2:** The system shall accept optional geographical coordinates (latitude/longitude) with explicit citizen consent, displaying approximate locality.
- **FR-COMP-3:** The system shall validate file evidence uploads: allowed MIME types (`image/jpeg`, `image/png`, `image/webp`), max size 5 MB, stored under safe random UUIDs with SHA-256 checksums.
- **FR-COMP-4:** Public tracking (`/track`) shall require both the reference code and the last 4 digits of the complainant's phone number or email match to prevent enumeration.

### 3.3 Explainable Priority Engine (FR-PRIORITY)
- **FR-PRIORITY-1:** The system shall evaluate complaints against deterministic, versioned rules producing a score between 0 and 100:
  - 0–39: `LOW`
  - 40–69: `MEDIUM`
  - 70–100: `HIGH`
- **FR-PRIORITY-2:** Every priority score must provide an exact list of fired rules, individual point contributions, textual signals detected, engine version, and uncertainty warnings.
- **FR-PRIORITY-3:** Officers may override the priority with a mandatory written justification (min 10 characters), recording actor ID, old score/level, and new score/level in an immutable audit table.

### 3.4 Workflow & State Transitions (FR-WORKFLOW)
- **FR-WORKFLOW-1:** The system shall enforce a strict state machine:
  `SUBMITTED -> TRIAGED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED`.
- **FR-WORKFLOW-2:** Moving to `RESOLVED` requires a mandatory resolution summary (min 10 characters).
- **FR-WORKFLOW-3:** Citizens may request case reopening from `RESOLVED` or `CLOSED` states.
- **FR-WORKFLOW-4:** All transitions must record previous status, new status, actor ID, timestamp, public note, and optional internal note in `ComplaintStatusHistory`.

### 3.5 Duplicate Detection & ML Category Suggestion (FR-AI)
- **FR-AI-1:** The system shall suggest similar complaints using TF-IDF vectorization and cosine similarity over a rolling 30-day window within the same category.
- **FR-AI-2:** The system shall never auto-merge or suppress complaints. Potential duplicates must be reviewed and confirmed by an authorized officer.
- **FR-AI-3:** The system shall provide an optional TF-IDF + Logistic Regression category classifier with versioned evaluations (`macro_f1`, confusion matrix) logged in the database.

### 3.6 Multilingual Accessibility (FR-I18N)
- **FR-I18N-1:** The system shall provide bilingual UI support in English and Tamil (தமிழ்).
- **FR-I18N-2:** Citizen complaint text in Tamil Unicode shall be preserved verbatim in database storage, indexing, and display without data corruption.

---

## 4. Non-Functional Requirements

### 4.1 Security & Privacy
- **NFR-SEC-1:** Passwords must meet minimum complexity (8+ chars, uppercase, lowercase, number, special char).
- **NFR-SEC-2:** Protection against CSV Formula Injection: all exported CSV fields starting with `=`, `+`, `-`, or `@` must be escaped with a leading single quote (`'`).
- **NFR-SEC-3:** All database queries must use SQLAlchemy ORM parameterized queries to prevent SQL Injection.
- **NFR-SEC-4:** Audit logging of all sensitive administrative actions, logins, status changes, overrides, and assignments.

### 4.2 Performance & Scalability
- **NFR-PERF-1:** API response time under 150 ms for cached static and paginated complaint queries.
- **NFR-PERF-2:** Database schema normalized with foreign keys and compound indexes on `(department_id, status)`, `(citizen_id, created_at)`, and `public_reference`.

### 4.3 Reliability & Availability
- **NFR-REL-1:** Graceful degradation: if the ML classifier model is absent, the system seamlessly falls back to the keyword taxonomy matcher.
- **NFR-REL-2:** Transactional atomicity: multi-step updates (e.g. status transition + notification + audit log) must execute inside a database transaction commit/rollback block.
