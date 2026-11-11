# CivicResolve AI — Capstone Project Report Outline
**Academic Project Report for Final Year / 7th Semester B.E. / B.Tech Computer Science & Engineering**

---

## Title Page
**CIVICRESOLVE AI: AN EXPLAINABLE AUTONOMOUS GRIEVANCE REDRESSAL SYSTEM FOR GOVERNMENT SERVICES**

---

## Certificate & Declaration
Standard academic institution format certifying genuine project completion.

---

## Abstract
Public municipal grievance redressal systems suffer from severe backlogs, opaque prioritization, manual departmental misrouting, and duplicate field dispatches. Existing AI-based proposals rely on uninterpretable deep neural networks, raising accountability and safety concerns in public administration. This project presents **CivicResolve AI**, an explainable, autonomous grievance redressal web platform built with React, TypeScript, Python/Flask, and SQLAlchemy. The core innovation is a deterministic, versioned, explainable priority scoring engine that breaks down urgency scores (0–100) into traceable rule contributions (e.g., safety hazards, critical facility proximity, essential service outages). An officer-in-the-loop governance mechanism allows manual priority overrides with mandatory audit justification. The system integrates TF-IDF cosine duplicate detection, automated SLA deadline tracking, bilingual Tamil-English Unicode support, and defensive security measures (IDOR prevention, CSV formula injection defense). Automated testing (22 pytest test cases) validates deterministic scoring, state machine enforcement, and RBAC authorization.

---

## Chapter 1: Introduction
- **1.1 Background:** Urban governance challenges in municipal corporations (Corporation of Chennai, BBMP, etc.).
- **1.2 Problem Statement:** Lack of transparent triage, high manual triage burden, black-box AI risks in governance.
- **1.3 Objectives:**
  - Build a deterministic explainable priority engine.
  - Implement a secure, role-based workflow state machine.
  - Integrate duplicate grievance detection without citizen privacy leakage.
  - Guarantee bilingual accessibility (English & Tamil Unicode).
- **1.4 Scope and Limitations:** Digital grievance management and administrative assistance; does not control physical municipal machinery.

---

## Chapter 2: Literature Survey
- **2.1 Review of Existing Systems:** CPGRAMS (Centralized Public Grievance Redress and Monitoring System), CM Helpline, municipal web portals.
- **2.2 Explainable AI (XAI) in Public Administration:** Limitations of SHAP/LIME on unstructured text vs. deterministic expert systems.
- **2.3 Natural Language Processing in Civic Tech:** TF-IDF, Logistic Regression, bilingual transliteration vs. verbatim Unicode preservation.
- **2.4 Comparative Matrix:** CivicResolve AI vs. Traditional Portals vs. Opaque ML Black-Box Platforms.

---

## Chapter 3: System Architecture & Design
- **3.1 High-Level Architecture:** 3-tier decoupled architecture (Client, REST Gateway, Domain Services, Persistence).
- **3.2 Database Schema & ER Modeling:** 3NF normalization, table descriptions (`complaints`, `priority_assessments`, `priority_overrides`, `audit_logs`).
- **3.3 Workflow State Machine:** Permitted transitions (`SUBMITTED` to `CLOSED`), resolution requirements, reopening triggers.
- **3.4 Threat Modeling:** STRIDE analysis, IDOR prevention, CSV formula injection neutralization, safe file upload validation.

---

## Chapter 4: Implementation Methodology
- **4.1 Explainable Priority Engine Algorithm:** Mathematical formulation, weight configurations, signal extraction, clamps.
- **4.2 Duplicate Detection Pipeline:** TF-IDF vectorization, cosine similarity matrix computation, 30-day temporal windowing.
- **4.3 Category Classification:** Deterministic multilingual keyword taxonomy + TF-IDF Logistic Regression pipeline.
- **4.4 Frontend Design System:** React 19, TypeScript strict mode, Tailwind CSS v4, Lucide icons, Leaflet OpenStreetMap integration, custom zero-overhead i18n context.

---

## Chapter 5: Testing & Experimental Results
- **5.1 Testing Strategy:** Unit testing, integration testing, boundary value analysis.
- **5.2 Automated Test Matrix:** 22/22 pytest cases passing (auth, permissions, priority engine, workflow, SLA, analytics).
- **5.3 Classification & Priority Performance:** Confusion matrix, macro-F1 evaluation, deterministic reproducibility tests.
- **5.4 Performance Metrics:** API response latencies, database query performance.

---

## Chapter 6: Ethical Governance & Safety Safeguards
- **6.1 Zero Hallucination & Transparency:** Visible fired rules vs. fabricated confidence scores.
- **6.2 Officer-in-the-Loop Override:** Mandatory audit logging, accountability preservation.
- **6.3 Non-Discrimination:** Tone and literacy neutrality; non-inference of demographic traits.

---

## Chapter 7: Conclusion & Future Enhancements
- **7.1 Conclusion:** Successful delivery of a production-grade, explainable civic grievance redressal platform.
- **7.2 Future Enhancements:**
  - Automated WhatsApp/SMS webhook integration via open-source protocols.
  - Satellite/GIS raster overlay for flood mapping.
  - Offline-first Progressive Web App (PWA) sync for remote rural field officers.

---

## References
Standard IEEE bibliography covering XAI, Flask architectures, civic tech governance, and web application security standards.
