#!/usr/bin/env python3
"""
===============================================================================
CIVICRESOLVE AI — UNIFIED APPLICATION RUNNER
Autonomous & Explainable Grievance Redressal System for Government Services
Final-Year / 7th-Semester CSE Capstone Project
===============================================================================
This single script initializes and runs the entire full-stack application:
  1. Python Flask REST API Backend (Port 5000)
  2. React + TypeScript + Vite Frontend (Port 5173)

Usage:
  python civic.py               # Run both backend & frontend + open browser
  python civic.py --no-browser  # Run without launching default browser
  python civic.py --seed        # Re-seed database before starting
  python civic.py --test        # Run automated pytest test suite and exit
  python civic.py --backend-only
  python civic.py --frontend-only
===============================================================================
"""

import os
import sys
import time
import shutil
import signal
import argparse
import subprocess
import webbrowser
import urllib.request
import urllib.error
from pathlib import Path
from threading import Thread

# Paths configuration
PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"
STORAGE_DIR = PROJECT_ROOT / "storage"
DB_FILE = PROJECT_ROOT / "civicresolve.db"
MODEL_FILE = BACKEND_DIR / "models_storage" / "category_classifier.joblib"


def get_backend_python() -> str:
    """Detect and return the preferred Python interpreter for backend."""
    # Check Windows venv
    win_venv = BACKEND_DIR / "venv" / "Scripts" / "python.exe"
    if win_venv.exists():
        return str(win_venv)
    
    # Check Unix venv
    unix_venv = BACKEND_DIR / "venv" / "bin" / "python"
    if unix_venv.exists():
        return str(unix_venv)

    # Fallback to the interpreter currently running this script
    return sys.executable


def get_npm_cmd() -> str:
    """Find the npm executable across Windows and Unix."""
    npm_path = shutil.which("npm.cmd") or shutil.which("npm")
    if not npm_path:
        raise RuntimeError(
            "Node.js 'npm' package manager was not found on your system PATH.\n"
            "Please install Node.js from https://nodejs.org (v18+ recommended)."
        )
    return npm_path


def check_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """Check if a network port is already open/listening."""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0


def ensure_environment(backend_py: str, force_seed: bool = False, force_train: bool = False):
    """Ensure database, migrations, seed data, and ML models are ready."""
    print("\n[CivicResolve AI] Initializing system environment...")

    # Ensure storage uploads directory exists
    uploads_dir = STORAGE_DIR / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)

    # Check database initialization
    needs_seed = force_seed or not DB_FILE.exists()
    if needs_seed:
        print("[CivicResolve AI] Seeding database with departments, users, and rules...")
        seed_script = BACKEND_DIR / "scripts" / "seed_demo.py"
        res = subprocess.run([backend_py, str(seed_script)], cwd=str(PROJECT_ROOT))
        if res.returncode != 0:
            print("[CivicResolve AI] Warning: Database seeding exited with non-zero status.")
    else:
        print(f"[CivicResolve AI] Database found: {DB_FILE.name}")

    # Check ML classifier model
    needs_train = force_train or not MODEL_FILE.exists()
    if needs_train:
        print("[CivicResolve AI] Training TF-IDF Category Classifier & evaluating baseline...")
        train_script = BACKEND_DIR / "scripts" / "train_classifier.py"
        eval_script = BACKEND_DIR / "scripts" / "evaluate_classifier.py"
        subprocess.run([backend_py, str(train_script)], cwd=str(PROJECT_ROOT))
        subprocess.run([backend_py, str(eval_script)], cwd=str(PROJECT_ROOT))
    else:
        print(f"[CivicResolve AI] Trained ML model found: {MODEL_FILE.name}")

    # Check frontend node_modules
    frontend_nm = FRONTEND_DIR / "node_modules"
    if not frontend_nm.exists():
        print("[CivicResolve AI] Installing frontend dependencies (npm install)...")
        npm_cmd = get_npm_cmd()
        subprocess.run([npm_cmd, "install", "--legacy-peer-deps"], cwd=str(FRONTEND_DIR), shell=True)


def stream_logs(process: subprocess.Popen, prefix: str):
    """Continuously stream process stdout/stderr with a colored prefix."""
    try:
        for line in iter(process.stdout.readline, ""):
            if not line:
                break
            line_str = line.strip()
            if line_str:
                print(f"{prefix} {line_str}")
    except Exception:
        pass


def wait_for_backend(url: str = "http://127.0.0.1:5000/api/v1/health", timeout: int = 15) -> bool:
    """Poll backend health check until it responds 200 OK."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "CivicResolve-Healthcheck"})
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            time.sleep(0.5)
    return False


def print_banner():
    """Print the unified application banner and operational links."""
    banner = r"""
================================================================================
   ______ _       _      ____                 _             ___    ____
  / ____/(_)   __(_)____/ __ \___  _________ / /   __   __ /   |  /  _/
 / /    / / | / / / ___/ /_/ / _ \/ ___/ __ \/ / | / / _ \ / /| |  / /  
/ /___ / /| |/ / / /__/ _, _/  __(__  ) /_/ / /| |/ /  __// ___ |_/ /   
\____//_/ |___/_/\___/_/ |_|\___/____/\____/_/ |___/\___//_/  |_/___/   
================================================================================
   EXPLAINABLE AUTONOMOUS GRIEVANCE REDRESSAL SYSTEM FOR GOVERNMENT SERVICES
   CSE Final-Year Capstone Project — Full-Stack Application Running!
================================================================================
  🌍 FRONTEND PORTAL : http://localhost:5173
  ⚙️ BACKEND REST API : http://127.0.0.1:5000/api/v1
  🩺 HEALTH STATUS    : http://127.0.0.1:5000/api/v1/health (HEALTHY)
  🔍 PUBLIC TRACKING  : http://localhost:5173/track
  📖 USER MANUAL      : docs/user-manual.md
--------------------------------------------------------------------------------
  DEMO CREDENTIALS (or use One-Click selector on /login):
    • Citizen         : citizen.anita@example.com     / CitizenPass123!
    • Water Officer   : water.officer@civicresolve.gov / OfficerPass123!
    • Power Officer   : power.officer@civicresolve.gov / OfficerPass123!
    • Supervisor      : supervisor@civicresolve.gov    / SupervisorPass123!
    • Administrator   : admin@civicresolve.gov         / AdminPass123!
================================================================================
  👉 Press Ctrl + C in this terminal to safely stop all services.
================================================================================
"""
    print(banner)


def kill_process_tree(pid: int):
    """Safely terminate a process and all its child subprocesses."""
    if os.name == "nt":
        # Windows taskkill forcefully kills process tree
        subprocess.run(
            ["taskkill", "/F", "/T", "/PID", str(pid)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    else:
        try:
            os.killpg(os.getpgid(pid), signal.SIGTERM)
        except Exception:
            try:
                os.kill(pid, signal.SIGTERM)
            except Exception:
                pass


def run_tests(backend_py: str) -> int:
    """Run backend automated pytest suite."""
    print("\n[CivicResolve AI] Running automated test suite (pytest)...")
    cmd = [backend_py, "-m", "pytest", str(BACKEND_DIR / "tests"), "-v"]
    res = subprocess.run(cmd, cwd=str(PROJECT_ROOT))
    return res.returncode


def main():
    parser = argparse.ArgumentParser(
        description="CivicResolve AI — Unified Full-Stack Application Runner"
    )
    parser.add_argument("--no-browser", action="store_true", help="Do not open web browser automatically")
    parser.add_argument("--seed", action="store_true", help="Force re-seed demo database before starting")
    parser.add_argument("--train", action="store_true", help="Force re-train ML category classifier")
    parser.add_argument("--test", action="store_true", help="Run automated test suite and exit")
    parser.add_argument("--backend-only", action="store_true", help="Start only the Flask backend server")
    parser.add_argument("--frontend-only", action="store_true", help="Start only the Vite frontend dev server")
    parser.add_argument("--port-backend", type=int, default=5000, help="Backend port (default 5000)")
    parser.add_argument("--port-frontend", type=int, default=5173, help="Frontend port (default 5173)")
    args = parser.parse_args()

    backend_py = get_backend_python()

    # If --test flag requested
    if args.test:
        code = run_tests(backend_py)
        sys.exit(code)

    # Initialize environment
    ensure_environment(backend_py, force_seed=args.seed, force_train=args.train)

    processes = []

    def shutdown(signum=None, frame=None):
        print("\n\n[CivicResolve AI] Stopping services gracefully...")
        for proc, name in processes:
            print(f"[CivicResolve AI] Terminating {name} (PID: {proc.pid})...")
            kill_process_tree(proc.pid)
        print("[CivicResolve AI] All services stopped. Goodbye!\n")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # 1. Start Backend Server
    if not args.frontend_only:
        backend_entry = BACKEND_DIR / "wsgi.py"
        print(f"[CivicResolve AI] Starting Flask Backend on http://127.0.0.1:{args.port_backend}...")

        env = os.environ.copy()
        env["PYTHONUNBUFFERED"] = "1"
        env["FLASK_RUN_PORT"] = str(args.port_backend)

        backend_proc = subprocess.Popen(
            [backend_py, str(backend_entry)],
            cwd=str(PROJECT_ROOT),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        processes.append((backend_proc, "Backend (Flask)"))

        # Stream backend logs in background thread
        t_be = Thread(target=stream_logs, args=(backend_proc, "[Backend]"), daemon=True)
        t_be.start()

        # Wait for healthcheck
        print("[CivicResolve AI] Awaiting backend healthcheck...")
        is_healthy = wait_for_backend(f"http://127.0.0.1:{args.port_backend}/api/v1/health", timeout=12)
        if is_healthy:
            print("[CivicResolve AI] ✓ Backend is HEALTHY and ready!")
        else:
            print("[CivicResolve AI] Warning: Backend took longer than expected to report healthy.")

    # 2. Start Frontend Server
    if not args.backend_only:
        npm_cmd = get_npm_cmd()
        print(f"[CivicResolve AI] Starting Vite Frontend on http://localhost:{args.port_frontend}...")

        # Run npm run dev in frontend dir
        frontend_proc = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            cwd=str(FRONTEND_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            shell=True
        )
        processes.append((frontend_proc, "Frontend (Vite)"))

        # Stream frontend logs in background thread
        t_fe = Thread(target=stream_logs, args=(frontend_proc, "[Frontend]"), daemon=True)
        t_fe.start()

        # Wait a moment for Vite to bind
        time.sleep(2.0)

    # Print summary dashboard banner
    print_banner()

    # Automatically launch browser if requested
    if not args.no_browser and not args.backend_only:
        time.sleep(1.0)
        frontend_url = f"http://localhost:{args.port_frontend}"
        print(f"[CivicResolve AI] Opening browser at {frontend_url}...")
        try:
            webbrowser.open(frontend_url)
        except Exception:
            pass

    # Keep main thread alive and monitor child processes
    try:
        while True:
            for proc, name in processes:
                ret = proc.poll()
                if ret is not None:
                    print(f"\n[CivicResolve AI] Alert: {name} process exited unexpectedly with code {ret}.")
                    shutdown()
            time.sleep(1.0)
    except KeyboardInterrupt:
        shutdown()


if __name__ == "__main__":
    main()
