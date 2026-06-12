"""Shared pytest fixtures: bootstrap two isolated users with bearer tokens."""

from __future__ import annotations

import os
import time
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests
from pymongo import MongoClient


BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get(
    "REACT_APP_BACKEND_URL"
) else None
if not BASE_URL:
    # Fallback to reading frontend/.env directly when pytest is launched bare.
    env_path = "/app/frontend/.env"
    with open(env_path) as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.strip().split("=", 1)[1].rstrip("/")

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def _create_user(db, email: str, name: str) -> tuple[str, str]:
    user_id = f"test-user-{uuid.uuid4().hex[:10]}"
    token = f"test_session_{uuid.uuid4().hex}"
    now = datetime.now(timezone.utc)
    db.users.insert_one(
        {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": "https://via.placeholder.com/150",
            "created_at": _iso(now),
            "updated_at": _iso(now),
        }
    )
    db.user_sessions.insert_one(
        {
            "user_id": user_id,
            "session_token": token,
            "expires_at": _iso(now + timedelta(days=7)),
            "created_at": _iso(now),
        }
    )
    return user_id, token


@pytest.fixture(scope="session")
def base_url() -> str:
    assert BASE_URL, "REACT_APP_BACKEND_URL not configured"
    return BASE_URL


@pytest.fixture(scope="session")
def mongo_db():
    client = MongoClient(MONGO_URL)
    yield client[DB_NAME]
    client.close()


@pytest.fixture(scope="session")
def user_a(mongo_db):
    user_id, token = _create_user(
        mongo_db, "icaroomanuel@gmail.com", "Icaro Manuel A"
    )
    yield {"user_id": user_id, "token": token}
    # cleanup
    mongo_db.user_sessions.delete_many({"session_token": token})
    mongo_db.users.delete_many({"user_id": user_id})
    mongo_db.billings.delete_many({"user_id": user_id})
    mongo_db.expenses.delete_many({"user_id": user_id})
    mongo_db.recurrence_skips.delete_many({"user_id": user_id})


@pytest.fixture(scope="session")
def user_b(mongo_db):
    # Different email (still allowed by inserting directly, bypasses allowlist).
    user_id, token = _create_user(
        mongo_db, f"test.user.{int(time.time())}@example.com", "Test User B"
    )
    yield {"user_id": user_id, "token": token}
    mongo_db.user_sessions.delete_many({"session_token": token})
    mongo_db.users.delete_many({"user_id": user_id})
    mongo_db.billings.delete_many({"user_id": user_id})
    mongo_db.expenses.delete_many({"user_id": user_id})
    mongo_db.recurrence_skips.delete_many({"user_id": user_id})


@pytest.fixture
def client_a(base_url, user_a):
    s = requests.Session()
    s.headers.update(
        {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {user_a['token']}",
        }
    )
    return s


@pytest.fixture
def client_b(base_url, user_b):
    s = requests.Session()
    s.headers.update(
        {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {user_b['token']}",
        }
    )
    return s


@pytest.fixture
def anon_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s
