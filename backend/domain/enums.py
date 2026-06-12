from enum import Enum


class BillingType(str, Enum):
    SALARY = "SALARY"
    AWARD = "AWARD"


class ExpenseType(str, Enum):
    FIXED = "FIXED"
    CARD = "CARD"
    DETACHED = "DETACHED"


class ExpenseStatus(str, Enum):
    PAID = "PAID"
    PENDING = "PENDING"


# Which types are automatically recurring per month
RECURRING_BILLING_TYPES = {BillingType.SALARY}
RECURRING_EXPENSE_TYPES = {ExpenseType.FIXED, ExpenseType.CARD}
