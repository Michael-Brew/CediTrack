from fastapi import APIRouter, Depends
from app.auth import get_current_user, AuthenticatedUser

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.get("/me")
def get_user_profile(user: AuthenticatedUser = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "is_authenticated": True
    }

@router.post("/demo-login")
def demo_login():
    """Returns demo user credentials for instant testing."""
    return {
        "access_token": "demo-token",
        "token_type": "bearer",
        "user": {
            "id": "demo-ghana-user-001",
            "email": "kwame@ceditrack.gh",
            "name": "Kwame Mensah"
        }
    }
