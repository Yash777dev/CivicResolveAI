import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv

# Base directory of the repository
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load .env file from root or backend directory
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


class Config:
    """Base application configuration."""
    ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = os.getenv("FLASK_DEBUG", "1") == "1"
    SECRET_KEY = os.getenv("SECRET_KEY", "civicresolve-fallback-secret-key-32-chars-min")

    # Database configuration
    # Default to SQLite local storage as requested, but seamlessly supports Postgres
    default_db_path = BASE_DIR / "civicresolve.db"
    DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{default_db_path.as_posix()}")
    
    # Fix for Heroku/Render postgres:// vs postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # SQLite specific engine options
    if DATABASE_URL.startswith("sqlite"):
        SQLALCHEMY_ENGINE_OPTIONS = {
            "connect_args": {"check_same_thread": False}
        }
    else:
        SQLALCHEMY_ENGINE_OPTIONS = {
            "pool_pre_ping": True,
            "pool_recycle": 300,
        }

    # JWT Authentication Configuration
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "civicresolve-fallback-jwt-secret-key-development")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "120"))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", "7"))
    )
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    # CORS
    raw_cors = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
    CORS_ORIGINS = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]

    # File Uploads
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", str(BASE_DIR / "storage" / "uploads"))
    if not os.path.isabs(UPLOAD_FOLDER):
        UPLOAD_FOLDER = str(BASE_DIR / UPLOAD_FOLDER)
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", str(10 * 1024 * 1024))) # 10 MB
    ALLOWED_EXTENSIONS = set(
        ext.strip().lower()
        for ext in os.getenv("ALLOWED_EXTENSIONS", "jpg,jpeg,png,webp,pdf").split(",")
    )

    # Priority Engine & Intelligence
    PRIORITY_ENGINE_VERSION = os.getenv("PRIORITY_ENGINE_VERSION", "1.0.0")
    SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.65"))

    # SLA Settings (Hours)
    DEFAULT_ACKNOWLEDGEMENT_SLA_HOURS = int(os.getenv("DEFAULT_ACKNOWLEDGEMENT_SLA_HOURS", "24"))
    DEFAULT_RESOLUTION_SLA_HOURS = int(os.getenv("DEFAULT_RESOLUTION_SLA_HOURS", "72"))


class TestConfig(Config):
    """Configuration for automated test suite."""
    TESTING = True
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(minutes=15)
