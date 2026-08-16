import os
import re
import ssl
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

db_url = settings.DATABASE_URL or "sqlite:///./ceditrack.db"

# Replace legacy postgres:// with postgresql://
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

if db_url.startswith("sqlite"):
    engine = create_engine(db_url, connect_args={"check_same_thread": False}, pool_pre_ping=True)
else:
    # Use pg8000 as reliable driver across serverless environments
    try:
        # If pg8000 is installed, use postgresql+pg8000://
        pg8000_url = db_url
        if not pg8000_url.startswith("postgresql+"):
            pg8000_url = pg8000_url.replace("postgresql://", "postgresql+pg8000://", 1)
        
        # Clean query parameters for pg8000
        pg8000_url = re.sub(r'[?&]sslmode=[^&]+', '', pg8000_url)
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        engine = create_engine(pg8000_url, connect_args={"ssl_context": ssl_ctx}, pool_pre_ping=True)
    except Exception:
        engine = create_engine(db_url, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
