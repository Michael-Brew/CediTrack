from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Any, Tuple
from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import Account, Transaction
from app.schemas import (
    DashboardSummary,
    AccountBalanceHistoryPoint,
    MonthlyIncomeExpensePoint,
    CategorySpendItem,
    CategoryChangeItem,
    AnomalyAlertItem,
    DashboardChartsResponse
)

CATEGORY_COLORS = {
    "Transport": "#F59E0B",
    "Food": "#EF4444",
    "MoMo/Airtime": "#8B5CF6",
    "Data Bundle": "#6366F1",
    "Rent": "#EC4899",
    "Bills": "#F97316",
    "Susu/Savings": "#059669",
    "Entertainment": "#A855F7",
    "Personal Care": "#D946EF",
    "Inventory/Supplies": "#EAB308",
    "Logistics/Delivery": "#3B82F6",
    "Marketing": "#06B6D4",
    "Salary": "#10B981",
    "Business Income": "#059669",
    "Gift/Remittance": "#14B8A6",
    "Susu Payout": "#0D9488",
    "Investment/Interest": "#0284C7",
    "Other Income": "#64748B",
    "Other Expense": "#94A3B8"
}

def get_dashboard_summary(db: Session, user_id: str) -> DashboardSummary:
    today = date.today()
    # Current month start
    start_of_month = date(today.year, today.month, 1)

    accounts = db.query(Account).filter(Account.user_id == user_id).all()
    all_transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()

    # Calculate net worth across all accounts
    account_balances = {acc.id: float(acc.initial_balance) for acc in accounts}
    for txn in all_transactions:
        amt = float(txn.amount)
        if txn.account_id in account_balances:
            if txn.type == "Income":
                account_balances[txn.account_id] += amt
            else:
                account_balances[txn.account_id] -= amt

    total_net_worth = sum(account_balances.values())

    # Current month income & expense
    monthly_income = 0.0
    monthly_expense = 0.0
    for txn in all_transactions:
        if txn.date >= start_of_month:
            amt = float(txn.amount)
            if txn.type == "Income":
                monthly_income += amt
            else:
                monthly_expense += amt

    net_savings = monthly_income - monthly_expense
    savings_rate = (net_savings / monthly_income * 100.0) if monthly_income > 0 else 0.0

    # 30-day window anomaly count
    cutoff_30d = today - timedelta(days=30)
    flagged_count = sum(
        1 for t in all_transactions
        if t.is_flagged_anomaly and t.date >= cutoff_30d
    )

    return DashboardSummary(
        total_net_worth=Decimal(str(round(total_net_worth, 2))),
        total_monthly_income=Decimal(str(round(monthly_income, 2))),
        total_monthly_expense=Decimal(str(round(monthly_expense, 2))),
        net_savings=Decimal(str(round(net_savings, 2))),
        savings_rate=round(savings_rate, 1),
        total_flagged_anomalies=flagged_count,
        accounts_count=len(accounts),
        transactions_count=len(all_transactions)
    )

def get_dashboard_charts(db: Session, user_id: str) -> DashboardChartsResponse:
    today = date.today()
    accounts = db.query(Account).filter(Account.user_id == user_id).all()
    account_dict = {acc.id: acc.name for acc in accounts}

    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id
    ).order_by(Transaction.date.asc()).all()

    # 1. Running balance history per account
    # Group changes by date
    daily_changes = defaultdict(lambda: defaultdict(float))
    dates_set = set()

    for txn in transactions:
        d_str = txn.date.strftime("%Y-%m-%d")
        dates_set.add(txn.date)
        amt = float(txn.amount) if txn.type == "Income" else -float(txn.amount)
        acc_name = account_dict.get(txn.account_id, "Unknown")
        daily_changes[d_str][acc_name] += amt

    sorted_dates = sorted(list(dates_set))
    if not sorted_dates and accounts:
        sorted_dates = [today - timedelta(days=i) for i in range(14, -1, -1)]

    # Compute cumulative balances
    current_acc_balances = {acc.name: float(acc.initial_balance) for acc in accounts}
    balance_history: List[AccountBalanceHistoryPoint] = []

    # Sample points to keep chart smooth (e.g. max 30 points)
    step = max(1, len(sorted_dates) // 30) if len(sorted_dates) > 30 else 1
    sampled_dates = sorted_dates[::step]
    if sorted_dates and sorted_dates[-1] not in sampled_dates:
        sampled_dates.append(sorted_dates[-1])

    date_idx = 0
    running_balances = dict(current_acc_balances)

    for d in sorted_dates:
        d_str = d.strftime("%Y-%m-%d")
        if d_str in daily_changes:
            for acc_name, delta in daily_changes[d_str].items():
                running_balances[acc_name] = round(running_balances.get(acc_name, 0.0) + delta, 2)

        if d in sampled_dates:
            balance_history.append(
                AccountBalanceHistoryPoint(
                    date=d.strftime("%d %b"),
                    balances=dict(running_balances)
                )
            )

    # 2. Monthly Income vs Expense Trend (Last 6 months)
    monthly_data = defaultdict(lambda: {"income": 0.0, "expense": 0.0})
    for txn in transactions:
        m_str = txn.date.strftime("%b %Y")
        amt = float(txn.amount)
        if txn.type == "Income":
            monthly_data[m_str]["income"] += amt
        else:
            monthly_data[m_str]["expense"] += amt

    # Ensure last 4-6 months exist
    income_expense_trend: List[MonthlyIncomeExpensePoint] = []
    # Build ordered list of last 6 months
    months_order = []
    for i in range(5, -1, -1):
        m_date = today.replace(day=1) - timedelta(days=i*30)
        m_label = m_date.strftime("%b %Y")
        if m_label not in months_order:
            months_order.append(m_label)

    for m_label in months_order:
        data = monthly_data.get(m_label, {"income": 0.0, "expense": 0.0})
        inc = round(data["income"], 2)
        exp = round(data["expense"], 2)
        income_expense_trend.append(
            MonthlyIncomeExpensePoint(
                month=m_label,
                income=inc,
                expense=exp,
                net=round(inc - exp, 2)
            )
        )

    # 3. Spending by Category (Expense in last 30 days or all-time)
    cutoff_30d = today - timedelta(days=30)
    category_totals = defaultdict(lambda: {"amount": 0.0, "count": 0})
    total_expense_sum = 0.0

    for txn in transactions:
        if txn.type == "Expense" and txn.date >= cutoff_30d:
            amt = float(txn.amount)
            category_totals[txn.category]["amount"] += amt
            category_totals[txn.category]["count"] += 1
            total_expense_sum += amt

    # Fallback to all transactions if 30-day window has few expenses
    if total_expense_sum == 0.0:
        for txn in transactions:
            if txn.type == "Expense":
                amt = float(txn.amount)
                category_totals[txn.category]["amount"] += amt
                category_totals[txn.category]["count"] += 1
                total_expense_sum += amt

    category_spending: List[CategorySpendItem] = []
    for cat, val in sorted(category_totals.items(), key=lambda x: x[1]["amount"], reverse=True):
        amt = val["amount"]
        pct = (amt / total_expense_sum * 100.0) if total_expense_sum > 0 else 0.0
        category_spending.append(
            CategorySpendItem(
                category=cat,
                amount=round(amt, 2),
                percentage=round(pct, 1),
                count=val["count"],
                color=CATEGORY_COLORS.get(cat, "#64748B")
            )
        )

    # 4. Top 5 Categories (This month vs Last month)
    curr_month_start = date(today.year, today.month, 1)
    last_month_end = curr_month_start - timedelta(days=1)
    last_month_start = date(last_month_end.year, last_month_end.month, 1)

    curr_month_spend = defaultdict(float)
    last_month_spend = defaultdict(float)

    for txn in transactions:
        if txn.type == "Expense":
            amt = float(txn.amount)
            if txn.date >= curr_month_start:
                curr_month_spend[txn.category] += amt
            elif last_month_start <= txn.date <= last_month_end:
                last_month_spend[txn.category] += amt

    all_cat_keys = set(curr_month_spend.keys()).union(set(last_month_spend.keys()))
    top_categories_comparison: List[CategoryChangeItem] = []

    sorted_cats = sorted(all_cat_keys, key=lambda c: curr_month_spend.get(c, 0.0), reverse=True)[:5]

    for cat in sorted_cats:
        c_amt = curr_month_spend.get(cat, 0.0)
        l_amt = last_month_spend.get(cat, 0.0)
        if l_amt > 0:
            pct_change = ((c_amt - l_amt) / l_amt) * 100.0
        elif c_amt > 0:
            pct_change = 100.0
        else:
            pct_change = 0.0

        trend = "up" if pct_change > 2.0 else ("down" if pct_change < -2.0 else "unchanged")
        top_categories_comparison.append(
            CategoryChangeItem(
                category=cat,
                current_month_amount=round(c_amt, 2),
                last_month_amount=round(l_amt, 2),
                percentage_change=round(pct_change, 1),
                trend=trend
            )
        )

    # 5. Unusual Spending Alerts (in 30-day window)
    unusual_alerts: List[AnomalyAlertItem] = []
    for txn in reversed(transactions):
        if txn.is_flagged_anomaly and txn.date >= cutoff_30d:
            acc_name = account_dict.get(txn.account_id, "Account")
            unusual_alerts.append(
                AnomalyAlertItem(
                    id=txn.id,
                    date=txn.date,
                    description=txn.description,
                    amount=txn.amount,
                    category=txn.category,
                    account_name=acc_name,
                    anomaly_reason=txn.anomaly_reason or f"Unusually high spending in {txn.category}"
                )
            )

    return DashboardChartsResponse(
        balance_history=balance_history,
        income_expense_trend=income_expense_trend,
        category_spending=category_spending,
        top_categories_comparison=top_categories_comparison,
        unusual_spending_alerts=unusual_alerts
    )
