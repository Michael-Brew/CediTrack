import sys
from datetime import date, timedelta
from decimal import Decimal

from app.services.categorizer import categorize, resolve_account_from_text
from app.services.anomaly_detector import evaluate_transaction_anomaly
from app.services.file_parser import clean_amount, parse_date_flexible, parse_statement_file
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import Account, Transaction
from fastapi.testclient import TestClient
from app.main import app

def main():
    print("--------------------------------------------------")
    print("Testing Categorizer...")
    assert categorize("Trotro from Circle to Kaneshie", "Expense") == "Transport"
    assert categorize("Waakye at Auntie Muni", "Expense") == "Food"
    assert categorize("ECG prepaid power token", "Expense") == "Bills"
    assert categorize("Monthly salary from Fintech Accra", "Income") == "Salary"
    print("PASSED: Categorizer")

    print("Testing Anomaly Detector...")
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    today = date(2026, 8, 15)
    acc = Account(id="acc-1", user_id="u1", name="MoMo", type="mobile_money", initial_balance=Decimal("1000"))
    db.add(acc)
    db.flush()

    for i, amt in enumerate([35, 40, 45, 38, 42]):
        txn = Transaction(user_id="u1", account_id="acc-1", date=today - timedelta(days=i + 1), description=f"Food {i}", amount=Decimal(str(amt)), type="Expense", category="Food")
        db.add(txn)
    db.commit()

    f1, _, _, _ = evaluate_transaction_anomaly(db=db, user_id="u1", txn_date=today, category="Food", amount=Decimal("45.00"), description="Normal Lunch")
    assert not f1
    f2, r2, _, _ = evaluate_transaction_anomaly(db=db, user_id="u1", txn_date=today, category="Food", amount=Decimal("850.00"), description="Skybar Dinner")
    assert f2
    assert "Food" in r2
    print("PASSED: 30-Day Anomaly Detection")

    print("Testing Parser...")
    amt, _ = clean_amount("₵1,450.50")
    assert amt == Decimal("1450.50")
    sample_csv = "Date,Narration,Debit,Credit\n01/08/2026,ECG Prepaid Electricity,150.00,\n02/08/2026,Remittance from Brother,,1200.00\n".encode("utf-8")
    res = parse_statement_file(content=sample_csv, filename="bank.csv", available_accounts=[{"id": "acc-1", "name": "GCB Bank", "type": "bank"}], available_categories=["Bills", "Gift/Remittance"])
    assert res.detected_format == "Debit / Credit Columns"
    print("PASSED: Statement Parser")

    print("Testing FastAPI Endpoints...")
    with TestClient(app) as client:
        headers = {"X-User-Id": "test-runner-user", "Authorization": "Bearer dev-test-token"}
        h_res = client.get("/api/health")
        assert h_res.status_code == 200

        acc_res = client.post("/api/accounts", headers=headers, json={"name": "MTN MoMo Test", "type": "mobile_money", "initial_balance": 800.00})
        assert acc_res.status_code == 201
        acc_id = acc_res.json()["id"]

        seed_res = client.post("/api/dashboard/seed", headers=headers)
        assert seed_res.status_code == 200
        assert seed_res.json()["success"] is True

        sum_res = client.get("/api/dashboard/summary", headers=headers)
        assert sum_res.status_code == 200
        assert float(sum_res.json()["total_net_worth"]) > 0

        chart_res = client.get("/api/dashboard/charts", headers=headers)
        assert chart_res.status_code == 200
        assert len(chart_res.json()["unusual_spending_alerts"]) > 0
    print("PASSED: FastAPI Endpoints & Seeding")
    print("--------------------------------------------------")
    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
