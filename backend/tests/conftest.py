import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import pytest
from app import create_app
from app.config import TestConfig
from app.extensions import db
from app.models.user import User
from app.models.department import Department
from app.models.category import Category
from app.models.rules import PriorityRule
from app.services.auth_service import AuthService

@pytest.fixture(scope="session")
def app():
    app = create_app(TestConfig)
    return app

@pytest.fixture(scope="function")
def client(app):
    with app.app_context():
        db.create_all()
        # Seed test department and category
        dept = Department(code="TEST_DEPT", name="Test Department", is_active=True)
        db.session.add(dept)
        db.session.flush()

        cat = Category(
            code="TEST_CAT",
            name="Test Category",
            department_id=dept.id,
            default_sla_hours=48,
            is_active=True
        )
        cat.keywords = ["test", "water", "leak"]
        db.session.add(cat)

        # Seed priority rules
        rules = [
            PriorityRule(rule_key="EMERGENCY_DANGER", name="Immediate Danger", description="test", weight=30, condition_type="emergency_danger"),
            PriorityRule(rule_key="ESSENTIAL_FACILITY", name="Essential Facility", description="test", weight=20, condition_type="essential_facility"),
            PriorityRule(rule_key="DURATION_PROLONGED", name="Prolonged", description="test", weight=10, condition_type="duration_threshold"),
            PriorityRule(rule_key="CATEGORY_BASELINE", name="Baseline", description="test", weight=10, condition_type="baseline"),
        ]
        db.session.add_all(rules)

        # Seed test users
        citizen = AuthService.register_user("Citizen Test", "citizen.test@example.com", "Password123!", role="citizen", phone="1234567890")
        officer = AuthService.register_user("Officer Test", "officer.test@example.com", "Password123!", role="officer")
        officer.department_id = dept.id
        admin = AuthService.register_user("Admin Test", "admin.test@example.com", "Password123!", role="admin")

        db.session.commit()

        yield app.test_client()

        db.session.remove()
        db.drop_all()

@pytest.fixture
def citizen_auth(client):
    res = client.post("/api/v1/auth/login", json={"email": "citizen.test@example.com", "password": "Password123!"})
    token = res.get_json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def officer_auth(client):
    res = client.post("/api/v1/auth/login", json={"email": "officer.test@example.com", "password": "Password123!"})
    token = res.get_json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_auth(client):
    res = client.post("/api/v1/auth/login", json={"email": "admin.test@example.com", "password": "Password123!"})
    token = res.get_json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}
