"""Strategy pattern for financial calculations (taxes / interest / totals).

Each strategy implements a `calculate` method on a uniform contract so the
service layer can swap them without conditionals.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterable


class TotalStrategy(ABC):
    @abstractmethod
    def calculate(self, items: Iterable[dict]) -> float:  # pragma: no cover - interface
        ...


class SumValueStrategy(TotalStrategy):
    """Plain sum of `value` field."""

    def calculate(self, items: Iterable[dict]) -> float:
        return round(sum(float(i.get("value", 0.0)) for i in items), 2)


class FilteredSumStrategy(TotalStrategy):
    """Sum only items matching a predicate over a single field."""

    def __init__(self, field: str, equals: object) -> None:
        self.field = field
        self.equals = equals

    def calculate(self, items: Iterable[dict]) -> float:
        return round(
            sum(
                float(i.get("value", 0.0))
                for i in items
                if i.get(self.field) == self.equals
            ),
            2,
        )


class CommittedPercentageStrategy:
    """Computes % of income committed to expenses."""

    def calculate(self, total_income: float, total_expenses: float) -> float:
        if total_income <= 0:
            return 0.0
        return round((total_expenses / total_income) * 100.0, 2)


class GroupByTypeStrategy:
    """Aggregates totals grouped by a `type` field."""

    def calculate(self, items: Iterable[dict]) -> list[dict]:
        bucket: dict[str, float] = {}
        for it in items:
            t = it.get("type", "OTHER")
            bucket[t] = bucket.get(t, 0.0) + float(it.get("value", 0.0))
        return [{"type": k, "value": round(v, 2)} for k, v in bucket.items()]
