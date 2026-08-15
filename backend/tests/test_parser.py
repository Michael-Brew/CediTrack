import pytest
from decimal import Decimal
from app.services.file_parser import parse_statement_file, clean_amount, parse_date_flexible

def test_clean_amount():
    amt, sign = clean_amount("1,450.50")
    assert amt == Decimal("1450.50")
    assert sign == "positive"

    amt, sign = clean_amount("GHS 250.00")
    assert amt == Decimal("250.00")

    amt, sign = clean_amount("₵120.00")
    assert amt == Decimal("120.00")

    amt, sign = clean_amount("¢120.00")
    assert amt == Decimal("120.00")

    amt, sign = clean_amount("(50.00)")
    assert amt == Decimal("50.00")
    assert sign == "negative"

    amt, sign = clean_amount("-35.00")
    assert amt == Decimal("35.00")
    assert sign == "negative"

def test_parse_date_flexible():
    d = parse_date_flexible("15/08/2026")
    assert d is not None
    assert d.year == 2026
    assert d.month == 8
    assert d.day == 15

    d2 = parse_date_flexible("2026-08-15 14:30:00")
    assert d2 is not None
    assert d2.year == 2026
    assert d2.month == 8
    assert d2.day == 15

def test_parse_csv_statement():
    sample_csv = (
        "Date,Description,Amount,Type\n"
        "12/08/2026,Waakye at Auntie Muni,35.00,Expense\n"
        "14/08/2026,Salary credit from Tech GH,5500.00,Income\n"
        "15/08/2026,Trotro Circle to Accra,12.00,Expense\n"
    ).encode("utf-8")

    accounts = [{"id": "acc-1", "name": "MTN MoMo", "type": "mobile_money"}]
    categories = ["Food", "Transport", "Salary"]

    res = parse_statement_file(
        content=sample_csv,
        filename="statement.csv",
        available_accounts=accounts,
        available_categories=categories
    )

    assert res.total_rows == 3
    assert res.valid_rows == 3
    assert res.rows[0].category == "Food"
    assert res.rows[1].type == "Income"
    assert res.rows[1].category == "Salary"
    assert res.rows[2].category == "Transport"

def test_parse_debit_credit_bank_statement():
    sample_csv = (
        "Date,Narration,Debit,Credit\n"
        "01/08/2026,ECG Prepaid Electricity,150.00,\n"
        "02/08/2026,Remittance from Brother,,1200.00\n"
    ).encode("utf-8")

    accounts = [{"id": "acc-bank", "name": "GCB Bank", "type": "bank"}]
    categories = ["Bills", "Gift/Remittance"]

    res = parse_statement_file(
        content=sample_csv,
        filename="bank.csv",
        available_accounts=accounts,
        available_categories=categories
    )

    assert res.detected_format == "Debit / Credit Columns"
    assert res.rows[0].type == "Expense"
    assert res.rows[0].amount == Decimal("150.00")
    assert res.rows[0].category == "Bills"
    assert res.rows[1].type == "Income"
    assert res.rows[1].amount == Decimal("1200.00")
