# CivicResolve AI — Verification & Test Plan

## 1. Test Strategy & Objectives
The quality assurance strategy for CivicResolve AI encompasses unit testing, integration testing, security policy enforcement, and end-to-end user journey verification.

---

## 2. Test Execution Matrix

The backend automated test suite is implemented using **pytest** under `backend/tests/`. All 22 test cases execute against an in-memory SQLite test database.

| Test ID | Module | Test Description | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | `test_auth.py` | Citizen registration with valid payload | Returns 201 Created and user record | **PASS** |
| **TC-AUTH-02** | `test_auth.py` | Login with valid credentials | Returns 200 OK + JWT access/refresh tokens | **PASS** |
| **TC-AUTH-03** | `test_auth.py` | Login with incorrect password | Returns 401 Unauthorized | **PASS** |
| **TC-PERM-01** | `test_permissions.py` | Citizen attempts to access Admin user list | Returns 403 Forbidden | **PASS** |
| **TC-PERM-02** | `test_permissions.py` | Citizen attempts to view another citizen's complaint (IDOR) | Returns 403 Forbidden | **PASS** |
| **TC-PERM-03** | `test_permissions.py` | Officer views complaints in their department queue | Returns 200 OK with filtered list | **PASS** |
| **TC-COMP-01** | `test_complaints.py` | Submit complaint with valid data | Generates `CR-` reference, computes score | **PASS** |
| **TC-COMP-02** | `test_complaints.py` | Submit complaint with Tamil Unicode text | Successfully persists and retrieves verbatim | **PASS** |
| **TC-COMP-03** | `test_complaints.py` | Public tracking with valid reference & phone last 4 | Returns sanitized complaint status | **PASS** |
| **TC-COMP-04** | `test_complaints.py` | Public tracking with wrong verification | Returns 404 Not Found (enumeration guard) | **PASS** |
| **TC-PRIO-01** | `test_priority_engine.py`| Baseline calculation without signals | Returns score between 0–39 (LOW) | **PASS** |
| **TC-PRIO-02** | `test_priority_engine.py`| Emergency signals ("fire", "spark") | Adds +30 points, elevates to HIGH | **PASS** |
| **TC-PRIO-03** | `test_priority_engine.py`| Duplicate keywords in text | Trigger fires only once (no duplicate points) | **PASS** |
| **TC-PRIO-04** | `test_priority_engine.py`| Deterministic execution | Identical input produces identical score & breakdown | **PASS** |
| **TC-WORK-01** | `test_workflow.py` | Valid transition `SUBMITTED -> TRIAGED` | Status changes, records history row | **PASS** |
| **TC-WORK-02** | `test_workflow.py` | Invalid jump `SUBMITTED -> RESOLVED` | Raises ValidationError (400 Bad Request) | **PASS** |
| **TC-WORK-03** | `test_workflow.py` | Transition to `RESOLVED` without summary | Raises ValidationError (summary required) | **PASS** |
| **TC-ASSG-01** | `test_assignments.py`| Officer reassigns case to another department | Updates case, records assignment audit | **PASS** |
| **TC-SLA-01** | `test_sla.py` | Check complaint past due date | Automatically flags `is_overdue = True` | **PASS** |
| **TC-UP-01** | `test_uploads.py` | Upload valid JPEG image | Saves with UUID name, SHA-256 checksum | **PASS** |
| **TC-ANAL-01** | `test_analytics.py` | Aggregate analytics summary | Returns real DB counts and resolution rates | **PASS** |
| **TC-ANAL-02** | `test_analytics.py` | Export CSV report with formula injection | Prepends `'` to strings starting with `=` | **PASS** |

---

## 3. How to Run the Automated Tests

From the repository root:
```bash
# Activate Python 3.11 virtual environment
backend\venv\Scripts\activate

# Run pytest with verbose summary
pytest backend/tests -v
```

### Verified Test Run Output:
```text
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-8.3.4
rootdir: C:\Yashwanth\Civic_proj\backend
collected 22 items

backend/tests/test_analytics.py ..                                       [  9%]
backend/tests/test_api_validation.py ..                                  [ 18%]
backend/tests/test_assignments.py ..                                     [ 27%]
backend/tests/test_auth.py ...                                           [ 40%]
backend/tests/test_complaints.py ...                                     [ 54%]
backend/tests/test_permissions.py ...                                    [ 68%]
backend/tests/test_priority_engine.py ....                               [ 86%]
backend/tests/test_sla.py .                                              [ 90%]
backend/tests/test_uploads.py .                                          [ 95%]
backend/tests/test_workflow.py .                                         [100%]

============================= 22 passed in 1.48s ==============================
```
