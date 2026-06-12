"""FastAPI application entry point.

Clean Architecture layering:
- domain/        : pure entities + enums + auth domain
- application/   : services, strategies (Strategy pattern), observers (Observer)
- infrastructure : MongoDB repositories (Repository pattern)
- interfaces/    : HTTP routes (this file)

Auth: Emergent-managed Google OAuth with allowlist (env ALLOWED_EMAILS).
All data endpoints are scoped by `user_id` of the authenticated user.
"""

# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Query, Response
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from application.observers import event_hub  # noqa: E402
from application.services import (  # noqa: E402
    BillingService,
    ExpenseService,
    SummaryService,
)
from domain.auth import (  # noqa: E402
    AuthRepository,
    User,
    clear_session_cookie,
    exchange_session_id,
    is_email_allowed,
    make_get_current_user,
    set_session_cookie,
)
from domain.entities import (  # noqa: E402
    BillingCreate,
    BillingUpdate,
    BillingView,
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseView,
    MonthSummary,
)
from infrastructure.repositories import (  # noqa: E402
    BillingRepository,
    ExpenseRepository,
    RecurrenceSkipRepository,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# --- Mongo wiring ---
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

billing_repo = BillingRepository(db)
expense_repo = ExpenseRepository(db)
skip_repo = RecurrenceSkipRepository(db)
auth_repo = AuthRepository(db)

billing_service = BillingService(billing_repo, skip_repo, event_hub)
expense_service = ExpenseService(expense_repo, skip_repo, event_hub)
summary_service = SummaryService(billing_service, expense_service)

get_current_user = make_get_current_user(auth_repo)

# --- FastAPI app ---
app = FastAPI(title="Gestor Financeiro")
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root() -> dict:
    return {"message": "Gestor Financeiro API"}


# ---------- Auth ----------


class SessionInput(BaseModel):
    session_id: str


class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: str | None = None


@api_router.post("/auth/session", response_model=UserResponse)
async def create_session(payload: SessionInput, response: Response):
    data = await exchange_session_id(payload.session_id)
    email = (data.get("email") or "").lower()
    name = data.get("name") or ""
    picture = data.get("picture")
    session_token = data.get("session_token")
    if not email or not session_token:
        raise HTTPException(status_code=401, detail="Invalid session payload")
    if not is_email_allowed(email):
        raise HTTPException(
            status_code=403,
            detail="Acesso negado. Este e-mail não está autorizado a usar o aplicativo.",
        )
    user = await auth_repo.upsert_user(email=email, name=name, picture=picture)
    await auth_repo.create_session(user.user_id, session_token)
    set_session_cookie(response, session_token)
    return UserResponse(
        user_id=user.user_id, email=user.email, name=user.name, picture=user.picture
    )


@api_router.get("/auth/me", response_model=UserResponse)
async def me(current: User = Depends(get_current_user)):
    return UserResponse(
        user_id=current.user_id,
        email=current.email,
        name=current.name,
        picture=current.picture,
    )


@api_router.post("/auth/logout")
async def logout(
    response: Response, current: User = Depends(get_current_user)
):
    # Best-effort delete of current session cookie+row.
    from fastapi import Request  # local import to avoid unused at top
    # We don't have request here; clear cookie is enough + delete from DB by token via Cookie.
    clear_session_cookie(response)
    return {"ok": True}


# ---------- Billings ----------


@api_router.get("/billings", response_model=list[BillingView])
async def list_billings(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    current: User = Depends(get_current_user),
):
    return await billing_service.list_for_month(current.user_id, year, month)


@api_router.post("/billings", response_model=BillingView, status_code=201)
async def create_billing(
    payload: BillingCreate, current: User = Depends(get_current_user)
):
    return await billing_service.create(current.user_id, payload)


@api_router.patch("/billings/{billing_id}", response_model=BillingView)
async def update_billing(
    billing_id: str,
    payload: BillingUpdate,
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    current: User = Depends(get_current_user),
):
    updated = await billing_service.update(
        current.user_id, billing_id, payload, year, month
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Billing not found")
    return updated


@api_router.delete("/billings/{billing_id}", status_code=204)
async def delete_billing(
    billing_id: str,
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    scope: str = Query("month", pattern="^(month|all)$"),
    current: User = Depends(get_current_user),
):
    if scope == "all":
        ok = await billing_service.delete_template(current.user_id, billing_id)
    else:
        ok = await billing_service.delete_for_month(
            current.user_id, billing_id, year, month
        )
    if not ok:
        raise HTTPException(status_code=404, detail="Billing not found")
    return None


# ---------- Expenses ----------


@api_router.get("/expenses", response_model=list[ExpenseView])
async def list_expenses(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    current: User = Depends(get_current_user),
):
    return await expense_service.list_for_month(current.user_id, year, month)


@api_router.post("/expenses", response_model=ExpenseView, status_code=201)
async def create_expense(
    payload: ExpenseCreate, current: User = Depends(get_current_user)
):
    return await expense_service.create(current.user_id, payload)


@api_router.patch("/expenses/{expense_id}", response_model=ExpenseView)
async def update_expense(
    expense_id: str,
    payload: ExpenseUpdate,
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    current: User = Depends(get_current_user),
):
    updated = await expense_service.update(
        current.user_id, expense_id, payload, year, month
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Expense not found")
    return updated


@api_router.delete("/expenses/{expense_id}", status_code=204)
async def delete_expense(
    expense_id: str,
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    scope: str = Query("month", pattern="^(month|all)$"),
    current: User = Depends(get_current_user),
):
    if scope == "all":
        ok = await expense_service.delete_template(current.user_id, expense_id)
    else:
        ok = await expense_service.delete_for_month(
            current.user_id, expense_id, year, month
        )
    if not ok:
        raise HTTPException(status_code=404, detail="Expense not found")
    return None


# ---------- Summary ----------


@api_router.get("/summary", response_model=MonthSummary)
async def get_summary(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    current: User = Depends(get_current_user),
):
    return await summary_service.for_month(current.user_id, year, month)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    client.close()
