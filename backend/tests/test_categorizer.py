import pytest
from app.services.categorizer import categorize, resolve_account_from_text

def test_categorize_ghana_expenses():
    # Transport
    assert categorize("Trotro from Circle to Kaneshie", "Expense") == "Transport"
    assert categorize("Uber ride to Airport", "Expense") == "Transport"
    assert categorize("Bolt ride to Osu", "Expense") == "Transport"
    assert categorize("Goil fuel petrol topup", "Expense") == "Transport"

    # Food
    assert categorize("Waakye at Auntie Muni", "Expense") == "Food"
    assert categorize("Chop Bar lunch fufu and light soup", "Expense") == "Food"
    assert categorize("KFC Streetwise 3 meal", "Expense") == "Food"
    assert categorize("Shoprite groceries purchase", "Expense") == "Food"

    # Bills & Utilities
    assert categorize("ECG prepaid power token", "Expense") == "Bills"
    assert categorize("GWCL water bill payment", "Expense") == "Bills"
    assert categorize("DStv compact subscription", "Expense") == "Bills"

    # MoMo & Airtime & Data
    assert categorize("MTN airtime top up 0244123456", "Expense") == "MoMo/Airtime"
    assert categorize("Telecel data bundle purchase", "Expense") == "Data Bundle"
    assert categorize("MTN fiber broadband monthly", "Expense") == "Data Bundle"

    # Susu / Savings
    assert categorize("Weekly susu contribution to collector", "Expense") == "Susu/Savings"

    # SME Inventory & Logistics
    assert categorize("Makola wholesale fabric restock", "Expense") == "Inventory/Supplies"
    assert categorize("Dispatch rider delivery to Tema", "Expense") == "Logistics/Delivery"
    assert categorize("Instagram sponsored promo ad", "Expense") == "Marketing"

def test_categorize_ghana_income():
    assert categorize("Monthly salary from Fintech Accra", "Income") == "Salary"
    assert categorize("Shop boutique daily sales cash", "Income") == "Business Income"
    assert categorize("Remittance from brother UK via TapTap Send", "Income") == "Gift/Remittance"
    assert categorize("Susu payout collection share", "Income") == "Susu Payout"

def test_resolve_account_from_text():
    available_accounts = [
        {"id": "acc-1", "name": "MTN MoMo", "type": "mobile_money"},
        {"id": "acc-2", "name": "GCB Main Account", "type": "bank"},
        {"id": "acc-3", "name": "Shop Cash Till", "type": "cash"},
    ]

    # Matching from account column or narration
    acc_id, name, conf = resolve_account_from_text("MTN MOMO", available_accounts)
    assert acc_id == "acc-1"
    assert conf >= 0.9

    acc_id, name, conf = resolve_account_from_text("ATM withdrawal at GCB Bank", available_accounts)
    assert acc_id == "acc-2"
    assert conf >= 0.75

    acc_id, name, conf = resolve_account_from_text("Cash from till", available_accounts)
    assert acc_id == "acc-3"
