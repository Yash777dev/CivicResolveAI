# CivicResolve AI — REST API Reference Documentation

All API routes are served under the `/api/v1` namespace. All request and response bodies use UTF-8 JSON unless specified otherwise (e.g. multipart/form-data for file uploads, text/csv for analytics export).

---

## 1. Authentication Endpoints

### 1.1 Register Citizen
- **Endpoint:** `POST /api/v1/auth/register`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "name": "Anita Raman",
  "email": "anita.raman@example.com",
  "password": "SecurePassword123!",
  "phone": "9876543210",
  "preferred_language": "ta"
}
```
- **Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 12,
    "name": "Anita Raman",
    "email": "anita.raman@example.com",
    "role": "citizen",
    "preferred_language": "ta"
  }
}
```

### 1.2 User Login
- **Endpoint:** `POST /api/v1/auth/login`
- **Auth:** None (Public)
- **Request Body:**
```json
{
  "email": "water.officer@civicresolve.gov",
  "password": "OfficerPass123!"
}
```
- **Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "name": "Kavitha Murugan",
    "email": "water.officer@civicresolve.gov",
    "role": "officer",
    "department_id": 1,
    "preferred_language": "en"
  }
}
```

### 1.3 Get Current User Profile
- **Endpoint:** `GET /api/v1/auth/me`
- **Auth:** Bearer Token
- **Response (200 OK):** Returns current user details.

---

## 2. Complaint Management Endpoints

### 2.1 Submit New Complaint
- **Endpoint:** `POST /api/v1/complaints`
- **Auth:** Bearer Token (Citizen / Admin)
- **Request Body:**
```json
{
  "title": "Severe main pipeline burst flooding Anna Nagar 4th cross",
  "description": "Drinking water pipeline has burst since 6 AM. Road is completely flooded near government primary school.",
  "category_id": 1,
  "approximate_location": "Anna Nagar 4th Cross, Chennai",
  "latitude": 13.0827,
  "longitude": 80.2107,
  "signals": {
    "immediate_danger": false,
    "essential_service_outage": true,
    "critical_facility_impact": true,
    "duration_days": 1,
    "vulnerable_person_impact": false
  }
}
```
- **Response (201 Created):**
```json
{
  "message": "Complaint submitted successfully",
  "complaint": {
    "id": 45,
    "public_reference": "CR-20261025-9B21FA",
    "title": "Severe main pipeline burst flooding Anna Nagar 4th cross",
    "status": "SUBMITTED",
    "current_priority": "HIGH",
    "priority_score": 75,
    "department_id": 1,
    "category_id": 1,
    "due_at": "2026-10-26T12:00:00Z",
    "created_at": "2026-10-25T12:00:00Z"
  },
  "priority_assessment": {
    "score": 75,
    "level": "HIGH",
    "engine_version": "v1.0",
    "summary": "Priority: HIGH (Score: 75/100). Fired rules: Category Baseline (+10), Essential Service Outage (+20), Verified Critical Facility Impact (+15), Pipeline Damage (+30).",
    "fired_rules": [
      {"rule_key": "CAT_WATER_PIPELINE", "name": "Pipeline Damage", "weight": 30, "trigger": "pipeline burst"},
      {"rule_key": "ESSENTIAL_SERVICE", "name": "Essential Service Outage", "weight": 20, "trigger": "user signal"},
      {"rule_key": "CRITICAL_FACILITY", "name": "Verified Critical Facility Impact", "weight": 15, "trigger": "school"}
    ]
  }
}
```

### 2.2 List Complaints (Paginated & Filtered)
- **Endpoint:** `GET /api/v1/complaints`
- **Auth:** Bearer Token
- **Query Parameters:**
  - `page`: default 1
  - `limit`: default 10
  - `status`: filter by state (e.g. `IN_PROGRESS`)
  - `priority`: filter by level (`LOW`, `MEDIUM`, `HIGH`)
  - `department_id`: filter by department ID
  - `search`: search keywords in title or description

### 2.3 Get Complaint Details
- **Endpoint:** `GET /api/v1/complaints/:id`
- **Auth:** Bearer Token (Object-Level Authorization enforced)
- **Response (200 OK):** Complete complaint object including assessments, history, notes, attachments, and feedback.

### 2.4 Public Tracking
- **Endpoint:** `GET /api/v1/complaints/track/:reference?verification=4321`
- **Auth:** None (Public)
- **Parameters:** `reference` (path), `verification` (query string - last 4 digits of phone or email prefix).
- **Protection:** Prevents enumeration by rejecting unverified reference queries.

---

## 3. Workflow & Officer Actions

### 3.1 Update Complaint Status
- **Endpoint:** `POST /api/v1/complaints/:id/status`
- **Auth:** Bearer Token (Officer / Admin)
- **Request Body:**
```json
{
  "new_status": "RESOLVED",
  "resolution_summary": "Replaced the damaged 200mm PVC joint valve and restored normal water pressure. Water quality verified.",
  "public_note": "Pipeline repair successfully executed by field team.",
  "internal_note": "Work order #4892 completed."
}
```

### 3.2 Override Priority
- **Endpoint:** `POST /api/v1/complaints/:id/override-priority`
- **Auth:** Bearer Token (Officer / Admin)
- **Request Body:**
```json
{
  "new_score": 90,
  "new_level": "HIGH",
  "reason": "On-site assessment revealed water flooding is dangerously undermining an electric transformer base."
}
```

### 3.3 Reassign Complaint
- **Endpoint:** `POST /api/v1/complaints/:id/assign`
- **Auth:** Bearer Token (Officer / Admin)
- **Request Body:**
```json
{
  "department_id": 2,
  "assigned_officer_id": 4,
  "reason": "Electrical hazard requires immediate coordination with Tamil Nadu Electricity Board."
}
```

---

## 4. Analytics & Administration

### 4.1 System Operational Summary
- **Endpoint:** `GET /api/v1/analytics/summary`
- **Auth:** Bearer Token (Officer / Admin)
- **Response (200 OK):** Aggregated metrics: total grievances, resolution rate, median turnaround hours, overdue count, priority distribution, department workload.

### 4.2 CSV Export
- **Endpoint:** `GET /api/v1/analytics/export?department_id=1`
- **Auth:** Bearer Token (Admin / Officer)
- **Response:** `text/csv` stream with CSV Formula Injection escaping on text fields.

### 4.3 Machine Learning Model Evaluation
- **Endpoint:** `GET /api/v1/admin/model-evaluation`
- **Auth:** Bearer Token (Admin)
- **Response (200 OK):** Model version, training timestamp, accuracy, macro-F1, confusion matrix, and feature vocabulary status.

### 4.4 System Health Check
- **Endpoint:** `GET /api/v1/health`
- **Auth:** None (Public)
- **Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-25T14:15:00Z",
  "database": "connected",
  "version": "1.0.0"
}
```
