import urllib.parse
from sqlalchemy import create_engine, text

# URL-encode password if it has '@'
# password: git.SUPABASE@7 -> git.SUPABASE%407
db_user = "postgres.wgtwjcfmkuqkltsfvmpr"
db_pass = urllib.parse.quote_plus("git.SUPABASE@7")
db_host = "aws-0-eu-central-1.pooler.supabase.com"
db_port = "6543"
db_name = "postgres"

db_url = f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}?sslmode=require"

print("Connecting to Supabase database...")
try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT current_user, current_database(), version();"))
        row = res.fetchone()
        print("Connected successfully!")
        print("User & DB:", row[0], row[1])
        print("Postgres Version:", row[2][:40])

        # Check if tables exist
        tables_res = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"))
        tables = [t[0] for t in tables_res.fetchall()]
        print("Existing tables in public schema:", tables)
except Exception as e:
    print("Connection failed:", e)
