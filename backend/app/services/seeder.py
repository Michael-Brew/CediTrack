from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models import Account, Transaction, Category

def seed_sample_ghana_data(db: Session, user_id: str) -> Dict[str, Any]:
    """
    Clears existing transactions and accounts for the user and seeds a rich,
    realistic dataset tailored for Ghanaian personal and SME finance tracking.
    """
    # 1. Clear user data
    db.query(Transaction).filter(Transaction.user_id == user_id).delete()
    db.query(Account).filter(Account.user_id == user_id).delete()
    db.flush()

    today = date.today()

    # 2. Create Accounts in batch including 'Other'
    accounts_data = [
        {"name": "MTN MoMo", "type": "mobile_money", "initial_balance": Decimal("850.00"), "color": "#F59E0B"},
        {"name": "GCB Main Account", "type": "bank", "initial_balance": Decimal("3500.00"), "color": "#0284C7"},
        {"name": "Telecel Cash", "type": "mobile_money", "initial_balance": Decimal("300.00"), "color": "#EF4444"},
        {"name": "Shop Cash Till", "type": "cash", "initial_balance": Decimal("1200.00"), "color": "#10B981"},
        {"name": "Susu Savings Box", "type": "cash", "initial_balance": Decimal("500.00"), "color": "#8B5CF6"},
        {"name": "Other", "type": "other", "initial_balance": Decimal("0.00"), "color": "#64748B"},
    ]

    account_objs = [
        Account(
            user_id=user_id,
            name=acc["name"],
            type=acc["type"],
            initial_balance=acc["initial_balance"],
            currency="GHS",
            color=acc["color"]
        )
        for acc in accounts_data
    ]
    db.add_all(account_objs)
    db.flush()
    created_accounts: Dict[str, Account] = {acc.name: acc for acc in account_objs}

    # 3. Seed Transactions across the last 60 days
    raw_txns = [
        # --- Month -2 (40 to 60 days ago) ---
        (-58, "GCB Main Account", "Monthly Salary from Fintech Ltd", Decimal("6200.00"), "Income", "Salary", False, None),
        (-56, "Shop Cash Till", "Daily Boutique Sales", Decimal("750.00"), "Income", "Business Income", False, None),
        (-55, "MTN MoMo", "Trotro fare Circle to Accra", Decimal("12.00"), "Expense", "Transport", False, None),
        (-55, "MTN MoMo", "Waakye at Auntie Muni", Decimal("35.00"), "Expense", "Food", False, None),
        (-54, "MTN MoMo", "ECG Prepaid Electricity Token", Decimal("120.00"), "Expense", "Bills", False, None),
        (-53, "MTN MoMo", "MTN 10GB Data Bundle", Decimal("65.00"), "Expense", "Data Bundle", False, None),
        (-52, "Shop Cash Till", "Makola Wholesale Fabric Restock", Decimal("650.00"), "Expense", "Inventory/Supplies", False, None),
        (-50, "Shop Cash Till", "Weekend Shop Sales", Decimal("1200.00"), "Income", "Business Income", False, None),
        (-48, "Susu Savings Box", "Weekly Susu Contribution", Decimal("150.00"), "Expense", "Susu/Savings", False, None),
        (-45, "MTN MoMo", "Jollof and Grilled Chicken lunch", Decimal("45.00"), "Expense", "Food", False, None),
        (-42, "GCB Main Account", "GWCL Water Bill Payment", Decimal("85.00"), "Expense", "Bills", False, None),

        # --- Month -1 (15 to 35 days ago) ---
        (-30, "GCB Main Account", "Monthly Salary from Fintech Ltd", Decimal("6200.00"), "Income", "Salary", False, None),
        (-28, "MTN MoMo", "Remittance via TapTap Send from London", Decimal("2200.00"), "Income", "Gift/Remittance", False, None),
        (-27, "Shop Cash Till", "Saturday Pop-up Sales Revenue", Decimal("1450.00"), "Income", "Business Income", False, None),
        (-26, "MTN MoMo", "Bolt ride to Ridge Hospital", Decimal("42.00"), "Expense", "Transport", False, None),
        (-25, "MTN MoMo", "Lunch at Buka Restaurant Osu", Decimal("95.00"), "Expense", "Food", False, None),
        (-24, "Shop Cash Till", "Makola Packaging Bags and boxes", Decimal("320.00"), "Expense", "Inventory/Supplies", False, None),
        (-23, "Telecel Cash", "Telecel Airtime Recharge", Decimal("50.00"), "Expense", "MoMo/Airtime", False, None),
        (-22, "MTN MoMo", "ECG Prepaid Power Top-up", Decimal("200.00"), "Expense", "Bills", False, None),
        (-21, "Shop Cash Till", "Dispatch rider delivery fee to Tema", Decimal("45.00"), "Expense", "Logistics/Delivery", False, None),
        (-20, "Susu Savings Box", "Weekly Susu Contribution", Decimal("150.00"), "Expense", "Susu/Savings", False, None),
        (-19, "MTN MoMo", "KFC Streetwise 3 Lunch", Decimal("80.00"), "Expense", "Food", False, None),
        (-18, "MTN MoMo", "Trotro to Kaneshie market", Decimal("14.00"), "Expense", "Transport", False, None),
        (-16, "Shop Cash Till", "Facebook and Instagram Ads Campaign", Decimal("180.00"), "Expense", "Marketing", False, None),
        (-15, "MTN MoMo", "Barber shop haircut & shave", Decimal("70.00"), "Expense", "Personal Care", False, None),

        # --- Recent 14 Days (Current 30-day Window) ---
        (-12, "Shop Cash Till", "Mid-week Customer Order Payment", Decimal("980.00"), "Income", "Business Income", False, None),
        (-10, "MTN MoMo", "Uber ride from Airport to East Legon", Decimal("55.00"), "Expense", "Transport", False, None),
        (-9, "MTN MoMo", "Waakye and fried plantain lunch", Decimal("38.00"), "Expense", "Food", False, None),
        (-8, "MTN MoMo", "MTN Fiber Internet Subscription", Decimal("250.00"), "Expense", "Data Bundle", False, None),
        (-7, "Susu Savings Box", "Weekly Susu Contribution", Decimal("150.00"), "Expense", "Susu/Savings", False, None),
        (-6, "Shop Cash Till", "Courier delivery to Takoradi", Decimal("60.00"), "Expense", "Logistics/Delivery", False, None),
        (-5, "MTN MoMo", "Chop Bar Fufu & Light Soup", Decimal("40.00"), "Expense", "Food", False, None),
        (-4, "MTN MoMo", "DStv Compact Subscription", Decimal("390.00"), "Expense", "Bills", False, None),
        (-3, "Shop Cash Till", "Daily Walk-in Sales", Decimal("850.00"), "Income", "Business Income", False, None),
        (-2, "MTN MoMo", "Yango ride to Makola", Decimal("28.00"), "Expense", "Transport", False, None),
        (-1, "MTN MoMo", "KFC Zinger Burger Dinner", Decimal("65.00"), "Expense", "Food", False, None),

        # --- High Expense Anomaly 1: Food Anomaly in last 30 days ---
        (-8, "GCB Main Account", "VIP Anniversary Dinner at Skybar 25", Decimal("1850.00"), "Expense", "Food", True, "Amount ₵1,850.00 is significantly above 30-day Food baseline average ₵57.50"),

        # --- High Expense Anomaly 2: Transport Anomaly in last 30 days ---
        (-4, "MTN MoMo", "Emergency Private Charter Taxi to Kumasi", Decimal("1250.00"), "Expense", "Transport", True, "Amount ₵1,250.00 is 33.7x higher than 30-day Transport average ₵37.00"),

        # --- High Expense Anomaly 3: Inventory SME Anomaly in last 30 days ---
        (-6, "GCB Main Account", "New POS Machine & Laptop from CompuGhana", Decimal("5600.00"), "Expense", "Inventory/Supplies", True, "Amount ₵5,600.00 is 11.4x higher than 30-day Inventory/Supplies average ₵490.00"),
    ]

    flagged_anomalies_count = 0
    t_objs = []

    for days_ago, acc_name, desc, amt, t_type, cat, is_flagged, reason in raw_txns:
        txn_date = today + timedelta(days=days_ago)
        account = created_accounts.get(acc_name)
        if not account:
            continue

        if is_flagged:
            flagged_anomalies_count += 1

        t_objs.append(Transaction(
            user_id=user_id,
            account_id=account.id,
            date=txn_date,
            description=desc,
            amount=amt,
            type=t_type,
            category=cat,
            is_flagged_anomaly=is_flagged,
            anomaly_reason=reason,
            source="manual"
        ))

    db.add_all(t_objs)
    db.commit()

    return {
        "success": True,
        "accounts_created": len(created_accounts),
        "transactions_created": len(t_objs),
        "flagged_anomalies_count": flagged_anomalies_count,
        "message": f"Successfully seeded {len(created_accounts)} Ghanaian accounts and {len(t_objs)} transactions."
    }
