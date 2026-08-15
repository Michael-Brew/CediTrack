import os

class Settings:
    PROJECT_NAME: str = "CediTrack"
    API_V1_STR: str = "/api"
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "super-secret-dev-jwt-key")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ceditrack.db")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    DEFAULT_CURRENCY: str = "GHS"
    DEFAULT_CURRENCY_SYMBOL: str = "₵"

settings = Settings()
