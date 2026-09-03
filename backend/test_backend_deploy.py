import sys
import httpx
import json

BASE_URL = "http://localhost:8000"

def test_endpoint(name: str, passed: bool, details: str = ""):
    status_str = "PASS" if passed else "FAIL"
    print(f"[{status_str}] {name} {('- ' + details) if details else ''}")
    if not passed:
        raise AssertionError(f"Test failed: {name} - {details}")

def run_tests():
    print("==================================================")
    print("    QubitLab Backend Comprehensive Deploy Audit   ")
    print("==================================================")

    with httpx.Client(base_url=BASE_URL, timeout=15.0) as client:
        # 1. Health Check
        r = client.get("/health")
        test_endpoint("GET /health", r.status_code == 200, f"status={r.status_code}, data={r.text}")

        # 2. Problems Listing
        r = client.get("/problems")
        data = r.json()
        items = data.get("items", [])
        test_endpoint("GET /problems", r.status_code == 200 and len(items) > 0, f"Found {len(items)} problems")
        first_problem_id = items[0]["id"] if items else None

        # 3. Single Problem Detail
        if first_problem_id:
            r = client.get(f"/problems/{first_problem_id}")
            p_data = r.json()
            test_endpoint("GET /problems/{id}", r.status_code == 200 and "title" in p_data, f"Title: {p_data.get('title')}")

        # 4. Courses Listing
        r = client.get("/courses")
        courses = r.json()
        test_endpoint("GET /courses", r.status_code == 200 and len(courses) > 0, f"Found {len(courses)} courses")

        # 5. Badges Listing
        r = client.get("/badges")
        badges = r.json()
        test_endpoint("GET /badges", r.status_code == 200 and len(badges) > 0, f"Found {len(badges)} badges")

        # 6. Leaderboard
        r = client.get("/leaderboard")
        test_endpoint("GET /leaderboard", r.status_code == 200, f"status={r.status_code}")

        # 7. Qiskit Aer Quantum Simulation
        sim_payload = {
            "qubits": 2,
            "gates": [
                {"type": "H", "qubit": 0, "step": 0},
                {"type": "CNOT", "qubit": 0, "target": 1, "step": 1}
            ]
        }
        r = client.post("/simulate", json=sim_payload)
        sim_data = r.json()
        probs = sim_data.get("probabilities", {})
        is_bell = abs(probs.get("00", 0) - 0.5) < 0.05 and abs(probs.get("11", 0) - 0.5) < 0.05
        test_endpoint("POST /simulate (Qiskit Aer Bell State)", r.status_code == 200 and is_bell, f"00: {probs.get('00')}, 11: {probs.get('11')}")

        # 8. Python Code Sandbox
        code_payload = {
            "dialect": "qiskit",
            "code": "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)\nprint('Circuits ready!')"
        }
        r = client.post("/sandbox/run", json=code_payload)
        sb_data = r.json()
        sb_ok = sb_data.get("ok", False) and "Circuits ready!" in sb_data.get("stdout", "")
        test_endpoint("POST /sandbox/run", r.status_code == 200 and sb_ok, f"stdout: {sb_data.get('stdout', '').strip()}")

        # 9. Admin Authentication
        from app.config import settings
        admin_payload = {
            "email": settings.admin_email,
            "password": settings.admin_password
        }
        r = client.post("/admin/auth/login", json=admin_payload)
        admin_token = r.json().get("access_token")
        test_endpoint("POST /admin/auth/login", r.status_code == 200 and bool(admin_token), f"Admin session token obtained (status={r.status_code})")

        if admin_token:
            admin_headers = {"Authorization": f"Bearer {admin_token}"}
            r = client.get("/admin/analytics", headers=admin_headers)
            test_endpoint("GET /admin/analytics", r.status_code == 200, f"Total problems in analytics: {r.json().get('totalProblems')}")

        # 10. User Registration & Auth Flow
        test_email = f"deploy_test_user_{int(r.elapsed.total_seconds() * 10000)}@example.com"
        reg_payload = {
            "email": test_email,
            "password": "Password123!",
            "name": "Deploy Tester"
        }
        r = client.post("/auth/signup", json=reg_payload)
        user_token = r.json().get("access_token")
        test_endpoint("POST /auth/signup", r.status_code == 201 and bool(user_token), f"Created user {test_email}")

        if user_token:
            user_headers = {"Authorization": f"Bearer {user_token}"}
            r = client.get("/users/me/stats", headers=user_headers)
            test_endpoint("GET /users/me/stats", r.status_code == 200, f"User stats verified, level={r.json().get('level')}")

    print("==================================================")
    print("   ALL 10 DEPLOYMENT HEALTH TESTS PASSED (100%)   ")
    print("==================================================")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\nAudit failed with error: {e}", file=sys.stderr)
        sys.exit(1)
