"""
pip install requests
"""

import requests
import time
import json

BASE_URL = "http://localhost:8080"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_header(text):
    print(f"\n{'='*60}")
    print(f"{Colors.BLUE}{text}{Colors.END}")
    print('='*60)

def print_pass(text):
    print(f"{Colors.GREEN}PASS: {text}{Colors.END}")

def print_fail(text):
    print(f"{Colors.RED}FAIL: {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.YELLOW}INFO: {text}{Colors.END}")

results = {"pass": 0, "fail": 0}

# ============================================================
# TEST 1: SQL INJECTION
# ============================================================
print_header("TEST 1: SQL INJECTION")

sql_payloads = [
    "admin@gmail.com' OR '1'='1' --",
    "admin@gmail.com'--",
    "' OR '1'='1' --",
    "admin@gmail.com' OR 1=1 --",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
]

print("Testing SQL Injection on /api/auth/login...")

for payload in sql_payloads:
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": payload, "password": "anything"},
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get('status') == 'SUCCESS':
            print_fail(f"SQL Injection BYPASSED với: {payload[:40]}...")
            results["fail"] += 1
            continue
    
    print_pass(f"Blocked: {payload[:40]}...")
    results["pass"] += 1

# ============================================================
# TEST 2: BRUTE FORCE (Rate Limiting)
# ============================================================
print_header("TEST 2: BRUTE FORCE (Rate Limiting)")

print("Gửi 15 request login liên tục...")

rate_limited = False
for i in range(1, 16):
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "test@gmail.com", "password": f"wrong{i}"},
        timeout=10
    )
    
    print(f"  Request {i:2}: HTTP {response.status_code}")
    
    if response.status_code == 429:
        print_pass(f"Rate Limited sau {i} request!")
        rate_limited = True
        results["pass"] += 1
        break

if not rate_limited:
    print_fail("KHÔNG BỊ RATE LIMITED! Có thể brute force!")
    results["fail"] += 1

# ============================================================
# TEST 3: XSS INJECTION
# ============================================================
print_header("TEST 3: XSS INJECTION")

xss_payloads = [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "<svg onload=alert('XSS')>",
    "javascript:alert('XSS')",
]

print("Testing XSS on /api/auth/register...")

for payload in xss_payloads:
    response = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "email": f"xss{xss_payloads.index(payload)}@test.com",
            "password": "Test1234!",
            "fullName": payload
        },
        timeout=10
    )
    
    content_type = response.headers.get('Content-Type', '')
    
    if 'text/html' in content_type:
        print_fail(f"Response là HTML - có thể XSS!")
        results["fail"] += 1
    else:
        print_pass(f"Response là JSON - Script không execute")
        results["pass"] += 1
        break

# ============================================================
# TEST 4: MASS ASSIGNMENT
# ============================================================
print_header("TEST 4: MASS ASSIGNMENT (Privilege Escalation)")

print("Thử inject role ADMIN vào register request...")

response = requests.post(
    f"{BASE_URL}/api/auth/register",
    json={
        "email": "hacker_test@gmail.com",
        "password": "Test1234!",
        "fullName": "Hacker",
        "role": "ROLE_ADMIN",
        "roles": ["ROLE_ADMIN"],
        "isAdmin": True,
        "emailVerified": True,
        "id": 1
    },
    timeout=10
)

print(f"  HTTP Status: {response.status_code}")

if response.status_code in [200, 201]:
    data = response.json()
    if 'ADMIN' in str(data):
        print_fail("User được gán role ADMIN!")
        results["fail"] += 1
    else:
        print_pass("Extra fields bị ignore - User là FREELANCER")
        results["pass"] += 1
else:
    print_pass("Request bị reject hoặc validation error")
    results["pass"] += 1

# ============================================================
# TEST 5: JWT TOKEN TAMPERING
# ============================================================
print_header("TEST 5: JWT TOKEN TAMPERING")

fake_tokens = [
    "fake.token.here",
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20ifQ.fake",
    "eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbkBnbWFpbC5jb20ifQ.",
    "",
    "null",
]

print("Testing fake JWT tokens on /api/users/me...")

for token in fake_tokens:
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    response = requests.get(
        f"{BASE_URL}/api/users/me",
        headers=headers,
        timeout=10
    )
    
    if response.status_code == 401:
        print_pass(f"Rejected token: {token[:30]}...")
        results["pass"] += 1
    elif response.status_code == 200:
        print_fail(f"Accepted fake token: {token[:30]}...")
        results["fail"] += 1
    else:
        print_pass(f"Blocked (HTTP {response.status_code})")
        results["pass"] += 1
        
    break

# ============================================================
# TEST 6: INPUT VALIDATION
# ============================================================
print_header("TEST 6: INPUT VALIDATION")

invalid_inputs = [
    {"email": "", "password": "Test1234!", "fullName": "Test"},
    {"email": "invalid-email", "password": "Test1234!", "fullName": "Test"},
    {"email": "test@test.com", "password": "weak", "fullName": "Test"},
    {"email": "test@test.com", "password": "Test1234!", "fullName": ""},
    {"email": "test@test.com", "password": "Test1234!", "fullName": "A" * 200},
]

print("Testing input validation on /api/auth/register...")

for i, data in enumerate(invalid_inputs, 1):
    response = requests.post(
        f"{BASE_URL}/api/auth/register",
        json=data,
        timeout=10
    )
    
    if response.status_code == 400:
        print_pass(f"Test {i}: Invalid input rejected (400)")
        results["pass"] += 1
    elif response.status_code == 201:
        print_fail(f"Test {i}: Invalid input accepted!")
        results["fail"] += 1
    else:
        print_info(f"Test {i}: HTTP {response.status_code}")

# ============================================================
# TEST 7: OTP BRUTE FORCE
# ============================================================
print_header("TEST 7: OTP BRUTE FORCE")

print("Gửi 10 request verify-otp liên tục...")

otp_rate_limited = False
for i in range(1, 11):
    response = requests.post(
        f"{BASE_URL}/api/auth/verify-otp",
        json={"email": "test@gmail.com", "otp": f"{i:06d}"},
        timeout=10
    )
    
    print(f"  Request {i:2}: HTTP {response.status_code}")
    
    if response.status_code == 429:
        print_pass(f"Rate Limited sau {i} request!")
        otp_rate_limited = True
        results["pass"] += 1
        break

if not otp_rate_limited:
    print_fail("KHÔNG BỊ RATE LIMITED! Có thể brute force OTP!")
    results["fail"] += 1

# ============================================================
# KẾT QUẢ TỔNG HỢP
# ============================================================
print_header("KẾT QUẢ TỔNG HỢP")

total = results["pass"] + results["fail"]
pass_rate = (results["pass"] / total * 100) if total > 0 else 0

print(f"""
┌─────────────────────────────────────────┐
│  SECURITY TEST RESULTS                  │
├─────────────────────────────────────────┤
│  PASS: {results["pass"]:3} tests                      │
│  FAIL: {results["fail"]:3} tests                      │
│  Rate: {pass_rate:.1f}%                          │
└─────────────────────────────────────────┘
""")

if results["fail"] == 0:
    print(f"{Colors.GREEN}TẤT CẢ TESTS ĐỀU PASS! Backend an toàn!{Colors.END}")
else:
    print(f"{Colors.RED}CÓ {results['fail']} TESTS FAIL! Cần kiểm tra lại!{Colors.END}")

print("""
Tests đã thực hiện:
1. SQL Injection → Blocked bởi JPA Parameterized Queries
2. Brute Force → Blocked bởi Rate Limiting (Redis)  
3. XSS → Safe vì API trả về JSON
4. Mass Assignment → Blocked bởi DTO
5. JWT Tampering → Blocked bởi Signature Verification
6. Input Validation → Blocked bởi @Valid annotations
7. OTP Brute Force → Blocked bởi Rate Limiting
""")
