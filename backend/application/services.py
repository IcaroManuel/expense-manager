"""Application services orchestrating repositories, strategies and observers."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from application.observers import EventHub
from application.strategies import (
    CommittedPercentageStrategy,
    FilteredSumStrategy,
    GroupByTypeStrategy,
    SumValueStrategy,
)
from domain.entities import (
    Billing,
    BillingCreate,
    BillingUpdate,
    BillingView,
    Expense,
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseView,
    MonthSummary,
)
from domain.enums import (
    ExpenseStatus,
    RECURRING_BILLING_TYPES,
    RECURRING_EXPENSE_TYPES,
)
from infrastructure.repositories import (
    BillingRepository,
    ExpenseRepository,
    RecurrenceSkipRepository,
)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _materialize_billing(doc: dict, year: int, month: int) -> dict:
    return {
        "id": doc["id"],
        "name": doc["name"],
        "type": doc["type"],
        "value": doc["value"],
        "recurring": doc.get("recurring", False),
        "year": year,
        "month": month,
        "created_at": doc.get("created_at", _now_iso()),
        "updated_at": doc.get("updated_at", _now_iso()),
    }


def _materialize_expense(doc: dict, year: int, month: int) -> dict:
    return {
        "id": doc["id"],
        "name": doc["name"],
        "type": doc["type"],
        "value": doc["value"],
        "status": doc.get("status", ExpenseStatus.PENDING.value),
        "color": doc.get("color", "#2D4238"),
        "recurring": doc.get("recurring", False),
        "year": year,
        "month": month,
        "created_at": doc.get("created_at", _now_iso()),
        "updated_at": doc.get("updated_at", _now_iso()),
    }


class BillingService:
    def __init__(
        self,
        repo: BillingRepository,
        skips: RecurrenceSkipRepository,
        hub: EventHub,
    ) -> None:
        self._repo = repo
        self._skips = skips
        self._hub = hub

    async def list_for_month(
        self, user_id: str, year: int, month: int
    ) -> list[BillingView]:
        raw = await self._repo.list_for_month(user_id, year, month)
        skipped = await self._skips.list_for_month(user_id, "billing", year, month)
        out: list[BillingView] = []
        for d in raw:
            if d.get("recurring") and d["id"] in skipped:
                continue
            out.append(BillingView(**_materialize_billing(d, year, month)))
        out.sort(key=lambda b: (b.type, b.created_at))
        return out

    async def create(self, user_id: str, payload: BillingCreate) -> BillingView:
        is_recurring = payload.type in RECURRING_BILLING_TYPES
        billing = Billing(
            user_id=user_id,
            name=payload.name,
            type=payload.type,
            value=payload.value,
            recurring=is_recurring,
            start_year=payload.year if is_recurring else None,
            start_month=payload.month if is_recurring else None,
            year=None if is_recurring else payload.year,
            month=None if is_recurring else payload.month,
        )
        await self._repo.insert(billing)
        self._hub.publish({"name": "billing.created", "payload": billing.model_dump()})
        return BillingView(
            **_materialize_billing(billing.model_dump(), payload.year, payload.month)
        )

    async def update(
        self,
        user_id: str,
        billing_id: str,
        payload: BillingUpdate,
        year: int,
        month: int,
    ) -> Optional[BillingView]:
        fields: dict = {"updated_at": _now_iso()}
        if payload.name is not None:
            fields["name"] = payload.name
        if payload.value is not None:
            fields["value"] = payload.value
        updated = await self._repo.update_fields(user_id, billing_id, fields)
        if not updated:
            return None
        self._hub.publish({"name": "billing.updated", "payload": updated})
        return BillingView(**_materialize_billing(updated, year, month))

    async def delete_for_month(
        self, user_id: str, billing_id: str, year: int, month: int
    ) -> bool:
        doc = await self._repo.find_by_id(user_id, billing_id)
        if not doc:
            return False
        if doc.get("recurring"):
            await self._skips.add_skip(user_id, "billing", billing_id, year, month)
        else:
            await self._repo.delete(user_id, billing_id)
        self._hub.publish(
            {
                "name": "billing.deleted",
                "payload": {"id": billing_id, "year": year, "month": month},
            }
        )
        return True

    async def delete_template(self, user_id: str, billing_id: str) -> bool:
        doc = await self._repo.find_by_id(user_id, billing_id)
        if not doc:
            return False
        await self._repo.delete(user_id, billing_id)
        await self._skips.delete_all_for_entity(user_id, "billing", billing_id)
        self._hub.publish(
            {"name": "billing.template_deleted", "payload": {"id": billing_id}}
        )
        return True


class ExpenseService:
    def __init__(
        self,
        repo: ExpenseRepository,
        skips: RecurrenceSkipRepository,
        hub: EventHub,
    ) -> None:
        self._repo = repo
        self._skips = skips
        self._hub = hub

    async def list_for_month(
        self, user_id: str, year: int, month: int
    ) -> list[ExpenseView]:
        raw = await self._repo.list_for_month(user_id, year, month)
        skipped = await self._skips.list_for_month(user_id, "expense", year, month)
        out: list[ExpenseView] = []
        for d in raw:
            if d.get("recurring") and d["id"] in skipped:
                continue
            out.append(ExpenseView(**_materialize_expense(d, year, month)))
        out.sort(key=lambda e: (e.type, e.created_at))
        return out

    async def create(self, user_id: str, payload: ExpenseCreate) -> ExpenseView:
        is_recurring = payload.type in RECURRING_EXPENSE_TYPES
        expense = Expense(
            user_id=user_id,
            name=payload.name,
            type=payload.type,
            value=payload.value,
            status=payload.status,
            color=payload.color,
            recurring=is_recurring,
            start_year=payload.year if is_recurring else None,
            start_month=payload.month if is_recurring else None,
            year=None if is_recurring else payload.year,
            month=None if is_recurring else payload.month,
        )
        await self._repo.insert(expense)
        self._hub.publish({"name": "expense.created", "payload": expense.model_dump()})
        return ExpenseView(
            **_materialize_expense(expense.model_dump(), payload.year, payload.month)
        )

    async def update(
        self,
        user_id: str,
        expense_id: str,
        payload: ExpenseUpdate,
        year: int,
        month: int,
    ) -> Optional[ExpenseView]:
        fields: dict = {"updated_at": _now_iso()}
        if payload.name is not None:
            fields["name"] = payload.name
        if payload.value is not None:
            fields["value"] = payload.value
        if payload.status is not None:
            fields["status"] = (
                payload.status.value if hasattr(payload.status, "value") else payload.status
            )
        if payload.color is not None:
            fields["color"] = payload.color
        updated = await self._repo.update_fields(user_id, expense_id, fields)
        if not updated:
            return None
        self._hub.publish({"name": "expense.updated", "payload": updated})
        return ExpenseView(**_materialize_expense(updated, year, month))

    async def delete_for_month(
        self, user_id: str, expense_id: str, year: int, month: int
    ) -> bool:
        doc = await self._repo.find_by_id(user_id, expense_id)
        if not doc:
            return False
        if doc.get("recurring"):
            await self._skips.add_skip(user_id, "expense", expense_id, year, month)
        else:
            await self._repo.delete(user_id, expense_id)
        self._hub.publish(
            {
                "name": "expense.deleted",
                "payload": {"id": expense_id, "year": year, "month": month},
            }
        )
        return True

    async def delete_template(self, user_id: str, expense_id: str) -> bool:
        doc = await self._repo.find_by_id(user_id, expense_id)
        if not doc:
            return False
        await self._repo.delete(user_id, expense_id)
        await self._skips.delete_all_for_entity(user_id, "expense", expense_id)
        self._hub.publish(
            {"name": "expense.template_deleted", "payload": {"id": expense_id}}
        )
        return True


class SummaryService:
    def __init__(
        self,
        billing_service: BillingService,
        expense_service: ExpenseService,
    ) -> None:
        self._billings = billing_service
        self._expenses = expense_service
        self._sum = SumValueStrategy()
        self._sum_paid = FilteredSumStrategy("status", ExpenseStatus.PAID.value)
        self._sum_pending = FilteredSumStrategy("status", ExpenseStatus.PENDING.value)
        self._committed = CommittedPercentageStrategy()
        self._group_by_type = GroupByTypeStrategy()

    async def for_month(self, user_id: str, year: int, month: int) -> MonthSummary:
        billings = [
            b.model_dump()
            for b in await self._billings.list_for_month(user_id, year, month)
        ]
        expenses = [
            e.model_dump()
            for e in await self._expenses.list_for_month(user_id, year, month)
        ]

        total_income = self._sum.calculate(billings)
        total_expenses = self._sum.calculate(expenses)
        total_paid = self._sum_paid.calculate(expenses)
        total_pending = self._sum_pending.calculate(expenses)
        balance = round(total_income - total_expenses, 2)
        committed = self._committed.calculate(total_income, total_expenses)

        return MonthSummary(
            year=year,
            month=month,
            total_income=total_income,
            total_expenses=total_expenses,
            total_paid=total_paid,
            total_pending=total_pending,
            balance=balance,
            committed_percentage=committed,
            expenses_by_type=self._group_by_type.calculate(expenses),
            income_by_type=self._group_by_type.calculate(billings),
        )
