import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app

headers = {
    "X-User-Id": "test-user-api",
    "Authorization": "Bearer dev-test-user-api"
}

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"
    assert res.json()["currency"] == "GHS"

def test_accounts_crud_and_transactions(client):
    # 1. Create account
    create_acc_res = client.post(
        "/api/accounts",
        headers=headers,
        json={
            "name": "MTN MoMo API Test",
            "type": "mobile_money",
            "initial_balance": 500.00,
            "color": "#F59E0B"
        }
    )
    assert create_acc_res.status_code == 201
    acc_id = create_acc_res.json()["id"]

    # 2. List accounts
    list_res = client.get("/api/accounts", headers=headers)
    assert list_res.status_code == 200
    assert any(a["id"] == acc_id for a in list_res.json())

    # 3. Create normal transaction
    txn_res = client.post(
        "/api/transactions",
        headers=headers,
        json={
            "account_id": acc_id,
            "date": "2026-08-15",
            "description": "Waakye at Auntie Muni",
            "amount": 35.00,
            "type": "Expense",
            "category": "Food"
        }
    )
    assert txn_res.status_code == 201
    assert txn_res.json()["is_flagged_anomaly"] is False

    # 4. Create abnormal high expense transaction (single high spend > ₵2,000 threshold with no history)
    abnormal_res = client.post(
        "/api/transactions",
        headers=headers,
        json={
            "account_id": acc_id,
            "date": "2026-08-15",
            "description": "VIP Skybar 25 Extravaganza",
            "amount": 3800.00,
            "type": "Expense",
            "category": "Food"
        }
    )
    assert abnormal_res.status_code == 201
    assert abnormal_res.json()["is_flagged_anomaly"] is True

def test_seed_and_dashboard(client):
    # Seed data
    seed_res = client.post("/api/dashboard/seed", headers=headers)
    assert seed_res.status_code == 200
    assert seed_res.json()["success"] is True

    # Check dashboard summary
    summary_res = client.get("/api/dashboard/summary", headers=headers)
    assert summary_res.status_code == 200
    data = summary_res.json()
    assert float(data["total_net_worth"]) > 0
    assert data["total_flagged_anomalies"] >= 1

    # Check dashboard charts
    charts_res = client.get("/api/dashboard/charts", headers=headers)
    assert charts_res.status_code == 200
    charts_data = charts_res.json()
    assert len(charts_data["category_spending"]) > 0
    assert len(charts_data["unusual_spending_alerts"]) > 0
