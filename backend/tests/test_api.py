"""End-to-end backend tests for the Gestor Financeiro API.

Covers auth protection, allowlist via Emergent endpoint, CRUD + recurrence
semantics for billings and expenses, multi-tenant isolation, and the summary
aggregation.
"""

from __future__ import annotations

import pytest


# ---------- Auth Protection ----------

class TestAuthProtection:
    def test_get_billings_requires_auth(self, base_url, anon_client):
        r = anon_client.get(f"{base_url}/api/billings", params={"year": 2026, "month": 2})
        assert r.status_code == 401

    def test_post_billings_requires_auth(self, base_url, anon_client):
        r = anon_client.post(
            f"{base_url}/api/billings",
            json={"name": "x", "type": "SALARY", "value": 1, "year": 2026, "month": 2},
        )
        assert r.status_code == 401

    def test_get_expenses_requires_auth(self, base_url, anon_client):
        r = anon_client.get(f"{base_url}/api/expenses", params={"year": 2026, "month": 2})
        assert r.status_code == 401

    def test_get_summary_requires_auth(self, base_url, anon_client):
        r = anon_client.get(f"{base_url}/api/summary", params={"year": 2026, "month": 2})
        assert r.status_code == 401

    def test_patch_billing_requires_auth(self, base_url, anon_client):
        r = anon_client.patch(
            f"{base_url}/api/billings/abc",
            params={"year": 2026, "month": 2},
            json={"name": "x"},
        )
        assert r.status_code == 401

    def test_delete_expense_requires_auth(self, base_url, anon_client):
        r = anon_client.delete(
            f"{base_url}/api/expenses/abc",
            params={"year": 2026, "month": 2},
        )
        assert r.status_code == 401

    def test_session_invalid_returns_401(self, base_url, anon_client):
        r = anon_client.post(
            f"{base_url}/api/auth/session",
            json={"session_id": "totally-bogus-session"},
        )
        assert r.status_code == 401

    def test_me_with_bearer_works(self, base_url, client_a, user_a):
        r = client_a.get(f"{base_url}/api/auth/me")
        assert r.status_code == 200
        data = r.json()
        assert data["user_id"] == user_a["user_id"]
        assert data["email"] == "icaroomanuel@gmail.com"


# ---------- Billings CRUD + recurrence ----------

class TestBillingRecurrence:
    def test_salary_recurs_award_doesnt(self, base_url, client_a):
        # Create SALARY in 2026/02
        salary = client_a.post(
            f"{base_url}/api/billings",
            json={"name": "TEST_Salary", "type": "SALARY", "value": 5000, "year": 2026, "month": 2},
        )
        assert salary.status_code == 201, salary.text
        salary_data = salary.json()
        assert salary_data["recurring"] is True

        # Create AWARD in 2026/02
        award = client_a.post(
            f"{base_url}/api/billings",
            json={"name": "TEST_Bonus", "type": "AWARD", "value": 1000, "year": 2026, "month": 2},
        )
        assert award.status_code == 201
        assert award.json()["recurring"] is False

        # GET 2026/02 must return both
        feb = client_a.get(f"{base_url}/api/billings", params={"year": 2026, "month": 2}).json()
        ids_feb = {b["id"] for b in feb}
        assert salary_data["id"] in ids_feb
        assert award.json()["id"] in ids_feb

        # GET 2026/03 must contain SALARY but not AWARD
        mar = client_a.get(f"{base_url}/api/billings", params={"year": 2026, "month": 3}).json()
        ids_mar = {b["id"] for b in mar}
        assert salary_data["id"] in ids_mar, "SALARY should recur to next month"
        assert award.json()["id"] not in ids_mar, "AWARD must not recur"

        # cleanup
        client_a.delete(
            f"{base_url}/api/billings/{salary_data['id']}",
            params={"year": 2026, "month": 2, "scope": "all"},
        )
        client_a.delete(
            f"{base_url}/api/billings/{award.json()['id']}",
            params={"year": 2026, "month": 2},
        )

    def test_delete_month_creates_skip(self, base_url, client_a):
        salary = client_a.post(
            f"{base_url}/api/billings",
            json={"name": "TEST_VacaSalary", "type": "SALARY", "value": 5000, "year": 2026, "month": 2},
        ).json()
        sid = salary["id"]

        # Delete with scope=month in 2026/03
        d = client_a.delete(
            f"{base_url}/api/billings/{sid}",
            params={"year": 2026, "month": 3, "scope": "month"},
        )
        assert d.status_code == 204

        # In Feb still present
        feb_ids = {b["id"] for b in client_a.get(
            f"{base_url}/api/billings", params={"year": 2026, "month": 2}).json()}
        assert sid in feb_ids

        # In March it disappears
        mar_ids = {b["id"] for b in client_a.get(
            f"{base_url}/api/billings", params={"year": 2026, "month": 3}).json()}
        assert sid not in mar_ids

        # In April it reappears
        apr_ids = {b["id"] for b in client_a.get(
            f"{base_url}/api/billings", params={"year": 2026, "month": 4}).json()}
        assert sid in apr_ids

        # cleanup full
        client_a.delete(
            f"{base_url}/api/billings/{sid}",
            params={"year": 2026, "month": 2, "scope": "all"},
        )

    def test_delete_all_removes_template_and_skips(self, base_url, client_a, mongo_db, user_a):
        s = client_a.post(
            f"{base_url}/api/billings",
            json={"name": "TEST_RmAll", "type": "SALARY", "value": 100, "year": 2026, "month": 1},
        ).json()
        sid = s["id"]
        # Skip March
        client_a.delete(
            f"{base_url}/api/billings/{sid}",
            params={"year": 2026, "month": 3, "scope": "month"},
        )
        # Delete all
        d = client_a.delete(
            f"{base_url}/api/billings/{sid}",
            params={"year": 2026, "month": 1, "scope": "all"},
        )
        assert d.status_code == 204
        # Verify removed
        assert mongo_db.billings.find_one({"id": sid, "user_id": user_a["user_id"]}) is None
        assert mongo_db.recurrence_skips.count_documents(
            {"entity_id": sid, "user_id": user_a["user_id"]}
        ) == 0


# ---------- Expenses ----------

class TestExpenses:
    def test_fixed_recurs_detached_doesnt(self, base_url, client_a):
        fx = client_a.post(
            f"{base_url}/api/expenses",
            json={"name": "TEST_Rent", "type": "FIXED", "value": 1200, "year": 2026, "month": 2},
        )
        assert fx.status_code == 201
        fx_id = fx.json()["id"]
        assert fx.json()["recurring"] is True

        dt = client_a.post(
            f"{base_url}/api/expenses",
            json={"name": "TEST_Vet", "type": "DETACHED", "value": 200, "year": 2026, "month": 2},
        )
        assert dt.status_code == 201
        assert dt.json()["recurring"] is False
        dt_id = dt.json()["id"]

        mar = client_a.get(f"{base_url}/api/expenses", params={"year": 2026, "month": 3}).json()
        ids = {e["id"] for e in mar}
        assert fx_id in ids
        assert dt_id not in ids

        # cleanup
        client_a.delete(f"{base_url}/api/expenses/{fx_id}",
                        params={"year": 2026, "month": 2, "scope": "all"})
        client_a.delete(f"{base_url}/api/expenses/{dt_id}",
                        params={"year": 2026, "month": 2})

    def test_patch_status_and_value(self, base_url, client_a):
        e = client_a.post(
            f"{base_url}/api/expenses",
            json={"name": "TEST_Patch", "type": "DETACHED", "value": 50, "year": 2026, "month": 2},
        ).json()
        eid = e["id"]
        r = client_a.patch(
            f"{base_url}/api/expenses/{eid}",
            params={"year": 2026, "month": 2},
            json={"status": "PAID", "value": 75.5},
        )
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "PAID"
        assert d["value"] == 75.5
        # GET to verify persistence
        got = client_a.get(f"{base_url}/api/expenses",
                           params={"year": 2026, "month": 2}).json()
        match = [x for x in got if x["id"] == eid][0]
        assert match["status"] == "PAID"
        assert match["value"] == 75.5
        # cleanup
        client_a.delete(f"{base_url}/api/expenses/{eid}",
                        params={"year": 2026, "month": 2})


# ---------- Multi-tenant isolation ----------

class TestIsolation:
    def test_user_b_cannot_see_user_a_data(self, base_url, client_a, client_b):
        a = client_a.post(
            f"{base_url}/api/billings",
            json={"name": "TEST_A_only", "type": "AWARD", "value": 500, "year": 2026, "month": 5},
        ).json()
        b = client_b.post(
            f"{base_url}/api/billings",
            json={"name": "TEST_B_only", "type": "AWARD", "value": 700, "year": 2026, "month": 5},
        ).json()

        a_list = client_a.get(f"{base_url}/api/billings",
                              params={"year": 2026, "month": 5}).json()
        b_list = client_b.get(f"{base_url}/api/billings",
                              params={"year": 2026, "month": 5}).json()
        a_ids = {x["id"] for x in a_list}
        b_ids = {x["id"] for x in b_list}
        assert a["id"] in a_ids and a["id"] not in b_ids
        assert b["id"] in b_ids and b["id"] not in a_ids

        # User B cannot delete A's billing
        d = client_b.delete(f"{base_url}/api/billings/{a['id']}",
                            params={"year": 2026, "month": 5})
        assert d.status_code == 404
        # cleanup
        client_a.delete(f"{base_url}/api/billings/{a['id']}",
                        params={"year": 2026, "month": 5})
        client_b.delete(f"{base_url}/api/billings/{b['id']}",
                        params={"year": 2026, "month": 5})


# ---------- Summary ----------

class TestSummary:
    def test_summary_aggregations(self, base_url, client_a):
        # Seed
        salary = client_a.post(
            f"{base_url}/api/billings",
            json={"name": "TEST_SumSalary", "type": "SALARY", "value": 4000, "year": 2026, "month": 6},
        ).json()
        award = client_a.post(
            f"{base_url}/api/billings",
            json={"name": "TEST_SumAward", "type": "AWARD", "value": 1000, "year": 2026, "month": 6},
        ).json()
        rent = client_a.post(
            f"{base_url}/api/expenses",
            json={"name": "TEST_Rent", "type": "FIXED", "value": 1500, "status": "PAID", "year": 2026, "month": 6},
        ).json()
        card = client_a.post(
            f"{base_url}/api/expenses",
            json={"name": "TEST_Card", "type": "CARD", "value": 500, "status": "PENDING", "year": 2026, "month": 6},
        ).json()

        s = client_a.get(f"{base_url}/api/summary",
                         params={"year": 2026, "month": 6})
        assert s.status_code == 200
        data = s.json()
        assert data["total_income"] == 5000
        assert data["total_expenses"] == 2000
        assert data["total_paid"] == 1500
        assert data["total_pending"] == 500
        assert data["balance"] == 3000
        # committed = expenses/income * 100 = 40
        assert round(data["committed_percentage"], 2) == 40.0
        types = {row["type"]: row["value"] for row in data["expenses_by_type"]}
        assert types.get("FIXED") == 1500
        assert types.get("CARD") == 500
        income_types = {row["type"]: row["value"] for row in data["income_by_type"]}
        assert income_types.get("SALARY") == 4000
        assert income_types.get("AWARD") == 1000

        # cleanup
        client_a.delete(f"{base_url}/api/billings/{salary['id']}",
                        params={"year": 2026, "month": 6, "scope": "all"})
        client_a.delete(f"{base_url}/api/billings/{award['id']}",
                        params={"year": 2026, "month": 6})
        client_a.delete(f"{base_url}/api/expenses/{rent['id']}",
                        params={"year": 2026, "month": 6, "scope": "all"})
        client_a.delete(f"{base_url}/api/expenses/{card['id']}",
                        params={"year": 2026, "month": 6, "scope": "all"})
