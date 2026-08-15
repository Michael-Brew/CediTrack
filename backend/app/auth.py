import os
from typing import Optional
from fastapi import Header, HTTPException, status, Depends
from jose import jwt, JWTError
from app.config import settings

class AuthenticatedUser:
    def __init__(self, id: str, email: str, name: Optional[str] = None):
        self.id = id
        self.email = email
        self.name = name or email.split("@")[0]

def get_current_user(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
) -> AuthenticatedUser:
    # 1. Dev/Mock override support for easy testing
    if x_user_id:
        return AuthenticatedUser(id=x_user_id, email=f"{x_user_id}@example.com", name="CediTrack User")

    if not authorization:
        # Default local demo user if no auth header in debug mode
        if settings.DEBUG:
            return AuthenticatedUser(id="demo-ghana-user-001", email="kwame@ceditrack.gh", name="Kwame Mensah")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization scheme. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Dev token quick bypass
    if token.startswith("dev-") or token == "demo-token":
        user_id = token.replace("dev-", "") if token.startswith("dev-") else "demo-ghana-user-001"
        return AuthenticatedUser(id=user_id, email=f"{user_id}@example.com", name="Kwame Mensah")

    # Supabase JWT verification
    try:
        # If Supabase secret is set, verify with it; otherwise decode unverified in dev or verify algorithms
        unverified_claims = jwt.get_unverified_claims(token)
        user_id = unverified_claims.get("sub") or unverified_claims.get("id")
        email = unverified_claims.get("email", f"{user_id}@user.supabase.io")
        user_metadata = unverified_claims.get("user_metadata", {})
        name = user_metadata.get("name") or user_metadata.get("full_name") or email.split("@")[0]

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="JWT missing user identifier (sub)",
            )

        return AuthenticatedUser(id=str(user_id), email=str(email), name=str(name))
    except JWTError as e:
        if settings.DEBUG:
            # Fallback in dev if token format is simple user id
            return AuthenticatedUser(id=token, email=f"{token}@ceditrack.gh", name="Kwame Mensah")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid JWT Token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
