# CivicResolve AI — Comprehensive Viva Voce Questions & Answers
**Academic Project Defense Preparation Guide for Final Year / 7th Sem CSE**

---

### Q1: What is the core problem CivicResolve AI solves, and why can't existing portals like CPGRAMS solve it?
**Answer:**
Existing municipal portals suffer from:
1. **Opaque Triage:** Grievances are treated on a first-in-first-out (FIFO) basis without considering dynamic ground risks (e.g. live sparking cables vs. routine streetlight bulb outages).
2. **Black-Box AI Risks:** Machine learning models that output an urgency percentage without reasons cannot be audited or explained to dissatisfied citizens.
3. **Manual Routing & Duplicates:** Field officers are repeatedly dispatched to the same location because multiple citizens report the same pothole or water burst.
CivicResolve AI introduces a **deterministic explainable priority scoring engine** that provides exact point breakdowns, human-in-the-loop overrides with mandatory audit justification, and cosine similarity duplicate detection.

---

### Q2: Why did you choose a deterministic rule-based priority engine rather than a deep learning neural network (like BERT or GPT)?
**Answer:**
In public administration and legal governance, decisions must be **accountable, deterministic, and legally defensible**.
1. Deep neural networks produce probabilistic outputs that can hallucinate urgency or be manipulated by keyword stuffing.
2. A deterministic engine guarantees that given the exact same complaint input and active rule set, it yields the exact same score ($P \in [0, 100]$) and the exact same explanation every time.
3. Administrators can inspect, version, and tune rule weights transparently (e.g. +30 for immediate safety hazard, +20 for essential service outage) without retraining an entire model.

---

### Q3: How do you prevent citizens from manipulating the system by simply stuffing emergency keywords like "fire", "danger", "hazard"?
**Answer:**
1. **No Duplicate Weight Stacking:** The engine applies a set-based trigger policy (`seen_rules`). If the word "spark" appears 5 times, points are credited only once.
2. **Officer-in-the-Loop Override:** Priority scores serve as an advisory recommendation. An authorized field officer inspects the complaint and must override the score if false claims are detected, recording a written justification in the immutable `priority_overrides` table.
3. **Evidence Validation:** High-urgency complaints encourage uploading photographic evidence, which officers verify before dispatching emergency teams.

---

### Q4: How does the Duplicate Detection mechanism work without leaking citizen private data?
**Answer:**
1. It queries grievances registered within the same municipal category over a rolling 30-day window.
2. The complaint text is vectorized using Scikit-Learn's `TfidfVectorizer` (with English and multilingual n-grams).
3. Pairwise cosine similarity is computed against existing complaints. Pairs exceeding a configurable threshold (e.g. 0.65) are flagged.
4. **Privacy Protection:** The system suggests potential duplicates to authorized departmental officers only. Citizens never see other citizens' personal details, names, phone numbers, or private text.

---

### Q5: How is Role-Based Access Control (RBAC) and Object-Level Authorization (IDOR) implemented?
**Answer:**
1. **Role Enforcement:** Handled via declarative Python decorators (`@role_required(["admin", "officer"])`) that inspect claims encoded in the verified JWT access token.
2. **Object-Level Authorization (IDOR Prevention):** In `backend/app/policies/permissions.py`, when a citizen requests `GET /api/v1/complaints/:id`, the system explicitly asserts `complaint.citizen_id == current_user.id`. If a citizen tries to access another citizen's case by changing the URL ID, the server returns a `403 Forbidden` and logs the security attempt.

---

### Q6: What is CSV Formula Injection, and how did you prevent it?
**Answer:**
CSV Formula Injection (CWE-1236) occurs when an attacker inputs a cell value starting with `=`, `+`, `-`, or `@` (e.g., `=cmd|' /C calc'!A0`). When an administrator exports the dataset and opens it in Microsoft Excel or LibreOffice Calc, the spreadsheet executes the command.
In `backend/app/services/analytics_service.py`, our export handler inspects every text field. If the value begins with an executable formula character, we prepend an apostrophe (`'`), which instructs spreadsheet software to treat the content strictly as text.

---

### Q7: Explain the complaint workflow state machine and how invalid transitions are prevented.
**Answer:**
The system enforces a directed graph in `backend/app/policies/transitions.py`:
`SUBMITTED` $\to$ `TRIAGED` $\to$ `ASSIGNED` $\to$ `IN_PROGRESS` $\to$ `RESOLVED` $\to$ `CLOSED`.
It also supports `NEEDS_INFORMATION`, `REOPENED`, and `ESCALATED`.
If an officer attempts an unauthorized jump (e.g. `SUBMITTED` directly to `RESOLVED`), the validator raises a `ValidationError` (400 Bad Request). Furthermore, transitioning to `RESOLVED` strictly requires a non-empty `resolution_summary` (minimum 10 characters).

---

### Q8: How does the system handle multilingual accessibility in Tamil and English?
**Answer:**
1. **Verbatim Unicode Storage:** PostgreSQL / SQLite database tables and text columns use UTF-8 character encoding, ensuring Tamil Unicode characters (e.g. "குடிநீர் குழாய் உடைப்பு") are stored, indexed, and retrieved without distortion.
2. **Dual-Language Keyword Dictionaries:** The priority engine and category classifier maintain explicit Tamil civic vocabulary dictionaries alongside English terms.
3. **Frontend Localization:** React frontend provides an instant language switch context with complete dictionary bindings in `en.json` and `ta.json`.

---

### Q9: What happens if the machine learning model file (`category_classifier.joblib`) is missing or fails to load?
**Answer:**
CivicResolve AI implements **graceful architectural degradation**. In `backend/app/services/classification_service.py`, if the scikit-learn model artifact is not found, the service seamlessly falls back to the deterministic keyword taxonomy dictionary. The system continues operating without crashing, and clearly labels suggestions as "Rule-based category suggestion".

---

### Q10: How are file evidence uploads secured against path traversal and malware execution?
**Answer:**
1. Uploaded filenames are sanitized using Werkzeug's `secure_filename` to strip path traversal sequences (`../`).
2. The file is never stored under its original name; it is assigned a random `uuid.uuid4().hex` identifier.
3. Magic bytes / MIME types are validated against an allowlist (`image/jpeg`, `image/png`, `image/webp`). Executable file extensions (`.exe`, `.py`, `.sh`) are rejected.
4. A SHA-256 cryptographic checksum is calculated and stored in the database for integrity validation.

---

### Q11: How is the database organized for scalability and quick queries under high load?
**Answer:**
1. Normalized to Third Normal Form (3NF) to eliminate data redundancy.
2. Compound indexes placed on high-frequency filtering criteria:
   - `(department_id, status)` for officer queue management.
   - `(citizen_id, created_at DESC)` for personal dashboard sorting.
   - `(public_reference)` unique index for instant case lookup.

---

### Q12: How are SLA deadlines computed and escalations triggered?
**Answer:**
Each category has a configurable baseline SLA (e.g. 24 hours for water leaks, 48 hours for streetlights).
Upon submission, `due_at` is computed as `created_at + timedelta(hours=sla_hours)`.
The SLA engine evaluates open cases where `UTC_NOW > due_at`. Such complaints are marked as `is_overdue = True`, auto-escalated to supervisor oversight, and trigger urgent in-app notifications.

---

### Q13: Why did you use React 19 + TypeScript on the frontend instead of server-rendered templates?
**Answer:**
1. **Interactive Single Page Application (SPA):** Provides fluid user experience with instant responsive state transitions, client-side routing, and zero-reload tab switching.
2. **Type Safety:** TypeScript enforces compile-time interfaces across API request/response payloads, preventing runtime `undefined` errors.
3. **TanStack React Query:** Handles declarative caching, optimistic UI updates, background re-fetching, and cache invalidation upon status changes.

---

### Q14: What metrics are tracked on the Officer and Admin Analytics Dashboards?
**Answer:**
All analytics are queried directly from the live database:
1. **Total Grievances Filed & Active Workload.**
2. **Resolution Rate (% of cases resolved or closed).**
3. **Median Turnaround Time (in hours from submission to resolution).**
4. **Overdue / SLA Breach Percentage.**
5. **Departmental Workload & Category Breakdown.**
The dashboards use **Recharts** to render responsive bar charts, line graphs, and pie distributions.

---

### Q15: What are the main limitations of the current system, and what future enhancements are planned?
**Answer:**
1. **Current Limitations:**
   - Priority engine weights are configured manually by administrators based on municipal heuristic guidelines rather than longitudinal statistical optimization.
   - GPS pin-drop requires device connectivity; remote rural areas with poor connectivity cannot use online map tiles.
2. **Future Enhancements:**
   - WhatsApp and SMS chatbot integration using open-source webhook bridges for citizens without smartphones.
   - Satellite and GIS raster map overlays for flood and drainage hazard zoning.
   - Offline-first Progressive Web App (PWA) with background sync for municipal field inspectors.
