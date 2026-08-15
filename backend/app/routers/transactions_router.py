from typing import List, Optional
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from app.database import get_db
from app.auth import get_current_user, AuthenticatedUser
from app.models import Transaction, Account
from app.schemas import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    CategorizeRequest,
    CategorizeResponse
)
from app.services.categorizer import categorize, resolve_account_from_text
from app.services.anomaly_detector import evaluate_transaction_anomaly

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

def to_transaction_response(t: Transaction, account_map: dict) -> TransactionResponse:
    acc = account_map.get(t.account_id)
    return TransactionResponse(
        id=t.id,
        user_id=t.user_id,
        account_id=t.account_id,
        date=t.date,
        description=t.description,
        amount=t.amount,
        type=t.type,
        category=t.category,
        is_flagged_anomaly=t.is_flagged_anomaly,
        anomaly_reason=t.anomaly_reason,
        source=t.source,
        reference_id=t.reference_id,
        account_name=acc.name if acc else "Unknown Account",
        account_type=acc.type if acc else "other",
        created_at=t.created_at,
        updated_at=t.updated_at
    )

@router.get("", response_model=List[TransactionResponse])
def list_transactions(
    search: Optional[str] = None,
    account_id: Optional[str] = None,
    type: Optional[str] = None,
    category: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    is_flagged_anomaly: Optional[bool] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    query = db.query(Transaction).filter(Transaction.user_id == user.id)

    if search:
        search_norm = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Transaction.description.ilike(search_norm),
                Transaction.category.ilike(search_norm),
                Transaction.reference_id.ilike(search_norm)
            )
        )

    if account_id:
        query = query.filter(Transaction.account_id == account_id)

    if type:
        query = query.filter(Transaction.type == type)

    if category:
        query = query.filter(Transaction.category == category)

    if date_from:
        query = query.filter(Transaction.date >= date_from)

    if date_to:
        query = query.filter(Transaction.date <= date_to)

    if is_flagged_anomaly is not None:
        query = query.filter(Transaction.is_flagged_anomaly == is_flagged_anomaly)

    transactions = query.order_by(desc(Transaction.date), desc(Transaction.created_at)).offset(offset).limit(limit).all()

    accounts = db.query(Account).filter(Account.user_id == user.id).all()
    account_map = {acc.id: acc for acc in accounts}

    return [to_transaction_response(t, account_map) for t in transactions]

@router.post("/categorize", response_model=CategorizeResponse)
def auto_categorize_preview(
    payload: CategorizeRequest,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    cat = categorize(payload.description, payload.type or "Expense")
    accounts = db.query(Account).filter(Account.user_id == user.id).all()
    acc_list = [{"id": acc.id, "name": acc.name} for acc in accounts]

    acc_id, acc_name, conf = resolve_account_from_text(payload.description, acc_list)

    return CategorizeResponse(
        category=cat,
        suggested_account_name=acc_name,
        confidence=conf
    )

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    acc = db.query(Account).filter(Account.id == payload.account_id, Account.user_id == user.id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")

    is_flagged = payload.is_flagged_anomaly or False
    anomaly_reason = payload.anomaly_reason

    # Automatic 30-day anomaly detection if Expense
    if payload.type == "Expense" and not is_flagged:
        is_flagged, anomaly_reason, _, _ = evaluate_transaction_anomaly(
            db=db,
            user_id=user.id,
            txn_date=payload.date,
            category=payload.category,
            amount=payload.amount,
            description=payload.description,
            window_days=30
        )

    t = Transaction(
        user_id=user.id,
        account_id=payload.account_id,
        date=payload.date,
        description=payload.description,
        amount=payload.amount,
        type=payload.type,
        category=payload.category,
        is_flagged_anomaly=is_flagged,
        anomaly_reason=anomaly_reason,
        source=payload.source or "manual",
        reference_id=payload.reference_id
    )
    db.add(t)
    db.commit()
    db.refresh(t)

    return to_transaction_response(t, {acc.id: acc})

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    t = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == user.id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")

    acc = db.query(Account).filter(Account.id == t.account_id).first()
    return to_transaction_response(t, {t.account_id: acc} if acc else {})

@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: str,
    payload: TransactionUpdate,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    t = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == user.id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if payload.account_id is not None:
        acc_exists = db.query(Account).filter(Account.id == payload.account_id, Account.user_id == user.id).first()
        if not acc_exists:
            raise HTTPException(status_code=404, detail="Account not found")
        t.account_id = payload.account_id

    if payload.date is not None:
        t.date = payload.date
    if payload.description is not None:
        t.description = payload.description
    if payload.amount is not None:
        t.amount = payload.amount
    if payload.type is not None:
        t.type = payload.type
    if payload.category is not None:
        t.category = payload.category
    if payload.reference_id is not None:
        t.reference_id = payload.reference_id

    if payload.is_flagged_anomaly is not None:
        t.is_flagged_anomaly = payload.is_flagged_anomaly
        t.anomaly_reason = payload.anomaly_reason
    elif t.type == "Expense":
        # Re-evaluate 30-day anomaly on edit
        is_flagged, reason, _, _ = evaluate_transaction_anomaly(
            db=db,
            user_id=user.id,
            txn_date=t.date,
            category=t.category,
            amount=t.amount,
            description=t.description,
            exclude_txn_id=t.id,
            window_days=30
        )
        t.is_flagged_anomaly = is_flagged
        t.anomaly_reason = reason

    db.commit()
    db.refresh(t)

    acc = db.query(Account).filter(Account.id == t.account_id).first()
    return to_transaction_response(t, {t.account_id: acc} if acc else {})

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    t = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == user.id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(t)
    db.commit()
    return None

@router.post("/{transaction_id}/dismiss-anomaly")
def dismiss_anomaly(
    transaction_id: str,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user)
):
    t = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == user.id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")

    t.is_flagged_anomaly = False
    t.anomaly_reason = "Anomaly acknowledged and dismissed by user."
    db.commit()

    return {"success": True, "message": "Anomaly dismissed successfully."}
