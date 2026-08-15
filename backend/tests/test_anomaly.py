import pytest
from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import Account, Transaction
from app.services.anomaly_detector import evaluate_transaction_anomaly

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_anomaly_with_history_ge_5(db_session):
    user_id = "test-user-1"
    today = date(2026, 8, 15)

    # Create account
    acc = Account(id="acc-1", user_id=user_id, name="MTN MoMo", type="mobile_money", initial_balance=Decimal("1000"))
    db_session.add(acc)
    db_session.flush()

    # Add 5 normal food transactions over the last 20 days (mean = 40, variance is small)
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
        db_session.add(txn)
    db_session.commit()

    # Normal amount: ₵45 should NOT be flagged
    is_flagged, reason, mean, std = evaluate_transaction_anomaly(
        db=db_session,
        user_id=user_id,
        txn_date=today,
        category="Food",
        amount=Decimal("45.00"),
        description="Standard lunch",
        window_days=30
    )
    assert not is_flagged

    # Abnormal amount: ₵650 dinner should BE flagged
    is_flagged, reason, mean, std = evaluate_transaction_anomaly(
        db=db_session,
        user_id=user_id,
        txn_date=today,
        category="Food",
        amount=Decimal("650.00"),
        description="Skybar 25 Luxury dinner",
        window_days=30
    )
    assert is_flagged
    assert reason is not None
    assert "Food" in reason
    assert "₵650.00" in reason

def test_anomaly_with_history_lt_5(db_session):
    user_id = "test-user-2"
    today = date(2026, 8, 15)

    acc = Account(id="acc-2", user_id=user_id, name="Cash", type="cash", initial_balance=Decimal("500"))
    db_session.add(acc)
    db_session.flush()

    # Only 2 transactions in Transport (avg = 20)
    for i, amt in enumerate([15, 25]):
        txn = Transaction(
            user_id=user_id,
            account_id="acc-2",
            date=today - timedelta(days=i + 2),
            description=f"Trotro {i}",
            amount=Decimal(str(amt)),
            type="Expense",
            category="Transport",
        )
        db_session.add(txn)
    db_session.commit()

    # ₵40 is 2x average -> NOT flagged (< 3x)
    is_flagged, reason, mean, std = evaluate_transaction_anomaly(
        db=db_session,
        user_id=user_id,
        txn_date=today,
        category="Transport",
        amount=Decimal("40.00"),
        description="Uber ride",
        window_days=30
    )
    assert not is_flagged

    # ₵180 is 9x average -> FLAGGED (> 3x)
    is_flagged, reason, mean, std = evaluate_transaction_anomaly(
        db=db_session,
        user_id=user_id,
        txn_date=today,
        category="Transport",
        amount=Decimal("180.00"),
        description="Charter Taxi",
        window_days=30
    )
    assert is_flagged
    assert reason is not None
    assert "3x" in reason
