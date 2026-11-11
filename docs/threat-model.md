# CivicResolve AI — Threat Model & Security Architecture

## 1. Threat Modeling Methodology: STRIDE
CivicResolve AI was modeled using Microsoft's **STRIDE** methodology (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) tailored to digital civic administration systems.

---

## 2. Threat Analysis & Mitigations Matrix

| Category | Identified Threat | Risk Level | Architectural Mitigation in CivicResolve AI |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker impersonates municipal officer or citizen. | HIGH | Short-lived JWT access tokens (60 min) signed with HS256 secret; refresh tokens stored securely; Argon2/PBKDF2-SHA256 password hashing. |
| **Tampering** | Rogue actor manipulates priority score or closes grievance without authorization. | CRITICAL | Enforced workflow state machine in `transitions.py`; mandatory justification for priority overrides logged in immutable `priority_overrides` table. |
| **Repudiation** | Officer denies reassigning a complaint or downgrading emergency priority. | MEDIUM | Dedicated `audit_logs` table records actor ID, action verb, target resource, metadata JSON, IP address, and UTC timestamp. |
| **Information Disclosure** | IDOR: Citizen modifies URL to view sensitive complaints/PII of neighbors; enumeration of `/track` endpoint. | HIGH | Object-level ownership check (`complaint.citizen_id == current_user.id`); `/track` requires dual verification (Reference + phone last 4 digits / email prefix). |
| **Denial of Service** | Flooding with large image files or repeated API queries. | HIGH | Max upload size capped at 5 MB; allowed MIME types restricted to JPEG/PNG/WebP; database query pagination (`limit=10, max=100`). |
| **Elevation of Privilege** | Citizen attempts to access `/api/v1/admin/*` or `/api/v1/complaints/:id/status`. | CRITICAL | `@role_required(["admin", "officer"])` decorator validates JWT payload claim before route handler execution; returns `403 Forbidden`. |

---

## 3. Specific Attack Vector Defenses

### 3.1 Insecure Direct Object References (IDOR)
- **Vulnerability:** Attacker changes integer ID in `GET /api/v1/complaints/14` to view complainant's home address and phone number.
- **Defense Implementation:** `backend/app/policies/permissions.py` evaluates ownership. If `user.role == 'citizen'`, the query guarantees `complaint.citizen_id == user.id`. Otherwise, a `403 Forbidden` exception is raised and logged.

### 3.2 CSV Formula Injection (CWE-1236)
- **Vulnerability:** Complainant enters malicious formula `=cmd|' /C calc'!A0` in title. When an administrator downloads the CSV report into Microsoft Excel, arbitrary commands execute.
- **Defense Implementation:** `backend/app/services/analytics_service.py` sanitizes all text fields. Any string starting with `=`, `+`, `-`, or `@` is prepended with a single quote (`'`), neutralizing spreadsheet formula execution.

### 3.3 Path Traversal & Unrestricted File Upload (CWE-22 / CWE-434)
- **Vulnerability:** Uploading `../../../etc/passwd` or `malicious.py` as an evidence attachment.
- **Defense Implementation:**
  1. Original filename is stripped via Werkzeug's `secure_filename`.
  2. File content magic bytes are checked against whitelisted image MIME types (`image/jpeg`, `image/png`, `image/webp`).
  3. Physical file is written using a freshly minted `uuid.uuid4().hex` extension-controlled filename into a non-executable storage folder (`storage/uploads`).
  4. SHA-256 hash is computed and stored for tamper verification.

### 3.4 SQL Injection (CWE-89)
- **Defense Implementation:** 100% of database access is mediated through **SQLAlchemy ORM** utilizing parameterized queries. Raw string interpolation in queries is strictly prohibited.
