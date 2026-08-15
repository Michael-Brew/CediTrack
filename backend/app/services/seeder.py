from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models import Account, Transaction, Category
from app.services.anomaly_detector import evaluate_transaction_anomaly

def seed_sample_ghana_data(db: Session, user_id: str) -> Dict[str, Any]:
    """
    Clears existing transactions and accounts for the user and seeds a rich,
    realistic dataset tailored for Ghanaian personal and SME finance tracking.
    """
    # 1. Clear user data
    db.query(Transaction).filter(Transaction.user_id == user_id).delete()
    db.query(Account).filter(Account.user_id == user_id).delete()
    db.commit()

    today = date.today()

    # 2. Create Accounts
    accounts_data = [
        {"name": "MTN MoMo", "type": "mobile_money", "initial_balance": Decimal("850.00"), "color": "#F59E0B"},
        {"name": "GCB Main Account", "type": "bank", "initial_balance": Decimal("3500.00"), "color": "#0284C7"},
        {"name": "Telecel Cash", "type": "mobile_money", "initial_balance": Decimal("300.00"), "color": "#EF4444"},
        {"name": "Shop Cash Till", "type": "cash", "initial_balance": Decimal("1200.00"), "color": "#10B981"},
        {"name": "Susu Savings Box", "type": "cash", "initial_balance": Decimal("500.00"), "color": "#8B5CF6"},
    ]

    created_accounts: Dict[str, Account] = {}
    for acc in accounts_data:
        account_obj = Account(
            user_id=user_id,
            name=acc["name"],
            type=acc["type"],
            initial_balance=acc["initial_balance"],
            currency="GHS",
            color=acc["color"]
        )
        db.add(account_obj)
        db.flush()
        created_accounts[acc["name"]] = account_obj

    # 3. Seed Transactions across the last 60 days
    # Note: We will evaluate anomaly detection for each expense
    raw_txns = [
        # --- Month -2 (40 to 60 days ago) ---
        (-58, "GCB Main Account", "Monthly Salary from Fintech Ltd", Decimal("6200.00"), "Income", "Salary"),
        (-56, "Shop Cash Till", "Daily Boutique Sales", Decimal("750.00"), "Income", "Business Income"),
        (-55, "MTN MoMo", "Trotro fare Circle to Accra", Decimal("12.00"), "Expense", "Transport"),
        (-55, "MTN MoMo", "Waakye at Auntie Muni", Decimal("35.00"), "Expense", "Food"),
        (-54, "MTN MoMo", "ECG Prepaid Electricity Token", Decimal("120.00"), "Expense", "Bills"),
        (-53, "MTN MoMo", "MTN 10GB Data Bundle", Decimal("65.00"), "Expense", "Data Bundle"),
        (-52, "Shop Cash Till", "Makola Wholesale Fabric Restock", Decimal("650.00"), "Expense", "Inventory/Supplies"),
        (-50, "Shop Cash Till", "Weekend Shop Sales", Decimal("1200.00"), "Income", "Business Income"),
        (-48, "Susu Savings Box", "Weekly Susu Contribution", Decimal("150.00"), "Expense", "Susu/Savings"),
        (-45, "MTN MoMo", "Jollof and Grilled Chicken lunch", Decimal("45.00"), "Expense", "Food"),
        (-42, "GCB Main Account", "GWCL Water Bill Payment", Decimal("85.00"), "Expense", "Bills"),

        # --- Month -1 (15 to 35 days ago) ---
        (-30, "GCB Main Account", "Monthly Salary from Fintech Ltd", Decimal("6200.00"), "Income", "Salary"),
        (-28, "MTN MoMo", "Remittance via TapTap Send from London", Decimal("2200.00"), "Income", "Gift/Remittance"),
        (-27, "Shop Cash Till", "Saturday Pop-up Sales Revenue", Decimal("1450.00"), "Income", "Business Income"),
        (-26, "MTN MoMo", "Bolt ride to Ridge Hospital", Decimal("42.00"), "Expense", "Transport"),
        (-25, "MTN MoMo", "Lunch at Buka Restaurant Osu", Decimal("95.00"), "Expense", "Food"),
        (-24, "Shop Cash Till", "Makola Packaging Bags and boxes", Decimal("320.00"), "Expense", "Inventory/Supplies"),
        (-23, "Telecel Cash", "Telecel Airtime Recharge", Decimal("50.00"), "Expense", "MoMo/Airtime"),
        (-22, "MTN MoMo", "ECG Prepaid Power Top-up", Decimal("200.00"), "Expense", "Bills"),
        (-21, "Shop Cash Till", "Dispatch rider delivery fee to Tema", Decimal("45.00"), "Expense", "Logistics/Delivery"),
        (-20, "Susu Savings Box", "Weekly Susu Contribution", Decimal("150.00"), "Expense", "Susu/Savings"),
        (-19, "MTN MoMo", "KFC Streetwise 3 Lunch", Decimal("80.00"), "Expense", "Food"),
        (-18, "MTN MoMo", "Trotro to Kaneshie market", Decimal("14.00"), "Expense", "Transport"),
        (-16, "Shop Cash Till", "Facebook and Instagram Ads Campaign", Decimal("180.00"), "Expense", "Marketing"),
        (-15, "MTN MoMo", "Barber shop haircut & shave", Decimal("70.00"), "Expense", "Personal Care"),

        # --- Recent 14 Days (Current 30-day Window) ---
        (-12, "Shop Cash Till", "Mid-week Customer Order Payment", Decimal("980.00"), "Income", "Business Income"),
        (-10, "MTN MoMo", "Uber ride from Airport to East Legon", Decimal("55.00"), "Expense", "Transport"),
        (-9, "MTN MoMo", "Waakye and fried plantain lunch", Decimal("38.00"), "Expense", "Food"),
        (-8, "MTN MoMo", "MTN Fiber Internet Subscription", Decimal("250.00"), "Expense", "Data Bundle"),
        (-7, "Susu Savings Box", "Weekly Susu Contribution", Decimal("150.00"), "Expense", "Susu/Savings"),
        (-6, "Shop Cash Till", "Courier delivery to Takoradi", Decimal("60.00"), "Expense", "Logistics/Delivery"),
        (-5, "MTN MoMo", "Chop Bar Fufu & Light Soup", Decimal("40.00"), "Expense", "Food"),
        (-4, "MTN MoMo", "DStv Compact Subscription", Decimal("390.00"), "Expense", "Bills"),
        (-3, "Shop Cash Till", "Daily Walk-in Sales", Decimal("850.00"), "Income", "Business Income"),
        (-2, "MTN MoMo", "Yango ride to Makola", Decimal("28.00"), "Expense", "Transport"),
        (-1, "MTN MoMo", "KFC Zinger Burger Dinner", Decimal("65.00"), "Expense", "Food"),

        # --- High Expense Anomaly 1: Food Anomaly in last 30 days ---
        (-8, "GCB Main Account", "VIP Anniversary Dinner at Skybar 25", Decimal("1850.00"), "Expense", "Food"),

        # --- High Expense Anomaly 2: Transport Anomaly in last 30 days ---
        (-4, "MTN MoMo", "Emergency Private Charter Taxi to Kumasi", Decimal("1250.00"), "Expense", "Transport"),

        # --- High Expense Anomaly 3: Inventory SME Anomaly in last 30 days ---
        (-6, "GCB Main Account", "New POS Machine & Laptop from CompuGhana", Decimal("5600.00"), "Expense", "Inventory/Supplies"),
    ]

    flagged_anomalies_count = 0
    created_txns = []

    for days_ago, acc_name, desc, amt, t_type, cat in raw_txns:
        txn_date = today + timedelta(days=days_ago)
        account = created_accounts.get(acc_name)
        if not account:
            continue

        is_flagged = False
        anomaly_reason = None

        if t_type == "Expense":
            is_flagged, anomaly_reason, _, _ = evaluate_transaction_anomaly(
                db=db,
                user_id=user_id,
                txn_date=txn_date,
                category=cat,
                amount=amt,
                description=desc,
                window_days=30
            )

        if is_flagged:
            flagged_anomalies_count += 1

        t_obj = Transaction(
            user_id=user_id,
            account_id=account.id,
            date=txn_date,
            description=desc,
            amount=amt,
            type=t_type,
            category=cat,
            is_flagged_anomaly=is_flagged,
            anomaly_reason=anomaly_reason,
            source="manual"
        )
        db.add(t_obj)
        created_txns.append(t_obj)
        db.flush()

    db.commit()

    return {
        "success": True,
        "accounts_created": len(created_accounts),
        "transactions_created": len(created_txns),
        "flagged_anomalies_count": flagged_anomalies_count,
        "message": f"Successfully seeded {len(created_accounts)} Ghanaian accounts and {len(created_txns)} transactions."
    }
