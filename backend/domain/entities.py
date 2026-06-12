from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from .enums import BillingType, ExpenseStatus, ExpenseType


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id() -> str:
    return str(uuid.uuid4())


class Billing(BaseModel):
    """Billing (Faturamento) entity.

    SALARY -> recurring (replicated every month from start_year/start_month onward).
    AWARD  -> one-shot (year/month are explicit).
    """

    model_config = ConfigDict(extra="ignore", use_enum_values=True)

    id: str = Field(default_factory=_new_id)
    user_id: str
    name: str
    type: BillingType
    value: float
    recurring: bool = False
    # For recurring entries: month from which it starts repeating.
    start_year: Optional[int] = None
    start_month: Optional[int] = None
    # For one-shot entries: the explicit month it belongs to.
    year: Optional[int] = None
    month: Optional[int] = None
    created_at: str = Field(default_factory=_now_iso)
    updated_at: str = Field(default_factory=_now_iso)


class Expense(BaseModel):
    """Expense (Despesa) entity.

    FIXED / CARD -> recurring.
    DETACHED     -> one-shot.
    """

    model_config = ConfigDict(extra="ignore", use_enum_values=True)

    id: str = Field(default_factory=_new_id)
    user_id: str
    name: str
    type: ExpenseType
    value: float
    status: ExpenseStatus = ExpenseStatus.PENDING
    color: str = "#2D4238"
    recurring: bool = False
    start_year: Optional[int] = None
    start_month: Optional[int] = None
    year: Optional[int] = None
    month: Optional[int] = None
    created_at: str = Field(default_factory=_now_iso)
    updated_at: str = Field(default_factory=_now_iso)


class RecurrenceSkip(BaseModel):
    """Marks that a specific recurring entity should NOT appear in a given month.

    Used when the user deletes a recurring item from a single month (e.g. SALARY
    on vacation month) without removing the recurrence rule itself.
    """

    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=_new_id)
    user_id: str
    entity_kind: str  # "billing" | "expense"
    entity_id: str
    year: int
    month: int
    created_at: str = Field(default_factory=_now_iso)


# ---------- Request / Response DTOs ---------- #


class BillingCreate(BaseModel):
    name: str
    type: BillingType
    value: float
    year: int
    month: int


class BillingUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[float] = None


class ExpenseCreate(BaseModel):
    name: str
    type: ExpenseType
    value: float
    status: ExpenseStatus = ExpenseStatus.PENDING
    color: str = "#2D4238"
    year: int
    month: int


class ExpenseUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[float] = None
    status: Optional[ExpenseStatus] = None
    color: Optional[str] = None


class BillingView(BaseModel):
    id: str
    name: str
    type: BillingType
    value: float
    recurring: bool
    year: int
    month: int
    created_at: str
    updated_at: str


class ExpenseView(BaseModel):
    id: str
    name: str
    type: ExpenseType
    value: float
    status: ExpenseStatus
    color: str
    recurring: bool
    year: int
    month: int
    created_at: str
    updated_at: str


class CategoryBreakdown(BaseModel):
    type: str
    value: float


class MonthSummary(BaseModel):
    year: int
    month: int
    total_income: float
    total_expenses: float
    total_paid: float
    total_pending: float
    balance: float
    committed_percentage: float
    expenses_by_type: list[CategoryBreakdown]
    income_by_type: list[CategoryBreakdown]
