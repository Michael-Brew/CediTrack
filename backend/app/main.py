from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import (
    auth_router,
    accounts_router,
    transactions_router,
    upload_router,
    dashboard_router,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize tables for local sqlite / postgres
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Personal & SME Finance Tracker API (Ghana-focused) with automated MoMo/Bank categorization, statement parsing, and 30-day anomaly detection.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router.router)
app.include_router(accounts_router.router)
app.include_router(transactions_router.router)
app.include_router(upload_router.router)
app.include_router(dashboard_router.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "currency": settings.DEFAULT_CURRENCY,
        "currency_symbol": settings.DEFAULT_CURRENCY_SYMBOL,
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
