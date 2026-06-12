"""Observer pattern for keeping panels/balances always up to date.

Subjects (services) emit domain events whenever billings/expenses are mutated.
Observers react (e.g. logging, future websocket broadcaster, cache invalidation).
"""

from __future__ import annotations

import logging
from typing import Callable, Protocol

logger = logging.getLogger(__name__)

DomainEvent = dict  # {"name": str, "payload": dict}


class Observer(Protocol):
    def update(self, event: DomainEvent) -> None:  # pragma: no cover - interface
        ...


class EventHub:
    """Singleton-ish in-process pub/sub used by the service layer."""

    def __init__(self) -> None:
        self._observers: list[Observer] = []

    def subscribe(self, observer: Observer) -> None:
        self._observers.append(observer)

    def publish(self, event: DomainEvent) -> None:
        for obs in self._observers:
            try:
                obs.update(event)
            except Exception:  # pragma: no cover - defensive
                logger.exception("Observer failed for event %s", event.get("name"))


class LoggingObserver:
    """Logs every event for auditability."""

    def update(self, event: DomainEvent) -> None:
        logger.info("event=%s payload=%s", event.get("name"), event.get("payload"))


class CallbackObserver:
    """Wraps an arbitrary callback for ad-hoc subscriptions."""

    def __init__(self, callback: Callable[[DomainEvent], None]) -> None:
        self._cb = callback

    def update(self, event: DomainEvent) -> None:
        self._cb(event)


# Global hub used by the FastAPI app.
event_hub = EventHub()
event_hub.subscribe(LoggingObserver())
