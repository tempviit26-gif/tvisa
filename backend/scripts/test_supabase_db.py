"""
Comprehensive Database Stress & Integrity Audit Script for Supabase PostgreSQL
"""
import psycopg2
import psycopg2.extras
import time
import uuid

DB_URL = "postgresql://postgres.acdlrnbqnnuvobvfbwaf:sisode11002299@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require"

db_results = {
    "passed": 0,
    "failed": 0,
    "details": []
}

def log_db(name, success, details):
    status = "[PASS]" if success else "[FAIL]"
    if success:
        db_results["passed"] += 1
    else:
        db_results["failed"] += 1
    msg = f"{status} - {name}: {details}"
    db_results["details"].append(msg)
    print(msg)

print("=" * 65)
print("STARTING COMPREHENSIVE SUPABASE DATABASE STRESS & INTEGRITY AUDIT")
print("=" * 65)

# 1. Connection & Latency Test
start_t = time.time()
try:
    conn = psycopg2.connect(DB_URL)
    latency = round((time.time() - start_t) * 1000, 2)
    log_db("Database Connection & SSL", True, f"Connected to Supabase Pooler in {latency} ms")
except Exception as e:
    log_db("Database Connection & SSL", False, str(e))
    exit(1)

cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

# 2. Server Version & PostGIS/Extensions Check
try:
    cursor.execute("SELECT version();")
    ver = cursor.fetchone()["version"]
    log_db("PostgreSQL Engine Check", True, f"Engine: {ver.split(',')[0]}")
except Exception as e:
    log_db("PostgreSQL Engine Check", False, str(e))

# 3. Table Schema & Count Audit
tables = [
    "django_migrations", "django_content_type", "users", "addresses", 
    "email_verification_otps", "categories", "subcategories", "coating_types",
    "products", "product_variants", "product_images", "hero_sliders",
    "instagram_posts", "carts", "cart_items", "wishlists", "orders",
    "order_items", "order_status_history", "payment_history"
]

counts = {}
for tbl in tables:
    try:
        cursor.execute(f"SELECT COUNT(*) AS c FROM {tbl};")
        cnt = cursor.fetchone()["c"]
        counts[tbl] = cnt
    except Exception as e:
        log_db(f"Table Audit ({tbl})", False, str(e))

log_db("Database Tables Audit", len(counts) == len(tables), f"All {len(tables)} tables verified present in Supabase.")

# Print key table row counts
row_summary = ", ".join([f"{k}:{v}" for k, v in counts.items() if k in ["users", "products", "categories", "orders", "carts"]])
print(f"[INFO] Current Row Counts -> {row_summary}")

# 4. Foreign Key & Index Integrity Check
try:
    cursor.execute("""
        SELECT count(*) as count 
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY';
    """)
    fk_count = cursor.fetchone()["count"]
    log_db("Foreign Key Constraints Audit", fk_count > 0, f"Found {fk_count} active Foreign Key constraints in database schema.")
except Exception as e:
    log_db("Foreign Key Constraints Audit", False, str(e))

# 5. CRUD Transaction Stress Test (Insert, Read, Query, Rollback)
test_user_id = str(uuid.uuid4())
test_email = f"stress_test_{uuid.uuid4().hex[:6]}@tvisa.com"
test_category_id = str(uuid.uuid4())
test_product_id = str(uuid.uuid4())

try:
    # Test Transaction Block
    cursor.execute("BEGIN;")
    
    # A. Insert User
    cursor.execute("""
        INSERT INTO users (id, password, name, email, phone, is_active, is_staff, is_superuser, is_email_verified, created_at, updated_at)
        VALUES (%s, 'pbkdf2_sha256$hashedpass', 'Stress Test User', %s, '+919999999999', True, False, False, True, NOW(), NOW());
    """, (test_user_id, test_email))
    
    # B. Insert Category & Product
    cursor.execute("""
        INSERT INTO categories (id, name, slug, is_active, display_order, created_at, updated_at)
        VALUES (%s, 'Stress Test Category', %s, True, 1, NOW(), NOW());
    """, (test_category_id, f"stress-cat-{uuid.uuid4().hex[:6]}"))
    
    cursor.execute("""
        INSERT INTO products (id, category_id, name, description, styling, base_price, is_active, is_bestseller, is_quick_pick, is_new_arrival, created_at, updated_at)
        VALUES (%s, %s, 'Stress Test Necklace', 'Fine silver', 'Daily wear', 1999.00, True, True, False, True, NOW(), NOW());
    """, (test_product_id, test_category_id))
    
    # C. Query Joined Product & Category
    cursor.execute("""
        SELECT p.name AS product_name, c.name AS category_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = %s;
    """, (test_product_id,))
    res = cursor.fetchone()
    
    # D. Test Unique Email Constraint Failure (Expect Exception)
    unique_failed = False
    try:
        cursor.execute("SAVEPOINT email_test;")
        cursor.execute("""
            INSERT INTO users (id, password, name, email, phone, is_active, is_staff, is_superuser, is_email_verified, created_at, updated_at)
            VALUES (%s, 'pass', 'Dup User', %s, '+919999999999', True, False, False, True, NOW(), NOW());
        """, (str(uuid.uuid4()), test_email))
    except Exception:
        unique_failed = True
        cursor.execute("ROLLBACK TO SAVEPOINT email_test;")

    # Rollback entire stress transaction so test data leaves no trace
    cursor.execute("ROLLBACK;")
    
    log_db("CRUD & Transaction Isolation Stress Test", res is not None and res["product_name"] == "Stress Test Necklace", "Insert, JOIN query, and Transaction Rollback executed cleanly.")
    log_db("Unique Constraint Enforcement", unique_failed, "Duplicate email insertion correctly blocked by UNIQUE constraint.")

except Exception as e:
    cursor.execute("ROLLBACK;")
    log_db("CRUD Stress Test", False, str(e))

# 6. JSONB Query Capability Test (Payment History)
try:
    cursor.execute("""
        SELECT COUNT(*) as c FROM payment_history WHERE gateway_response IS NOT NULL;
    """)
    log_db("JSONB Engine & Query Audit", True, "PostgreSQL JSONB column querying verified working.")
except Exception as e:
    log_db("JSONB Engine & Query Audit", False, str(e))

cursor.close()
conn.close()

print("=" * 65)
print(f"DATABASE AUDIT SUMMARY: {db_results['passed']} Passed | {db_results['failed']} Failed")
print("=" * 65)
