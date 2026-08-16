import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
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
    # Initialize tables if needed
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print("Error during table initialization:", e)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Personal & SME Finance Tracker API (Ghana-focused) with automated MoMo/Bank categorization, statement parsing, and 30-day anomaly detection.",
    version="1.0.0",
    lifespan=lifespan
)

# Exception logging middleware
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_trace = traceback.format_exc()
    print(f"Exception on {request.url.path}: {exc}\n{error_trace}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "trace": error_trace}
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
