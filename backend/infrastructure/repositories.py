"""Repositories: thin abstraction over MongoDB collections.

All queries are scoped by `user_id` to enforce multi-tenant isolation.
Single document operations preserve ACID semantics at the document level.
"""

from __future__ import annotations

from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from domain.entities import Billing, Expense, RecurrenceSkip


def _month_filter(user_id: str, year: int, month: int) -> dict:
    return {
        "user_id": user_id,
        "$or": [
            {"recurring": False, "year": year, "month": month},
            {
                "recurring": True,
                "$or": [
                    {"start_year": {"$lt": year}},
                    {"start_year": year, "start_month": {"$lte": month}},
                ],
            },
        ],
    }


class BillingRepository:
    COLLECTION = "billings"

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db[self.COLLECTION]

    async def insert(self, billing: Billing) -> Billing:
        await self._col.insert_one(billing.model_dump())
        return billing

    async def find_by_id(self, user_id: str, billing_id: str) -> Optional[dict]:
        return await self._col.find_one(
            {"id": billing_id, "user_id": user_id}, {"_id": 0}
        )

    async def list_for_month(self, user_id: str, year: int, month: int) -> list[dict]:
        cursor = self._col.find(_month_filter(user_id, year, month), {"_id": 0})
        return await cursor.to_list(length=10000)

    async def update_fields(
        self, user_id: str, billing_id: str, fields: dict
    ) -> Optional[dict]:
        await self._col.update_one(
            {"id": billing_id, "user_id": user_id}, {"$set": fields}
        )
        return await self.find_by_id(user_id, billing_id)

    async def delete(self, user_id: str, billing_id: str) -> int:
        result = await self._col.delete_one({"id": billing_id, "user_id": user_id})
        return result.deleted_count


class ExpenseRepository:
    COLLECTION = "expenses"

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db[self.COLLECTION]

    async def insert(self, expense: Expense) -> Expense:
        await self._col.insert_one(expense.model_dump())
        return expense

    async def find_by_id(self, user_id: str, expense_id: str) -> Optional[dict]:
        return await self._col.find_one(
            {"id": expense_id, "user_id": user_id}, {"_id": 0}
        )

    async def list_for_month(self, user_id: str, year: int, month: int) -> list[dict]:
        cursor = self._col.find(_month_filter(user_id, year, month), {"_id": 0})
        return await cursor.to_list(length=10000)

    async def update_fields(
        self, user_id: str, expense_id: str, fields: dict
    ) -> Optional[dict]:
        await self._col.update_one(
            {"id": expense_id, "user_id": user_id}, {"$set": fields}
        )
        return await self.find_by_id(user_id, expense_id)

    async def delete(self, user_id: str, expense_id: str) -> int:
        result = await self._col.delete_one({"id": expense_id, "user_id": user_id})
        return result.deleted_count


class RecurrenceSkipRepository:
    COLLECTION = "recurrence_skips"

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db[self.COLLECTION]

    async def add_skip(
        self, user_id: str, kind: str, entity_id: str, year: int, month: int
    ) -> None:
        skip = RecurrenceSkip(
            user_id=user_id,
            entity_kind=kind,
            entity_id=entity_id,
            year=year,
            month=month,
        )
        await self._col.update_one(
            {
                "user_id": user_id,
                "entity_kind": kind,
                "entity_id": entity_id,
                "year": year,
                "month": month,
            },
            {"$setOnInsert": skip.model_dump()},
            upsert=True,
        )

    async def remove_skip(
        self, user_id: str, kind: str, entity_id: str, year: int, month: int
    ) -> None:
        await self._col.delete_one(
            {
                "user_id": user_id,
                "entity_kind": kind,
                "entity_id": entity_id,
                "year": year,
                "month": month,
            }
        )

    async def list_for_month(
        self, user_id: str, kind: str, year: int, month: int
    ) -> set[str]:
        cursor = self._col.find(
            {
                "user_id": user_id,
                "entity_kind": kind,
                "year": year,
                "month": month,
            },
            {"_id": 0, "entity_id": 1},
        )
        docs = await cursor.to_list(length=10000)
        return {d["entity_id"] for d in docs}

    async def delete_all_for_entity(
        self, user_id: str, kind: str, entity_id: str
    ) -> None:
        await self._col.delete_many(
            {"user_id": user_id, "entity_kind": kind, "entity_id": entity_id}
        )
