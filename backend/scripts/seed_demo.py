import sys
import json
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.department import Department
from app.models.category import Category
from app.models.complaint import Complaint
from app.models.rules import PriorityRule
from app.services.complaint_service import ComplaintService
from app.services.workflow_service import WorkflowService
from app.services.assignment_service import AssignmentService
from app.services.audit_service import AuditService

def seed():
    app = create_app()
    with app.app_context():
        print("[*] Creating database tables if not existing...")
        db.create_all()

        print("[*] Seeding Priority Rules...")
        default_rules = [
            ("EMERGENCY_DANGER", "Immediate Public Safety Danger", "Immediate hazard to life, sparks, cave-ins, or physical collapse", 30, "emergency_danger"),
            ("ESSENTIAL_FACILITY", "Essential Public Facility Outage", "Essential utility outage impacting public institutions", 20, "essential_facility"),
            ("CRITICAL_FACILITY_TYPE", "Critical Facility (Hospital / School)", "Interruption specifically affecting hospitals, trauma care, or schools", 15, "facility_type"),
            ("DURATION_PROLONGED", "Prolonged Hazard / Service Outage", "Unresolved outage persisting for 3 or more days", 10, "duration_threshold"),
            ("REPEAT_AREA_SIGNAL", "Geographic Complaint Density", "Cluster of 2 or more related complaints reported in same vicinity", 10, "keyword_signal"),
            ("VULNERABLE_POPULATION", "Vulnerable Persons Impact", "Impact directly on elderly citizens, children, or hospital patients", 5, "keyword_signal"),
            ("CATEGORY_BASELINE", "Essential Civic Category Baseline", "Baseline priority for vital civic lifelines (water, power, drainage)", 10, "baseline"),
        ]

        for key, name, desc, weight, cond in default_rules:
            if not PriorityRule.query.filter_by(rule_key=key).first():
                r = PriorityRule(rule_key=key, name=name, description=desc, weight=weight, condition_type=cond, version="1.0.0")
                db.session.add(r)
        db.session.commit()

        print("[*] Seeding Departments and Categories...")
        taxonomy_file = backend_dir.parent / "data" / "category_taxonomy.json"
        dept_map = {}
        if taxonomy_file.exists():
            with open(taxonomy_file, "r", encoding="utf-8") as f:
                tax = json.load(f)
                for d_data in tax.get("departments", []):
                    dept = Department.query.filter_by(code=d_data["code"]).first()
                    if not dept:
                        dept = Department(code=d_data["code"], name=d_data["name"], description=d_data.get("description"), is_active=True)
                        db.session.add(dept)
                        db.session.flush()
                    dept_map[d_data["code"]] = dept

                for c_data in tax.get("categories", []):
                    cat = Category.query.filter_by(code=c_data["code"]).first()
                    target_dept = dept_map.get(c_data["department_code"])
                    if not cat and target_dept:
                        cat = Category(
                            code=c_data["code"],
                            name=c_data["name"],
                            department_id=target_dept.id,
                            description=c_data.get("description"),
                            default_sla_hours=c_data.get("default_sla_hours", 48),
                            is_active=True
                        )
                        cat.keywords = c_data.get("keywords", [])
                        db.session.add(cat)
                db.session.commit()

        print("[*] Seeding Demo Users...")
        # Admin
        admin = User.query.filter_by(email="admin@civicresolve.gov").first()
        if not admin:
            admin = User(name="System Administrator", email="admin@civicresolve.gov", role="admin", account_status="active", preferred_language="en")
            admin.set_password("AdminPass123!")
            db.session.add(admin)

        # Supervisor
        supervisor = User.query.filter_by(email="supervisor@civicresolve.gov").first()
        if not supervisor:
            supervisor = User(name="Civic Supervisor", email="supervisor@civicresolve.gov", role="supervisor", account_status="active", preferred_language="en")
            supervisor.set_password("SupervisorPass123!")
            db.session.add(supervisor)

        # Officers per department
        officer_accounts = [
            ("water.officer@civicresolve.gov", "Water Board Officer", "WATER_DEPT"),
            ("power.officer@civicresolve.gov", "Power Grid Officer", "POWER_DEPT"),
            ("roads.officer@civicresolve.gov", "Works & Roads Officer", "WORKS_DEPT"),
            ("sanitation.officer@civicresolve.gov", "Sanitation Officer", "SAN_DEPT"),
            ("health.officer@civicresolve.gov", "Public Health Officer", "HEALTH_DEPT"),
            ("pds.officer@civicresolve.gov", "Civil Supplies Officer", "PDS_DEPT"),
            ("civic.officer@civicresolve.gov", "General Municipal Officer", "CIVIC_DEPT"),
        ]

        officer_map = {}
        for email, name, dept_code in officer_accounts:
            officer = User.query.filter_by(email=email).first()
            dept = dept_map.get(dept_code)
            if not officer:
                officer = User(name=name, email=email, role="officer", account_status="active", preferred_language="en")
                officer.set_password("OfficerPass123!")
                if dept:
                    officer.department_id = dept.id
                db.session.add(officer)
                db.session.flush()
            officer_map[dept_code] = officer

        # Citizens
        citizens = [
            ("citizen.anita@example.com", "Anita Sharma", "en", "9876543210"),
            ("citizen.kumar@example.com", "Kumaravel S", "ta", "9876543211"),
            ("citizen.priya@example.com", "Priya Venkatesh", "en", "9876543212"),
        ]
        citizen_objs = []
        for email, name, lang, phone in citizens:
            c = User.query.filter_by(email=email).first()
            if not c:
                c = User(name=name, email=email, role="citizen", account_status="active", preferred_language=lang, phone_number=phone)
                c.set_password("CitizenPass123!")
                db.session.add(c)
                db.session.flush()
            citizen_objs.append(c)

        db.session.commit()

        print("[*] Seeding Benchmark Complaints...")
        # Seed only if complaints table has fewer than 5 records
        if Complaint.query.count() < 5:
            sample_file = backend_dir.parent / "data" / "sample_complaints.csv"
            import csv
            if sample_file.exists():
                with open(sample_file, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for idx, row in enumerate(reader):
                        cat = Category.query.filter_by(code=row["category_code"]).first()
                        if not cat:
                            continue
                        citizen = citizen_objs[idx % len(citizen_objs)]
                        
                        complaint = ComplaintService.create_complaint(
                            citizen_id=citizen.id,
                            title=row["title"],
                            description=row["description"],
                            category_id=cat.id,
                            approx_location=row["approx_location"],
                            immediate_danger=(row["immediate_danger"].lower() == "true"),
                            is_essential_facility=(row["is_essential_facility"].lower() == "true"),
                            facility_type=row["facility_type"] if row["facility_type"] != "none" else None,
                            reported_duration_days=int(row["reported_duration_days"]),
                            contact_phone=citizen.phone_number
                        )

                        # Advance some demo cases to TRIAGED, ASSIGNED, and IN_PROGRESS for realistic initial dashboard
                        dept = cat.department
                        dept_officer = officer_map.get(dept.code)
                        if idx % 3 == 0 and dept_officer:
                            AssignmentService.assign_complaint(
                                complaint_id=complaint.id,
                                officer_id=dept_officer.id,
                                department_id=dept.id,
                                actor=supervisor,
                                reason="Priority triage assigned directly to departmental specialist."
                            )
                            WorkflowService.update_status(
                                complaint_id=complaint.id,
                                new_status="IN_PROGRESS",
                                user=dept_officer,
                                public_note="Department inspection team dispatched to site."
                            )
                        elif idx % 4 == 0 and dept_officer:
                            AssignmentService.assign_complaint(
                                complaint_id=complaint.id,
                                officer_id=dept_officer.id,
                                department_id=dept.id,
                                actor=supervisor,
                                reason="Standard assignment."
                            )
                            WorkflowService.update_status(
                                complaint_id=complaint.id,
                                new_status="IN_PROGRESS",
                                user=dept_officer,
                                public_note="Work in progress by ground team."
                            )
                            WorkflowService.update_status(
                                complaint_id=complaint.id,
                                new_status="RESOLVED",
                                user=dept_officer,
                                public_note="Grievance rectified and inspected.",
                                resolution_summary="Pipeline replacement completed and high-pressure test passed successfully."
                            )

        print("[+] Seed process completed successfully with realistic demo data!")

if __name__ == "__main__":
    seed()
