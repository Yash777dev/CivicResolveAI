# CivicResolve AI — User Operation Manual

## 1. Introduction
This manual provides end-to-end operational instructions for the three primary user personas of CivicResolve AI:
1. **Citizen Portal**
2. **Department Officer Workstation**
3. **Administrator Console**

---

## 2. Citizen User Journey

### 2.1 Registration & Language Selection
1. Navigate to `/register`.
2. Fill in full name, valid email address, phone number, and a secure password.
3. Select your preferred language: **English** or **Tamil (தமிழ்)** using the language toggle in the navigation bar. All form labels, error messages, and status badges will adapt dynamically.

### 2.2 Submitting a Grievance (`/citizen/complaints/new`)
1. **Title & Category:** Provide a clear, concise title. Select the primary municipal category (e.g. *Water Supply and Leakage*, *Sanitation and Garbage*).
2. **AI Category Suggestion:** As you type the grievance description, the integrated classifier analyzes your text and suggests the most probable municipal category.
3. **Urgency & Impact Signals:** Toggle relevant checkboxes if applicable:
   - *Immediate Safety Hazard* (sparking wire, deep open pit, building collapse risk).
   - *Essential Service Outage* (potable drinking water cut off, power grid failure).
   - *Proximity to Critical Facility* (school, hospital, clinic).
   - *Prolonged Outage Duration* (number of days).
4. **Location & Pin Drop:** Enter the approximate neighborhood address (e.g., "Ward 12, Gandhi Road"). Click on the interactive OpenStreetMap widget to record coordinates.
5. **Media Evidence:** Upload a clear photograph (JPEG, PNG, max 5 MB).
6. **Submit:** Click **Submit Grievance**. You will be redirected to the case detail page displaying your unique reference number (e.g. `CR-20261025-A8F29C`).

### 2.3 Transparent Tracking (`/track`)
- Anyone with the reference code and the last 4 digits of the complainant's phone number or email prefix can track real-time resolution progress without needing to log in.

---

## 3. Officer User Journey

### 3.1 Workstation Dashboard (`/officer/dashboard`)
1. Log in with officer credentials (e.g. `water.officer@civicresolve.gov`).
2. The dashboard displays real-time statistics:
   - Total complaints in your department.
   - High-priority and emergency-flagged cases requiring immediate dispatch.
   - Approaching SLA deadlines and overdue cases.

### 3.2 Triage & Case Review (`/officer/complaints/:id`)
1. **Explainability Accordion:** Inspect the "Why this priority?" panel. Review each triggered rule, points contributed, and textual evidence.
2. **Manual Priority Override:** If field conditions differ from citizen descriptions, click **Override Priority**. Select the revised tier and enter a mandatory written explanation. This action is permanently recorded in the audit trail.
3. **Workflow Status Updates:** Transition cases through strict lifecycle stages:
   - `SUBMITTED` $\to$ `TRIAGED` $\to$ `ASSIGNED` $\to$ `IN_PROGRESS` $\to$ `RESOLVED`.
   - Resolving a case requires entering a comprehensive **Resolution Summary** describing the technical fix applied.
4. **Duplicate Detection:** View AI-suggested similar grievances filed in the same ward to coordinate repairs without duplicate field dispatches.

---

## 4. Administrator Governance Journey

### 4.1 System Overview & Live Analytics (`/admin/dashboard` & `/officer/analytics`)
- View aggregated operational metrics: overall resolution percentage, median acknowledgment time, median resolution hours, and departmental case load.
- Export filtered grievance reports in CSV format with built-in spreadsheet formula injection defense.

### 4.2 Priority Rule Management (`/admin/rules`)
- Adjust scoring weights for rules (e.g. modify Immediate Safety Hazard from +30 to +35).
- Test proposed rule weight changes in the **Live Rule Simulation Playground** before saving.

### 4.3 Audit Logs & Security Monitoring (`/admin/audit-logs`)
- Filter and search tamper-evident audit records by actor, action verb (`LOGIN`, `OVERRIDE_PRIORITY`, `STATUS_CHANGE`), date, and IP address.

### 4.4 ML Category Classifier Metrics (`/admin/model-evaluation`)
- View machine learning model version, training timestamps, accuracy, macro-F1 score, and the multiclass confusion matrix.
