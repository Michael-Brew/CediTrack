import math
from datetime import date, timedelta
from decimal import Decimal
from typing import Tuple, Optional, List
from sqlalchemy.orm import Session
from app.models import Transaction

def evaluate_transaction_anomaly(
    db: Session,
    user_id: str,
    txn_date: date,
    category: str,
    amount: Decimal,
    description: str,
    exclude_txn_id: Optional[str] = None,
    window_days: int = 30
) -> Tuple[bool, Optional[str], Optional[float], Optional[float]]:
    """
    Evaluates whether an expense transaction is anomalous based on a 30-day rolling window
    for that user and category.

    Returns:
        (is_flagged: bool, reason: Optional[str], baseline_mean: Optional[float], baseline_std: Optional[float])
    """
    amt_float = float(amount)
    if amt_float <= 0:
        return False, None, None, None

    # Define 30-day window relative to the transaction date
    start_date = txn_date - timedelta(days=window_days)
    end_date = txn_date

    # Query existing expense transactions in the 30-day window
    query = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == "Expense",
        Transaction.category == category,
        Transaction.date >= start_date,
        Transaction.date <= end_date
    )

    if exclude_txn_id:
        query = query.filter(Transaction.id != exclude_txn_id)

    historical_txns = query.all()
    amounts: List[float] = [float(t.amount) for t in historical_txns]

    n = len(amounts)

    if n >= 5:
        # Statistically meaningful window: compute mean & standard deviation
        mean = sum(amounts) / n
        variance = sum((x - mean) ** 2 for x in amounts) / (n - 1)
        std_dev = math.sqrt(variance)
        threshold = mean + (2.0 * std_dev)

        if amt_float > threshold:
            reason = (
                f"This ₵{amt_float:,.2f} expense is unusually high compared to your 30-day "
                f"average of ₵{mean:,.2f} (±₵{std_dev:,.2f}) for {category}."
            )
            return True, reason, round(mean, 2), round(std_dev, 2)
        return False, None, round(mean, 2), round(std_dev, 2)

    elif n >= 1:
        # Less than 5 transactions in the 30-day window: use 3x average threshold
        mean = sum(amounts) / n
        threshold = 3.0 * mean

        if amt_float > threshold and amt_float >= 100.0:  # Avoid flagging minor amounts
            reason = (
                f"This ₵{amt_float:,.2f} expense is more than 3x higher than your 30-day "
                f"average of ₵{mean:,.2f} for {category}."
            )
            return True, reason, round(mean, 2), None
        return False, None, round(mean, 2), None

    else:
        # No prior transactions in category within last 30 days
        # Soft check for high single-ticket spend (e.g. ₵2,000+)
        if amt_float >= 2000.0:
            reason = (
                f"This ₵{amt_float:,.2f} expense is a major purchase with no previous "
                f"transactions in {category} in the last 30 days."
            )
            return True, reason, None, None
        return False, None, None, None
