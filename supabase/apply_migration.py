import sys
import os
import psycopg2
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
SQL_FILE = BASE_DIR / "migrations" / "20260807000000_create_tvisa_tables_and_relations.sql"

# Active Supabase connection URL
DB_URL = "postgresql://postgres.acdlrnbqnnuvobvfbwaf:sisode11002299@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres"

def main():
    if not SQL_FILE.exists():
        print(f"Error: SQL file {SQL_FILE} not found!")
        sys.exit(1)

    with open(SQL_FILE, 'r', encoding='utf-8') as f:
        sql_script = f.read()

    print(f"Connecting to Supabase at aws-0-ap-southeast-2.pooler.supabase.com:6543...")
    try:
        conn = psycopg2.connect(DB_URL, connect_timeout=10)
        print("[OK] Connected successfully to Supabase database!")
    except Exception as e:
        print(f"[FAIL] Connection failed: {e}")
        sys.exit(1)

    try:
        with conn.cursor() as cursor:
            print("\nExecuting SQL migration script (creating 16 tables, relations, indexes, RLS policies, and triggers)...")
            cursor.execute(sql_script)
            conn.commit()
            print("[SUCCESS] All tables, relationships, indexes, RLS policies, and triggers applied successfully!")
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Error during migration execution: {e}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    main()
