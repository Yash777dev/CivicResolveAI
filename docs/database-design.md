# CivicResolve AI — Database Design & Schema Specification

## 1. Relational Database Overview
CivicResolve AI uses a normalized relational data model (3NF) implemented via **SQLAlchemy ORM** and managed with **Flask-Migrate / Alembic**. The schema is engineered for full compatibility with both **PostgreSQL** (production) and **SQLite** (local development/testing).

---

## 2. Entity Descriptions & Data Dictionaries

### 2.1 Table: `users`
Stores system actors (citizens, officers, supervisors, administrators).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | PK, Auto-increment | Internal unique identifier |
| `name` | String(100) | NOT NULL | Full name of the user |
| `email` | String(120) | NOT NULL, UNIQUE, Indexed | Normalized lowercase email |
| `password_hash` | String(255) | NOT NULL | Secure salted hash (PBKDF2-SHA256) |
| `role` | String(30) | NOT NULL | One of: `citizen`, `officer`, `supervisor`, `admin` |
| `phone` | String(20) | NULL | Optional contact number |
| `preferred_language` | String(10) | DEFAULT 'en' | User preference: 'en' or 'ta' |
| `account_status` | String(20) | DEFAULT 'active' | 'active', 'suspended', 'pending' |
| `created_at` | DateTime | NOT NULL, DEFAULT UTC | Account creation timestamp |
| `updated_at` | DateTime | NOT NULL, DEFAULT UTC | Last profile update timestamp |

### 2.2 Table: `departments`
Municipal administrative divisions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | PK, Auto-increment | Department primary key |
| `name` | String(100) | NOT NULL, UNIQUE | Department title (e.g. Water Supply) |
| `code` | String(20) | NOT NULL, UNIQUE | Unique slug (e.g. `WATER`, `ELECTRICITY`) |
| `description` | Text | NULL | Functional mandate of the department |
| `is_active` | Boolean | DEFAULT True | Active state toggle |
| `created_at` | DateTime | NOT NULL, DEFAULT UTC | Creation timestamp |

### 2.3 Table: `categories`
Fine-grained complaint topics associated with departments and default SLAs.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | PK, Auto-increment | Category primary key |
| `department_id` | Integer | FK(`departments.id`), NOT NULL | Routing target department |
| `name` | String(100) | NOT NULL | Category name |
| `description` | Text | NULL | Category guidance for citizens |
| `sla_hours` | Integer | DEFAULT 48 | Service target in hours before escalation |
| `baseline_priority` | Integer | DEFAULT 5 | Category baseline priority points (0–10) |
| `is_active` | Boolean | DEFAULT True | Active state |

### 2.4 Table: `complaints`
The central case record for citizen grievances.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | PK, Auto-increment | Internal case identifier |
| `public_reference` | String(32) | NOT NULL, UNIQUE, Indexed | Non-guessable code (e.g. `CR-20261025-A8F29C`) |
| `citizen_id` | Integer | FK(`users.id`), NOT NULL, Indexed | Complainant user ID |
| `department_id` | Integer | FK(`departments.id`), NULL, Indexed | Assigned department |
| `category_id` | Integer | FK(`categories.id`), NOT NULL, Indexed | Classification category |
| `assigned_officer_id`| Integer | FK(`users.id`), NULL, Indexed | Assigned field/desk officer |
| `title` | String(200) | NOT NULL | Brief summary of the grievance |
| `description` | Text | NOT NULL | Detailed narrative (Unicode Tamil/English) |
| `status` | String(30) | NOT NULL, DEFAULT 'SUBMITTED', Indexed | Current lifecycle status |
| `current_priority` | String(20) | NOT NULL, DEFAULT 'LOW', Indexed | Priority level: `LOW`, `MEDIUM`, `HIGH` |
| `priority_score` | Integer | NOT NULL, DEFAULT 10 | Clamped priority score (0–100) |
| `priority_engine_version` | String(20) | DEFAULT 'v1.0' | Engine version that calculated score |
| `approximate_location` | String(255) | NULL | Publicly viewable locality (e.g. "Ward 14") |
| `latitude` | Float | NULL | Precision latitude (with consent) |
| `longitude` | Float | NULL | Precision longitude (with consent) |
| `contact_phone` | String(30) | NULL | Private contact phone |
| `contact_email` | String(120) | NULL | Private contact email |
| `created_at` | DateTime | NOT NULL, DEFAULT UTC, Indexed | Submission timestamp |
| `due_at` | DateTime | NULL, Indexed | Computed SLA deadline |
| `resolved_at` | DateTime | NULL | Timestamp of resolution |
| `closure_reason` | String(255) | NULL | Reason for case closure |
| `resolution_summary` | Text | NULL | Mandatory officer resolution description |

### 2.5 Table: `complaint_evidence`
Media evidence uploaded in support of complaints or resolutions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | PK, Auto-increment | Evidence primary key |
| `complaint_id` | Integer | FK(`complaints.id`), NOT NULL, Indexed | Parent complaint |
| `safe_storage_key` | String(100) | NOT NULL, UNIQUE | UUID filename on disk |
| `sanitized_filename`| String(255) | NOT NULL | Safe display name stripped of path traversal |
| `mime_type` | String(50) | NOT NULL | Validated MIME type (`image/jpeg`, etc.) |
| `byte_size` | Integer | NOT NULL | File size in bytes |
| `checksum` | String(64) | NOT NULL | SHA-256 integrity hash |
| `uploaded_by` | Integer | FK(`users.id`), NOT NULL | Actor who uploaded file |
| `created_at` | DateTime | NOT NULL, DEFAULT UTC | Upload timestamp |

### 2.6 Table: `priority_assessments`
Full mathematical record of explainable priority calculations.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | PK, Auto-increment | Assessment record ID |
| `complaint_id` | Integer | FK(`complaints.id`), NOT NULL, Indexed | Associated case |
| `score` | Integer | NOT NULL | Calculated score (0–100) |
| `level` | String(20) | NOT NULL | `LOW`, `MEDIUM`, or `HIGH` |
| `engine_version` | String(20) | NOT NULL | Priority engine algorithm version |
| `fired_rules_json` | Text | NOT NULL | JSON array of triggered rules, weights, and triggers |
| `summary` | Text | NOT NULL | Plain-text explanation of score |
| `assessed_at` | DateTime | NOT NULL, DEFAULT UTC | Computation timestamp |

### 2.7 Table: `priority_overrides`
Audit history of manual officer priority changes.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | PK, Auto-increment | Override record ID |
| `complaint_id` | Integer | FK(`complaints.id`), NOT NULL, Indexed | Case modified |
| `actor_id` | Integer | FK(`users.id`), NOT NULL | Officer who made change |
| `previous_score` | Integer | NOT NULL | Score before override |
| `previous_level` | String(20) | NOT NULL | Level before override |
| `new_score` | Integer | NOT NULL | New overridden score |
| `new_level` | String(20) | NOT NULL | New overridden level |
| `reason` | Text | NOT NULL | Mandatory written explanation |
| `created_at` | DateTime | NOT NULL, DEFAULT UTC | Override timestamp |

### 2.8 Table: `complaint_status_history`
Immutable event log for the complaint workflow state machine.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | PK, Auto-increment | History primary key |
| `complaint_id` | Integer | FK(`complaints.id`), NOT NULL, Indexed | Parent complaint |
| `actor_id` | Integer | FK(`users.id`), NOT NULL | Actor triggering transition |
| `previous_status` | String(30) | NOT NULL | Prior status |
| `new_status` | String(30) | NOT NULL | Transitioned status |
| `public_note` | Text | NULL | Citizen-visible timeline update |
| `internal_note` | Text | NULL | Officer-only internal operational note |
| `created_at` | DateTime | NOT NULL, DEFAULT UTC | Transition timestamp |

### 2.9 Table: `audit_logs`
System-wide security and compliance audit trail.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | PK, Auto-increment | Audit log ID |
| `actor_id` | Integer | FK(`users.id`), NULL, Indexed | User who performed action |
| `action` | String(64) | NOT NULL, Indexed | Action verb (e.g. `LOGIN`, `OVERRIDE_PRIORITY`) |
| `resource_type` | String(64) | NOT NULL | Target entity type (e.g. `complaint`) |
| `resource_id` | String(64) | NULL | Target entity ID |
| `metadata_json` | Text | NULL | JSON context payload |
| `ip_address` | String(45) | NULL | Client IP address |
| `timestamp` | DateTime | NOT NULL, DEFAULT UTC, Indexed | Audit timestamp |

---

## 3. Database Indexes & Optimization
To sustain sub-100ms response times under municipal workloads, the following compound and specialized indexes are declared:
1. `ix_complaints_dept_status`: `(department_id, status)` for fast officer queue retrieval.
2. `ix_complaints_citizen_created`: `(citizen_id, created_at DESC)` for personal dashboard sorting.
3. `ix_complaints_public_reference`: `(public_reference)` unique index for instant case tracking lookups.
4. `ix_audit_logs_timestamp`: `(timestamp DESC)` for efficient security audit log pagination.
