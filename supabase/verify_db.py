import psycopg2

DB_URL = "postgresql://postgres.acdlrnbqnnuvobvfbwaf:sisode11002299@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres"

conn = psycopg2.connect(DB_URL)
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;")
tables = [r[0] for r in cur.fetchall()]
print(f"Total public tables in Supabase: {len(tables)}")
print("Tables list:")
for t in tables:
    print(f" - {t}")
conn.close()
