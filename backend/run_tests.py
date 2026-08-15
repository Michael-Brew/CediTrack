import sys
from datetime import date, timedelta
from decimal import Decimal

# Import app modules
from app.services.categorizer import categorize, resolve_account_from_text
from app.services.anomaly_detector import evaluate_transaction_anomaly
from app.services.file_parser import clean_amount, parse_date_flexible, parse_statement_file
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import Account, Transaction
from fastapi.testclient import TestClient
from app.main import app

def run_all_tests():
    print("=======================================================")
    print("  RUNNING CEDITRACK BACKEND SUITE")
    print("=======================================================")

    # 1. Categorization
    assert categorize("Trotro from Circle to Kaneshie", "Expense") == "Transport"
    assert categorize("Uber ride to Airport", "Expense") == "Transport"
    assert categorize("Waakye at Auntie Muni", "Expense") == "Food"
    assert categorize("Chop Bar lunch fufu and light soup", "Expense") == "Food"
    assert categorize("ECG prepaid power token", "Expense") == "Bills"
    assert categorize("MTN airtime top up", "Expense") == "MoMo/Airtime"
    assert categorize("Weekly susu contribution", "Expense") == "Susu/Savings"
    assert categorize("Makola wholesale fabric restock", "Expense") == "Inventory/Supplies"
    assert categorize("Monthly salary from Fintech Accra", "Income") == "Salary"
    assert categorize("Shop boutique daily sales cash", "Income") == "Business Income"
    assert categorize("Remittance from brother UK via TapTap Send", "Income") == "Gift/Remittance"
    print("✓ 1. Ghanaian Keyword Categorization: PASSED")

    # 2. Account Resolution
    accounts = [
        {"id": "acc-1", "name": "MTN MoMo", "type": "mobile_money"},
        {"id": "acc-2", "name": "GCB Main Account", "type": "bank"},
        {"id": "acc-3", "name": "Shop Cash Till", "type": "cash"},
    ]
    acc_id, name, conf = resolve_account_from_text("MTN MOMO", accounts)
    assert acc_id == "acc-1"
    assert conf >= 0.9
    acc_id, name, conf = resolve_account_from_text("Withdrawal at GCB Bank", accounts)
    assert acc_id == "acc-2"
    print("✓ 2. Account Resolution & Keyword Lookup: PASSED")

    # 3. 30-Day Anomaly Detection
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    user_id = "user-test-30d"
    today = date(2026, 8, 15)

    acc = Account(id="acc-1", user_id=user_id, name="MTN MoMo", type="mobile_money", initial_balance=Decimal("1000"))
    db.add(acc)
    db.flush()

    for i, amt in enumerate([35, 40, 45, 38, 42]):
        txn = Transaction(
            user_id=user_id,
            account_id="acc-1",
            date=today - timedelta(days=i + 1),
            description=f"Food purchase {i}",
            amount=Decimal(str(amt)),
            type="Expense",
            category="Food",
        )
        db.add(txn)
    db.commit()

    # Normal ₵45
    flagged, reason, mean, std = evaluate_transaction_anomaly(
        db=db, user_id=user_id, txn_date=today, category="Food",
        amount=Decimal("45.00"), description="Normal Lunch", window_days=30
    )
    assert not flagged

    # Abnormal ₵850
    flagged, reason, mean, std = evaluate_transaction_anomaly(
        db=db, user_id=user_id, txn_date=today, category="Food",
        amount=Decimal("850.00"), description="Skybar Dinner", window_days=30
    )
    assert flagged
    assert "Food" in reason
    assert "₵850.00" in reason
    print("✓ 3. 30-Day Rolling Window Statistical Anomaly Detection: PASSED")

    # 4. Statement Parser
    amt, sign = clean_amount("₵1,450.50")
    assert amt == Decimal("1450.50")
    d = parse_date_flexible("15/08/2026")
    assert d.day == 15 and d.month == 8

    sample_csv = (
        "Date,Narration,Debit,Credit\n"
        "01/08/2026,ECG Prepaid Electricity,150.00,\n"
        "02/08/2026,Remittance from Brother,,1200.00\n"
    ).encode("utf-8")

    res = parse_statement_file(
        content=sample_csv,
        filename="bank.csv",
        available_accounts=[{"id": "acc-1", "name": "GCB Bank", "type": "bank"}],
        available_categories=["Bills", "Gift/Remittance"]
    )
    assert res.detected_format == "Debit / Credit Columns"
    assert res.rows[0].category == "Bills"
    assert res.rows[0].type == "Expense"
    assert res.rows[1].type == "Income"
    print("✓ 4. CSV/XLSX Auto-detection & Parser: PASSED")

    # 5. FastAPI REST API Integration
    with TestClient(app) as client:
        headers = {"X-User-Id": "test-runner-user", "Authorization": "Bearer dev-test-token"}

        h_res = client.get("/api/health")
        assert h_res.status_code == 200
        assert h_res.json()["status"] == "healthy"

        # Create Account
        acc_res = client.post(
            "/api/accounts",
            headers=headers,
            json={"name": "MTN MoMo Test", "type": "mobile_money", "initial_balance": 800.00}
        )
        assert acc_res.status_code == 201
        acc_id = acc_res.json()["id"]

        # Seed Demo Data
        seed_res = client.post("/api/dashboard/seed", headers=headers)
        assert seed_res.status_code == 200
        assert seed_res.json()["success"] is True

        # Dashboard Summary
        sum_res = client.get("/api/dashboard/summary", headers=headers)
        assert sum_res.status_code == 200
        assert float(sum_res.json()["total_net_worth"]) > 0

        # Dashboard Charts
        chart_res = client.get("/api/dashboard/charts", headers=headers)
        assert chart_res.status_code == 200
        assert len(chart_res.json()["unusual_spending_alerts"]) > 0
        print("✓ 5. FastAPI Accounts, Transactions, Seeding & Dashboard API: PASSED")

    print("\n=======================================================")
    print("  ALL 5 TEST MODULES PASSED SUCCESSFULLY! (100% GREEN)")
    print("=======================================================")

if __name__ == "__main__":
    run_all_tests()
