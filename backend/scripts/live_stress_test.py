"""
Comprehensive Live API Testing Script for TVISA / Lumière Jewels
Tests all endpoints on https://tvisa-1.onrender.com
"""
import urllib.request
import urllib.error
import json
import time
import uuid

BASE_URL = "https://tvisa-1.onrender.com"

results = {
    "passed": 0,
    "failed": 0,
    "details": []
}

def log_result(name, success, details):
    status = "[PASS]" if success else "[FAIL]"
    if success:
        results["passed"] += 1
    else:
        results["failed"] += 1
    results["details"].append(f"{status} - {name}: {details}")
    print(f"{status} - {name}: {details}")

def make_request(path, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{path}"
    headers = headers or {}
    req_data = None
    
    if data:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode("utf-8")
            json_body = None
            try:
                json_body = json.loads(body)
            except Exception:
                pass
            return resp.status, resp.headers, json_body or body
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        json_body = None
        try:
            json_body = json.loads(body)
        except Exception:
            pass
        return e.code, e.headers, json_body or body
    except Exception as e:
        return 500, {}, str(e)

print("=" * 60)
print(f"STARTING COMPREHENSIVE LIVE API TEST ON {BASE_URL}")
print("=" * 60)

# 1. Health Check
status, _, body = make_request("/health/")
log_result("Health Check (/health/)", status == 200, f"Status={status}, Response={body}")

# 2. Products List
status, _, body = make_request("/api/products/")
count = body.get("count", len(body.get("results", []))) if isinstance(body, dict) else 0
log_result("Products Feed (/api/products/)", status == 200, f"Status={status}, Count={count}")

# 3. Homepage Feeds
for feed in ["all", "bestsellers", "quick-picks", "new-arrivals", "hero", "instagram"]:
    status, _, body = make_request(f"/api/products/homepage/{feed}/")
    log_result(f"Homepage Feed ({feed})", status == 200, f"Status={status}")

# 4. Categories & Subcategories
status, _, body = make_request("/api/categories/")
log_result("Categories List (/api/categories/)", status == 200, f"Status={status}")

status, _, body = make_request("/api/subcategories/")
log_result("Subcategories List (/api/subcategories/)", status == 200, f"Status={status}")

# 5. CORS Preflight Check
req = urllib.request.Request(
    f"{BASE_URL}/api/products/",
    headers={"Origin": "https://tvisa.onrender.com", "Access-Control-Request-Method": "GET"},
    method="OPTIONS"
)
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        cors_header = resp.headers.get("Access-Control-Allow-Origin")
        log_result("CORS Preflight Headers", resp.status in [200, 204], f"Status={resp.status}, CORS={cors_header}")
except Exception as e:
        log_result("CORS Preflight Headers", False, str(e))

# 6. Guest Cart Operations (with X-Guest-ID)
guest_id = str(uuid.uuid4())
status, _, body = make_request("/api/cart/", headers={"X-Guest-ID": guest_id})
log_result("Guest Cart Fetch (/api/cart/)", status == 200, f"Status={status}, GuestID={guest_id[:8]}")

# 7. Invalid Auth Token handling (401 expected)
status, _, body = make_request("/api/auth/profile/", headers={"Authorization": "Bearer invalid_token_123"})
log_result("Invalid Auth Token rejection", status == 401, f"Status={status} (Expected 401)")

# 8. Missing User Login validation (400 / 401 expected)
status, _, body = make_request("/api/auth/login/", method="POST", data={"email": "nonexistent@test.com", "password": "wrong"})
log_result("Invalid Login rejection", status in [400, 401], f"Status={status}")

print("=" * 60)
print(f"LIVE TEST SUMMARY: {results['passed']} Passed | {results['failed']} Failed")
print("=" * 60)
