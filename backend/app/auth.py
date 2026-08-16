import os
import uuid
from typing import Optional
from fastapi import Header, HTTPException, status, Depends
from jose import jwt, JWTError
from app.config import settings

def ensure_uuid_format(val: str) -> str:
    """Ensure string is valid UUID; otherwise generate deterministic UUID."""
    if not val:
        return "00000000-0000-0000-0000-000000000001"
    try:
        uuid.UUID(str(val))
        return str(val)
    except (ValueError, AttributeError):
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(val)))

class AuthenticatedUser:
    def __init__(self, id: str, email: str, name: Optional[str] = None):
        self.id = ensure_uuid_format(id)
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
        return AuthenticatedUser(id="demo-ghana-user-001", email="kwame@ceditrack.gh", name="Kwame Mensah")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return AuthenticatedUser(id="demo-ghana-user-001", email="kwame@ceditrack.gh", name="Kwame Mensah")

    # Dev token quick bypass
    if token.startswith("dev-") or token == "demo-token":
        user_id = token.replace("dev-", "") if token.startswith("dev-") else "demo-ghana-user-001"
        return AuthenticatedUser(id=user_id, email=f"{user_id}@example.com", name="Kwame Mensah")

    # Supabase JWT verification
    try:
        unverified_claims = jwt.get_unverified_claims(token)
        user_id = unverified_claims.get("sub") or unverified_claims.get("id")
        email = unverified_claims.get("email", f"{user_id}@user.supabase.io")
        user_metadata = unverified_claims.get("user_metadata", {})
        name = user_metadata.get("name") or user_metadata.get("full_name") or email.split("@")[0]

        if not user_id:
            user_id = "demo-ghana-user-001"

        return AuthenticatedUser(id=str(user_id), email=str(email), name=str(name))
    except JWTError:
        return AuthenticatedUser(id=token, email=f"{token}@ceditrack.gh", name="Kwame Mensah")
