"""Auth domain: User + Session entities and HTTP auth dependency.

Emergent-managed Google Auth. Only emails in ALLOWED_EMAILS (env) are accepted.
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from fastapi import Cookie, Depends, Header, HTTPException, Response
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, ConfigDict, Field

EMERGENT_SESSION_DATA_URL = (
    "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
)
SESSION_TTL_DAYS = 7
COOKIE_NAME = "session_token"


def _allowed_emails() -> set[str]:
    raw = os.environ.get("ALLOWED_EMAILS", "")
    return {e.strip().lower() for e in raw.split(",") if e.strip()}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")

    user_id: str = Field(default_factory=lambda: f"user_{uuid.uuid4().hex[:12]}")
    email: str
    name: str
    picture: Optional[str] = None
    created_at: str = Field(default_factory=_now_iso)
    updated_at: str = Field(default_factory=_now_iso)


class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")

    user_id: str
    session_token: str
    expires_at: str  # ISO string
    created_at: str = Field(default_factory=_now_iso)


class AuthRepository:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._users = db["users"]
        self._sessions = db["user_sessions"]

    async def upsert_user(self, email: str, name: str, picture: Optional[str]) -> User:
        existing = await self._users.find_one({"email": email}, {"_id": 0})
        if existing:
            await self._users.update_one(
                {"email": email},
                {"$set": {"name": name, "picture": picture, "updated_at": _now_iso()}},
            )
            existing.update({"name": name, "picture": picture, "updated_at": _now_iso()})
            return User(**existing)
        user = User(email=email, name=name, picture=picture)
        await self._users.insert_one(user.model_dump())
        return user

    async def create_session(self, user_id: str, session_token: str) -> UserSession:
        expires_at = (
            datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)
        ).isoformat()
        session = UserSession(
            user_id=user_id, session_token=session_token, expires_at=expires_at
        )
        await self._sessions.insert_one(session.model_dump())
        return session

    async def find_user_by_session(self, session_token: str) -> Optional[User]:
        session_doc = await self._sessions.find_one(
            {"session_token": session_token}, {"_id": 0}
        )
        if not session_doc:
            return None
        expires_at = session_doc["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            await self._sessions.delete_one({"session_token": session_token})
            return None
        user_doc = await self._users.find_one(
            {"user_id": session_doc["user_id"]}, {"_id": 0}
        )
        if not user_doc:
            return None
        # Coerce any datetime fields to ISO strings to match Pydantic schema.
        for k in ("created_at", "updated_at"):
            v = user_doc.get(k)
            if isinstance(v, datetime):
                if v.tzinfo is None:
                    v = v.replace(tzinfo=timezone.utc)
                user_doc[k] = v.isoformat()
        return User(**user_doc)

    async def delete_session(self, session_token: str) -> None:
        await self._sessions.delete_one({"session_token": session_token})


async def exchange_session_id(session_id: str) -> dict:
    """Calls Emergent Auth backend to exchange session_id for user data + token."""
    async with httpx.AsyncClient(timeout=20.0) as http:
        resp = await http.get(
            EMERGENT_SESSION_DATA_URL, headers={"X-Session-ID": session_id}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    return resp.json()


def _extract_token(
    session_token_cookie: Optional[str], authorization: Optional[str]
) -> Optional[str]:
    if session_token_cookie:
        return session_token_cookie
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return None


def make_get_current_user(repo: AuthRepository):
    async def get_current_user(
        session_token: Optional[str] = Cookie(default=None),
        authorization: Optional[str] = Header(default=None),
    ) -> User:
        token = _extract_token(session_token, authorization)
        if not token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        user = await repo.find_user_by_session(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        return user

    return get_current_user


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=SESSION_TTL_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(key=COOKIE_NAME, path="/")


def is_email_allowed(email: str) -> bool:
    allowed = _allowed_emails()
    if not allowed:
        return True  # Allowlist disabled if env is empty
    return email.lower() in allowed
